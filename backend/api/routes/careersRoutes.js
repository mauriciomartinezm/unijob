import { Router } from 'express';
import { listCareers } from '../controllers/careersController.js';

const router = Router();

router.get('/api/careers', listCareers);

export default router;
