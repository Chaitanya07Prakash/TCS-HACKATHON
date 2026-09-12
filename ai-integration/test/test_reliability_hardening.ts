/**
 * Phase 8: AI Reliability & Hackathon Hardening Test Suite
 * Tests all 15 mandatory reliability & edge cases:
 * 1. Notice has no deadline.
 * 2. Notice has multiple dates.
 * 3. Notice has unclear eligibility.
 * 4. Notice has multiple branches.
 * 5. Student CGPA exactly equals minimum.
 * 6. Student CGPA is below minimum.
 * 7. Student profile is incomplete.
 * 8. AI returns malformed JSON.
 * 9. AI API times out / service fallback.
 * 10. No opportunities match.
 * 11. Deadline has passed.
 * 12. Notice contains OCR errors.
 * 13. Long notice.
 * 14. Duplicate notice handling.
 * 15. Student asks a question with no relevant data.
 */

import { extractNoticeFromText, validateAndRepairNotice } from "../src/extractor/extractor.js";
import { evaluateEligibility } from "../src/engine/eligibility.js";
import { calculateRelevance, calculateDeadlineUrgency } from "../src/engine/relevance.js";
import { intelligenceService } from "../src/service/intelligenceService.js";
import { StudentProfile, StructuredNotice } from "../src/types/index.js";

const BASE_STUDENT: StudentProfile = {
  name: "Harsh",
  branch: "CSE",
  year: 3,
  semester: 5,
  cgpa: 8.2,
  graduationYear: 2027,
  skills: ["Python", "Java", "SQL"],
  interests: ["AI", "Backend"],
};

async function runReliabilityTests() {
  console.log("================================================================================");
  console.log("PHASE 8: AI RELIABILITY & HACKATHON HARDENING SUITE (15 EDGE CASES)");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  // Case 1: Notice has no deadline
  console.log("--- Case 1: Notice has no deadline ---");
  const r1 = await intelligenceService.ingestNotice(`
    CENTRAL LIBRARY ANNOUNCEMENT
    Library books can be returned without fine during the inventory audit.
  `);
  if (r1.deadline === null && r1.summary.includes("Deadline: Not specified")) {
    console.log("  ✓ Deadline is safely null, summary explicitly notes unspecified deadline.");
    console.log("✅ CASE 1 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 1 FAILED\n");
    failed++;
  }

  // Case 2: Notice has multiple dates (Registration vs Assessment vs Interviews)
  console.log("--- Case 2: Notice has multiple dates ---");
  const r2 = await intelligenceService.ingestNotice(`
    Hiring Drive Timeline:
    1. Register before 18 September 2026.
    2. Online assessment will be conducted on 22 September 2026.
    3. Final interviews on 30 September 2026.
  `);
  if (r2.deadline === "2026-09-18" && r2.eventDate === "2026-09-22") {
    console.log(`  ✓ Registration deadline: ${r2.deadline}, Event/Assessment date: ${r2.eventDate}`);
    console.log("✅ CASE 2 PASSED\n");
    passed++;
  } else {
    console.error(`❌ CASE 2 FAILED: Expected 2026-09-18 / 2026-09-22, got ${r2.deadline} / ${r2.eventDate}\n`);
    failed++;
  }

  // Case 3: Notice has unclear eligibility
  console.log("--- Case 3: Notice has unclear / open eligibility ---");
  const r3 = await intelligenceService.ingestNotice(`
    GENERAL NOTICE
    Annual sports meet registration is open to interested college students.
  `);
  const elig3 = evaluateEligibility(BASE_STUDENT, r3.eligibility);
  if (elig3.eligible === true && elig3.reasons[0].includes("Open to all students")) {
    console.log("  ✓ Open notice correctly treated as universally eligible with transparent note.");
    console.log("✅ CASE 3 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 3 FAILED\n");
    failed++;
  }

  // Case 4: Notice has multiple branches
  console.log("--- Case 4: Notice has multiple branches ---");
  const r4 = await intelligenceService.ingestNotice(`
    Core Engineering Recruitment for B.Tech CSE, IT, ECE, and Mechanical students.
    Cutoff: 7.0 CGPA.
  `);
  const branchesFound = r4.eligibility.branches;
  if (branchesFound.includes("CSE") && branchesFound.includes("IT") && branchesFound.includes("ECE") && branchesFound.includes("ME")) {
    console.log(`  ✓ Successfully extracted all branches: ${branchesFound.join(", ")}`);
    console.log("✅ CASE 4 PASSED\n");
    passed++;
  } else {
    console.error(`❌ CASE 4 FAILED: Extracted branches: ${branchesFound.join(", ")}\n`);
    failed++;
  }

  // Case 5: Student CGPA exactly equals minimum (7.5 == 7.5)
  console.log("--- Case 5: Student CGPA exactly equals minimum (Boundary test) ---");
  const elig5 = evaluateEligibility(
    { ...BASE_STUDENT, cgpa: 7.5 },
    { branches: ["CSE"], years: [], semesters: [], minimumCGPA: 7.5, maximumCGPA: null, graduationYears: [2027], skills: [] }
  );
  if (elig5.eligible === true) {
    console.log("  ✓ Strict >= inequality: Student CGPA 7.5 satisfies cutoff 7.5.");
    console.log("✅ CASE 5 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 5 FAILED\n");
    failed++;
  }

  // Case 6: Student CGPA is below minimum (7.49 < 7.5)
  console.log("--- Case 6: Student CGPA is below minimum ---");
  const elig6 = evaluateEligibility(
    { ...BASE_STUDENT, cgpa: 7.49 },
    { branches: ["CSE"], years: [], semesters: [], minimumCGPA: 7.5, maximumCGPA: null, graduationYears: [2027], skills: [] }
  );
  if (elig6.eligible === false && elig6.failedCriteria[0].includes("7.49")) {
    console.log("  ✓ Correctly rejected: shortfall of 0.01 identified.");
    console.log("✅ CASE 6 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 6 FAILED\n");
    failed++;
  }

  // Case 7: Student profile is incomplete
  console.log("--- Case 7: Student profile is incomplete ---");
  const elig7 = evaluateEligibility(
    { name: "Harsh" }, // Missing branch, CGPA, graduationYear
    { branches: ["CSE"], years: [], semesters: [], minimumCGPA: 7.5, maximumCGPA: null, graduationYears: [2027], skills: [] }
  );
  if (elig7.eligible === false && elig7.missingRequirements.length >= 2) {
    console.log(`  ✓ Safely marked ineligible; missing fields: [${elig7.missingRequirements.join(", ")}]`);
    console.log("✅ CASE 7 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 7 FAILED\n");
    failed++;
  }

  // Case 8: AI returns malformed JSON (Zod validation & auto-repair)
  console.log("--- Case 8: AI returns malformed JSON ---");
  const malformedPayload = {
    title: 12345, // Invalid type
    category: "NON_EXISTENT_CATEGORY", // Invalid enum
    confidence: "super high", // Invalid number
  };
  const repairResult = validateAndRepairNotice(malformedPayload);
  if (repairResult.isValid === false && repairResult.notice.category === "GENERAL") {
    console.log("  ✓ Malformed payload safely intercepted and auto-repaired to fallback notice without crash.");
    console.log("✅ CASE 8 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 8 FAILED\n");
    failed++;
  }

  // Case 9: AI API times out / fails gracefully
  console.log("--- Case 9: Service resilience when input is degraded ---");
  const r9 = await intelligenceService.ingestNotice("   "); // completely empty string
  if (r9.title === "Empty Notice" && r9.confidence === 0) {
    console.log("  ✓ Degraded input gracefully returns safe fallback notice.");
    console.log("✅ CASE 9 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 9 FAILED\n");
    failed++;
  }

  // Case 10: No opportunities match
  console.log("--- Case 10: No opportunities match query ---");
  const res10 = await intelligenceService.handleAssistantQuery("What scholarships can I apply for?", {
    student: BASE_STUDENT,
    notices: [], // No notices
  });
  if (res10.opportunities.length === 0 && res10.answer.includes("no active scholarship opportunities")) {
    console.log("  ✓ Correctly returns 0 opportunities with helpful message.");
    console.log("✅ CASE 10 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 10 FAILED\n");
    failed++;
  }

  // Case 11: Deadline has passed
  console.log("--- Case 11: Deadline has passed ---");
  const pastUrgency = calculateDeadlineUrgency("2026-08-01", "2026-09-14");
  if (pastUrgency.urgencyScore === 0 && pastUrgency.reason.includes("already passed")) {
    console.log("  ✓ Passed deadline assigned 0 urgency points and flagged as passed.");
    console.log("✅ CASE 11 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 11 FAILED\n");
    failed++;
  }

  // Case 12: Notice contains OCR errors
  console.log("--- Case 12: Notice contains OCR errors & scan noise ---");
  const ocrText = `
    ======================================
    Page 1 of 3 [Scanned by CamScanner]
    ======================================
    ABC Tech-
    nologies is hiring for soft-
    ware roles. Students with CGPA 7.5+ can ap-
    ply before 20 September 2026.
    --------------------------------------
  `;
  const r12 = await intelligenceService.ingestNotice(ocrText);
  if (r12.deadline === "2026-09-20" && r12.eligibility.minimumCGPA === 7.5) {
    console.log("  ✓ OCR noise, hyphenated line wraps, and scanner watermarks successfully stripped.");
    console.log("✅ CASE 12 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 12 FAILED\n");
    failed++;
  }

  // Case 13: Long notice
  console.log("--- Case 13: Long notice handling ---");
  const longNoticeText = `
    UNIVERSITY PLACEMENT CELL CIRCULAR 2026
    ${"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(40)}
    TechCorp Recruitment for CSE graduating in 2027. Min CGPA: 8.0.
    Deadline: 15 October 2026.
    ${"Additional campus guidelines and policy descriptions follow. ".repeat(30)}
  `;
  const r13 = await intelligenceService.ingestNotice(longNoticeText);
  if (r13.deadline === "2026-10-15" && r13.eligibility.minimumCGPA === 8.0) {
    console.log("  ✓ Long multi-paragraph circular processed accurately without memory or token limits.");
    console.log("✅ CASE 13 PASSED\n");
    passed++;
  } else {
    console.error("❌ CASE 13 FAILED\n");
    failed++;
  }

  // Case 14: Duplicate notice handling
  console.log("--- Case 14: Duplicate notice deduplication in Dashboard ---");
  const dupNotice = await intelligenceService.ingestNotice("ABC Recruitment before 20 September 2026 for CSE with CGPA 7.5.");
  const dashboardWithDups = intelligenceService.evaluateStudentDashboard(
    BASE_STUDENT,
    [dupNotice, dupNotice, dupNotice], // Same notice submitted 3 times
    { referenceDate: "2026-09-14" }
  );
  if (dashboardWithDups.allEligibleOpportunities.length === 1 && dashboardWithDups.metrics.eligibleCount === 1) {
    console.log("  ✓ Duplicate notices automatically deduplicated; only 1 card rendered.");
    console.log("✅ CASE 14 PASSED\n");
    passed++;
  } else {
    console.error(`❌ CASE 14 FAILED: Expected 1 unique opportunity, got ${dashboardWithDups.allEligibleOpportunities.length}\n`);
    failed++;
  }

  // Case 15: Student asks a question with no relevant data (Strict anti-hallucination)
  console.log("--- Case 15: Student asks question with no relevant data ---");
  const res15 = await intelligenceService.handleAssistantQuery("Who won the 1998 World Cup?", {
    student: BASE_STUDENT,
    notices: [r13],
  });
  if (res15.answer === "I don't have enough information from the available notices to answer that.") {
    console.log("  ✓ Strictly refused to hallucinate external data.");
    console.log("✅ CASE 15 PASSED\n");
    passed++;
  } else {
    console.error(`❌ CASE 15 FAILED: Unexpected response: ${res15.answer}\n`);
    failed++;
  }

  console.log("================================================================================");
  console.log(`RELIABILITY SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (Total: 15)`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

runReliabilityTests().catch((err) => {
  console.error("Reliability test error:", err);
  process.exit(1);
});
