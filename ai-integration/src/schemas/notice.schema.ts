import { z } from "zod";

export const NoticeCategorySchema = z.enum([
  "GENERAL",
  "PLACEMENT",
  "SCHOLARSHIP",
  "EXAMINATION",
  "EVENT",
  "ACADEMIC",
  "COMPETITION",
  "CLUB",
  "REGISTRATION",
  "ADMINISTRATIVE",
]);

export const NoticeEligibilityCriteriaSchema = z.object({
  branches: z.array(z.string()).default([]),
  years: z.array(z.number()).default([]),
  semesters: z.array(z.number()).default([]),
  minimumCGPA: z.number().nullable().default(null),
  maximumCGPA: z.number().nullable().default(null),
  graduationYears: z.array(z.number()).default([]),
  skills: z.array(z.string()).default([]),
  otherCriteria: z.array(z.string()).optional().default([]),
});

export const ActionTypeSchema = z.enum([
  "REGISTER",
  "UPLOAD_RESUME",
  "SUBMIT_DOCUMENTS",
  "ATTEND_ASSESSMENT",
  "ATTEND_EVENT",
  "PAY_FEE",
  "SUBMIT_PROPOSAL",
  "OTHER",
]);

export const ExtractedActionSchema = z.object({
  title: z.string().optional(),
  action: z.string().min(1),
  actionType: ActionTypeSchema.optional(),
  deadline: z.string().nullable().default(null),
  description: z.string().optional(),
  url: z.string().nullable().optional(),
}).transform((data) => ({
  ...data,
  title: data.title || data.action,
}));

export const StructuredNoticeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  category: NoticeCategorySchema.default("GENERAL"),
  secondaryCategories: z.array(NoticeCategorySchema).optional().default([]),
  organization: z.string().default("Campus Administration"),
  description: z.string().default(""),
  summary: z.string().default(""),
  deadline: z.string().nullable().default(null),
  eventDate: z.string().nullable().default(null),
  location: z.string().nullable().default(null),

  eligibility: NoticeEligibilityCriteriaSchema.default({
    branches: [],
    years: [],
    semesters: [],
    minimumCGPA: null,
    maximumCGPA: null,
    graduationYears: [],
    skills: [],
    otherCriteria: [],
  }),

  requiredSkills: z.array(z.string()).default([]),
  requiredDocuments: z.array(z.string()).default([]),
  requiredActions: z.array(ExtractedActionSchema).default([]),

  registrationLink: z.string().nullable().default(null),
  contactInformation: z.string().nullable().default(null),

  confidence: z.number().min(0).max(1).default(0.8),
  rawTextExcerpt: z.string().optional(),
  extractedAt: z.string().optional(),
});

export type StructuredNoticeInput = z.infer<typeof StructuredNoticeSchema>;
