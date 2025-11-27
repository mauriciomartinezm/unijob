import { Router } from 'express';
import { listCareers, createCareer, updateCareer, deleteCareer } from '../controllers/carrerasController.js';

const router = Router();

// Rutas en español para carreras
router.get('/api/carreras', listCareers);
router.post('/api/carreras', createCareer);
router.put('/api/carreras/:career', updateCareer);
router.delete('/api/carreras/:career', deleteCareer);

export default router;
