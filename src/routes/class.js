import express from 'express';
import { createClassController } from '../controllers/classController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.post('/create', jwtRequire, createClassController);

export default router;
