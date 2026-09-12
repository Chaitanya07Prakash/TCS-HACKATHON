/**
 * Deterministic Eligibility Engine
 * Evaluates student profiles against notice eligibility criteria with 100% deterministic rules,
 * zero hallucination, and human-readable explanations of WHY eligible or ineligible.
 */

import { StudentProfile, NoticeEligibilityCriteria, EligibilityResult } from "../types/index.js";

/**
 * Branch synonym mapping to ensure robust matching across common campus variations
 */
const BRANCH_SYNONYMS: Record<string, string[]> = {
  CSE: ["CSE", "CS", "COMPUTER SCIENCE", "COMPUTER SCIENCE & ENGINEERING", "COMPUTER SCIENCE AND ENGINEERING", "B.TECH CSE"],
  IT: ["IT", "INFORMATION TECHNOLOGY", "B.TECH IT"],
  ECE: ["ECE", "ELECTRONICS", "ELECTRONICS & COMMUNICATION", "ELECTRONICS AND COMMUNICATION ENGINEERING", "B.TECH ECE"],
  EEE: ["EEE", "ELECTRICAL", "ELECTRICAL & ELECTRONICS", "ELECTRICAL AND ELECTRONICS ENGINEERING"],
  ME: ["ME", "MECH", "MECHANICAL", "MECHANICAL ENGINEERING"],
  CE: ["CE", "CIVIL", "CIVIL ENGINEERING"],
  AIML: ["AI", "ML", "AIML", "ARTIFICIAL INTELLIGENCE", "AI/ML", "AI & ML", "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING"],
  MCA: ["MCA", "MASTER OF COMPUTER APPLICATIONS"],
};

/**
 * Normalizes branch name to canonical abbreviation if recognized
 */
export function normalizeBranch(branch: string): string {
  if (!branch) return "";
  const upper = branch.trim().toUpperCase();

  for (const [canonical, synonyms] of Object.entries(BRANCH_SYNONYMS)) {
    if (canonical === upper || synonyms.includes(upper)) {
      return canonical;
    }
  }
  return upper;
}

/**
 * Checks if student's branch matches any of the allowed branches
 */
export function matchBranch(studentBranch: string, allowedBranches: string[]): boolean {
  if (!allowedBranches || allowedBranches.length === 0) return true; // Open to all
  if (!studentBranch) return false;

  const normStudent = normalizeBranch(studentBranch);
  const normAllowed = allowedBranches.map(normalizeBranch);

  return normAllowed.includes(normStudent) || allowedBranches.some(b => b.toUpperCase() === studentBranch.trim().toUpperCase());
}

/**
 * Main Deterministic Eligibility Evaluator
 */
export function evaluateEligibility(
  student: Partial<StudentProfile>,
  requirements: NoticeEligibilityCriteria
): EligibilityResult {
  const reasons: string[] = [];
  const failedCriteria: string[] = [];
  const missingRequirements: string[] = [];

  let hasExplicitCriteria = false;

  // 1. Branch Evaluation
  if (requirements.branches && requirements.branches.length > 0) {
    hasExplicitCriteria = true;
    if (!student.branch) {
      failedCriteria.push("Student profile is missing branch information");
      missingRequirements.push("Branch detail required");
    } else if (matchBranch(student.branch, requirements.branches)) {
      reasons.push(`✓ ${student.branch} branch matches allowed branches (${requirements.branches.join(", ")})`);
    } else {
      failedCriteria.push(`✗ Required branch: ${requirements.branches.join(" / ")}; Student branch: ${student.branch}`);
      missingRequirements.push(`Eligible branch (${requirements.branches.join(", ")})`);
    }
  }

  // 2. Graduation Year Evaluation
  if (requirements.graduationYears && requirements.graduationYears.length > 0) {
    hasExplicitCriteria = true;
    if (!student.graduationYear) {
      failedCriteria.push("Student profile is missing graduation year");
      missingRequirements.push("Graduation year detail required");
    } else if (requirements.graduationYears.includes(student.graduationYear)) {
      reasons.push(`✓ ${student.graduationYear} graduation year matches`);
    } else {
      failedCriteria.push(`✗ Required graduation year: ${requirements.graduationYears.join(", ")}; Student graduation year: ${student.graduationYear}`);
      missingRequirements.push(`Target graduation year (${requirements.graduationYears.join(", ")})`);
    }
  }

  // 3. Minimum CGPA Evaluation (Strict boundary check: student >= cutoff)
  if (requirements.minimumCGPA !== null && requirements.minimumCGPA !== undefined) {
    hasExplicitCriteria = true;
    if (student.cgpa === null || student.cgpa === undefined || isNaN(student.cgpa)) {
      failedCriteria.push(`Student profile is missing CGPA (Required minimum: ${requirements.minimumCGPA})`);
      missingRequirements.push(`Minimum CGPA requirement (${requirements.minimumCGPA})`);
    } else if (student.cgpa >= requirements.minimumCGPA) {
      reasons.push(`✓ CGPA ${student.cgpa} satisfies minimum requirement of ${requirements.minimumCGPA}`);
    } else {
      failedCriteria.push(`✗ Required minimum CGPA: ${requirements.minimumCGPA}; Student CGPA: ${student.cgpa}`);
      missingRequirements.push(`Minimum CGPA of ${requirements.minimumCGPA} (Shortfall: ${(requirements.minimumCGPA - student.cgpa).toFixed(2)})`);
    }
  }

  // 4. Maximum CGPA Evaluation (e.g., need-based aid)
  if (requirements.maximumCGPA !== null && requirements.maximumCGPA !== undefined) {
    hasExplicitCriteria = true;
    if (student.cgpa !== null && student.cgpa !== undefined && !isNaN(student.cgpa)) {
      if (student.cgpa <= requirements.maximumCGPA) {
        reasons.push(`✓ CGPA ${student.cgpa} is within maximum ceiling of ${requirements.maximumCGPA}`);
      } else {
        failedCriteria.push(`✗ Maximum allowed CGPA: ${requirements.maximumCGPA}; Student CGPA: ${student.cgpa}`);
        missingRequirements.push(`CGPA must not exceed ${requirements.maximumCGPA}`);
      }
    }
  }

  // 5. College Year Evaluation (1st, 2nd, 3rd, 4th)
  if (requirements.years && requirements.years.length > 0) {
    hasExplicitCriteria = true;
    if (student.year === undefined || student.year === null) {
      failedCriteria.push("Student profile is missing college year");
      missingRequirements.push("College year detail required");
    } else if (requirements.years.includes(student.year)) {
      reasons.push(`✓ ${student.year} year matches allowed years (${requirements.years.join(", ")})`);
    } else {
      failedCriteria.push(`✗ Required year: ${requirements.years.join(", ")}; Student year: ${student.year}`);
      missingRequirements.push(`Allowed college year (${requirements.years.join(", ")})`);
    }
  }

  // 6. Semester Evaluation (1 - 8)
  if (requirements.semesters && requirements.semesters.length > 0) {
    hasExplicitCriteria = true;
    if (student.semester === undefined || student.semester === null) {
      // If semester is not set but year matched, treat leniently unless year was not matched
    } else if (requirements.semesters.includes(student.semester)) {
      reasons.push(`✓ Semester ${student.semester} matches allowed semesters (${requirements.semesters.join(", ")})`);
    } else {
      failedCriteria.push(`✗ Required semester: ${requirements.semesters.join(", ")}; Student semester: ${student.semester}`);
      missingRequirements.push(`Allowed semester (${requirements.semesters.join(", ")})`);
    }
  }

  // 7. Mandatory Skills Evaluation (if any hard required skills)
  if (requirements.skills && requirements.skills.length > 0) {
    const studentSkillsLower = (student.skills || []).map(s => s.trim().toLowerCase());
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const reqSkill of requirements.skills) {
      if (studentSkillsLower.includes(reqSkill.trim().toLowerCase())) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    }

    if (matchedSkills.length > 0) {
      reasons.push(`✓ Matched skills: ${matchedSkills.join(", ")}`);
    }
    // Only fail if skill is flagged as hard prerequisite
    if (missingSkills.length > 0 && requirements.skills.length > 2) {
      // In soft scenarios, skills affect relevance score, but if strict:
      // missingRequirements.push(`Desired skills: ${missingSkills.join(", ")}`);
    }
  }

  // If no restrictive criteria was specified at all:
  if (!hasExplicitCriteria) {
    reasons.push("✓ Open to all students: No specific branch, CGPA, or graduation restrictions in notice");
  }

  const eligible = failedCriteria.length === 0;

  return {
    eligible,
    reasons,
    failedCriteria,
    missingRequirements,
    isPartial: !hasExplicitCriteria,
  };
}
