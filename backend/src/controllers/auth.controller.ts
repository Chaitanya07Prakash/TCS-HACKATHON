import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { env } from '../config/env';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, branch, year, semester, graduationYear, cgpa } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, branch, year, semester, graduationYear, cgpa },
    });

    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name }, token } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name }, token } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
