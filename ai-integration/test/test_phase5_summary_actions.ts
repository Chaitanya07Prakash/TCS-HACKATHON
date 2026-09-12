/**
 * Test Suite for Phase 5: Summaries & Action Extraction
 * Tests:
 * 1. Long realistic placement notice (ABC Technologies) with multi-action extraction
 * 2. Personalized summary for Eligible Student (Harsh, 96% match)
 * 3. Personalized summary for Ineligible Student (Amit, CGPA failure)
 * 4. Missing Information Notice (no deadline, no cutoff) -> Verified anti-hallucination
 * 5. Multi-Action Notice (Registration + Document Submission + Fee Payment + Hall ticket)
 */

import { extractNoticeFromText } from "../src/extractor/extractor.js";
import { extractExplicitActions } from "../src/extractor/actionExtractor.js";
import { generatePersonalizedSummary } from "../src/extractor/personalSummarizer.js";
import { evaluateEligibility } from "../src/engine/eligibility.js";
import { calculateRelevance } from "../src/engine/relevance.js";
import { StudentProfile } from "../src/types/index.js";

const HARSH_PROFILE: StudentProfile = {
  name: "Harsh",
  branch: "CSE",
  year: 3,
  semester: 5,
  cgpa: 8.2,
  graduationYear: 2027,
  skills: ["Python", "Java", "React", "SQL"],
  interests: ["AI", "Backend"],
  placementPreferences: ["Software Development"],
};

const AMIT_PROFILE: StudentProfile = {
  name: "Amit",
  branch: "CSE",
  year: 3,
  semester: 5,
  cgpa: 7.2, // Below 7.5
  graduationYear: 2027,
  skills: ["Python"],
  interests: ["Software Development"],
};

const LONG_PLACEMENT_NOTICE = `
OFFICE OF TRAINING AND PLACEMENT
CIRCULAR NO: T&P/2026/09/REC-041

Subject: Campus Recruitment Drive by ABC Technologies for B.Tech Batch of 2027

This is to inform all students of B.Tech Computer Science & Engineering (CSE) and Information Technology (IT) graduating in the year 2027 that ABC Technologies, a premier software enterprise, will be visiting our campus for hiring associate software engineers in AI and backend platforms.

Eligibility Criteria:
1. Degree: B.Tech (CSE, IT)
2. Graduation Year: 2027
3. Academic Cutoff: Minimum CGPA of 7.5 and above with no current backlogs.

Instructions and Timeline:
- Interested and eligible students must complete their online registration before 20 September 2026 at 11:59 PM.
- Candidates must upload their updated technical resume and grade transcripts during registration.
- The first round of online coding assessment will be conducted on 25 September 2026.
- Shortlisted candidates will undergo technical interviews thereafter.

Registration Portal: https://abctech.campus.hire/apply
For queries, contact Training & Placement Officer: tpo@college.edu | +91 9876543210
`;

const MULTI_ACTION_NOTICE = `
EXAMINATION CELL & FINANCE OFFICE NOTIFICATION

Semester Examination Guidelines:
1. Students must clear all pending semester fees and library dues before 25 October 2026.
2. Submit verification documents and caste certificates to Academic Section by 28 October 2026.
3. Download examination admit card / hall ticket from student ERP before 02 November 2026.
4. Mid-term theory examinations will be conducted commencing from 10 November 2026.
`;

const MISSING_INFO_NOTICE = `
CAMPUS SUSTAINABILITY INITIATIVE

The Green Campus Club invites enthusiastic students from all departments to participate in the Campus Tree Plantation and Biodiversity Audit drive.
Volunteers will be assigned tree monitoring zones and will receive social service credits upon completion.
Meet at Central Lawn at 9:00 AM on Saturday. Bring water bottles.
`;

async function runPhase5Tests() {
  console.log("==================================================");
  console.log("PHASE 5: SUMMARIES & ACTION EXTRACTION TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Long Placement Notice Extraction & Action Extraction
  console.log("--- Test 1: Long Placement Notice Extraction ---");
  const extracted = await extractNoticeFromText(LONG_PLACEMENT_NOTICE);
  const notice = extracted.notice;

  console.log(`  Title: ${notice.title}`);
  console.log(`  Category: ${notice.category}`);
  console.log(`  Deadline: ${notice.deadline}`);
  console.log(`  Min CGPA: ${notice.eligibility.minimumCGPA}`);
  console.log(`  Actions found: ${notice.requiredActions.length}`);
  notice.requiredActions.forEach((a, i) => {
    console.log(`    ${i + 1}. [${a.actionType}] ${a.title} (Deadline: ${a.deadline})`);
  });

  const hasReg = notice.requiredActions.some((a) => a.actionType === "REGISTER" && a.deadline === "2026-09-20");
  const hasResume = notice.requiredActions.some((a) => a.actionType === "UPLOAD_RESUME" && a.deadline === "2026-09-20");
  const hasAssess = notice.requiredActions.some((a) => a.actionType === "ATTEND_ASSESSMENT" && a.deadline === "2026-09-25");

  if (hasReg && hasResume && hasAssess) {
    console.log("✅ TEST 1 PASSED: All 3 explicit actions extracted with correct individual deadlines\n");
    passed++;
  } else {
    console.error("❌ TEST 1 FAILED: Missing one or more required actions with correct dates\n");
    failed++;
  }

  // Test 2: Personalized Summary for Eligible Student (Harsh)
  console.log("--- Test 2: Personalized Summary for Eligible Student (Harsh) ---");
  const eligHarsh = evaluateEligibility(HARSH_PROFILE, notice.eligibility);
  const relHarsh = calculateRelevance(HARSH_PROFILE, notice, { referenceDate: "2026-09-14" });
  const summaryHarsh = generatePersonalizedSummary(notice, {
    student: HARSH_PROFILE,
    eligibility: eligHarsh,
    relevance: relHarsh,
  });

  console.log(summaryHarsh);

  const containsElig = summaryHarsh.includes("✓ You are eligible because:");
  const containsMatchScore = summaryHarsh.includes("★ Match Score: 96%");
  const containsInterest = summaryHarsh.includes("AI & Backend");

  if (containsElig && containsMatchScore && containsInterest) {
    console.log("✅ TEST 2 PASSED: Personalized summary contains eligible reasons, 96% score, and interest match\n");
    passed++;
  } else {
    console.error("❌ TEST 2 FAILED: Personalized summary missing expected elements\n");
    failed++;
  }

  // Test 3: Personalized Summary for Ineligible Student (Amit)
  console.log("--- Test 3: Personalized Summary for Ineligible Student (Amit) ---");
  const eligAmit = evaluateEligibility(AMIT_PROFILE, notice.eligibility);
  const relAmit = calculateRelevance(AMIT_PROFILE, notice, { referenceDate: "2026-09-14" });
  const summaryAmit = generatePersonalizedSummary(notice, {
    student: AMIT_PROFILE,
    eligibility: eligAmit,
    relevance: relAmit,
  });

  console.log(summaryAmit);

  const containsInelig = summaryAmit.includes("✗ You are not eligible because:");
  const containsCGPAShortfall = summaryAmit.includes("Shortfall: 0.30");

  if (containsInelig && containsCGPAShortfall) {
    console.log("✅ TEST 3 PASSED: Ineligible student correctly receives explanation and shortfall\n");
    passed++;
  } else {
    console.error("❌ TEST 3 FAILED: Ineligible summary did not explain shortfall\n");
    failed++;
  }

  // Test 4: Missing Information Handling (Anti-Hallucination)
  console.log("--- Test 4: Missing Information Handling ---");
  const missingExtracted = await extractNoticeFromText(MISSING_INFO_NOTICE);
  const missingNotice = missingExtracted.notice;
  const missingSummary = generatePersonalizedSummary(missingNotice);

  console.log(missingSummary);

  const correctlyNoDeadline = missingNotice.deadline === null;
  const summaryShowsNoDeadline = missingSummary.includes("Registration Deadline: Not specified in notice");

  if (correctlyNoDeadline && summaryShowsNoDeadline) {
    console.log("✅ TEST 4 PASSED: Missing deadline cleanly reported without hallucinating\n");
    passed++;
  } else {
    console.error("❌ TEST 4 FAILED: Missing information hallucinated or misreported\n");
    failed++;
  }

  // Test 5: Multi-Action Notice (Fee payment, documents, admit card, exam)
  console.log("--- Test 5: Multi-Action Notice (4 distinct actions) ---");
  const multiActions = extractExplicitActions(MULTI_ACTION_NOTICE, {
    category: "EXAMINATION",
  });

  console.log(`  Actions extracted: ${multiActions.length}`);
  multiActions.forEach((a, i) => console.log(`    ${i + 1}. [${a.actionType}] ${a.title} (Deadline: ${a.deadline})`));

  const hasFee = multiActions.some((a) => a.actionType === "PAY_FEE");
  const hasDocs = multiActions.some((a) => a.actionType === "SUBMIT_DOCUMENTS");
  const hasAdmit = multiActions.some((a) => a.actionType === "ATTEND_ASSESSMENT" && a.action === "Download hall ticket");
  const hasExam = multiActions.some((a) => a.actionType === "ATTEND_ASSESSMENT" && a.action === "Attend exam");

  if (hasFee && hasDocs && hasAdmit && hasExam) {
    console.log("✅ TEST 5 PASSED: All 4 distinct actions successfully extracted\n");
    passed++;
  } else {
    console.error("❌ TEST 5 FAILED: Failed to extract all 4 actions\n");
    failed++;
  }

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: 5)`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runPhase5Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
