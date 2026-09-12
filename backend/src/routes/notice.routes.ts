import { Router } from 'express';
import { processNotice, getNotices, getNoticeById, updateNotice, deleteNotice } from '../controllers/notice.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { processNoticeSchema } from '../validators/notice.validator';

const router = Router();

router.use(authenticate);
router.post('/process', validate(processNoticeSchema), processNotice);
router.get('/', getNotices);
router.get('/:id', getNoticeById);
router.put('/:id', updateNotice);
router.delete('/:id', deleteNotice);

export default router;
