import express from 'express';
import { createClassController, getClassController } from '../controllers/classController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.post('/create', jwtRequire, createClassController);

router.get('/get', getClassController);

export default router;
