import { Request, Response } from 'express';
import prisma from '../config/db';
export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { deadline: 'asc' },
    });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { noticeId, title, description, deadline, priority } = req.body;
    
    const task = await prisma.task.create({
      data: {
        userId,
        noticeId,
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'MEDIUM',
      }
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status, title, description, deadline, priority } = req.body;

    const task = await prisma.task.updateMany({
      where: { id, userId },
      data: { 
        ...(status && { status }),
        ...(title && { title }),
        ...(description && { description }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(priority && { priority }),
      },
    });

    if (task.count === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await prisma.task.deleteMany({
      where: { id, userId },
    });

    if (task.count === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
