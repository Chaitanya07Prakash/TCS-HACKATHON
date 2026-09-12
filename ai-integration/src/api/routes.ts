/**
 * Backend API Routes for Member 2 Integration
 * Exposes standardized REST endpoints for Notice Ingestion, Evaluation, Dashboard, and Chat.
 */

import { intelligenceService } from "../service/intelligenceService.js";
import { StudentProfile, StructuredNotice, ActionTask } from "../types/index.js";

export interface ProcessNoticeRequestBody {
  rawText: string;
}

export interface EvaluateOpportunityRequestBody {
  student: Partial<StudentProfile>;
  notice: StructuredNotice;
  referenceDate?: string;
}

export interface DashboardRequestBody {
  student: Partial<StudentProfile>;
  notices: StructuredNotice[];
  referenceDate?: string;
}

export interface ChatRequestBody {
  query: string;
  student: Partial<StudentProfile>;
  notices?: StructuredNotice[];
  activeTasks?: ActionTask[];
  referenceDate?: string;
}

/**
 * Controller handlers ready to mount into Express / Next.js API routes
 */
export const aiControllers = {
  async processNotice(body: ProcessNoticeRequestBody) {
    if (!body?.rawText) {
      throw new Error("Missing 'rawText' in request body");
    }
    return await intelligenceService.ingestNotice(body.rawText);
  },

  async evaluateOpportunity(body: EvaluateOpportunityRequestBody) {
    if (!body?.student || !body?.notice) {
      throw new Error("Missing 'student' or 'notice' in request body");
    }
    return intelligenceService.evaluateOpportunityForStudent(body.student, body.notice, {
      referenceDate: body.referenceDate,
    });
  },

  async getStudentDashboard(body: DashboardRequestBody) {
    if (!body?.student) {
      throw new Error("Missing 'student' in request body");
    }
    return intelligenceService.evaluateStudentDashboard(body.student, body.notices || [], {
      referenceDate: body.referenceDate,
    });
  },

  async chatWithAssistant(body: ChatRequestBody) {
    if (!body?.query) {
      throw new Error("Missing 'query' in request body");
    }
    return await intelligenceService.handleAssistantQuery(body.query, {
      student: body.student,
      notices: body.notices,
      activeTasks: body.activeTasks,
      referenceDate: body.referenceDate,
    });
  },
};
