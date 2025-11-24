import { Router } from 'express';
import { listOpportunities } from '../controllers/opportunitiesController.js';

const router = Router();

router.get('/api/opportunities', listOpportunities);

export default router;
