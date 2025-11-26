import { Router } from 'express';
import { listCareers, createCareer } from '../controllers/careersController.js';

const router = Router();

router.get('/api/getCareers', listCareers);
router.post('/api/createCareer', createCareer);

export default router;
