import { Router } from 'express';
import { listStudents, getStudent, createStudent, updateStudent, deleteStudent } from '../controllers/estudiantesController.js';

const router = Router();

// Rutas en español para estudiantes
router.get('/api/getEstudiantes', listStudents);
router.get('/api/getEstudiante/:id', getStudent);
router.post('/api/createEstudiante', createStudent);
router.put('/api/updateEstudiante/:id', updateStudent);
router.delete('/api/deleteEstudiante/:id', deleteStudent);
export default router;
