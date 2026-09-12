import { Request, Response } from 'express';
import prisma from '../config/db';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        interests: true,
        placementPreference: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.placementPreference) {
      user.placementPreference.preferredRoles = JSON.parse(user.placementPreference.preferredRoles) as any;
      user.placementPreference.locations = JSON.parse(user.placementPreference.locations) as any;
    }
    const { passwordHash, ...userWithoutPassword } = user;
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, branch, year, semester, graduationYear, cgpa, skills, interests, placementPreference } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (branch) updateData.branch = branch;
    if (year !== undefined) updateData.year = year;
    if (semester !== undefined) updateData.semester = semester;
    if (graduationYear) updateData.graduationYear = graduationYear;
    if (cgpa !== undefined) updateData.cgpa = cgpa;

    if (skills) {
      await prisma.skill.deleteMany({ where: { userId } });
      updateData.skills = { create: skills.map((s: string) => ({ name: s })) };
    }

    if (interests) {
      await prisma.interest.deleteMany({ where: { userId } });
      updateData.interests = { create: interests.map((i: string) => ({ name: i })) };
    }

    if (placementPreference) {
      await prisma.placementPreference.deleteMany({ where: { userId } });
      updateData.placementPreference = { 
        create: {
          name: placementPreference.name,
          expectedCtc: placementPreference.expectedCtc,
          preferredRoles: JSON.stringify(placementPreference.preferredRoles || []),
          locations: JSON.stringify(placementPreference.locations || [])
        } 
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { skills: true, interests: true, placementPreference: true }
    });

    if (updatedUser.placementPreference) {
      updatedUser.placementPreference.preferredRoles = JSON.parse(updatedUser.placementPreference.preferredRoles) as any;
      updatedUser.placementPreference.locations = JSON.parse(updatedUser.placementPreference.locations) as any;
    }
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
