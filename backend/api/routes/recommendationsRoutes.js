import { Router } from 'express';
import { recommendBySkills } from '../controllers/recommendationsController.js';

const router = Router();

router.get('/api/recommendBySkills/:id', recommendBySkills);

export default router;
