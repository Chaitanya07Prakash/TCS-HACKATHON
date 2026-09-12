/**
 * Context Retrieval & Scoping Engine
 * Selectively filters student opportunities, tasks, and deadlines before passing
 * to the assistant, preventing prompt bloat and grounding answers strictly in facts.
 */

import {
  AssistantContext,
  AssistantIntent,
  StructuredNotice,
  ActionTask,
  AssistantResponseOpportunity,
  AssistantResponseDeadline,
} from "../types/index.js";
import { evaluateEligibility } from "../engine/eligibility.js";
import { calculateRelevance, calculateDeadlineUrgency } from "../engine/relevance.js";

export interface RetrievedScopedContext {
  intent: AssistantIntent;
  eligibleOpportunities: AssistantResponseOpportunity[];
  allScopedOpportunities: AssistantResponseOpportunity[];
  tasks: ActionTask[];
  deadlines: AssistantResponseDeadline[];
  ineligibilityReasons?: string[];
  referenceDate: Date;
  isProfileIncomplete?: boolean;
  missingProfileFields?: string[];
}

export function retrieveScopedContext(
  query: string,
  intent: AssistantIntent,
  context: AssistantContext
): RetrievedScopedContext {
  const { student, notices = [], activeTasks = [], referenceDate: refDateInput } = context;
  const refDate = refDateInput ? new Date(refDateInput) : new Date();

  // 1. Check for missing profile information
  const missingProfileFields: string[] = [];
  if (!student.branch) missingProfileFields.push("Branch");
  if (student.cgpa === undefined || student.cgpa === null) missingProfileFields.push("CGPA");
  if (!student.graduationYear) missingProfileFields.push("Graduation Year");
  const isProfileIncomplete = missingProfileFields.length > 0;

  // 2. Filter notices according to intent and query
  let candidateNotices = [...notices];

  if (intent === "PLACEMENT_QUERY") {
    candidateNotices = candidateNotices.filter((n) => n.category === "PLACEMENT");
  } else if (intent === "SCHOLARSHIP_QUERY") {
    candidateNotices = candidateNotices.filter((n) => n.category === "SCHOLARSHIP");
  } else if (intent === "EVENT_QUERY") {
    candidateNotices = candidateNotices.filter(
      (n) => n.category === "EVENT" || n.category === "COMPETITION" || n.category === "CLUB"
    );
  }

  // Keyword filtering (e.g., "AI", "hackathon", specific company name)
  const qLower = query.toLowerCase();
  const aiRegex = /\b(?:ai|artificial\s+intelligence)\b/i;
  if (aiRegex.test(query)) {
    candidateNotices = candidateNotices.filter(
      (n) =>
        aiRegex.test(n.title) ||
        aiRegex.test(n.description) ||
        (n.requiredSkills || []).some((s) => aiRegex.test(s))
    );
  }

  // 3. Evaluate Eligibility and Relevance for candidate notices
  const eligibleOpportunities: AssistantResponseOpportunity[] = [];
  const allScopedOpportunities: AssistantResponseOpportunity[] = [];
  const ineligibilityReasons: string[] = [];

  for (const notice of candidateNotices) {
    const elig = evaluateEligibility(student, notice.eligibility);
    const rel = calculateRelevance(student, notice, { referenceDate: refDate });

    const opp: AssistantResponseOpportunity = {
      id: notice.id,
      title: notice.title,
      category: notice.category,
      organization: notice.organization,
      deadline: notice.deadline,
      eligible: elig.eligible,
      relevanceScore: rel.score,
      priority: rel.priority,
      summary: notice.summary,
    };

    allScopedOpportunities.push(opp);

    if (elig.eligible) {
      eligibleOpportunities.push(opp);
    } else {
      if (notice.title.toLowerCase().includes("abc") || qLower.includes(notice.organization.toLowerCase())) {
        ineligibilityReasons.push(...elig.failedCriteria);
      }
    }
  }

  // Sort eligible opportunities by relevance score descending
  eligibleOpportunities.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  // 4. Retrieve and Filter Tasks & Deadlines
  const tasks: ActionTask[] = [...activeTasks];

  // Synthesize tasks from eligible opportunities if not already present in activeTasks
  for (const notice of candidateNotices) {
    const elig = evaluateEligibility(student, notice.eligibility);
    if (elig.eligible && notice.requiredActions) {
      for (const act of notice.requiredActions) {
        const existing = tasks.find(
          (t) => t.title.toLowerCase() === act.title.toLowerCase() && t.deadline === act.deadline
        );
        if (!existing) {
          tasks.push({
            id: `task-${tasks.length + 1}`,
            title: act.title || act.action,
            action: act.action,
            deadline: act.deadline,
            priority: "HIGH",
            sourceNoticeId: notice.id,
            sourceOrganization: notice.organization,
            status: "PENDING",
          });
        }
      }
    }
  }

  // Filter tasks if query asks specifically for "tomorrow" or "this week"
  let filteredTasks = tasks;
  if (qLower.includes("tomorrow")) {
    filteredTasks = tasks.filter((t) => {
      if (!t.deadline) return false;
      const urg = calculateDeadlineUrgency(t.deadline, refDate);
      return urg.urgencyScore === 9; // exactly tomorrow
    });
  } else if (qLower.includes("this week") || qLower.includes("week")) {
    filteredTasks = tasks.filter((t) => {
      if (!t.deadline) return false;
      const urg = calculateDeadlineUrgency(t.deadline, refDate);
      return urg.urgencyScore >= 6; // within 7 days or today/tomorrow
    });
  }

  // 5. Build structured deadlines list
  const deadlines: AssistantResponseDeadline[] = filteredTasks
    .filter((t) => t.deadline !== null)
    .map((t) => {
      const urg = calculateDeadlineUrgency(t.deadline!, refDate);
      return {
        title: t.title,
        action: t.action,
        deadline: t.deadline!,
        daysRemaining: urg.urgencyScore >= 8 ? (10 - urg.urgencyScore) : undefined,
        priority: t.priority,
      };
    });

  return {
    intent,
    eligibleOpportunities,
    allScopedOpportunities,
    tasks: filteredTasks,
    deadlines,
    ineligibilityReasons,
    referenceDate: refDate,
    isProfileIncomplete,
    missingProfileFields,
  };
}
