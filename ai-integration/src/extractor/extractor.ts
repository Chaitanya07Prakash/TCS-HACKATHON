/**
 * Notice Understanding & Extraction Orchestrator
 * Combines preprocessing, classification, deterministic entity extraction,
 * schema validation (Zod), and safe failure fallbacks.
 */

import { StructuredNotice } from "../types/index.js";
import { StructuredNoticeSchema } from "../schemas/notice.schema.js";
import { cleanNoticeText } from "./cleaner.js";
import { classifyNoticeText } from "./classifier.js";
import {
  extractDates,
  extractCGPA,
  extractBranches,
  extractYears,
  extractDocuments,
  extractSkills,
  extractLinksAndContact,
  extractTitleAndOrg,
} from "./ruleExtractor.js";
import { extractExplicitActions } from "./actionExtractor.js";
import { generatePersonalizedSummary } from "./personalSummarizer.js";

export interface ExtractionResult {
  success: boolean;
  notice: StructuredNotice;
  errors?: string[];
  warnings?: string[];
  validationRetried?: boolean;
}

/**
 * Validates and repairs an extraction payload against StructuredNoticeSchema
 */
export function validateAndRepairNotice(rawPayload: unknown): { notice: StructuredNotice; isValid: boolean; errors: string[] } {
  const parseResult = StructuredNoticeSchema.safeParse(rawPayload);

  if (parseResult.success) {
    return {
      notice: parseResult.data,
      isValid: true,
      errors: [],
    };
  }

  // Schema validation failed: collect error issues
  const errorMessages = parseResult.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );

  console.warn(`[NoticeExtractor] Schema validation issues detected: ${errorMessages.join("; ")}`);

  // Attempt safe auto-repair with baseline fallback defaults
  const rawObj = typeof rawPayload === "object" && rawPayload !== null ? (rawPayload as Record<string, any>) : {};

  const validCategory = (rawObj.category && typeof rawObj.category === "string" && [
    "GENERAL", "PLACEMENT", "SCHOLARSHIP", "EXAMINATION", "EVENT", "ACADEMIC", "COMPETITION", "CLUB", "REGISTRATION", "ADMINISTRATIVE"
  ].includes(rawObj.category)) ? rawObj.category : "GENERAL";

  const validTitle = (typeof rawObj.title === "string" && rawObj.title.trim().length > 0)
    ? rawObj.title
    : "Campus Notice";

  const validConfidence = (typeof rawObj.confidence === "number" && rawObj.confidence >= 0 && rawObj.confidence <= 1)
    ? rawObj.confidence
    : 0.5;

  const fallbackNotice: StructuredNotice = {
    title: validTitle,
    category: validCategory as any,
    organization: typeof rawObj.organization === "string" ? rawObj.organization : "Campus Administration",
    description: typeof rawObj.description === "string" ? rawObj.description : "",
    summary: typeof rawObj.summary === "string" ? rawObj.summary : "Notice information could not be fully parsed. Please check original circular.",
    deadline: typeof rawObj.deadline === "string" ? rawObj.deadline : null,
    eventDate: typeof rawObj.eventDate === "string" ? rawObj.eventDate : null,
    location: typeof rawObj.location === "string" ? rawObj.location : null,
    eligibility: {
      branches: Array.isArray(rawObj.eligibility?.branches) ? rawObj.eligibility.branches : [],
      years: Array.isArray(rawObj.eligibility?.years) ? rawObj.eligibility.years : [],
      semesters: Array.isArray(rawObj.eligibility?.semesters) ? rawObj.eligibility.semesters : [],
      minimumCGPA: typeof rawObj.eligibility?.minimumCGPA === "number" ? rawObj.eligibility.minimumCGPA : null,
      maximumCGPA: typeof rawObj.eligibility?.maximumCGPA === "number" ? rawObj.eligibility.maximumCGPA : null,
      graduationYears: Array.isArray(rawObj.eligibility?.graduationYears) ? rawObj.eligibility.graduationYears : [],
      skills: Array.isArray(rawObj.eligibility?.skills) ? rawObj.eligibility.skills : [],
    },
    requiredSkills: Array.isArray(rawObj.requiredSkills) ? rawObj.requiredSkills : [],
    requiredDocuments: Array.isArray(rawObj.requiredDocuments) ? rawObj.requiredDocuments : [],
    requiredActions: Array.isArray(rawObj.requiredActions) ? rawObj.requiredActions : [],
    registrationLink: typeof rawObj.registrationLink === "string" ? rawObj.registrationLink : null,
    contactInformation: typeof rawObj.contactInformation === "string" ? rawObj.contactInformation : null,
    confidence: validConfidence,
  };

  const repairedResult = StructuredNoticeSchema.safeParse(fallbackNotice);

  return {
    notice: repairedResult.success ? repairedResult.data : fallbackNotice,
    isValid: false,
    errors: errorMessages,
  };
}

/**
 * Main Extraction Entry Point
 * Takes raw notice text and returns a validated StructuredNotice.
 */
export async function extractNoticeFromText(rawText: string): Promise<ExtractionResult> {
  const warnings: string[] = [];

  // Step 1: Text Cleaning & Preprocessing
  const { cleanedText } = cleanNoticeText(rawText);
  if (!cleanedText || cleanedText.trim().length === 0) {
    const emptyNotice: StructuredNotice = {
      title: "Empty Notice",
      category: "GENERAL",
      organization: "Campus Administration",
      description: "Empty or unreadable text provided.",
      summary: "No content available in this notice.",
      deadline: null,
      eventDate: null,
      location: null,
      eligibility: {
        branches: [],
        years: [],
        semesters: [],
        minimumCGPA: null,
        maximumCGPA: null,
        graduationYears: [],
        skills: [],
      },
      requiredSkills: [],
      requiredDocuments: [],
      requiredActions: [],
      registrationLink: null,
      contactInformation: null,
      confidence: 0.0,
    };
    return {
      success: false,
      notice: emptyNotice,
      errors: ["Notice text is empty or contains no readable characters."],
    };
  }

  // Step 2: Notice Classification
  const classification = classifyNoticeText(cleanedText);

  // Step 3: Information & Requirement Extraction
  const { title, organization } = extractTitleAndOrg(cleanedText, classification.primary);
  const { deadline, eventDate } = extractDates(cleanedText);
  const { minimumCGPA, maximumCGPA } = extractCGPA(cleanedText);
  const branches = extractBranches(cleanedText);
  const { graduationYears, years, semesters } = extractYears(cleanedText);
  const requiredDocuments = extractDocuments(cleanedText);
  const requiredSkills = extractSkills(cleanedText);
  const { registrationLink, contactInformation } = extractLinksAndContact(cleanedText);

  // Use dedicated action extractor with rich context
  const requiredActions = extractExplicitActions(cleanedText, {
    deadline,
    eventDate,
    registrationLink,
    category: classification.primary,
  });

  // Step 4: Extract Location if present
  let location: string | null = null;
  const locMatch = cleanedText.match(/(?:location|venue|held\s+at|conducted\s+at)[:\s]+([^.\n,]+)/i);
  if (locMatch) {
    location = locMatch[1].trim();
  } else if (/online|virtual|google\s+meet|zoom/i.test(cleanedText)) {
    location = "Online";
  }

  // Flag warnings for missing fields to avoid hallucination
  if (!deadline) {
    warnings.push("No explicit deadline found in notice; deadline set to null.");
  }
  if (branches.length === 0 && minimumCGPA === null && graduationYears.length === 0) {
    warnings.push("No restrictive eligibility constraints identified; open to all students.");
  }

  // Step 5: Summary Generation
  const rawNoticeData = {
    title,
    category: classification.primary,
    secondaryCategories: classification.secondary,
    organization,
    description: cleanedText,
    summary: "",
    deadline,
    eventDate,
    location,
    eligibility: {
      branches,
      years,
      semesters,
      minimumCGPA,
      maximumCGPA,
      graduationYears,
      skills: requiredSkills,
    },
    requiredSkills,
    requiredDocuments,
    requiredActions,
    registrationLink,
    contactInformation,
    confidence: classification.confidence,
    rawTextExcerpt: cleanedText.slice(0, 200),
  };

  rawNoticeData.summary = generatePersonalizedSummary(rawNoticeData);

  // Step 6: Validation via Zod Schema
  const validation = validateAndRepairNotice(rawNoticeData);

  return {
    success: true,
    notice: validation.notice,
    warnings,
    errors: validation.errors.length > 0 ? validation.errors : undefined,
    validationRetried: !validation.isValid,
  };
}
