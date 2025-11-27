import { Router } from 'express';
import { listCareers, createCareer, updateCareer, deleteCareer } from '../controllers/carrerasController.js';

const router = Router();

// Rutas en español para carreras
router.get('/api/getCarreras', listCareers);
router.post('/api/createCarrera', createCareer);
router.put('/api/updateCarrera/:career', updateCareer);
router.delete('/api/deleteCarrera/:career', deleteCareer);

export default router;
