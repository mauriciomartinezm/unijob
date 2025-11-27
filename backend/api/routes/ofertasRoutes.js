import { Router } from 'express';
import { listOpportunities } from '../controllers/ofertasController.js';

const router = Router();

// Rutas en español para ofertas
router.get('/api/ofertas', listOpportunities);

export default router;
