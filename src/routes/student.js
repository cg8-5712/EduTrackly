import express from 'express';
import { addStudentsController } from '../controllers/studentController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.post('/add', jwtRequire, addStudentsController);

export default router;
