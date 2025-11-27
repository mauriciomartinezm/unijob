import { Router } from 'express';
import { createInteraction, setPreferences } from '../controllers/profileController.js';

const router = Router();

// Endpoint para interacciones genéricas (existing)
router.post('/api/interaccion', createInteraction);

// Endpoint para actualizar preferencias del usuario (ubicacion, modalidad, salario)
router.post('/api/preferencias', setPreferences);

export default router;
