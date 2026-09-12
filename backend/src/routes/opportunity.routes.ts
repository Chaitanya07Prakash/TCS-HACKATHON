import { Router } from 'express';
import { getOpportunities, getOpportunityById, getEligibleOpportunities, getRecommendedOpportunities } from '../controllers/opportunity.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getOpportunities);
router.get('/eligible', getEligibleOpportunities);
router.get('/recommended', getRecommendedOpportunities);
router.get('/:id', getOpportunityById);

export default router;
