/**
 * Automated Test Suite for Notice Intelligence (Phase 2)
 * Tests all 8 mandatory notice scenarios:
 * 1. Placement notice
 * 2. Scholarship notice
 * 3. Examination notice
 * 4. Event notice
 * 5. Competition notice
 * 6. Notice with no deadline
 * 7. Notice with multiple dates
 * 8. Notice with complex eligibility
 */

import { extractNoticeFromText } from "../src/extractor/extractor.js";
import { StructuredNoticeSchema } from "../src/schemas/notice.schema.js";

interface TestCase {
  id: number;
  name: string;
  rawText: string;
  expectedCategory: string;
  expectedMinCGPA?: number | null;
  expectedDeadline?: string | null;
  expectedBranches?: string[];
  expectNoDeadline?: boolean;
}

const TEST_CASES: TestCase[] = [
  {
    id: 1,
    name: "Placement Notice (ABC Technologies)",
    rawText: `
      ABC Technologies is conducting campus recruitment for students graduating in 2027.
      B.Tech CSE and IT students with a minimum CGPA of 7.5 are eligible.
      Students must register before 20 September 2026.
      The online assessment will be conducted on 25 September 2026.
      Students must upload their resume during registration.
      Contact: placement@college.edu
    `,
    expectedCategory: "PLACEMENT",
    expectedMinCGPA: 7.5,
    expectedDeadline: "2026-09-20",
    expectedBranches: ["CSE", "IT"],
  },
  {
    id: 2,
    name: "Scholarship Notice (Merit-cum-Means)",
    rawText: `
      SCHOLARSHIP WELFARE CELL
      Applications are invited for the State Merit-cum-Means Scholarship Scheme.
      Eligible students with family income under 2.5 LPA and minimum CGPA of 8.0 can apply.
      Required documents: Income Certificate, Mark Sheets, and College ID.
      Submit online application before 15 October 2026 at https://scholarships.gov.in.
    `,
    expectedCategory: "SCHOLARSHIP",
    expectedMinCGPA: 8.0,
    expectedDeadline: "2026-10-15",
  },
  {
    id: 3,
    name: "Examination Notice (Mid-Semester Schedule)",
    rawText: `
      CONTROLLER OF EXAMINATIONS
      Mid-Semester Examination schedule for 3rd year B.Tech students.
      Theory examinations will be conducted commencing from 10 November 2026.
      Students must download admit card from ERP portal before 28 October 2026.
    `,
    expectedCategory: "EXAMINATION",
    expectedDeadline: "2026-10-28",
  },
  {
    id: 4,
    name: "Event Notice (Tech Symposium & Workshop)",
    rawText: `
      Department of Computer Science presents InnovateX Annual Tech Fest and Workshop.
      Keynote seminar on Artificial Intelligence will be held at Main Auditorium on 05 December 2026.
      Open to students of all branches and years. Certificates will be provided.
      Register before 30 November 2026.
    `,
    expectedCategory: "EVENT",
    expectedDeadline: "2026-11-30",
  },
  {
    id: 5,
    name: "Competition Notice (National Coding Hackathon)",
    rawText: `
      CodeSprint 2026 - Inter-College Hackathon Competition.
      Teams of 2 to 4 members can submit problem statements and project abstracts.
      Cash prize pool of INR 1,00,000.
      Register team before 30 September 2026 at https://codesprint.org.
      Final presentation scheduled on 12 October 2026.
    `,
    expectedCategory: "COMPETITION",
    expectedDeadline: "2026-09-30",
  },
  {
    id: 6,
    name: "Notice with No Deadline (Library Advisory)",
    rawText: `
      CENTRAL LIBRARY ADVISORY
      The central library reading hall will remain open 24x7 for all B.Tech students during exam prep.
      Students must carry valid College ID card at all times.
      Maintain strict silence inside reading areas.
    `,
    expectedCategory: "ADMINISTRATIVE",
    expectNoDeadline: true,
  },
  {
    id: 7,
    name: "Notice with Multiple Dates (Recruitment Phases)",
    rawText: `
      Apex Global Solutions Campus Hiring for 2027 batch B.Tech CSE students.
      Eligibility: CGPA 7.0 and above.
      Key timeline:
      1. Register before 18 September 2026.
      2. Online assessment will be conducted on 22 September 2026.
      3. Technical interviews on 28 September 2026.
      Upload resume at https://apex.apply.com.
    `,
    expectedCategory: "PLACEMENT",
    expectedMinCGPA: 7.0,
    expectedDeadline: "2026-09-18",
    expectedBranches: ["CSE"],
  },
  {
    id: 8,
    name: "Notice with Complex Eligibility",
    rawText: `
      FinTech Global High-CTC Recruitment.
      Eligibility Criteria:
      - Strictly for B.Tech CSE, IT, and ECE branches.
      - Students graduating in 2026 or 2027.
      - Minimum CGPA of 8.5 required.
      - Required skills: Python, Java, SQL, and React.
      - Required documents: Resume and Mark Sheets.
      Registration deadline: 05 October 2026.
    `,
    expectedCategory: "PLACEMENT",
    expectedMinCGPA: 8.5,
    expectedDeadline: "2026-10-05",
    expectedBranches: ["CSE", "IT", "ECE"],
  },
];

async function runTests() {
  console.log("==================================================");
  console.log("PHASE 2: NOTICE INTELLIGENCE TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    console.log(`--- Test ${tc.id}: ${tc.name} ---`);
    const result = await extractNoticeFromText(tc.rawText);

    if (!result.success) {
      console.error(`❌ FAILED: Extraction returned success = false. Errors:`, result.errors);
      failed++;
      continue;
    }

    const { notice } = result;

    // Validate against Zod schema
    const schemaValidation = StructuredNoticeSchema.safeParse(notice);
    if (!schemaValidation.success) {
      console.error(`❌ FAILED: Zod validation failed on output:`, schemaValidation.error.format());
      failed++;
      continue;
    }

    let testOk = true;

    // Check Category
    if (notice.category !== tc.expectedCategory) {
      console.error(`❌ Category mismatch: Expected ${tc.expectedCategory}, got ${notice.category}`);
      testOk = false;
    } else {
      console.log(`  ✓ Category: ${notice.category} (Confidence: ${notice.confidence})`);
    }

    // Check CGPA if expected
    if (tc.expectedMinCGPA !== undefined) {
      if (notice.eligibility.minimumCGPA !== tc.expectedMinCGPA) {
        console.error(`❌ CGPA mismatch: Expected ${tc.expectedMinCGPA}, got ${notice.eligibility.minimumCGPA}`);
        testOk = false;
      } else {
        console.log(`  ✓ Min CGPA: ${notice.eligibility.minimumCGPA}`);
      }
    }

    // Check Deadline
    if (tc.expectNoDeadline) {
      if (notice.deadline !== null) {
        console.error(`❌ Expected deadline to be null, got ${notice.deadline}`);
        testOk = false;
      } else {
        console.log(`  ✓ Deadline correctly identified as null (no false hallucination)`);
      }
    } else if (tc.expectedDeadline) {
      if (notice.deadline !== tc.expectedDeadline) {
        console.error(`❌ Deadline mismatch: Expected ${tc.expectedDeadline}, got ${notice.deadline}`);
        testOk = false;
      } else {
        console.log(`  ✓ Deadline: ${notice.deadline}`);
      }
    }

    // Check Branches
    if (tc.expectedBranches) {
      const missingBranch = tc.expectedBranches.filter((b) => !notice.eligibility.branches.includes(b));
      if (missingBranch.length > 0) {
        console.error(`❌ Missing expected branches: ${missingBranch.join(", ")}`);
        testOk = false;
      } else {
        console.log(`  ✓ Branches matched: ${notice.eligibility.branches.join(", ")}`);
      }
    }

    // Check Actions Extracted
    console.log(`  ✓ Actions Extracted: ${notice.requiredActions.length} actions: [${notice.requiredActions.map((a) => a.action).join(" | ")}]`);

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

runTests().catch((err) => {
  console.error("Test execution failed with unhandled error:", err);
  process.exit(1);
});
