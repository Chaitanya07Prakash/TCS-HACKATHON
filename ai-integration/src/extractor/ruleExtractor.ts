/**
 * Deterministic Entity & Requirement Extractor
 * Extracts dates, cutoffs, branches, skills, documents, and actions
 * using pattern matching. Used as high-reliability primary or fallback extractor.
 */

import {
  NoticeEligibilityCriteria,
  ExtractedAction,
  StructuredNotice,
  NoticeCategory,
} from "../types/index.js";
import { cleanNoticeText } from "./cleaner.js";
import { classifyNoticeText } from "./classifier.js";

// Standard Month mapping for date normalization
const MONTHS: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", sept: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

/**
 * Normalizes date strings like "20 September 2026" or "20/09/2026" to ISO YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Format: "20 September 2026" or "20th September, 2026"
  const wordMatch = dateStr.match(/(\b\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:,)?\s+(\d{4})\b/);
  if (wordMatch) {
    const day = wordMatch[1].padStart(2, "0");
    const monthName = wordMatch[2].toLowerCase();
    const year = wordMatch[3];
    const month = MONTHS[monthName];
    if (month) return `${year}-${month}-${day}`;
  }

  // Format: "September 20, 2026"
  const usMatch = dateStr.match(/([A-Za-z]+)\s+(\b\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})\b/);
  if (usMatch) {
    const monthName = usMatch[1].toLowerCase();
    const day = usMatch[2].padStart(2, "0");
    const year = usMatch[3];
    const month = MONTHS[monthName];
    if (month) return `${year}-${month}-${day}`;
  }

  // Format: "DD-MM-YYYY" or "DD/MM/YYYY"
  const numMatch = dateStr.match(/(\b\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (numMatch) {
    const day = numMatch[1].padStart(2, "0");
    const month = numMatch[2].padStart(2, "0");
    const year = numMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format: "YYYY-MM-DD"
  const isoMatch = dateStr.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  return null;
}

/**
 * Extracts deadlines and event dates with contextual separation
 */
export function extractDates(text: string): { deadline: string | null; eventDate: string | null; allDates: string[] } {
  const dateRegex = /(?:(?:\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+|\b[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?),?\s+\d{4}|\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b|\b\d{4}-\d{2}-\d{2}\b)/gi;
  const matches = text.match(dateRegex) || [];
  const normalizedDates: string[] = [];

  for (const m of matches) {
    const norm = normalizeDate(m);
    if (norm && !normalizedDates.includes(norm)) {
      normalizedDates.push(norm);
    }
  }

  let deadline: string | null = null;
  let eventDate: string | null = null;

  // Find deadline context (before, by, deadline, last date, register before)
  const deadlineMatch = text.match(/(?:before|by|deadline|last\s+date\s*(?:for\s+registration)?|register\s+before|submit\s+by|apply\s+by)[:\s]+([^.\n,]+(?:\d{4}|\d{2}))/i);
  if (deadlineMatch) {
    deadline = normalizeDate(deadlineMatch[1]);
  }

  // Find event / assessment / exam date context
  const eventMatch = text.match(/(?:assessment|exam|test|event|conducted|scheduled|commencing|hackathon\s+date|drive\s+date)(?:\s+will\s+be\s+conducted|\s+on|\s+from)?[:\s]+([^.\n,]+(?:\d{4}|\d{2}))/i);
  if (eventMatch) {
    eventDate = normalizeDate(eventMatch[1]);
  }

  // Fallback heuristics if context wasn't exact
  if (!deadline && normalizedDates.length > 0) {
    deadline = normalizedDates[0];
  }
  if (!eventDate && normalizedDates.length > 1) {
    // If second date is later or distinct, treat as event/exam date
    eventDate = normalizedDates[1];
  }

  return { deadline, eventDate, allDates: normalizedDates };
}

/**
 * Extracts minimum and maximum CGPA cutoffs
 */
export function extractCGPA(text: string): { minimumCGPA: number | null; maximumCGPA: number | null } {
  let minimumCGPA: number | null = null;
  let maximumCGPA: number | null = null;

  // Match patterns like "minimum CGPA of 7.5", "CGPA >= 7.5", "CGPA 7.0 and above", "CGPA: 8.0", "min 7.5 CGPA"
  const minMatch = text.match(/(?:minimum\s+(?:cgpa|gpa)|min\s+cgpa|cgpa\s*(?:>=|of\s+at\s+least|of|:|is)?|cutoff\s*(?:of)?|at\s+least)\s*(\d(?:\.\d{1,2})?)\s*(?:\+|and\s+above|\s*or\s+higher)?/i);
  if (minMatch) {
    const val = parseFloat(minMatch[1]);
    if (val >= 4.0 && val <= 10.0) {
      minimumCGPA = val;
    }
  }

  // Alternative pattern: "with a 7.5+ CGPA" or "7.5 CGPA or higher"
  if (minimumCGPA === null) {
    const altMatch = text.match(/(\d(?:\.\d{1,2})?)\s*(?:\+|and\s+above|\s*or\s+higher)?\s*(?:cgpa|gpa)/i);
    if (altMatch) {
      const val = parseFloat(altMatch[1]);
      if (val >= 4.0 && val <= 10.0) {
        minimumCGPA = val;
      }
    }
  }

  return { minimumCGPA, maximumCGPA };
}

/**
 * Extracts eligible branches
 */
export function extractBranches(text: string): string[] {
  const branches: string[] = [];
  const patterns: Array<{ regex: RegExp; name: string }> = [
    { regex: /\b(?:cse|computer\s+science(?:\s+and\s+engineering)?|cs)\b/i, name: "CSE" },
    { regex: /\b(?:it|information\s+technology)\b/i, name: "IT" },
    { regex: /\b(?:ece|electronics(?:\s+and\s+communication)?)\b/i, name: "ECE" },
    { regex: /\b(?:eee|electrical(?:\s+and\s+electronics)?)\b/i, name: "EEE" },
    { regex: /\b(?:me|mech|mechanical(?:\s+engineering)?)\b/i, name: "ME" },
    { regex: /\b(?:ce|civil(?:\s+engineering)?)\b/i, name: "CE" },
    { regex: /\b(?:ai|aiml|artificial\s+intelligence)\b/i, name: "AI/ML" },
    { regex: /\b(?:mca|master\s+of\s+computer\s+applications)\b/i, name: "MCA" },
  ];

  for (const p of patterns) {
    if (p.regex.test(text)) {
      if (!branches.includes(p.name)) {
        branches.push(p.name);
      }
    }
  }

  return branches;
}

/**
 * Extracts target graduation years and college years/semesters
 */
export function extractYears(text: string): { graduationYears: number[]; years: number[]; semesters: number[] } {
  const graduationYears: number[] = [];
  const years: number[] = [];
  const semesters: number[] = [];

  // Graduation years: e.g. "graduating in 2027", "2027 batch", "batch of 2026", "2027 passouts"
  const gradPatterns = [
    /(?:graduating\s+(?:in)?|batch\s+(?:of)?|passing\s+out\s+(?:in)?|passouts?\s+(?:of)?|class\s+of)\s*(\d{4})/gi,
    /(\d{4})\s*(?:batch|passouts?|graduates?|graduating)/gi,
  ];

  for (const pat of gradPatterns) {
    const matches = text.matchAll(pat);
    for (const m of matches) {
      const yr = parseInt(m[1], 10);
      if (yr >= 2020 && yr <= 2035 && !graduationYears.includes(yr)) {
        graduationYears.push(yr);
      }
    }
  }

  // College years: "1st year", "2nd year", "3rd year", "4th year", "final year"
  const yearMatches = [
    { regex: /\b(?:1st|first)\s+year\b/i, val: 1 },
    { regex: /\b(?:2nd|second)\s+year\b/i, val: 2 },
    { regex: /\b(?:3rd|third)\s+year\b/i, val: 3 },
    { regex: /\b(?:4th|fourth|final)\s+year\b/i, val: 4 },
  ];
  for (const ym of yearMatches) {
    if (ym.regex.test(text) && !years.includes(ym.val)) {
      years.push(ym.val);
    }
  }

  // Semesters: "5th semester", "6th sem"
  const semMatches = text.match(/\b([1-8])(?:st|nd|rd|th)?\s+(?:sem|semester)\b/gi);
  if (semMatches) {
    for (const sm of semMatches) {
      const numMatch = sm.match(/([1-8])/);
      if (numMatch) {
        const s = parseInt(numMatch[1], 10);
        if (!semesters.includes(s)) semesters.push(s);
      }
    }
  }

  return { graduationYears, years, semesters };
}

/**
 * Extracts required documents
 */
export function extractDocuments(text: string): string[] {
  const documents: string[] = [];
  const docPatterns = [
    { regex: /\bresume\b/i, name: "Resume" },
    { regex: /\bcv\b/i, name: "CV" },
    { regex: /\b(?:grade\s+sheet|marksheet|transcript)s?\b/i, name: "Mark Sheets / Transcripts" },
    { regex: /\b(?:income\s+certificate)\b/i, name: "Income Certificate" },
    { regex: /\b(?:caste\s+certificate)\b/i, name: "Caste Certificate" },
    { regex: /\b(?:bonafide\s+certificate)\b/i, name: "Bonafide Certificate" },
    { regex: /\b(?:aadhaar|aadhar|id\s+proof|college\s+id)\b/i, name: "College ID / Aadhaar" },
    { regex: /\b(?:hall\s+ticket|admit\s+card)\b/i, name: "Admit Card / Hall Ticket" },
    { regex: /\b(?:passport\s+size\s+photo(?:graph)?s?)\b/i, name: "Passport Photos" },
  ];

  for (const dp of docPatterns) {
    if (dp.regex.test(text) && !documents.includes(dp.name)) {
      documents.push(dp.name);
    }
  }

  return documents;
}

/**
 * Extracts technical and domain skills
 */
export function extractSkills(text: string): string[] {
  const skills: string[] = [];
  const knownSkills = [
    "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "React", "Node.js",
    "SQL", "MongoDB", "AWS", "Git", "Docker", "Machine Learning", "Data Structures",
    "Problem Solving", "Web Development", "Android", "Flutter"
  ];

  for (const skill of knownSkills) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text) && !skills.includes(skill)) {
      skills.push(skill);
    }
  }

  return skills;
}

/**
 * Extracts required actions (e.g., Register, Upload Resume, Complete Assessment)
 */
export function extractActions(text: string, deadline: string | null, eventDate: string | null): ExtractedAction[] {
  const actions: ExtractedAction[] = [];

  // Action 1: Registration / Application
  if (/\b(?:register|apply|fill\s+the\s+form|registration)\b/i.test(text)) {
    actions.push({
      title: "Complete registration",
      action: "Register",
      actionType: "REGISTER",
      deadline: deadline,
      description: "Submit registration form before the announced deadline",
    });
  }

  // Action 2: Resume / Document Submission
  if (/\b(?:upload\s+(?:their\s+)?resume|submit\s+documents|attach\s+cv)\b/i.test(text)) {
    actions.push({
      title: "Upload resume during registration",
      action: "Upload resume",
      actionType: "UPLOAD_RESUME",
      deadline: deadline,
      description: "Ensure updated resume is attached with registration",
    });
  }

  // Action 3: Online Assessment / Test / Examination
  if (/\b(?:online\s+assessment|assessment\s+will|examination\s+schedule|conduct\s+(?:the\s+)?exam|appear\s+for\s+(?:the\s+)?exam|theory\s+examinations?\s+will|test\s+on\b)/i.test(text)) {
    actions.push({
      title: "Attend assessment / exam",
      action: "Attend assessment / exam",
      actionType: "ATTEND_ASSESSMENT",
      deadline: eventDate || deadline,
      description: eventDate ? `Be available for test/exam on ${eventDate}` : "Attend scheduled examination",
    });
  }

  // Action 4: Fee payment
  if (/\b(?:pay\s+fee|fee\s+payment|challan)\b/i.test(text)) {
    actions.push({
      title: "Complete fee payment",
      action: "Complete fee payment",
      actionType: "PAY_FEE",
      deadline: deadline,
      description: "Pay the required registration or semester fees",
    });
  }

  // Action 5: Project / Team submission (for hackathons/competitions)
  if (/\b(?:submit\s+abstract|submit\s+idea|team\s+registration|problem\s+statement)\b/i.test(text)) {
    actions.push({
      title: "Submit team proposal / idea",
      action: "Submit team proposal / idea",
      actionType: "SUBMIT_PROPOSAL",
      deadline: deadline,
      description: "Submit project abstract or pitch deck",
    });
  }

  return actions;
}

/**
 * Extracts links, URLs, and emails
 */
export function extractLinksAndContact(text: string): { registrationLink: string | null; contactInformation: string | null } {
  // URLs
  const urlMatch = text.match(/https?:\/\/[^\s)\]">]+/i);
  const registrationLink = urlMatch ? urlMatch[0].replace(/[.,;]$/, "") : null;

  // Contact / Emails / Phone
  const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const phones = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}/g) || [];

  const contactParts: string[] = [];
  if (emails.length > 0) contactParts.push(`Email: ${emails[0]}`);
  if (phones.length > 0) contactParts.push(`Phone: ${phones[0]}`);

  // Contact person name if mentioned e.g., "Contact: Dr. Sharma"
  const personMatch = text.match(/(?:contact|coordinator|in-charge)[:\s]+([A-Za-z\s.]{3,30})(?:,|\n|$)/i);
  if (personMatch && !personMatch[1].toLowerCase().includes("email")) {
    contactParts.unshift(personMatch[1].trim());
  }

  const contactInformation = contactParts.length > 0 ? contactParts.join(" | ") : null;

  return { registrationLink, contactInformation };
}

/**
 * Derives a clean title and organization from notice text
 */
export function extractTitleAndOrg(
  text: string,
  category: NoticeCategory
): { title: string; organization: string } {
  const lines = text.split("\n").filter((l) => l.length > 3);
  const firstFew = lines.slice(0, 5).join(" ");

  // Organization detection
  let organization = "Campus Administration";
  const orgMatch = firstFew.match(/\b([A-Z][A-Za-z0-9&.\s]{1,30}?)\s+(?:technologies|solutions|pvt|ltd|inc|corp|services|software|systems|labs|bank|foundation)\b/i);
  if (orgMatch) {
    let org = orgMatch[0].trim();
    org = org.replace(/\b(?:college|university|office\s+of|training\s*(?:&|and)\s*placement|placement\s+cell|circular|notice|dept\.?|department)\b/gi, "").trim();
    if (org.length > 2) organization = org;
  } else if (category === "EXAMINATION" || /exam(?:ination)?\s+cell/i.test(text)) {
    organization = "Examination Cell";
  } else if (category === "SCHOLARSHIP" || /scholarship\s+portal|state\s+govt/i.test(text)) {
    organization = "Scholarship Welfare Department";
  } else if (category === "PLACEMENT" || /placement\s+cell/i.test(text)) {
    organization = "Training & Placement Cell";
  }

  // Title derivation
  let title = lines[0] || `${category} Announcement`;
  if (organization !== "Campus Administration" && category === "PLACEMENT") {
    title = `${organization} Campus Recruitment`;
  } else if (category === "EXAMINATION" && /mid\s*sem/i.test(text)) {
    title = "Mid-Semester Examination Schedule";
  } else if (category === "SCHOLARSHIP") {
    title = organization !== "Campus Administration" ? `${organization} Scholarship Application` : "Student Scholarship Announcement";
  } else if (category === "COMPETITION") {
    const compMatch = text.match(/\b([A-Z][A-Za-z0-9\s]{3,30}?(?:hackathon|ideathon|challenge|competition))\b/i);
    title = compMatch ? compMatch[0].trim() : "Campus Competition Announcement";
  } else if (lines.length > 0 && lines[0].length < 80) {
    title = lines[0];
  }

  return { title, organization };
}
