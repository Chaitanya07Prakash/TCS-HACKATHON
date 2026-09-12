/**
 * Automated Test Suite for Deterministic Eligibility Engine (Phase 3)
 * Tests:
 * 1. Fully eligible student (Harsh's CSE profile with ABC Tech)
 * 2. Fully ineligible student (Mechanical student with low CGPA & wrong batch)
 * 3. CGPA failure (Student CGPA 7.2 vs Cutoff 7.5)
 * 4. Branch failure (Student EE vs Allowed CSE/IT)
 * 5. Graduation year failure (Student 2028 vs Allowed 2027)
 * 6. Multiple requirement failure (Wrong branch + low CGPA)
 * 7. Missing requirement in student profile (Missing CGPA)
 * 8. Exact CGPA boundary (Student CGPA 7.5 vs Cutoff 7.5 -> Eligible!)
 * 9. Branch synonym normalization (Student "Computer Science" vs Allowed "CSE")
 * 10. Open notice with no criteria -> Eligible
 */

import { evaluateEligibility } from "../src/engine/eligibility.js";
import { StudentProfile, NoticeEligibilityCriteria } from "../src/types/index.js";

interface EligibilityTestCase {
  id: number;
  name: string;
  student: Partial<StudentProfile>;
  requirements: NoticeEligibilityCriteria;
  expectedEligible: boolean;
  expectedReasonSnippet?: string;
  expectedFailedSnippet?: string;
}

const TEST_CASES: EligibilityTestCase[] = [
  {
    id: 1,
    name: "Fully Eligible Student (Harsh CSE with ABC Tech)",
    student: {
      name: "Harsh",
      branch: "CSE",
      year: 3,
      semester: 5,
      cgpa: 8.2,
      graduationYear: 2027,
      skills: ["Python", "Java", "React", "SQL"],
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: true,
    expectedReasonSnippet: "satisfies minimum requirement of 7.5",
  },
  {
    id: 2,
    name: "Fully Ineligible Student (Wrong branch, low CGPA, wrong grad year)",
    student: {
      name: "Rohan",
      branch: "ME",
      year: 2,
      semester: 4,
      cgpa: 6.2,
      graduationYear: 2028,
      skills: ["AutoCAD"],
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: false,
    expectedFailedSnippet: "Required branch: CSE / IT",
  },
  {
    id: 3,
    name: "CGPA Failure (Student 7.2 vs Cutoff 7.5)",
    student: {
      name: "Amit",
      branch: "CSE",
      year: 3,
      semester: 5,
      cgpa: 7.2,
      graduationYear: 2027,
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: false,
    expectedFailedSnippet: "Required minimum CGPA: 7.5; Student CGPA: 7.2",
  },
  {
    id: 4,
    name: "Branch Failure (Student EEE vs Allowed CSE/IT)",
    student: {
      name: "Priya",
      branch: "EEE",
      year: 3,
      semester: 5,
      cgpa: 8.5,
      graduationYear: 2027,
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: false,
    expectedFailedSnippet: "Required branch: CSE / IT; Student branch: EEE",
  },
  {
    id: 5,
    name: "Graduation Year Failure (Student 2028 vs Allowed 2027)",
    student: {
      name: "Rahul",
      branch: "CSE",
      year: 2,
      semester: 3,
      cgpa: 8.8,
      graduationYear: 2028,
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: false,
    expectedFailedSnippet: "Required graduation year: 2027; Student graduation year: 2028",
  },
  {
    id: 6,
    name: "Multiple Requirement Failure (Branch + CGPA failure)",
    student: {
      name: "Karan",
      branch: "Civil",
      year: 3,
      semester: 5,
      cgpa: 6.8,
      graduationYear: 2027,
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: false,
    expectedFailedSnippet: "Required branch",
  },
  {
    id: 7,
    name: "Missing Requirement (Student profile has missing CGPA)",
    student: {
      name: "Ananya",
      branch: "CSE",
      year: 3,
      semester: 5,
      cgpa: undefined, // Missing CGPA
      graduationYear: 2027,
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: false,
    expectedFailedSnippet: "Student profile is missing CGPA",
  },
  {
    id: 8,
    name: "Exact CGPA Boundary Check (Student 7.5 == Cutoff 7.5 -> Eligible)",
    student: {
      name: "Vikram",
      branch: "IT",
      year: 3,
      semester: 5,
      cgpa: 7.5,
      graduationYear: 2027,
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: true,
    expectedReasonSnippet: "CGPA 7.5 satisfies minimum requirement of 7.5",
  },
  {
    id: 9,
    name: "Branch Synonym Normalization (Student 'Computer Science' vs Allowed 'CSE')",
    student: {
      name: "Deepak",
      branch: "Computer Science",
      year: 3,
      semester: 5,
      cgpa: 8.0,
      graduationYear: 2027,
    },
    requirements: {
      branches: ["CSE", "IT"],
      years: [],
      semesters: [],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    expectedEligible: true,
    expectedReasonSnippet: "Computer Science branch matches",
  },
  {
    id: 10,
    name: "Open Notice (No restrictive criteria specified in notice)",
    student: {
      name: "Meera",
      branch: "Biotech",
      year: 1,
      semester: 1,
      cgpa: 7.0,
      graduationYear: 2029,
    },
    requirements: {
      branches: [],
      years: [],
      semesters: [],
      minimumCGPA: null,
      maximumCGPA: null,
      graduationYears: [],
      skills: [],
    },
    expectedEligible: true,
    expectedReasonSnippet: "Open to all students",
  },
];

async function runEligibilityTests() {
  console.log("==================================================");
  console.log("PHASE 3: DETERMINISTIC ELIGIBILITY ENGINE TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    console.log(`--- Test ${tc.id}: ${tc.name} ---`);
    const result = evaluateEligibility(tc.student, tc.requirements);

    let testOk = true;

    if (result.eligible !== tc.expectedEligible) {
      console.error(`❌ Expected eligible: ${tc.expectedEligible}, got: ${result.eligible}`);
      testOk = false;
    } else {
      console.log(`  ✓ Eligible flag: ${result.eligible}`);
    }

    if (tc.expectedReasonSnippet) {
      const hasReason = result.reasons.some((r) => r.includes(tc.expectedReasonSnippet!));
      if (!hasReason) {
        console.error(`❌ Expected reason containing "${tc.expectedReasonSnippet}", got:`, result.reasons);
        testOk = false;
      } else {
        console.log(`  ✓ Reason validated: "${result.reasons[0]}"`);
      }
    }

    if (tc.expectedFailedSnippet) {
      const hasFailed = result.failedCriteria.some((f) => f.includes(tc.expectedFailedSnippet!));
      if (!hasFailed) {
        console.error(`❌ Expected failedCriteria containing "${tc.expectedFailedSnippet}", got:`, result.failedCriteria);
        testOk = false;
      } else {
        console.log(`  ✓ Failure reason validated: "${result.failedCriteria[0]}"`);
      }
    }

    if (result.missingRequirements.length > 0) {
      console.log(`  ℹ Missing requirements: [${result.missingRequirements.join(" | ")}]`);
    }

    if (testOk) {
      passed++;
      console.log(`✅ TEST ${tc.id} PASSED\n`);
    } else {
      failed++;
      console.log(`❌ TEST ${tc.id} FAILED\n`);
    }
  }

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${TEST_CASES.length})`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runEligibilityTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
