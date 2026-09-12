import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../validators/profile.validator';

const router = Router();

router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

export default router;
