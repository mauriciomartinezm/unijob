import { Router } from 'express';
import { listOpportunities, createOpportunity } from '../controllers/ofertasController.js';

const router = Router();

// Rutas en español para ofertas
router.get('/api/getOfertas', listOpportunities);
router.post('/api/createOferta', createOpportunity);

export default router;
