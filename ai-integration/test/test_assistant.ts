/**
 * Automated Test Suite for Smart Campus AI Assistant (Phase 6)
 * Tests:
 * 1. "What do I need to complete this week?" (TASK_QUERY)
 * 2. "Which placement opportunities am I eligible for?" (PLACEMENT_QUERY with eligibility engine)
 * 3. "What scholarships can I apply for?" (SCHOLARSHIP_QUERY)
 * 4. "What deadlines are coming up?" (DEADLINE_QUERY)
 * 5. "What do I need to submit tomorrow?" (TASK_QUERY with tomorrow filter)
 * 6. "Why am I not eligible for this opportunity?" (ELIGIBILITY_QUERY for ineligible student)
 * 7. "Show me opportunities related to AI." (OPPORTUNITY_QUERY with AI filter)
 * 8. "Which opportunities should I prioritize?" (OPPORTUNITY_QUERY with relevance ranking)
 * 9. Unknown Query (Strict grounding: "I don't have enough information...")
 * 10. Empty Results Query (Scholarships when none exist)
 * 11. Missing Student Profile Information (Incomplete profile warning)
 */

import { queryAssistant } from "../src/assistant/assistant.js";
import { StudentProfile, StructuredNotice, ActionTask } from "../src/types/index.js";

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

const INELIGIBLE_STUDENT: StudentProfile = {
  name: "Karan",
  branch: "Civil",
  year: 3,
  semester: 5,
  cgpa: 6.8, // Cutoff is 7.5
  graduationYear: 2027,
  skills: ["Surveying"],
  interests: ["Construction"],
};

const SAMPLE_NOTICES: StructuredNotice[] = [
  {
    id: "notice-1",
    title: "ABC Technologies Campus Recruitment",
    category: "PLACEMENT",
    organization: "ABC Technologies",
    description: "Campus drive for software engineering roles in AI and cloud platforms.",
    summary: "ABC Technologies recruitment for 2027 batch CSE/IT students.",
    deadline: "2026-09-20",
    eventDate: "2026-09-25",
    location: "Online",
    eligibility: {
      branches: ["CSE", "IT"],
      years: [3],
      semesters: [5],
      minimumCGPA: 7.5,
      maximumCGPA: null,
      graduationYears: [2027],
      skills: [],
    },
    requiredSkills: ["Python", "SQL"],
    requiredDocuments: ["Resume"],
    requiredActions: [
      { title: "Register for campus placement", action: "Register", deadline: "2026-09-20" },
      { title: "Upload resume during registration", action: "Upload resume", deadline: "2026-09-20" },
      { title: "Complete online assessment", action: "Complete assessment", deadline: "2026-09-25" },
    ],
    registrationLink: "https://abc.tech/apply",
    contactInformation: "placement@college.edu",
    confidence: 0.95,
  },
  {
    id: "notice-2",
    title: "State Merit-cum-Means Scholarship",
    category: "SCHOLARSHIP",
    organization: "State Welfare Board",
    description: "Financial aid for undergraduate engineering students.",
    summary: "Scholarship for meritorious students with family income under 2.5 LPA.",
    deadline: "2026-10-15",
    eventDate: null,
    location: null,
    eligibility: {
      branches: [],
      years: [],
      semesters: [],
      minimumCGPA: 8.0,
      maximumCGPA: null,
      graduationYears: [],
      skills: [],
    },
    requiredSkills: [],
    requiredDocuments: ["Income Certificate", "Mark Sheets"],
    requiredActions: [
      { title: "Submit online scholarship form", action: "Submit form", deadline: "2026-10-15" },
    ],
    registrationLink: "https://scholarships.gov.in",
    contactInformation: null,
    confidence: 0.92,
  },
];

const SAMPLE_TASKS: ActionTask[] = [
  {
    id: "task-1",
    title: "Register for ABC Technologies recruitment",
    action: "Register",
    deadline: "2026-09-20",
    priority: "HIGH",
    status: "PENDING",
  },
  {
    id: "task-2",
    title: "Upload resume for ABC Technologies",
    action: "Upload resume",
    deadline: "2026-09-20",
    priority: "HIGH",
    status: "PENDING",
  },
  {
    id: "task-3",
    title: "Submit Lab Assignment",
    action: "Submit",
    deadline: "2026-09-15", // Tomorrow relative to 2026-09-14
    priority: "HIGH",
    status: "PENDING",
  },
];

async function runAssistantTests() {
  console.log("==================================================");
  console.log("PHASE 6: SMART CAMPUS AI ASSISTANT TEST SUITE");
  console.log("==================================================\n");

  const baseContext = {
    student: HARSH_PROFILE,
    notices: SAMPLE_NOTICES,
    activeTasks: SAMPLE_TASKS,
    referenceDate: "2026-09-14", // Tuesday, 6 days before Sep 20
  };

  let passed = 0;
  let failed = 0;

  // Test 1: "What do I need to complete this week?"
  console.log("--- Test 1: What do I need to complete this week? ---");
  const res1 = await queryAssistant("What do I need to complete this week?", baseContext);
  console.log("  Intent:", res1.intent);
  console.log("  Answer:\n", res1.answer);
  console.log(`  Tasks returned: ${res1.tasks.length}`);

  if (res1.intent === "TASK_QUERY" && res1.tasks.length > 0 && res1.answer.includes("actionable tasks")) {
    console.log("✅ TEST 1 PASSED\n");
    passed++;
  } else {
    console.error("❌ TEST 1 FAILED\n");
    failed++;
  }

  // Test 2: "Which placement opportunities am I eligible for?"
  console.log("--- Test 2: Which placement opportunities am I eligible for? ---");
  const res2 = await queryAssistant("Which placement opportunities am I eligible for?", baseContext);
  console.log("  Intent:", res2.intent);
  console.log("  Answer:\n", res2.answer);
  console.log(`  Eligible opportunities: ${res2.opportunities.length}`);

  if (
    res2.intent === "PLACEMENT_QUERY" &&
    res2.opportunities.length === 1 &&
    res2.opportunities[0].title.includes("ABC Technologies") &&
    res2.answer.includes("ABC Technologies")
  ) {
    console.log("✅ TEST 2 PASSED\n");
    passed++;
  } else {
    console.error("❌ TEST 2 FAILED\n");
    failed++;
  }

  // Test 3: "What scholarships can I apply for?"
  console.log("--- Test 3: What scholarships can I apply for? ---");
  const res3 = await queryAssistant("What scholarships can I apply for?", baseContext);
  console.log("  Intent:", res3.intent);
  console.log("  Answer:\n", res3.answer);

  if (res3.intent === "SCHOLARSHIP_QUERY" && res3.opportunities.length === 1 && res3.answer.includes("Merit-cum-Means")) {
    console.log("✅ TEST 3 PASSED\n");
    passed++;
  } else {
    console.error("❌ TEST 3 FAILED\n");
    failed++;
  }

  // Test 4: "What deadlines are coming up?"
  console.log("--- Test 4: What deadlines are coming up? ---");
  const res4 = await queryAssistant("What deadlines are coming up?", baseContext);
  console.log("  Intent:", res4.intent);
  console.log("  Answer:\n", res4.answer);
  console.log(`  Deadlines count: ${res4.deadlines.length}`);

  if (res4.intent === "DEADLINE_QUERY" && res4.deadlines.length > 0) {
    console.log("✅ TEST 4 PASSED\n");
    passed++;
  } else {
    console.error("❌ TEST 4 FAILED\n");
    failed++;
  }

  // Test 5: "What do I need to submit tomorrow?"
  console.log("--- Test 5: What do I need to submit tomorrow? ---");
  const res5 = await queryAssistant("What do I need to submit tomorrow?", baseContext);
  console.log("  Answer:\n", res5.answer);

  // Since referenceDate is 2026-09-14 and Lab Assignment is 2026-09-15:
  if (res5.tasks.length === 1 && res5.tasks[0].title.includes("Lab Assignment")) {
    console.log("✅ TEST 5 PASSED: Correctly identified task due tomorrow\n");
    passed++;
  } else {
    console.error("❌ TEST 5 FAILED\n");
    failed++;
  }

  // Test 6: "Why am I not eligible for this opportunity?" (Ineligible student)
  console.log("--- Test 6: Why am I not eligible for this opportunity? (Ineligible student) ---");
  const res6 = await queryAssistant("Why am I not eligible for this ABC opportunity?", {
    student: INELIGIBLE_STUDENT,
    notices: SAMPLE_NOTICES,
    referenceDate: "2026-09-14",
  });
  console.log("  Answer:\n", res6.answer);

  if (res6.answer.includes("Required branch") || res6.answer.includes("Required minimum CGPA")) {
    console.log("✅ TEST 6 PASSED: Correctly explains ineligibility reasons\n");
    passed++;
  } else {
    console.error("❌ TEST 6 FAILED\n");
    failed++;
  }

  // Test 7: "Show me opportunities related to AI."
  console.log("--- Test 7: Show me opportunities related to AI ---");
  const res7 = await queryAssistant("Show me opportunities related to AI", baseContext);
  console.log("  Answer:\n", res7.answer);

  if (res7.opportunities.length > 0 && res7.opportunities[0].title.includes("ABC Technologies")) {
    console.log("✅ TEST 7 PASSED\n");
    passed++;
  } else {
    console.error("❌ TEST 7 FAILED\n");
    failed++;
  }

  // Test 8: "Which opportunities should I prioritize?"
  console.log("--- Test 8: Which opportunities should I prioritize? ---");
  const res8 = await queryAssistant("Which opportunities should I prioritize?", baseContext);
  console.log("  Answer:\n", res8.answer);

  if (res8.answer.includes("HIGH Priority") && res8.opportunities[0].relevanceScore === 96) {
    console.log("✅ TEST 8 PASSED: Prioritized opportunity with 96% score\n");
    passed++;
  } else {
    console.error("❌ TEST 8 FAILED\n");
    failed++;
  }

  // Test 9: Out-of-scope query (Anti-hallucination)
  console.log("--- Test 9: Out-of-scope query (Anti-hallucination) ---");
  const res9 = await queryAssistant("What is the weather in New York?", baseContext);
  console.log("  Answer:\n", res9.answer);

  if (res9.answer === "I don't have enough information from the available notices to answer that.") {
    console.log("✅ TEST 9 PASSED: Strict refusal to hallucinate external information\n");
    passed++;
  } else {
    console.error("❌ TEST 9 FAILED\n");
    failed++;
  }

  // Test 10: Empty results (Querying for scholarships when none match)
  console.log("--- Test 10: Empty results query ---");
  const res10 = await queryAssistant("What scholarships can I apply for?", {
    student: HARSH_PROFILE,
    notices: [SAMPLE_NOTICES[0]], // Only placement notice, no scholarships
  });
  console.log("  Answer:\n", res10.answer);

  if (res10.answer.includes("no active scholarship opportunities")) {
    console.log("✅ TEST 10 PASSED: Gracefully explains absence of opportunities\n");
    passed++;
  } else {
    console.error("❌ TEST 10 FAILED\n");
    failed++;
  }

  // Test 11: Missing student profile information
  console.log("--- Test 11: Missing student profile information ---");
  const incompleteStudent: Partial<StudentProfile> = {
    name: "Harsh",
    // Missing branch, CGPA, graduationYear
  };
  const res11 = await queryAssistant("Which placement opportunities am I eligible for?", {
    student: incompleteStudent,
    notices: SAMPLE_NOTICES,
  });
  console.log("  Answer:\n", res11.answer);

  if (res11.answer.includes("missing critical details") && res11.answer.includes("update your profile")) {
    console.log("✅ TEST 11 PASSED: Warns user about incomplete profile\n");
    passed++;
  } else {
    console.error("❌ TEST 11 FAILED\n");
    failed++;
  }

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: 11)`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runAssistantTests().catch((err) => {
  console.error("Assistant test failed with error:", err);
  process.exit(1);
});
