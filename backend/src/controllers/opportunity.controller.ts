import { Request, Response } from 'express';
import prisma from '../config/db';

export const getOpportunities = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    const where: any = {};
    if (category) where.category = category as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { eligibilities: true }
    });
    const formatted = opportunities.map(opp => ({
      ...opp,
      eligibilities: opp.eligibilities.map(e => ({
        ...e,
        reasons: JSON.parse(e.reasons)
      }))
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getOpportunityById = async (req: Request, res: Response) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      include: { notice: { include: { requirements: true } } }
    });
    if (!opportunity) return res.status(404).json({ success: false, message: 'Opportunity not found' });
    res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getEligibleOpportunities = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const eligibilities = await prisma.opportunityEligibility.findMany({
      where: { userId, eligible: true },
      include: { opportunity: { include: { notice: true } } },
      orderBy: { score: 'desc' },
    });

    const response = eligibilities.map(el => ({
      id: el.opportunity.id,
      title: el.opportunity.title,
      category: el.opportunity.category,
      deadline: el.opportunity.notice?.deadline || null,
      eligible: el.eligible,
      relevanceScore: el.score,
      priority: el.priority,
      reasons: el.reasons,
    }));

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getRecommendedOpportunities = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const eligibilities = await prisma.opportunityEligibility.findMany({
      where: { userId, eligible: true, priority: { in: ['HIGH', 'MEDIUM'] } },
      include: { opportunity: { include: { notice: true } } },
      orderBy: { score: 'desc' },
      take: 10,
    });

    const response = eligibilities.map(el => ({
      id: el.opportunity.id,
      title: el.opportunity.title,
      category: el.opportunity.category,
      deadline: el.opportunity.notice?.deadline || null,
      eligible: el.eligible,
      relevanceScore: el.score,
      priority: el.priority,
      reasons: el.reasons,
    }));

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
