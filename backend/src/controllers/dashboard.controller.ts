import { Request, Response } from 'express';
import prisma from '../config/db';
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const [user, tasks, notifications, opportunities, notices] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { skills: true, interests: true },
      }),
      prisma.task.findMany({
        where: { userId, status: 'PENDING' },
        orderBy: { deadline: 'asc' },
        take: 5,
      }),
      prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.opportunityEligibility.findMany({
        where: { userId, eligible: true, priority: { in: ['HIGH', 'MEDIUM'] } },
        include: { opportunity: { include: { notice: true } } },
        orderBy: { score: 'desc' },
        take: 5,
      }),
      prisma.notice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { passwordHash, ...profile } = user;

    const importantDeadlines = tasks
      .filter(t => t.deadline)
      .map(t => ({ title: t.title, deadline: t.deadline }))
      .concat(
        opportunities
          .filter(o => o.opportunity.notice?.deadline)
          .map(o => ({ title: o.opportunity.title, deadline: o.opportunity.notice?.deadline as Date }))
      )
      .filter(d => d.deadline);

    res.status(200).json({
      success: true,
      data: {
        user: profile,
        importantDeadlines,
        tasks,
        recommendedOpportunities: opportunities.map(o => ({
          ...o.opportunity,
          relevanceScore: o.score,
          priority: o.priority,
          reasons: JSON.parse(o.reasons)
        })),
        recentNotices: notices,
        notifications,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
