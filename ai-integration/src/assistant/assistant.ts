/**
 * Grounded Smart Campus AI Assistant
 * Context-aware, natural language answering grounded in verified student profile,
 * deterministic eligibility checks, relevance scoring, and active tasks.
 */

import {
  AssistantContext,
  AssistantResponse,
  AssistantIntent,
} from "../types/index.js";
import { detectIntent } from "./intentDetector.js";
import { retrieveScopedContext, RetrievedScopedContext } from "./retriever.js";

/**
 * Generates natural language answer grounded strictly in retrieved context
 */
function synthesizeGroundedAnswer(
  query: string,
  scoped: RetrievedScopedContext,
  studentName?: string
): string {
  const name = studentName ? ` ${studentName}` : "";

  // Guard 1: Incomplete Profile Warning
  if (scoped.isProfileIncomplete && (scoped.intent === "ELIGIBILITY_QUERY" || scoped.intent === "PLACEMENT_QUERY")) {
    return `Hello${name}, your student profile is missing critical details (${scoped.missingProfileFields?.join(", ")}). Please update your profile to receive accurate eligibility checks.`;
  }

  // Handle Intent 1: TASK_QUERY ("What do I need to complete this week?", "What to submit tomorrow?")
  if (scoped.intent === "TASK_QUERY") {
    if (scoped.tasks.length === 0) {
      if (query.toLowerCase().includes("tomorrow")) {
        return `You have no pending tasks or submissions due tomorrow.`;
      }
      return `You have no pending tasks scheduled for this period. All set!`;
    }

    const taskLines = scoped.tasks.map((t, idx) => {
      const deadlineStr = t.deadline ? ` (Due: ${t.deadline})` : "";
      return `${idx + 1}. ${t.title}${deadlineStr}`;
    });

    const timing = query.toLowerCase().includes("tomorrow")
      ? "due tomorrow"
      : "to complete this week";

    return `Here are your actionable tasks ${timing}:\n\n${taskLines.join("\n")}\n\nMake sure to complete these before the deadlines.`;
  }

  // Handle Intent 2: DEADLINE_QUERY ("What deadlines are coming up?")
  if (scoped.intent === "DEADLINE_QUERY") {
    if (scoped.deadlines.length === 0) {
      return `There are currently no upcoming deadlines recorded in your notices.`;
    }

    const lines = scoped.deadlines.map((d, idx) => {
      return `${idx + 1}. ${d.title} — Deadline: ${d.deadline} [${d.priority} Priority]`;
    });

    return `Here are your upcoming deadlines:\n\n${lines.join("\n")}`;
  }

  // Handle Intent 3: PLACEMENT_QUERY ("Which placement opportunities am I eligible for?")
  if (scoped.intent === "PLACEMENT_QUERY") {
    if (scoped.eligibleOpportunities.length === 0) {
      return `You are currently not eligible for any announced placement opportunities based on your branch and CGPA, or no active placement drives are open.`;
    }

    const oppLines = scoped.eligibleOpportunities.map((opp, idx) => {
      const scoreStr = opp.relevanceScore ? ` (Relevance: ${opp.relevanceScore}%, ${opp.priority} Priority)` : "";
      const deadlineStr = opp.deadline ? ` | Register before: ${opp.deadline}` : "";
      return `${idx + 1}. **${opp.title}** by ${opp.organization}${scoreStr}${deadlineStr}`;
    });

    return `Based on your academic profile, you are eligible for the following placement opportunities:\n\n${oppLines.join("\n")}\n\nCheck your dashboard to view required actions and register.`;
  }

  // Handle Intent 4: SCHOLARSHIP_QUERY ("What scholarships can I apply for?")
  if (scoped.intent === "SCHOLARSHIP_QUERY") {
    if (scoped.eligibleOpportunities.length === 0) {
      return `There are currently no active scholarship opportunities matching your profile criteria in the campus notices.`;
    }

    const lines = scoped.eligibleOpportunities.map((s, idx) => {
      const dl = s.deadline ? ` (Deadline: ${s.deadline})` : "";
      return `${idx + 1}. **${s.title}**${dl}`;
    });

    return `You are eligible to apply for the following scholarships:\n\n${lines.join("\n")}`;
  }

  // Handle Intent 5: ELIGIBILITY_QUERY ("Why am I not eligible for this opportunity?")
  if (scoped.intent === "ELIGIBILITY_QUERY") {
    if (scoped.ineligibilityReasons && scoped.ineligibilityReasons.length > 0) {
      const cleanReasons = scoped.ineligibilityReasons.map((r) => `• ${r.replace(/^✗\s*/, "")}`).join("\n");
      return `You are not eligible for this opportunity due to the following requirements:\n\n${cleanReasons}`;
    }

    if (scoped.eligibleOpportunities.length > 0) {
      const topOpp = scoped.eligibleOpportunities[0];
      return `Good news! You are currently eligible for **${topOpp.title}** (${topOpp.organization}) with a ${topOpp.relevanceScore}% match score.`;
    }

    return `I don't have enough information from the available notices to answer that.`;
  }

  // Handle Intent 6: OPPORTUNITY_QUERY ("Which opportunities should I prioritize?", "Show AI opportunities")
  if (scoped.intent === "OPPORTUNITY_QUERY") {
    if (scoped.eligibleOpportunities.length === 0) {
      return `No matching opportunities were found for your query.`;
    }

    const isPrioritize = query.toLowerCase().includes("prioritize") || query.toLowerCase().includes("priority");
    const header = isPrioritize
      ? "Based on your branch, CGPA, graduation year, and upcoming deadlines, here are the opportunities you should prioritize:"
      : "Here are the opportunities matching your focus:";

    const lines = scoped.eligibleOpportunities.map((opp, idx) => {
      const score = opp.relevanceScore ? ` [${opp.relevanceScore}/100 - ${opp.priority} Priority]` : "";
      const dl = opp.deadline ? ` (Deadline: ${opp.deadline})` : "";
      return `${idx + 1}. **${opp.title}** by ${opp.organization}${score}${dl}`;
    });

    return `${header}\n\n${lines.join("\n")}`;
  }

  // Default fallback for unknown / general queries (Strict grounding: zero hallucination)
  return `I don't have enough information from the available notices to answer that.`;
}

/**
 * Main AI Assistant Entrypoint
 */
export async function queryAssistant(
  query: string,
  context: AssistantContext
): Promise<AssistantResponse> {
  if (!query || query.trim().length === 0) {
    return {
      answer: "How can I help you today? You can ask about deadlines, eligible placements, scholarships, or tasks.",
      intent: "GENERAL_QUERY",
      opportunities: [],
      tasks: [],
      deadlines: [],
    };
  }

  // 1. Intent Detection
  const { intent } = detectIntent(query);

  // 2. Scoped Context Retrieval (zero full-database dumping)
  const scoped = retrieveScopedContext(query, intent, context);

  // 3. Grounded Answer Synthesis
  const answer = synthesizeGroundedAnswer(query, scoped, context.student.name);

  // 4. Return Rich Structured Response for Member 1's frontend
  return {
    answer,
    intent,
    opportunities: scoped.eligibleOpportunities,
    tasks: scoped.tasks,
    deadlines: scoped.deadlines,
  };
}
