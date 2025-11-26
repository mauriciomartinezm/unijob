import { Router } from 'express';
import { listCareers, createCareer, updateCareer, deleteCareer } from '../controllers/careersController.js';

const router = Router();

router.get('/api/getCareers', listCareers);
router.post('/api/createCareer', createCareer);
router.put('/api/careers/:career', updateCareer);
router.delete('/api/deleteCareer/:career', deleteCareer);

export default router;
