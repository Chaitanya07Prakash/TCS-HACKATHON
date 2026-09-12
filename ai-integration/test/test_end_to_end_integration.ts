/**
 * End-to-End Integration Verification Test Suite (Phase 7)
 * Runs the complete end-to-end target hackathon scenarios:
 * 
 * SCENARIO 1 (Eligible Student):
 * - Student: Harsh (CSE, 3rd Year, CGPA 8.2, Grad 2027)
 * - Notice: ABC Technologies Campus Recruitment
 * - Pipeline: Raw Notice -> Ingest -> Evaluate -> Tasks -> Dashboard -> Assistant
 * - Assistant queries:
 *   "What do I need to complete this week?"
 *   "Which placement opportunities am I eligible for?"
 * 
 * SCENARIO 2 (Ineligible Student):
 * - Student: Rohan (Mechanical, 2nd Year, CGPA 6.2, Grad 2028)
 * - Pipeline: Evaluate -> Verify Ineligibility
 * - Assistant query:
 *   "Why am I not eligible for this opportunity?" -> Returns detailed explanation
 */

import { intelligenceService } from "../src/service/intelligenceService.js";
import { StudentProfile } from "../src/types/index.js";

const HARSH_STUDENT: StudentProfile = {
  id: "student-harsh-01",
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

const ROHAN_STUDENT: StudentProfile = {
  id: "student-rohan-02",
  name: "Rohan",
  branch: "ME",
  year: 2,
  semester: 3,
  cgpa: 6.2, // Below 7.5
  graduationYear: 2028, // Not 2027
  skills: ["AutoCAD", "SolidWorks"],
  interests: ["Mechanical Design"],
};

const RAW_ABC_NOTICE = `
ABC Technologies is conducting campus recruitment for students
graduating in 2027. B.Tech CSE and IT students with a minimum CGPA
of 7.5 are eligible. Students must register before 20 September 2026.
The online assessment will be conducted on 25 September 2026.
Students must upload their resume during registration.
`;

async function runEndToEndIntegration() {
  console.log("================================================================================");
  console.log("PHASE 7: END-TO-END SMART CAMPUS AI INTEGRATION SUITE");
  console.log("================================================================================\n");

  const REFERENCE_DATE = "2026-09-14"; // 6 days before Sep 20 deadline
  let passed = 0;
  let failed = 0;

  // ==========================================================================
  // SCENARIO 1: ELIGIBLE STUDENT (HARSH)
  // ==========================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("SCENARIO 1: FULL PIPELINE EXECUTION FOR HARSH (CSE, 8.2 CGPA, 2027 GRAD)");
  console.log("--------------------------------------------------------------------------------\n");

  // Step 1: Raw Notice Ingestion
  console.log("Step 1: Ingesting & Extracting Raw Notice Text...");
  const structuredNotice = await intelligenceService.ingestNotice(RAW_ABC_NOTICE);
  structuredNotice.id = "notice-abc-tech-01";

  console.log(`  ✓ Title: ${structuredNotice.title}`);
  console.log(`  ✓ Category: ${structuredNotice.category}`);
  console.log(`  ✓ Organization: ${structuredNotice.organization}`);
  console.log(`  ✓ Registration Deadline: ${structuredNotice.deadline}`);
  console.log(`  ✓ Assessment Date: ${structuredNotice.eventDate}`);
  console.log(`  ✓ Extracted Branches: ${structuredNotice.eligibility.branches.join(", ")}`);
  console.log(`  ✓ Minimum CGPA: ${structuredNotice.eligibility.minimumCGPA}`);
  console.log(`  ✓ Target Batch: ${structuredNotice.eligibility.graduationYears.join(", ")}`);
  console.log(`  ✓ Actions Identified: ${structuredNotice.requiredActions.length} actions:`);
  structuredNotice.requiredActions.forEach((a, idx) => {
    console.log(`     ${idx + 1}. [${a.actionType}] ${a.title} (Deadline: ${a.deadline})`);
  });

  // Step 2: Evaluate Opportunity against Harsh's Profile
  console.log("\nStep 2: Evaluating Opportunity against Harsh's Profile...");
  const evaluation = intelligenceService.evaluateOpportunityForStudent(
    HARSH_STUDENT,
    structuredNotice,
    { referenceDate: REFERENCE_DATE }
  );

  console.log(`  ✓ Eligible: ${evaluation.eligibility.eligible}`);
  console.log(`  ✓ Relevance Score: ${evaluation.relevance.score}/100`);
  console.log(`  ✓ Priority: ${evaluation.relevance.priority}`);
  console.log("  ✓ Eligibility Reasons:");
  evaluation.eligibility.reasons.forEach((r) => console.log(`     ${r}`));
  console.log("  ✓ Relevance Breakdown:");
  console.log("    ", JSON.stringify(evaluation.relevance.factors));

  // Step 3: Tasks Created
  console.log(`\nStep 3: Actionable Tasks Generated for Student: ${evaluation.recommendedTasks.length} tasks:`);
  evaluation.recommendedTasks.forEach((t, idx) => {
    console.log(`     ${idx + 1}. Task: "${t.title}" | Due: ${t.deadline} | Priority: ${t.priority}`);
  });

  // Step 4: Populate Dashboard
  console.log("\nStep 4: Building Student Dashboard Data...");
  const dashboard = intelligenceService.evaluateStudentDashboard(
    HARSH_STUDENT,
    [structuredNotice],
    { referenceDate: REFERENCE_DATE }
  );

  console.log(`  ✓ Dashboard Metrics: Total Notices: ${dashboard.metrics.totalNotices}, Eligible: ${dashboard.metrics.eligibleCount}, High Priority: ${dashboard.metrics.highPriorityCount}, Tasks: ${dashboard.metrics.pendingTasksCount}`);

  // Assertions for Scenario 1 Pipeline
  let scenario1Ok = true;
  if (evaluation.eligibility.eligible !== true) {
    console.error("❌ Failed assertion: Eligible should be true");
    scenario1Ok = false;
  }
  if (evaluation.relevance.score !== 96 || evaluation.relevance.priority !== "HIGH") {
    console.error(`❌ Failed assertion: Expected 96 HIGH, got ${evaluation.relevance.score} ${evaluation.relevance.priority}`);
    scenario1Ok = false;
  }
  if (evaluation.recommendedTasks.length < 2) {
    console.error("❌ Failed assertion: Expected at least 2 recommended tasks");
    scenario1Ok = false;
  }

  // Step 5: Query AI Assistant: "What do I need to complete this week?"
  console.log("\nStep 5: Querying AI Assistant: 'What do I need to complete this week?'");
  const assistantRes1 = await intelligenceService.handleAssistantQuery(
    "What do I need to complete this week?",
    {
      student: HARSH_STUDENT,
      notices: [structuredNotice],
      activeTasks: evaluation.recommendedTasks,
      referenceDate: REFERENCE_DATE,
    }
  );

  console.log("  Assistant Answer:\n", assistantRes1.answer);
  console.log("  Returned Tasks in JSON:", assistantRes1.tasks.map((t) => `${t.title} (${t.deadline})`));

  const containsRegTask = assistantRes1.answer.includes("Register") && assistantRes1.answer.includes("2026-09-20");
  if (!containsRegTask) {
    console.error("❌ Failed assertion: Assistant response does not mention registration task and deadline");
    scenario1Ok = false;
  }

  // Step 6: Query AI Assistant: "Which placement opportunities am I eligible for?"
  console.log("\nStep 6: Querying AI Assistant: 'Which placement opportunities am I eligible for?'");
  const assistantRes2 = await intelligenceService.handleAssistantQuery(
    "Which placement opportunities am I eligible for?",
    {
      student: HARSH_STUDENT,
      notices: [structuredNotice],
      referenceDate: REFERENCE_DATE,
    }
  );

  console.log("  Assistant Answer:\n", assistantRes2.answer);
  console.log("  Returned Opportunities in JSON:", assistantRes2.opportunities.map((o) => `${o.title} (${o.relevanceScore}%)`));

  const containsABCPlacement = assistantRes2.answer.includes("ABC Technologies") && assistantRes2.opportunities.length === 1;
  if (!containsABCPlacement) {
    console.error("❌ Failed assertion: Assistant response does not list eligible ABC Technologies placement");
    scenario1Ok = false;
  }

  if (scenario1Ok) {
    console.log("\n✅ SCENARIO 1 FULLY PASSED: Harsh is eligible, scored 96% HIGH, tasks created, and assistant answered accurately!\n");
    passed++;
  } else {
    console.log("\n❌ SCENARIO 1 FAILED\n");
    failed++;
  }

  // ==========================================================================
  // SCENARIO 2: INELIGIBLE STUDENT (ROHAN)
  // ==========================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("SCENARIO 2: INELIGIBLE STUDENT EVALUATION (ROHAN: ME, 6.2 CGPA, 2028 GRAD)");
  console.log("--------------------------------------------------------------------------------\n");

  console.log("Step 1: Evaluating ABC Technologies Notice against Rohan's Profile...");
  const evaluationRohan = intelligenceService.evaluateOpportunityForStudent(
    ROHAN_STUDENT,
    structuredNotice,
    { referenceDate: REFERENCE_DATE }
  );

  console.log(`  ✓ Eligible: ${evaluationRohan.eligibility.eligible}`);
  console.log(`  ✓ Priority: ${evaluationRohan.relevance.priority}`);
  console.log("  ✓ Failed Criteria:");
  evaluationRohan.eligibility.failedCriteria.forEach((f) => console.log(`     ${f}`));
  console.log("  ✓ Missing Requirements:");
  evaluationRohan.eligibility.missingRequirements.forEach((m) => console.log(`     ${m}`));

  let scenario2Ok = true;
  if (evaluationRohan.eligibility.eligible !== false) {
    console.error("❌ Failed assertion: Rohan should NOT be eligible");
    scenario2Ok = false;
  }
  if (evaluationRohan.recommendedTasks.length !== 0) {
    console.error("❌ Failed assertion: Ineligible student should receive 0 tasks for this opportunity");
    scenario2Ok = false;
  }

  // Step 2: Query AI Assistant: "Why am I not eligible for this opportunity?"
  console.log("\nStep 2: Querying AI Assistant: 'Why am I not eligible for this opportunity?'");
  const assistantResRohan = await intelligenceService.handleAssistantQuery(
    "Why am I not eligible for this opportunity?",
    {
      student: ROHAN_STUDENT,
      notices: [structuredNotice],
      referenceDate: REFERENCE_DATE,
    }
  );

  console.log("  Assistant Answer:\n", assistantResRohan.answer);

  const explainsBranch = assistantResRohan.answer.includes("Required branch");
  const explainsCGPA = assistantResRohan.answer.includes("Required minimum CGPA");

  if (!explainsBranch || !explainsCGPA) {
    console.error("❌ Failed assertion: Assistant failed to explain branch or CGPA disqualification reasons");
    scenario2Ok = false;
  }

  if (scenario2Ok) {
    console.log("\n✅ SCENARIO 2 FULLY PASSED: Ineligible student correctly rejected with clear explanation reasons!\n");
    passed++;
  } else {
    console.log("\n❌ SCENARIO 2 FAILED\n");
    failed++;
  }

  console.log("================================================================================");
  console.log(`INTEGRATION TEST SUMMARY: ${passed} SCENARIOS PASSED, ${failed} SCENARIOS FAILED`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

runEndToEndIntegration().catch((err) => {
  console.error("E2E test error:", err);
  process.exit(1);
});
