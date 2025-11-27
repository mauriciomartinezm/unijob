import { Router } from 'express';
import { recommendByCompetencias } from '../controllers/recomendacionesController.js';

const router = Router();

// Ruta en español para recomendaciones basadas en competencias
router.get('/api/recomendaciones/:id', recommendByCompetencias);

export default router;
