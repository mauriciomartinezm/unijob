import { Router } from 'express';
import { listSkills, createSkill, deleteSkill, updateSkill } from '../controllers/competenciasController.js';

const router = Router();

// Rutas en español para competencias
router.get('/api/competencias', listSkills);
router.post('/api/competencias', createSkill);
router.put('/api/competencias/:skill', updateSkill);
router.delete('/api/competencias/:skill', deleteSkill);

export default router;
