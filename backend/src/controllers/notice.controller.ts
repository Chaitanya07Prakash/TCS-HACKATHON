import { Request, Response } from 'express';
import prisma from '../config/db';
import { extractNoticeDetails } from '../services/ai.service';
import { checkEligibility } from '../services/eligibility.service';
import { calculateRelevance } from '../services/relevance.service';

const formatNotice = (notice: any) => {
  if (notice.requirements) {
    notice.requirements.branches = JSON.parse(notice.requirements.branches);
    notice.requirements.years = JSON.parse(notice.requirements.years);
    notice.requirements.graduationYears = JSON.parse(notice.requirements.graduationYears);
    notice.requirements.skills = JSON.parse(notice.requirements.skills);
  }
  return notice;
};

export const processNotice = async (req: Request, res: Response) => {
  try {
    const { title, rawText } = req.body;
    const extracted = await extractNoticeDetails(title, rawText);
    
    const notice = await prisma.notice.create({
      data: {
        title,
        description: extracted.summary || rawText,
        category: extracted.category || 'GENERAL',
        rawText,
        summary: extracted.summary || null,
        deadline: extracted.opportunity?.deadline ? new Date(extracted.opportunity.deadline) : null,
        requirements: {
          create: {
            branches: JSON.stringify(extracted.requirements?.branches || []),
            years: JSON.stringify(extracted.requirements?.years || []),
            minimumCGPA: extracted.requirements?.minimumCGPA || null,
            graduationYears: JSON.stringify(extracted.requirements?.graduationYears || []),
            skills: JSON.stringify(extracted.requirements?.skills || []),
          }
        },
        opportunity: extracted.opportunity ? {
          create: {
            organization: extracted.opportunity.organization || null,
            title: extracted.opportunity.title || title,
            description: extracted.opportunity.description || rawText,
            location: extracted.opportunity.location || null,
            category: extracted.category || 'GENERAL',
          }
        } : undefined
      },
      include: {
        requirements: true,
        opportunity: true,
      }
    });

    if (notice.opportunity) {
      const users = await prisma.user.findMany({
        include: { skills: true, interests: true }
      });

      const eligibilities = [];
      const tasks = [];
      const notifications = [];

      for (const user of users) {
        const isEligible = checkEligibility(user, notice.requirements);
        const { score, priority, reasons } = calculateRelevance(user, notice.requirements, isEligible);

        eligibilities.push({
          opportunityId: notice.opportunity.id,
          userId: user.id,
          eligible: isEligible,
          score: score,
          reasons: JSON.stringify(reasons),
          priority,
        });

        if (isEligible && (priority === 'HIGH' || priority === 'MEDIUM')) {
          tasks.push({
            userId: user.id,
            noticeId: notice.id,
            title: `Apply for ${notice.opportunity.title}`,
            description: notice.opportunity.description,
            deadline: notice.deadline,
            priority: priority,
            status: 'PENDING',
          });

          notifications.push({
            userId: user.id,
            type: 'OPPORTUNITY_MATCH',
            message: `You are eligible for ${notice.title}.`,
          });
        }
      }

      if (eligibilities.length > 0) {
        await prisma.opportunityEligibility.createMany({ data: eligibilities });
      }
      if (tasks.length > 0) {
        await prisma.task.createMany({ data: tasks });
      }
      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    res.status(201).json({ success: true, data: formatNotice(notice) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getNotices = async (req: Request, res: Response) => {
  try {
    const { category, search, deadline } = req.query;
    
    const where: any = {};
    if (category) where.category = category as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }
    if (deadline === 'upcoming') {
      where.deadline = { gte: new Date() };
    }

    const notices = await prisma.notice.findMany({
      where,
      include: { requirements: true, opportunity: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: notices.map(formatNotice) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getNoticeById = async (req: Request, res: Response) => {
  try {
    const notice = await prisma.notice.findUnique({
      where: { id: req.params.id },
      include: { requirements: true, opportunity: true }
    });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.status(200).json({ success: true, data: formatNotice(notice) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const notice = await prisma.notice.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    await prisma.notice.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
