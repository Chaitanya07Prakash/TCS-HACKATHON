/**
 * Intent Detection Engine for Smart Campus Assistant
 * Identifies the student's question intent to retrieve targeted context.
 */

import { AssistantIntent } from "../types/index.js";

interface IntentRule {
  intent: AssistantIntent;
  patterns: RegExp[];
  priority: number;
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: "PLACEMENT_QUERY",
    patterns: [
      /\b(?:placements?|recruitments?|jobs?|internships?|hirings?|compan(?:y|ies)|campus\s+drives?|packages?|ctc)\b/i,
      /\b(?:eligible\s+for\s+placements?|apply\s+for\s+jobs?)\b/i,
    ],
    priority: 10,
  },
  {
    intent: "SCHOLARSHIP_QUERY",
    patterns: [
      /\b(?:scholarships?|financial\s+aid|fellowships?|fee\s+waivers?|stipends?)\b/i,
    ],
    priority: 10,
  },
  {
    intent: "ELIGIBILITY_QUERY",
    patterns: [
      /\b(?:why\s+am\s+i\s+(?:not\s+)?eligible|am\s+i\s+eligible|eligibility|who\s+can\s+apply|cutoff|criteria)\b/i,
    ],
    priority: 9,
  },
  {
    intent: "TASK_QUERY",
    patterns: [
      /\b(?:what\s+do\s+i\s+need\s+to\s+(?:complete|do|submit)|my\s+tasks|pending\s+tasks|to-?do|checklist|actions)\b/i,
      /\b(?:submit\s+tomorrow|complete\s+this\s+week)\b/i,
    ],
    priority: 8,
  },
  {
    intent: "DEADLINE_QUERY",
    patterns: [
      /\b(?:deadline|deadlines|due\s+date|last\s+date|coming\s+up|expiring)\b/i,
      /\b(?:due\s+tomorrow|due\s+this\s+week)\b/i,
    ],
    priority: 8,
  },
  {
    intent: "OPPORTUNITY_QUERY",
    patterns: [
      /\b(?:opportunities|prioritize|priority|related\s+to\s+ai|matching|recommended|best\s+for\s+me)\b/i,
    ],
    priority: 7,
  },
  {
    intent: "EVENT_QUERY",
    patterns: [
      /\b(?:event|events|workshop|fest|hackathon|seminar|webinar|symposium|conference)\b/i,
    ],
    priority: 7,
  },
  {
    intent: "NOTICE_QUERY",
    patterns: [
      /\b(?:notices?|circulars?|announcements?|bulletin)\b/i,
    ],
    priority: 6,
  },
];

export function detectIntent(query: string): { intent: AssistantIntent; confidence: number } {
  const trimmed = query.trim();

  // Sort by priority descending
  for (const rule of INTENT_RULES) {
    for (const pat of rule.patterns) {
      if (pat.test(trimmed)) {
        return { intent: rule.intent, confidence: 0.9 };
      }
    }
  }

  return { intent: "GENERAL_QUERY", confidence: 0.5 };
}
