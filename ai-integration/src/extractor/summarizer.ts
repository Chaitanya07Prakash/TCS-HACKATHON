/**
 * Student-Friendly Notice Summarizer
 * Generates clear, bite-sized summaries focusing on "Who can apply?", "Deadline",
 * and "What you need to do" without modifying underlying facts.
 */

import { StructuredNotice } from "../types/index.js";

export function generateStudentSummary(notice: Partial<StructuredNotice>): string {
  const parts: string[] = [];

  // 1. Header
  const title = notice.title || "Announcement";
  const org = notice.organization && notice.organization !== "Campus Administration" ? ` (${notice.organization})` : "";
  parts.push(`${title}${org}`);
  parts.push("------------------------------------------------");

  // 2. Who can apply? (Eligibility criteria in plain English)
  parts.push("Who can apply?");
  const eligParts: string[] = [];

  if (notice.eligibility?.branches && notice.eligibility.branches.length > 0) {
    eligParts.push(`Branches: ${notice.eligibility.branches.join(" / ")}`);
  } else {
    eligParts.push("Branches: Open to all branches");
  }

  if (notice.eligibility?.graduationYears && notice.eligibility.graduationYears.length > 0) {
    eligParts.push(`Batch: ${notice.eligibility.graduationYears.join(", ")} graduating`);
  }

  if (notice.eligibility?.minimumCGPA !== null && notice.eligibility?.minimumCGPA !== undefined) {
    eligParts.push(`Minimum CGPA: ${notice.eligibility.minimumCGPA}+`);
  }

  if (notice.eligibility?.years && notice.eligibility.years.length > 0) {
    eligParts.push(`Year: ${notice.eligibility.years.join(", ")} year`);
  }

  parts.push(eligParts.join(" | "));

  // 3. Deadline / Key Dates
  parts.push("");
  parts.push("Key Dates:");
  if (notice.deadline) {
    parts.push(`• Registration Deadline: ${notice.deadline}`);
  } else {
    parts.push("• Registration Deadline: Not specified in notice");
  }
  if (notice.eventDate) {
    parts.push(`• Assessment / Event Date: ${notice.eventDate}`);
  }

  // 4. Required Actions ("What do you need to do?")
  parts.push("");
  parts.push("What do you need to do?");
  if (notice.requiredActions && notice.requiredActions.length > 0) {
    notice.requiredActions.forEach((act, idx) => {
      const actDeadline = act.deadline ? ` (by ${act.deadline})` : "";
      parts.push(`${idx + 1}. ${act.action}${actDeadline}`);
    });
  } else {
    parts.push("1. Review notice details on campus portal");
  }

  // 5. Required Documents (if any)
  if (notice.requiredDocuments && notice.requiredDocuments.length > 0) {
    parts.push("");
    parts.push(`Required Documents: ${notice.requiredDocuments.join(", ")}`);
  }

  // 6. Registration Link (if any)
  if (notice.registrationLink) {
    parts.push(`Registration Link: ${notice.registrationLink}`);
  }

  return parts.join("\n");
}
