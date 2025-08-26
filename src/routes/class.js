import express from 'express';
import { createClassController, getClassController, listClass } from '../controllers/classController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.post('/create', jwtRequire, createClassController);

router.get('/get', getClassController);

router.get('/list', listClass);

export default router;
