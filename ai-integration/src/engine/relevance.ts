/**
 * Deterministic Relevance and Priority Scoring Engine
 * Evaluates opportunity relevance on an explainable 100-point scale:
 * - Branch match: 30 pts
 * - Graduation year: 20 pts
 * - CGPA requirement: 15 pts
 * - Interest match: 15 pts
 * - Skill match: 10 pts
 * - Deadline urgency: 10 pts
 * 
 * Priority Levels:
 * 80 - 100: HIGH
 * 50 - 79:  MEDIUM
 *  0 - 49:  LOW
 */

import {
  StudentProfile,
  StructuredNotice,
  RelevanceResult,
  RelevanceScoreBreakdown,
  PriorityLevel,
} from "../types/index.js";
import { matchBranch } from "./eligibility.js";

export interface RelevanceCalculationOptions {
  referenceDate?: string | Date; // Useful for tests/demo reproducibility
}

/**
 * Calculates deadline urgency score deterministically (0 - 10 pts)
 */
export function calculateDeadlineUrgency(
  deadlineStr: string | null,
  referenceDateInput?: string | Date
): { urgencyScore: number; reason: string } {
  if (!deadlineStr) {
    return { urgencyScore: 0, reason: "+0 No deadline specified" };
  }

  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) {
    return { urgencyScore: 0, reason: "+0 Invalid deadline format" };
  }

  const ref = referenceDateInput ? new Date(referenceDateInput) : new Date();
  // Set both to midnight UTC for pure calendar day comparison
  const dMidnight = new Date(Date.UTC(deadline.getUTCFullYear(), deadline.getUTCMonth(), deadline.getUTCDate()));
  const rMidnight = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));

  const diffTime = dMidnight.getTime() - rMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { urgencyScore: 0, reason: `+0 Deadline has already passed (${deadlineStr})` };
  } else if (diffDays === 0) {
    return { urgencyScore: 10, reason: `+10 Deadline is TODAY (${deadlineStr}) - Urgent` };
  } else if (diffDays === 1) {
    return { urgencyScore: 9, reason: `+9 Deadline is tomorrow (${deadlineStr})` };
  } else if (diffDays <= 3) {
    return { urgencyScore: 8, reason: `+8 Deadline is within 3 days (${diffDays} days left: ${deadlineStr})` };
  } else if (diffDays <= 7) {
    return { urgencyScore: 6, reason: `+6 Deadline is approaching (${diffDays} days left: ${deadlineStr})` };
  } else {
    return { urgencyScore: 3, reason: `+3 Deadline is more than a week away (${diffDays} days left: ${deadlineStr})` };
  }
}

/**
 * Evaluates interest match between student and notice (0 - 15 pts)
 */
export function calculateInterestMatch(
  student: Partial<StudentProfile>,
  notice: Partial<StructuredNotice>
): { interestScore: number; reason: string } {
  const studentInterests = [
    ...(student.interests || []),
    ...(student.placementPreferences || []),
  ].map((i) => i.toLowerCase().trim());

  if (studentInterests.length === 0) {
    return { interestScore: 5, reason: "+5 General student interest" };
  }

  const noticeSearchText = [
    notice.title || "",
    notice.category || "",
    notice.description || "",
    notice.organization || "",
    ...(notice.requiredSkills || []),
  ].join(" ").toLowerCase();

  const matchedInterests: string[] = [];

  for (const interest of studentInterests) {
    // Check direct word match or domain match
    if (noticeSearchText.includes(interest)) {
      matchedInterests.push(interest);
    } else if (
      (interest.includes("software") || interest.includes("backend") || interest.includes("web") || interest.includes("ai")) &&
      (notice.category === "PLACEMENT" || noticeSearchText.includes("developer") || noticeSearchText.includes("engineer") || noticeSearchText.includes("recruitment"))
    ) {
      matchedInterests.push(interest);
    }
  }

  if (matchedInterests.length >= 2) {
    return {
      interestScore: 15,
      reason: `+15 High interest match (${matchedInterests.slice(0, 2).join(", ")})`,
    };
  } else if (matchedInterests.length === 1) {
    return {
      interestScore: 12,
      reason: `+12 Interest matches (${matchedInterests[0]})`,
    };
  } else if (notice.category === "PLACEMENT") {
    return {
      interestScore: 8,
      reason: "+8 General career and placement relevance",
    };
  }

  return { interestScore: 0, reason: "+0 No direct interest match" };
}

/**
 * Evaluates skill match between student skills and notice requirements (0 - 10 pts)
 */
export function calculateSkillMatch(
  student: Partial<StudentProfile>,
  notice: Partial<StructuredNotice>
): { skillScore: number; reason: string } {
  const studentSkills = (student.skills || []).map((s) => s.toLowerCase().trim());
  const noticeSkills = [
    ...(notice.requiredSkills || []),
    ...(notice.eligibility?.skills || []),
  ].map((s) => s.toLowerCase().trim());

  // If notice has explicit skill requirements
  if (noticeSkills.length > 0) {
    const matched = noticeSkills.filter((ns) => studentSkills.includes(ns));
    if (matched.length > 0) {
      const ratio = matched.length / noticeSkills.length;
      const score = Math.round(ratio * 10);
      return {
        skillScore: Math.max(5, score),
        reason: `+${Math.max(5, score)} Skill matches (${matched.join(", ")})`,
      };
    }
    return { skillScore: 0, reason: "+0 Required skills not found in profile" };
  }

  // If no explicit skill requirement in notice, but student has skills relevant to technical notice
  if (studentSkills.length > 0 && (notice.category === "PLACEMENT" || notice.category === "COMPETITION")) {
    return {
      skillScore: 10,
      reason: `+10 Strong student skill profile matches technical opportunity`,
    };
  }

  return { skillScore: 8, reason: "+8 Open requirement: No specific prerequisite skills" };
}

/**
 * Main Relevance Calculator
 */
export function calculateRelevance(
  student: Partial<StudentProfile>,
  notice: StructuredNotice,
  options?: RelevanceCalculationOptions
): RelevanceResult {
  const reasons: string[] = [];

  // 1. Branch Match (Max 30 pts)
  let branchScore = 0;
  const allowedBranches = notice.eligibility?.branches || [];
  if (allowedBranches.length === 0) {
    branchScore = 25;
    reasons.push("+25 Open to all branches including student's department");
  } else if (student.branch && matchBranch(student.branch, allowedBranches)) {
    branchScore = 30;
    reasons.push(`+30 Branch matches (${student.branch})`);
  } else {
    branchScore = 0;
    reasons.push(`+0 Branch mismatch (Required: ${allowedBranches.join(", ")}; Student: ${student.branch || "Unknown"})`);
  }

  // 2. Graduation Year Match (Max 20 pts)
  let graduationYearScore = 0;
  const targetGradYears = notice.eligibility?.graduationYears || [];
  if (targetGradYears.length === 0) {
    graduationYearScore = 15;
    reasons.push("+15 Open to all graduation years");
  } else if (student.graduationYear && targetGradYears.includes(student.graduationYear)) {
    graduationYearScore = 20;
    reasons.push(`+20 Graduation year matches (${student.graduationYear})`);
  } else {
    graduationYearScore = 0;
    reasons.push(`+0 Graduation year mismatch (Target: ${targetGradYears.join(", ")}; Student: ${student.graduationYear || "Unknown"})`);
  }

  // 3. CGPA Satisfaction (Max 15 pts)
  let cgpaScore = 0;
  const minCGPA = notice.eligibility?.minimumCGPA;
  if (minCGPA === null || minCGPA === undefined) {
    cgpaScore = 15;
    reasons.push("+15 No minimum CGPA restriction");
  } else if (student.cgpa !== undefined && student.cgpa !== null && student.cgpa >= minCGPA) {
    cgpaScore = 15;
    reasons.push(`+15 CGPA requirement satisfied (${student.cgpa} >= ${minCGPA})`);
  } else {
    cgpaScore = 0;
    reasons.push(`+0 CGPA requirement not satisfied (${student.cgpa || 0} < ${minCGPA})`);
  }

  // 4. Interest Match (Max 15 pts)
  const interestResult = calculateInterestMatch(student, notice);
  const interestScore = interestResult.interestScore;
  reasons.push(interestResult.reason);

  // 5. Skill Match (Max 10 pts)
  const skillResult = calculateSkillMatch(student, notice);
  const skillScore = skillResult.skillScore;
  reasons.push(skillResult.reason);

  // 6. Deadline Urgency (Max 10 pts)
  const urgencyResult = calculateDeadlineUrgency(notice.deadline, options?.referenceDate);
  const urgencyScore = urgencyResult.urgencyScore;
  reasons.push(urgencyResult.reason);

  // Compute Total Score
  const rawScore = branchScore + graduationYearScore + cgpaScore + interestScore + skillScore + urgencyScore;
  const score = Math.max(0, Math.min(100, rawScore));

  // Determine Priority Level
  let priority: PriorityLevel = "LOW";
  if (score >= 80) {
    priority = "HIGH";
  } else if (score >= 50) {
    priority = "MEDIUM";
  } else {
    priority = "LOW";
  }

  const factors: RelevanceScoreBreakdown = {
    branchScore,
    graduationYearScore,
    cgpaScore,
    interestScore,
    skillScore,
    urgencyScore,
  };

  const matchExplanation = `Opportunity scored ${score}/100 (${priority} Priority) based on branch, academic standing, student interests, and upcoming deadline.`;

  return {
    score,
    priority,
    factors,
    breakdown: factors,
    reasons,
    matchExplanation,
  };
}
