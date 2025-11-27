import { Router } from 'express';
import { listCompetencias, createCompetencia, deleteCompetencia, updateCompetencia } from '../controllers/competenciasController.js';

const router = Router();

// Rutas en español para competencias
router.get('/api/getCompetencias', listCompetencias);
router.post('/api/createCompetencia', createCompetencia);
router.put('/api/updateCompetencia/:competencia', updateCompetencia);
router.delete('/api/deleteCompetencia/:competencia', deleteCompetencia);

export default router;
