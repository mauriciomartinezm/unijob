import { Router } from 'express';
import { refreshRecommendations, solicitarRecomendacion } from '../controllers/recomendacionesController.js';

const router = Router();

// Ruta para solicitar recomendaciones en vivo (no persiste)
router.get('/api/recomendaciones/:id/solicitar', solicitarRecomendacion);

// Ruta admin para forzar recálculo y persistencia de recomendaciones
router.post('/api/recomendaciones/:id/refresh', refreshRecommendations);

export default router;
