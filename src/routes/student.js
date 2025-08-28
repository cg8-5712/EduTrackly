import express from 'express';
import { addStudentsController, getStudentController } from '../controllers/studentController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.post('/add', jwtRequire, addStudentsController);

router.get('/get', getStudentController);

export default router;
