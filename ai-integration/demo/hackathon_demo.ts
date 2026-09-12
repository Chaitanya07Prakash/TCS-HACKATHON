/**
 * SMART CAMPUS AI — Complete Hackathon Live Demonstration
 * 
 * Demonstrates the full student journey:
 * 1. Harsh logs in (CSE, 3rd Year, CGPA 8.2, Grad 2027)
 * 2. An official unstructured recruitment notice is published (ABC Technologies)
 * 3. AI processes & extracts structured requirements and actions
 * 4. Deterministic engine verifies eligibility (eligible = true)
 * 5. 100-point engine calculates relevance score (96% HIGH Priority)
 * 6. Actionable tasks created ("Register", "Upload Resume", "Complete Assessment")
 * 7. Student dashboard populated with high priority cards & deadlines
 * 8. Harsh opens AI Assistant and asks:
 *    - "What do I need to complete this week?"
 *    - "Which placement opportunities am I eligible for?"
 * 9. Second student logs in (Rohan, Mechanical, CGPA 6.2)
 *    - Automatically disqualified with transparent explanation
 */

import { intelligenceService } from "../src/service/intelligenceService.js";
import { StudentProfile } from "../src/types/index.js";

const HARSH_PROFILE: StudentProfile = {
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

const ROHAN_PROFILE: StudentProfile = {
  id: "student-rohan-02",
  name: "Rohan",
  branch: "ME",
  year: 2,
  semester: 3,
  cgpa: 6.2,
  graduationYear: 2028,
  skills: ["AutoCAD"],
  interests: ["Design"],
};

const RAW_ABC_CIRCULAR = `
============================================================
COLLEGE TRAINING & PLACEMENT CELL CIRCULAR
============================================================

ABC Technologies is conducting campus recruitment for students
graduating in 2027. B.Tech CSE and IT students with a minimum CGPA
of 7.5 are eligible. Students must register before 20 September 2026.
The online assessment will be conducted on 25 September 2026.
Students must upload their resume during registration.

Registration Link: https://abctech.campus.hire/apply
`;

async function main() {
  console.log("================================================================================");
  console.log("🎓 SMART CAMPUS AI — \"Never Miss an Opportunity\"");
  console.log("   LIVE HACKATHON DEMO (MEMBER 3: INTELLIGENCE ENGINE)");
  console.log("================================================================================\n");

  const REF_DATE = "2026-09-14";

  // STEP 1: Student Profile
  console.log("📌 STEP 1: Student Profile Loaded");
  console.log(`   Student: ${HARSH_PROFILE.name} | Branch: ${HARSH_PROFILE.branch} | Year: ${HARSH_PROFILE.year} (Sem ${HARSH_PROFILE.semester})`);
  console.log(`   CGPA: ${HARSH_PROFILE.cgpa} | Graduation: ${HARSH_PROFILE.graduationYear}`);
  console.log(`   Skills: ${HARSH_PROFILE.skills.join(", ")}`);
  console.log(`   Interests: ${HARSH_PROFILE.interests.join(", ")}\n`);

  // STEP 2: Raw Notice Published
  console.log("📌 STEP 2: Raw College Notice Published (Unstructured)");
  console.log(RAW_ABC_CIRCULAR.trim());
  console.log("");

  // STEP 3: AI Processing & Information Extraction
  console.log("📌 STEP 3: AI Understanding & Extraction Pipeline");
  const notice = await intelligenceService.ingestNotice(RAW_ABC_CIRCULAR);
  notice.id = "notice-abc-001";

  console.log(`   ✓ Title: ${notice.title}`);
  console.log(`   ✓ Category: ${notice.category}`);
  console.log(`   ✓ Target Branches: ${notice.eligibility.branches.join(", ")}`);
  console.log(`   ✓ Minimum CGPA: ${notice.eligibility.minimumCGPA}`);
  console.log(`   ✓ Target Batch: ${notice.eligibility.graduationYears.join(", ")}`);
  console.log(`   ✓ Registration Deadline: ${notice.deadline}`);
  console.log(`   ✓ Assessment Date: ${notice.eventDate}`);
  console.log(`   ✓ Registration URL: ${notice.registrationLink}\n`);

  // STEP 4: Deterministic Eligibility & Relevance Evaluation
  console.log("📌 STEP 4: Personalization Engine (Deterministic Logic)");
  const evalHarsh = intelligenceService.evaluateOpportunityForStudent(
    HARSH_PROFILE,
    notice,
    { referenceDate: REF_DATE }
  );

  console.log(`   ✓ Eligible: ${evalHarsh.eligibility.eligible ? "YES ✅" : "NO ❌"}`);
  console.log("   ✓ Eligibility Reasons:");
  evalHarsh.eligibility.reasons.forEach((r) => console.log(`      ${r}`));
  console.log(`   ✓ Relevance Score: ${evalHarsh.relevance.score}/100 [${evalHarsh.relevance.priority} PRIORITY]`);
  console.log("   ✓ 100-Point Score Breakdown:");
  console.log(`      • Branch Match (30 pts):        +${evalHarsh.relevance.factors.branchScore}`);
  console.log(`      • Graduation Year Match (20 pts):+${evalHarsh.relevance.factors.graduationYearScore}`);
  console.log(`      • CGPA Cutoff Satisfied (15 pts):+${evalHarsh.relevance.factors.cgpaScore}`);
  console.log(`      • Student Interest Match (15 pts):+${evalHarsh.relevance.factors.interestScore}`);
  console.log(`      • Student Skill Match (10 pts):  +${evalHarsh.relevance.factors.skillScore}`);
  console.log(`      • Deadline Urgency (10 pts):     +${evalHarsh.relevance.factors.urgencyScore} (6 days left)\n`);

  // STEP 5: Task Generation
  console.log("📌 STEP 5: Actionable Tasks Generated for Harsh");
  evalHarsh.recommendedTasks.forEach((t, i) => {
    console.log(`   ${i + 1}. [${t.priority}] ${t.title} (Deadline: ${t.deadline})`);
  });
  console.log("");

  // STEP 6: Student Dashboard View
  console.log("📌 STEP 6: Student Dashboard Feed (Ready for Member 1 Frontend)");
  const dashboard = intelligenceService.evaluateStudentDashboard(
    HARSH_PROFILE,
    [notice],
    { referenceDate: REF_DATE }
  );
  console.log(`   • Total Notices: ${dashboard.metrics.totalNotices}`);
  console.log(`   • Eligible Opportunities: ${dashboard.metrics.eligibleCount}`);
  console.log(`   • High Priority Opportunities: ${dashboard.metrics.highPriorityCount}`);
  console.log(`   • Pending Tasks: ${dashboard.metrics.pendingTasksCount}\n`);

  // STEP 7: AI Assistant Conversational QA
  console.log("================================================================================");
  console.log("💬 STEP 7: AI ASSISTANT NATURAL LANGUAGE INTERACTION");
  console.log("================================================================================\n");

  console.log("👤 Harsh asks: \"What do I need to complete this week?\"");
  const qa1 = await intelligenceService.handleAssistantQuery(
    "What do I need to complete this week?",
    {
      student: HARSH_PROFILE,
      notices: [notice],
      activeTasks: evalHarsh.recommendedTasks,
      referenceDate: REF_DATE,
    }
  );
  console.log(`🤖 AI Assistant:\n${qa1.answer}\n`);

  console.log("👤 Harsh asks: \"Which placement opportunities am I eligible for?\"");
  const qa2 = await intelligenceService.handleAssistantQuery(
    "Which placement opportunities am I eligible for?",
    {
      student: HARSH_PROFILE,
      notices: [notice],
      referenceDate: REF_DATE,
    }
  );
  console.log(`🤖 AI Assistant:\n${qa2.answer}\n`);

  // STEP 8: Second Student Scenario (Ineligible)
  console.log("================================================================================");
  console.log("👤 STEP 8: SECOND STUDENT SCENARIO (INELIGIBLE STUDENT)");
  console.log("================================================================================\n");
  console.log(`   Student: ${ROHAN_PROFILE.name} | Branch: ${ROHAN_PROFILE.branch} | CGPA: ${ROHAN_PROFILE.cgpa} | Grad: ${ROHAN_PROFILE.graduationYear}`);
  const evalRohan = intelligenceService.evaluateOpportunityForStudent(
    ROHAN_PROFILE,
    notice,
    { referenceDate: REF_DATE }
  );
  console.log(`   ✓ Eligible: ${evalRohan.eligibility.eligible ? "YES" : "NO ❌"}`);
  console.log("   ✓ Disqualification Reasons:");
  evalRohan.eligibility.failedCriteria.forEach((f) => console.log(`      ${f}`));

  console.log("\n👤 Rohan asks: \"Why am I not eligible for this opportunity?\"");
  const qaRohan = await intelligenceService.handleAssistantQuery(
    "Why am I not eligible for this opportunity?",
    {
      student: ROHAN_PROFILE,
      notices: [notice],
      referenceDate: REF_DATE,
    }
  );
  console.log(`🤖 AI Assistant:\n${qaRohan.answer}\n`);

  console.log("================================================================================");
  console.log("🎉 HACKATHON LIVE DEMO COMPLETED SUCCESSFULLY — 100% RELIABLE & GROUNDED");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
