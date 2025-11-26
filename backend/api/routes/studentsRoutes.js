import { Router } from 'express';
import { listStudents, getStudent, createStudent } from '../controllers/studentsController.js';

const router = Router();

router.get('/api/getStudents', listStudents);
router.get('/api/getStudent/:id', getStudent);
router.post('/api/students', createStudent);

export default router;
