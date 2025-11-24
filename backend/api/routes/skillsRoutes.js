import { Router } from 'express';
import { listSkills } from '../controllers/skillsController.js';

const router = Router();

router.get('/api/skills', listSkills);

export default router;
