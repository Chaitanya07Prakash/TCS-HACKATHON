/**
 * Dedicated Action Extraction Engine
 * Extracts discrete, actionable tasks for students from notices:
 * - Register / Submit Form
 * - Upload Resume / CV
 * - Submit Documents
 * - Complete Online Assessment
 * - Download Admit Card / Hall Ticket
 * - Attend Examination
 * - Pay Fee / Clear Dues
 * - Attend Event / Workshop
 * - Submit Team Proposal / Abstract
 */

import { ExtractedAction } from "../types/index.js";
import { normalizeDate } from "./ruleExtractor.js";

export interface ActionExtractionContext {
  deadline?: string | null;
  eventDate?: string | null;
  registrationLink?: string | null;
  category?: string;
}

export function extractExplicitActions(
  text: string,
  context?: ActionExtractionContext
): ExtractedAction[] {
  const actions: ExtractedAction[] = [];
  const primaryDeadline = context?.deadline || null;
  const eventDate = context?.eventDate || null;
  const link = context?.registrationLink || null;

  // Helper to extract action-specific deadline from text if present near the action
  const findLocalDeadline = (pattern: RegExp, defaultDate: string | null): string | null => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const normalized = normalizeDate(match[1]);
      if (normalized) return normalized;
    }
    return defaultDate;
  };

  // 1. Registration / Application Action
  if (/\b(?:register|registration|apply|application|fill\s+(?:the\s+)?form|sign\s*up)\b/i.test(text)) {
    const regDeadline = findLocalDeadline(
      /(?:register|registration|apply|application|last\s+date)[^.\n\r]*?(?:before|by|deadline|on)[:\s]+([^.\n,]+(?:\d{4}|\d{2}))/i,
      primaryDeadline
    );

    const isPlacement = context?.category === "PLACEMENT" || /recruitment|placement|hiring/i.test(text);
    const isScholarship = context?.category === "SCHOLARSHIP" || /scholarship/i.test(text);
    const isComp = context?.category === "COMPETITION" || /hackathon|contest/i.test(text);

    let title = "Complete registration";
    if (isPlacement) title = "Register for campus placement";
    else if (isScholarship) title = "Submit scholarship application";
    else if (isComp) title = "Register team for competition";

    actions.push({
      title,
      action: "Register",
      actionType: "REGISTER",
      deadline: regDeadline,
      description: link ? `Submit registration form online at ${link}` : "Submit application before deadline",
      url: link,
    });
  }

  // 2. Upload Resume / CV
  if (/\b(?:upload|submit|attach)[^.\n\r]*?\b(?:resume|cv)\b/i.test(text)) {
    actions.push({
      title: "Upload resume during registration",
      action: "Upload resume",
      actionType: "UPLOAD_RESUME",
      deadline: primaryDeadline,
      description: "Ensure updated technical resume is uploaded with the application",
    });
  }

  // 3. Document Submission (Transcripts, income certificate, caste certificate, ID)
  if (/\b(?:submit|upload|provide|verify)[^.\n\r]*?\b(?:documents?|certificates?|transcripts?|mark\s*sheets?|caste\s+certificate|income\s+certificate)\b/i.test(text)) {
    const docDeadline = findLocalDeadline(
      /(?:documents?|certificates?)[^.\n\r]*?(?:before|by|deadline|to)[:\s]+([^.\n,]+(?:\d{4}|\d{2}))/i,
      primaryDeadline
    );
    actions.push({
      title: "Submit required verification documents",
      action: "Submit documents",
      actionType: "SUBMIT_DOCUMENTS",
      deadline: docDeadline,
      description: "Submit attested copies of certificates and transcripts",
    });
  }

  // 4. Online Assessment / Coding Test
  if (/\b(?:online\s+assessment|assessment\s+will|technical\s+test|coding\s+test|online\s+test|assessment\s+on)\b/i.test(text)) {
    const assessDeadline = findLocalDeadline(
      /(?:assessment|online\s+test|test)[^.\n\r]*?(?:conducted|on|held)[:\s]+([^.\n,]+(?:\d{4}|\d{2}))/i,
      eventDate || primaryDeadline
    );
    actions.push({
      title: "Complete online assessment",
      action: "Complete assessment",
      actionType: "ATTEND_ASSESSMENT",
      deadline: assessDeadline,
      description: assessDeadline ? `Appear for online test scheduled on ${assessDeadline}` : "Appear for scheduled online test",
    });
  }

  // 5. Download Admit Card / Hall Ticket
  if (/\b(?:download|collect|obtain|issue)[^.\n\r]*?\b(?:admit\s+card|hall\s+ticket)\b/i.test(text)) {
    const cardDeadline = findLocalDeadline(
      /(?:admit\s+card|hall\s+ticket)[^.\n\r]*?(?:before|from|by)[:\s]+([^.\n,]+(?:\d{4}|\d{2}))/i,
      primaryDeadline
    );
    actions.push({
      title: "Download examination admit card / hall ticket",
      action: "Download hall ticket",
      actionType: "ATTEND_ASSESSMENT",
      deadline: cardDeadline,
      description: "Download hall ticket through the ERP portal",
    });
  }

  // 6. Fee Payment / Clear Dues
  if (/\b(?:pay|clear)[^.\n\r]*?\b(?:fees?|dues|challan)\b/i.test(text)) {
    const feeDeadline = findLocalDeadline(
      /(?:fees?|dues)[^.\n\r]*?(?:before|by|last\s+date)[:\s]+([^.\n,]+(?:\d{4}|\d{2}))/i,
      primaryDeadline
    );
    actions.push({
      title: "Clear fees / dues",
      action: "Pay fee",
      actionType: "PAY_FEE",
      deadline: feeDeadline,
      description: "Clear outstanding dues to prevent registration hold",
    });
  }

  // 7. Attend Scheduled Examinations
  if (/\b(?:examinations?\s+will\s+be\s+conducted|theory\s+exams?|practical\s+exams?|appear\s+for\s+(?:the\s+)?exam)\b/i.test(text)) {
    actions.push({
      title: "Attend scheduled examinations",
      action: "Attend exam",
      actionType: "ATTEND_ASSESSMENT",
      deadline: eventDate || primaryDeadline,
      description: eventDate ? `Examinations commence from ${eventDate}` : "Appear for examination according to timetable",
    });
  }

  // 8. Event / Workshop / Fest Attendance
  if (/\b(?:attend\s+(?:the\s+)?(?:workshop|webinar|seminar|session|fest)|keynote|guest\s+lecture)\b/i.test(text) && actions.length === 0) {
    actions.push({
      title: "Attend event / workshop",
      action: "Attend event",
      actionType: "ATTEND_EVENT",
      deadline: eventDate || primaryDeadline,
      description: eventDate ? `Event scheduled on ${eventDate}` : "Participate in campus event",
    });
  }

  // 9. Team Idea / Abstract Submission (Hackathons)
  if (/\b(?:submit\s+(?:project\s+)?(?:abstract|idea|pitch|proposal)|project\s+submission)\b/i.test(text)) {
    const subDeadline = findLocalDeadline(
      /(?:abstract|idea|proposal)[^.\n\r]*?(?:before|by|deadline)[:\s]+([^.\n,]+(?:\d{4}|\d{2}))/i,
      primaryDeadline
    );
    actions.push({
      title: "Submit team project abstract / proposal",
      action: "Submit idea",
      actionType: "SUBMIT_PROPOSAL",
      deadline: subDeadline,
      description: "Upload problem statement pitch deck",
    });
  }

  return actions;
}
