import express from 'express';
import { getToday, getClassAnalysisController } from '../controllers/analysisController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.get('/basic', getToday);

router.get('/class',  getClassAnalysisController);

export default router;
