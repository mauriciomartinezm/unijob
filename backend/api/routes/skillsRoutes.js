import { Router } from 'express';
import { listSkills, createSkill, deleteSkill } from '../controllers/skillsController.js';
import { updateSkill } from '../controllers/skillsController.js';

const router = Router();

router.get('/api/getSkills', listSkills);
router.post('/api/createSkill', createSkill);
router.delete('/api/deleteSkill/:skill', deleteSkill);
router.put('/api/updateSkill/:skill', updateSkill);

export default router;
