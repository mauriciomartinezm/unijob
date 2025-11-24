import { Router } from 'express';
import { listStudents, getStudent } from '../controllers/studentsController.js';

const router = Router();

router.get('/api/students', listStudents);
router.get('/api/students/:id', getStudent);

export default router;
