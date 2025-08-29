import express from 'express';
import { getToday } from '../controllers/analysisController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.get('/today', getToday);

export default router;
