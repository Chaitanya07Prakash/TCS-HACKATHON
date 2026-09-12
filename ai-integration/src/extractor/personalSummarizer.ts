/**
 * Personalized Student-Friendly Summarizer
 * Preserves key facts without inventing information, and produces tailored
 * "You are eligible because..." / "You are not eligible because..." breakdowns.
 */

import {
  StructuredNotice,
  StudentProfile,
  EligibilityResult,
  RelevanceResult,
} from "../types/index.js";

export interface PersonalizedSummaryOptions {
  student?: Partial<StudentProfile>;
  eligibility?: EligibilityResult;
  relevance?: RelevanceResult;
}

export function generatePersonalizedSummary(
  notice: StructuredNotice,
  options?: PersonalizedSummaryOptions
): string {
  const parts: string[] = [];
  const { student, eligibility, relevance } = options || {};

  // 1. Header & Opportunity Overview
  parts.push("------------------------------------------------");
  parts.push(`${notice.title}${notice.organization ? ` (${notice.organization})` : ""}`);
  parts.push("------------------------------------------------");

  if (notice.description && notice.description.length > 0) {
    const briefDesc = notice.description.split("\n")[0].slice(0, 160);
    parts.push(`Opportunity: ${briefDesc}${briefDesc.length >= 160 ? "..." : ""}`);
    parts.push("");
  }

  // 2. Who Can Apply (Eligibility Requirements)
  parts.push("Who can apply?");
  const eligLines: string[] = [];

  if (notice.eligibility?.branches && notice.eligibility.branches.length > 0) {
    eligLines.push(`• Branches: ${notice.eligibility.branches.join(" / ")}`);
  } else {
    eligLines.push("• Branches: Open to all branches");
  }

  if (notice.eligibility?.graduationYears && notice.eligibility.graduationYears.length > 0) {
    eligLines.push(`• Graduation Batch: ${notice.eligibility.graduationYears.join(", ")}`);
  }

  if (notice.eligibility?.minimumCGPA !== null && notice.eligibility?.minimumCGPA !== undefined) {
    eligLines.push(`• Minimum CGPA: ${notice.eligibility.minimumCGPA}+`);
  }

  if (notice.eligibility?.years && notice.eligibility.years.length > 0) {
    eligLines.push(`• Allowed College Year: ${notice.eligibility.years.join(", ")} year`);
  }

  parts.push(eligLines.join("\n"));
  parts.push("");

  // 3. Key Dates (Strict anti-hallucination)
  parts.push("Key Dates:");
  if (notice.deadline) {
    parts.push(`• Registration Deadline: ${notice.deadline}`);
  } else {
    parts.push("• Registration Deadline: Not specified in notice");
  }

  if (notice.eventDate) {
    parts.push(`• Assessment / Event Date: ${notice.eventDate}`);
  }
  parts.push("");

  // 4. What Do You Need to Do? (Extracted Actions)
  parts.push("What do you need to do?");
  if (notice.requiredActions && notice.requiredActions.length > 0) {
    notice.requiredActions.forEach((act, idx) => {
      const actDeadline = act.deadline ? ` (by ${act.deadline})` : "";
      const actTitle = act.title || act.action;
      parts.push(`${idx + 1}. ${actTitle}${actDeadline}`);
    });
  } else {
    parts.push("1. Review notice circular details on student portal");
  }

  // 5. Required Documents
  if (notice.requiredDocuments && notice.requiredDocuments.length > 0) {
    parts.push("");
    parts.push(`Required Documents: ${notice.requiredDocuments.join(", ")}`);
  }

  // 6. Registration Link
  if (notice.registrationLink) {
    parts.push("");
    parts.push(`Registration Portal: ${notice.registrationLink}`);
  }

  // 7. Personalized Match & Eligibility Section (If Student Context Provided)
  if (student && eligibility) {
    parts.push("");
    parts.push("Personalized Eligibility & Relevance:");

    if (eligibility.eligible) {
      parts.push(`✓ You are eligible because:`);
      eligibility.reasons.forEach((r) => {
        parts.push(`  • ${r.replace(/^✓\s*/, "")}`);
      });

      if (relevance) {
        parts.push("");
        parts.push(`★ Match Score: ${relevance.score}% (${relevance.priority} Priority)`);

        // Explain interest alignment
        const studentInterests = [
          ...(student.interests || []),
          ...(student.placementPreferences || []),
        ];
        if (studentInterests.length > 0) {
          parts.push(`• This opportunity matches your profile because it aligns with your focus in ${studentInterests.slice(0, 2).join(" & ")}.`);
        }
      }
    } else {
      parts.push(`✗ You are not eligible because:`);
      eligibility.failedCriteria.forEach((f) => {
        parts.push(`  • ${f.replace(/^✗\s*/, "")}`);
      });
      if (eligibility.missingRequirements.length > 0) {
        parts.push(`• Missing / Shortfall: ${eligibility.missingRequirements.join("; ")}`);
      }
    }
  }

  parts.push("------------------------------------------------");
  return parts.join("\n");
}
