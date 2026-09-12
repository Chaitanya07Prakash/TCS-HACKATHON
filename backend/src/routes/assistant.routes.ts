import { Router } from 'express';
import { chat } from '../controllers/assistant.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.post('/chat', chat);

export default router;
