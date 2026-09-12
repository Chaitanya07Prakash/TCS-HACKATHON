import { Request, Response } from 'express';
import prisma from '../config/db';
import { chatWithAssistant } from '../services/ai.service';

export const chat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const userId = req.user!.id;

    const [user, tasks, opportunities, notices] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { skills: true, interests: true },
      }),
      prisma.task.findMany({
        where: { userId, status: 'PENDING' },
        orderBy: { deadline: 'asc' },
      }),
      prisma.opportunityEligibility.findMany({
        where: { userId, eligible: true },
        include: { opportunity: { include: { notice: true } } },
        orderBy: { score: 'desc' },
        take: 3,
      }),
      prisma.notice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const context = {
      profile: {
        name: user?.name,
        branch: user?.branch,
        graduationYear: user?.graduationYear,
        cgpa: user?.cgpa,
        skills: user?.skills.map(s => s.name),
        interests: user?.interests.map(i => i.name),
      },
      pendingTasks: tasks.map(t => ({ title: t.title, deadline: t.deadline })),
      topOpportunities: opportunities.map(o => ({
        title: o.opportunity.title,
        deadline: o.opportunity.notice?.deadline,
        relevanceScore: o.score,
      })),
      recentNotices: notices.map(n => ({ title: n.title, summary: n.summary })),
    };

    const response = await chatWithAssistant(message, context);

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
