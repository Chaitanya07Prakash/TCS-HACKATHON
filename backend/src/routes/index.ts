import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import noticeRoutes from './notice.routes';
import assistantRoutes from './assistant.routes';
import opportunityRoutes from './opportunity.routes';
import taskRoutes from './task.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notices', noticeRoutes);
router.use('/assistant', assistantRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);

export default router;
