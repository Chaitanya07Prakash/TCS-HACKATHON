/**
 * SMART CAMPUS AI — Data Contracts & Type Definitions
 * Shared between Member 2 (Backend) and Member 3 (AI/Intelligence Layer)
 */

export type NoticeCategory =
  | "GENERAL"
  | "PLACEMENT"
  | "SCHOLARSHIP"
  | "EXAMINATION"
  | "EVENT"
  | "ACADEMIC"
  | "COMPETITION"
  | "CLUB"
  | "REGISTRATION"
  | "ADMINISTRATIVE";

export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

/**
 * Student Profile representation
 */
export interface StudentProfile {
  id?: string;
  name: string;
  email?: string;
  branch: string; // e.g., "CSE", "IT", "ECE"
  year: number; // e.g., 3
  semester: number; // e.g., 5
  cgpa: number; // e.g., 8.2
  graduationYear: number; // e.g., 2027
  skills: string[]; // e.g., ["Python", "Java", "React", "SQL"]
  interests: string[]; // e.g., ["AI", "Backend"]
  placementPreferences?: string[]; // e.g., ["Software Development"]
}

/**
 * Structured Eligibility extracted from Notice
 */
export interface NoticeEligibilityCriteria {
  branches: string[]; // Target branches, e.g. ["CSE", "IT"]
  years: number[]; // e.g., [3, 4]
  semesters: number[]; // e.g., [5, 6, 7, 8]
  minimumCGPA: number | null; // e.g., 7.5
  maximumCGPA: number | null;
  graduationYears: number[]; // e.g., [2027]
  skills: string[]; // e.g., ["Python", "C++"]
  otherCriteria?: string[]; // e.g., ["No active backlogs"]
}

export type ActionType =
  | "REGISTER"
  | "UPLOAD_RESUME"
  | "SUBMIT_DOCUMENTS"
  | "ATTEND_ASSESSMENT"
  | "ATTEND_EVENT"
  | "PAY_FEE"
  | "SUBMIT_PROPOSAL"
  | "OTHER";

/**
 * Action extracted from Notice
 */
export interface ExtractedAction {
  title: string; // e.g., "Register for placement"
  action: string; // e.g., "Register" (backwards compatible)
  actionType?: ActionType;
  deadline: string | null; // e.g., "2026-09-20"
  description?: string;
  url?: string | null;
}

/**
 * Structured Notice extracted by AI pipeline
 */
export interface StructuredNotice {
  id?: string;
  title: string;
  category: NoticeCategory;
  secondaryCategories?: NoticeCategory[];
  organization: string; // e.g., "ABC Technologies", "Exam Cell"
  description: string; // Cleaned description
  summary: string; // Concise student-friendly summary
  deadline: string | null; // Primary registration or submission deadline
  eventDate: string | null; // Assessment or event date
  location: string | null; // e.g., "Auditorium / Online"

  eligibility: NoticeEligibilityCriteria;

  requiredSkills: string[];
  requiredDocuments: string[];
  requiredActions: ExtractedAction[];

  registrationLink: string | null;
  contactInformation: string | null;

  confidence: number; // Extraction confidence score (0.0 to 1.0)
  rawTextExcerpt?: string;
  extractedAt?: string;
}

/**
 * Deterministic Eligibility evaluation result
 */
export interface EligibilityResult {
  eligible: boolean;
  reasons: string[]; // Positive reasons why eligible
  failedCriteria: string[]; // Explicit criteria that failed evaluation
  missingRequirements: string[]; // Requirements missing from student profile or opportunity
  isPartial?: boolean; // When some requirements are unspecified in the notice
}

/**
 * Breakdown of 100-Point Relevance Score
 */
export interface RelevanceScoreBreakdown {
  branchScore: number; // Max 30
  graduationYearScore: number; // Max 20
  cgpaScore: number; // Max 15
  interestScore: number; // Max 15
  skillScore: number; // Max 10
  urgencyScore: number; // Max 10
}

/**
 * Relevance Evaluation result
 */
export interface RelevanceResult {
  score: number; // 0 - 100
  priority: PriorityLevel;
  factors: RelevanceScoreBreakdown;
  breakdown: RelevanceScoreBreakdown;
  reasons: string[];
  matchExplanation?: string;
}

/**
 * Actionable Task recommended to the student
 */
export interface ActionTask {
  id?: string;
  title: string;
  action: string;
  deadline: string | null;
  priority: PriorityLevel;
  sourceNoticeId?: string;
  sourceOrganization?: string;
  status: "PENDING" | "COMPLETED" | "MISSED";
}

/**
 * Personalized Evaluation output combining all steps
 */
export interface OpportunityEvaluation {
  studentId?: string;
  noticeId?: string;
  eligibility: EligibilityResult;
  relevance: RelevanceResult;
  recommendedTasks: ActionTask[];
  personalizedSummary: string;
}

export type AssistantIntent =
  | "TASK_QUERY"
  | "DEADLINE_QUERY"
  | "ELIGIBILITY_QUERY"
  | "PLACEMENT_QUERY"
  | "SCHOLARSHIP_QUERY"
  | "EVENT_QUERY"
  | "OPPORTUNITY_QUERY"
  | "NOTICE_QUERY"
  | "GENERAL_QUERY";

export interface AssistantResponseOpportunity {
  id?: string;
  title: string;
  category: NoticeCategory;
  organization: string;
  deadline: string | null;
  eligible?: boolean;
  relevanceScore?: number;
  priority?: PriorityLevel;
  summary?: string;
}

export interface AssistantResponseDeadline {
  title: string;
  action: string;
  deadline: string;
  daysRemaining?: number;
  priority: PriorityLevel;
}

export interface AssistantResponse {
  answer: string;
  intent: AssistantIntent;
  opportunities: AssistantResponseOpportunity[];
  tasks: ActionTask[];
  deadlines: AssistantResponseDeadline[];
}

export interface StudentDashboardData {
  student: Partial<StudentProfile>;
  metrics: {
    totalNotices: number;
    eligibleCount: number;
    highPriorityCount: number;
    pendingTasksCount: number;
  };
  highPriorityOpportunities: Array<{
    notice: StructuredNotice;
    eligibility: EligibilityResult;
    relevance: RelevanceResult;
  }>;
  allEligibleOpportunities: Array<{
    notice: StructuredNotice;
    eligibility: EligibilityResult;
    relevance: RelevanceResult;
  }>;
  actionableTasks: ActionTask[];
  upcomingDeadlines: AssistantResponseDeadline[];
}

/**
 * Grounded AI Assistant Context
 */
export interface AssistantContext {
  student: Partial<StudentProfile>;
  notices?: StructuredNotice[];
  relevantOpportunities?: Array<{
    title: string;
    category: NoticeCategory;
    organization: string;
    deadline: string | null;
    eligibility: EligibilityResult;
    relevance: RelevanceResult;
    requiredActions: ExtractedAction[];
  }>;
  activeTasks?: ActionTask[];
  referenceDate?: string | Date;
}
