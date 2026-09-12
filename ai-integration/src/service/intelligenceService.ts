/**
 * Unified Intelligence Service Facade
 * The central integration contract for Member 2 (Backend) and Member 1 (Frontend).
 * Connects the complete pipeline from raw notice ingestion to dashboard delivery and assistant QA.
 */

import {
  StructuredNotice,
  StudentProfile,
  OpportunityEvaluation,
  StudentDashboardData,
  AssistantContext,
  AssistantResponse,
  ActionTask,
  AssistantResponseDeadline,
} from "../types/index.js";
import { extractNoticeFromText } from "../extractor/extractor.js";
import { evaluateEligibility } from "../engine/eligibility.js";
import { calculateRelevance, calculateDeadlineUrgency } from "../engine/relevance.js";
import { generatePersonalizedSummary } from "../extractor/personalSummarizer.js";
import { queryAssistant } from "../assistant/assistant.js";

export class IntelligenceService {
  /**
   * STEP 1: Ingest and process a raw circular into structured data.
   * Invoked by Member 2 when an admin or student uploads a notice.
   */
  public async ingestNotice(rawText: string): Promise<StructuredNotice> {
    const result = await extractNoticeFromText(rawText);
    return result.notice;
  }

  /**
   * STEP 2: Evaluate a single notice against a student profile.
   * Computes deterministic eligibility, 100-point relevance, priority, tasks, and personalized summary.
   */
  public evaluateOpportunityForStudent(
    student: Partial<StudentProfile>,
    notice: StructuredNotice,
    options?: { referenceDate?: string | Date }
  ): OpportunityEvaluation {
    const refDate = options?.referenceDate || new Date();

    // 1. Deterministic Eligibility Check
    const eligibility = evaluateEligibility(student, notice.eligibility);

    // 2. Deterministic Relevance and Priority Scoring
    const relevance = calculateRelevance(student, notice, { referenceDate: refDate });

    // 3. Recommended Tasks
    const recommendedTasks: ActionTask[] = [];
    if (eligibility.eligible && notice.requiredActions) {
      notice.requiredActions.forEach((act, idx) => {
        let taskTitle = act.title || act.action;
        if (!taskTitle.toLowerCase().includes(notice.organization.toLowerCase()) && notice.organization !== "Campus Administration") {
          taskTitle = `${act.action} for ${notice.organization}`;
        }

        recommendedTasks.push({
          id: `task-${notice.id || "notice"}-${idx + 1}`,
          title: taskTitle,
          action: act.action,
          deadline: act.deadline,
          priority: relevance.priority,
          sourceNoticeId: notice.id,
          sourceOrganization: notice.organization,
          status: "PENDING",
        });
      });
    }

    // 4. Personalized Student Summary
    const personalizedSummary = generatePersonalizedSummary(notice, {
      student,
      eligibility,
      relevance,
    });

    return {
      studentId: student.id,
      noticeId: notice.id,
      eligibility,
      relevance,
      recommendedTasks,
      personalizedSummary,
    };
  }

  /**
   * STEP 3: Generate the comprehensive Student Dashboard view.
   * Feeds Member 1's dashboard with prioritized opportunities, task checklist, and deadlines.
   */
  public evaluateStudentDashboard(
    student: Partial<StudentProfile>,
    notices: StructuredNotice[],
    options?: { referenceDate?: string | Date }
  ): StudentDashboardData {
    const refDate = options?.referenceDate || new Date();
    const highPriorityOpportunities: StudentDashboardData["highPriorityOpportunities"] = [];
    const allEligibleOpportunities: StudentDashboardData["allEligibleOpportunities"] = [];
    const actionableTasks: ActionTask[] = [];

    // Deduplicate notices based on normalized title + organization + deadline
    const seenNoticeKeys = new Set<string>();
    const uniqueNotices: StructuredNotice[] = [];

    for (const notice of notices) {
      const key = `${notice.title.trim().toLowerCase()}|${notice.organization.trim().toLowerCase()}|${notice.deadline || "none"}`;
      if (!seenNoticeKeys.has(key)) {
        seenNoticeKeys.add(key);
        uniqueNotices.push(notice);
      }
    }

    for (const notice of uniqueNotices) {
      const evaluation = this.evaluateOpportunityForStudent(student, notice, { referenceDate: refDate });

      if (evaluation.eligibility.eligible) {
        const item = {
          notice,
          eligibility: evaluation.eligibility,
          relevance: evaluation.relevance,
        };

        allEligibleOpportunities.push(item);
        if (evaluation.relevance.priority === "HIGH") {
          highPriorityOpportunities.push(item);
        }

        actionableTasks.push(...evaluation.recommendedTasks);
      }
    }

    // Sort opportunities by relevance score descending
    allEligibleOpportunities.sort((a, b) => b.relevance.score - a.relevance.score);
    highPriorityOpportunities.sort((a, b) => b.relevance.score - a.relevance.score);

    // Build timeline deadlines
    const upcomingDeadlines: AssistantResponseDeadline[] = actionableTasks
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
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return {
      student,
      metrics: {
        totalNotices: notices.length,
        eligibleCount: allEligibleOpportunities.length,
        highPriorityCount: highPriorityOpportunities.length,
        pendingTasksCount: actionableTasks.length,
      },
      highPriorityOpportunities,
      allEligibleOpportunities,
      actionableTasks,
      upcomingDeadlines,
    };
  }

  /**
   * STEP 4: Answer student natural language queries using grounded context.
   * Invoked when student interacts with AI Assistant drawer or chat window.
   */
  public async handleAssistantQuery(
    query: string,
    context: AssistantContext
  ): Promise<AssistantResponse> {
    return queryAssistant(query, context);
  }
}

// Export singleton instance for direct import
export const intelligenceService = new IntelligenceService();
