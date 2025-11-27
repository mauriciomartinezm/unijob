import { Router } from 'express';
import { recommendBySkills } from '../controllers/recomendacionesController.js';

const router = Router();

// Ruta en español para recomendaciones basadas en competencias
router.get('/api/recomendaciones/:id', recommendBySkills);

export default router;
