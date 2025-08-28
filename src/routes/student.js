import express from 'express';
import { addStudentsController, getStudentController, getStudentlistController, attendanceChangeController, deleteStudentController } from '../controllers/studentController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.post('/add', jwtRequire, addStudentsController);

router.get('/get', getStudentController);

router.get('/list', getStudentlistController);

router.put('/attendance-change', jwtRequire, attendanceChangeController);

router.delete('/delete', jwtRequire, deleteStudentController);

export default router;
