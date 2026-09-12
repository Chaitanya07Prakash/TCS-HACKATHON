/**
 * Automated Test Suite for Relevance & Priority Scoring Engine (Phase 4)
 * Tests:
 * 1. Harsh CSE with ABC Technologies (Expected 96/100 -> HIGH Priority)
 * 2. Urgent Deadline (Deadline today -> 10 pts urgency)
 * 3. Urgent Deadline (Deadline tomorrow -> 9 pts urgency)
 * 4. Deadline within 3 days -> 8 pts urgency
 * 5. Expired Deadline -> 0 pts urgency
 * 6. No Deadline -> 0 pts urgency
 * 7. Medium Priority Student Match (50-79 pts -> MEDIUM)
 * 8. Low Priority / Ineligible Mismatch (< 50 pts -> LOW)
 */

import { calculateRelevance, calculateDeadlineUrgency } from "../src/engine/relevance.js";
import { StudentProfile, StructuredNotice } from "../src/types/index.js";

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

const ABC_NOTICE: StructuredNotice = {
  title: "ABC Technologies Campus Recruitment",
  category: "PLACEMENT",
  organization: "ABC Technologies",
  description: "Campus recruitment for software development roles in AI and Backend systems.",
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
    { action: "Complete registration", deadline: "2026-09-20" },
    { action: "Upload resume", deadline: "2026-09-20" },
  ],
  registrationLink: "https://abc.tech/apply",
  contactInformation: "placement@college.edu",
  confidence: 0.95,
};

async function runRelevanceTests() {
  console.log("==================================================");
  console.log("PHASE 4: RELEVANCE & PRIORITY ENGINE TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Harsh's Profile with ABC Tech (6 days before deadline)
  console.log("--- Test 1: Harsh with ABC Technologies (Target: 96/100 HIGH) ---");
  const result1 = calculateRelevance(HARSH_PROFILE, ABC_NOTICE, {
    referenceDate: "2026-09-14", // 6 days before 2026-09-20
  });

  console.log(`  Score: ${result1.score}/100 | Priority: ${result1.priority}`);
  console.log("  Factors:", JSON.stringify(result1.factors));
  console.log("  Reasons:\n   ", result1.reasons.join("\n    "));

  if (result1.score === 96 && result1.priority === "HIGH") {
    console.log("✅ TEST 1 PASSED: Exactly 96/100 HIGH Priority\n");
    passed++;
  } else {
    console.error(`❌ TEST 1 FAILED: Expected 96 HIGH, got ${result1.score} ${result1.priority}\n`);
    failed++;
  }

  // Test 2: Deadline Urgency Checks
  console.log("--- Test 2: Deadline Urgency Granularity ---");
  const urgToday = calculateDeadlineUrgency("2026-09-20", "2026-09-20");
  const urgTomorrow = calculateDeadlineUrgency("2026-09-21", "2026-09-20");
  const urg3Days = calculateDeadlineUrgency("2026-09-23", "2026-09-20");
  const urg7Days = calculateDeadlineUrgency("2026-09-27", "2026-09-20");
  const urgPast = calculateDeadlineUrgency("2026-09-18", "2026-09-20");
  const urgNone = calculateDeadlineUrgency(null, "2026-09-20");

  let urgencyOk = true;
  if (urgToday.urgencyScore !== 10) urgencyOk = false;
  if (urgTomorrow.urgencyScore !== 9) urgencyOk = false;
  if (urg3Days.urgencyScore !== 8) urgencyOk = false;
  if (urg7Days.urgencyScore !== 6) urgencyOk = false;
  if (urgPast.urgencyScore !== 0) urgencyOk = false;
  if (urgNone.urgencyScore !== 0) urgencyOk = false;

  if (urgencyOk) {
    console.log("  ✓ Today: 10 pts, Tomorrow: 9 pts, 3 days: 8 pts, 7 days: 6 pts, Past: 0 pts, None: 0 pts");
    console.log("✅ TEST 2 PASSED\n");
    passed++;
  } else {
    console.error("❌ TEST 2 FAILED on urgency scores\n");
    failed++;
  }

  // Test 3: Medium Priority Opportunity (Score 50 - 79)
  console.log("--- Test 3: Medium Priority Opportunity (Mechanical student with open software contest) ---");
  const mechStudent: StudentProfile = {
    name: "Rohan",
    branch: "ME",
    year: 3,
    semester: 5,
    cgpa: 7.8,
    graduationYear: 2027,
    skills: ["AutoCAD", "Python"],
    interests: ["Robotics"],
  };
  const result3 = calculateRelevance(mechStudent, ABC_NOTICE, {
    referenceDate: "2026-09-14",
  });
  console.log(`  Score: ${result3.score}/100 | Priority: ${result3.priority}`);
  console.log("  Factors:", JSON.stringify(result3.factors));

  if (result3.priority === "MEDIUM" && result3.score >= 50 && result3.score < 80) {
    console.log("✅ TEST 3 PASSED: Expected MEDIUM Priority\n");
    passed++;
  } else {
    console.error(`❌ TEST 3 FAILED: Expected MEDIUM, got ${result3.priority} (${result3.score})\n`);
    failed++;
  }

  // Test 4: Low Priority Opportunity (Score < 50)
  console.log("--- Test 4: Low Priority Opportunity (First year Civil student, wrong batch, passed deadline) ---");
  const civilStudent: StudentProfile = {
    name: "Aman",
    branch: "Civil",
    year: 1,
    semester: 1,
    cgpa: 6.5,
    graduationYear: 2029,
    skills: ["Surveying"],
    interests: ["Construction"],
  };
  const expiredNotice: StructuredNotice = {
    ...ABC_NOTICE,
    deadline: "2026-08-10", // already passed
  };
  const result4 = calculateRelevance(civilStudent, expiredNotice, {
    referenceDate: "2026-09-14",
  });
  console.log(`  Score: ${result4.score}/100 | Priority: ${result4.priority}`);
  console.log("  Factors:", JSON.stringify(result4.factors));

  if (result4.priority === "LOW" && result4.score < 50) {
    console.log("✅ TEST 4 PASSED: Expected LOW Priority\n");
    passed++;
  } else {
    console.error(`❌ TEST 4 FAILED: Expected LOW, got ${result4.priority} (${result4.score})\n`);
    failed++;
  }

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: 4)`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runRelevanceTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
