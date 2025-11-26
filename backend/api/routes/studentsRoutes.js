import { Router } from 'express';
import { listStudents, getStudent, createStudent } from '../controllers/studentsController.js';

const router = Router();

// Rutas en español para estudiantes
router.get('/api/getEstudiantes', listStudents);
router.get('/api/getEstudiantes/:id', getStudent);
router.post('/api/createEstudiante', createStudent);

export default router;
