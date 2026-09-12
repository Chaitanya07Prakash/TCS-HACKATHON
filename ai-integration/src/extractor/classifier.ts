/**
 * Notice Classifier
 * Categorizes notices into standard categories with confidence and secondary tags.
 */

import { NoticeCategory } from "../types/index.js";

interface CategoryDefinition {
  category: NoticeCategory;
  primaryKeywords: Array<{ pattern: RegExp; weight: number }>;
}

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    category: "PLACEMENT",
    primaryKeywords: [
      { pattern: /\b(?:recruitment|campus\s+drive|placement\s+drive|placement\s+cell|training\s*(?:&|and)\s*placement|t&p)\b/i, weight: 5 },
      { pattern: /\b(?:ctc|lpa|stipend|job\s+offer|full[- ]time|hiring|internship\s+opportunity)\b/i, weight: 4 },
      { pattern: /\b(?:online\s+assessment|technical\s+interview|hr\s+round|shortlisted\s+students)\b/i, weight: 3 },
      { pattern: /\b(?:eligibility|cgpa\s*>=|b\.?tech\s+(?:cse|it|ece))\b/i, weight: 2 },
    ],
  },
  {
    category: "SCHOLARSHIP",
    primaryKeywords: [
      { pattern: /\b(?:scholarship|financial\s+aid|merit[- ]cum[- ]means|fee\s+concession|tuition\s+fee\s+waiver)\b/i, weight: 6 },
      { pattern: /\b(?:national\s+scholarship\s+portal|nsp|fellowship|financial\s+assistance)\b/i, weight: 5 },
      { pattern: /\b(?:family\s+income|income\s+certificate|caste\s+certificate|disbursement)\b/i, weight: 3 },
    ],
  },
  {
    category: "EXAMINATION",
    primaryKeywords: [
      { pattern: /\b(?:mid[- ]?(?:sem|semester)|end[- ]?(?:sem|semester)|examination\s+cell|controller\s+of\s+examinations?)\b/i, weight: 6 },
      { pattern: /\b(?:hall\s+ticket|admit\s+card|exam\s+schedule|exam\s+timetable|revaluation|backlog\s+exam)\b/i, weight: 5 },
      { pattern: /\b(?:seating\s+arrangement|invigilation|theory\s+exam|practical\s+exam)\b/i, weight: 3 },
    ],
  },
  {
    category: "COMPETITION",
    primaryKeywords: [
      { pattern: /\b(?:hackathon|ideathon|coding\s+contest|competition|prize\s+money|cash\s+prize|prize\s+pool)\b/i, weight: 6 },
      { pattern: /\b(?:round\s+1|prelims|finale|pitching|problem\s+statement|unstop|kaggle)\b/i, weight: 4 },
      { pattern: /\b(?:teams?\s+of|team\s+size|runner[- ]?up|winners?)\b/i, weight: 3 },
    ],
  },
  {
    category: "EVENT",
    primaryKeywords: [
      { pattern: /\b(?:annual\s+fest|cultural\s+fest|tech\s+fest|symposium|webinar|workshop|guest\s+lecture|seminar)\b/i, weight: 5 },
      { pattern: /\b(?:keynote\s+speaker|chief\s+guest|auditorium|conclave|panel\s+discussion)\b/i, weight: 4 },
      { pattern: /\b(?:registration\s+fee|certificates?\s+will\s+be\s+provided)\b/i, weight: 2 },
    ],
  },
  {
    category: "CLUB",
    primaryKeywords: [
      { pattern: /\b(?:club\s+orientation|club\s+recruitment|society\s+audition|student\s+club|induction\s+drive)\b/i, weight: 6 },
      { pattern: /\b(?:rotaract|gdsc|ieee\s+student\s+branch|acm\s+chapter|dramatics|dance\s+club|robotics\s+club)\b/i, weight: 5 },
      { pattern: /\b(?:core\s+team|sub[- ]?coordinator|executive\s+member)\b/i, weight: 4 },
    ],
  },
  {
    category: "REGISTRATION",
    primaryKeywords: [
      { pattern: /\b(?:course\s+registration|subject\s+registration|elective\s+selection|semester\s+registration)\b/i, weight: 6 },
      { pattern: /\b(?:portal\s+open\s+for\s+registration|erp\s+portal|add\/drop\s+course)\b/i, weight: 5 },
      { pattern: /\b(?:credits?\s+limit|prerequisite|portal\s+deadline)\b/i, weight: 3 },
    ],
  },
  {
    category: "ACADEMIC",
    primaryKeywords: [
      { pattern: /\b(?:academic\s+calendar|syllabus|attendance\s+shortage|detention\s+list|condonation)\b/i, weight: 5 },
      { pattern: /\b(?:commencement\s+of\s+classes|makeup\s+classes|course\s+structure|curriculum)\b/i, weight: 4 },
      { pattern: /\b(?:dean\s+academics|hod|lecture\s+plan)\b/i, weight: 3 },
    ],
  },
  {
    category: "ADMINISTRATIVE",
    primaryKeywords: [
      { pattern: /\b(?:hostel\s+fee|mess\s+fee|bus\s+pass|transport\s+circular|identity\s+card|id\s+card)\b/i, weight: 5 },
      { pattern: /\b(?:holiday\s+circular|declared\s+a\s+holiday|office\s+order|administrative\s+office)\b/i, weight: 5 },
      { pattern: /\b(?:maintenance|water\s+supply|power\s+cut|campus\s+rules)\b/i, weight: 3 },
    ],
  },
];

export interface ClassificationResult {
  primary: NoticeCategory;
  secondary: NoticeCategory[];
  confidence: number;
  scores: Record<NoticeCategory, number>;
}

export function classifyNoticeText(text: string): ClassificationResult {
  const scores: Record<NoticeCategory, number> = {
    GENERAL: 1, // baseline
    PLACEMENT: 0,
    SCHOLARSHIP: 0,
    EXAMINATION: 0,
    EVENT: 0,
    ACADEMIC: 0,
    COMPETITION: 0,
    CLUB: 0,
    REGISTRATION: 0,
    ADMINISTRATIVE: 0,
  };

  for (const def of CATEGORY_DEFINITIONS) {
    for (const kw of def.primaryKeywords) {
      const matches = text.match(new RegExp(kw.pattern.source, "gi"));
      if (matches) {
        scores[def.category] += matches.length * kw.weight;
      }
    }
  }

  // Sort categories by score descending
  const sortedCategories = (Object.keys(scores) as NoticeCategory[])
    .filter((cat) => cat !== "GENERAL")
    .sort((a, b) => scores[b] - scores[a]);

  const topCategory = sortedCategories[0];
  const topScore = scores[topCategory];

  let primary: NoticeCategory = "GENERAL";
  let confidence = 0.5;
  const secondary: NoticeCategory[] = [];

  if (topScore >= 4) {
    primary = topCategory;
    // Calculate normalized confidence (max ~0.98)
    confidence = Math.min(0.98, Number((0.65 + (topScore / (topScore + 10)) * 0.33).toFixed(2)));

    // Pick second category if it has significant score (>= 4 and >= 40% of topScore)
    const secondCategory = sortedCategories[1];
    if (scores[secondCategory] >= 4 && scores[secondCategory] >= topScore * 0.4) {
      secondary.push(secondCategory);
    }
  }

  return {
    primary,
    secondary,
    confidence,
    scores,
  };
}
