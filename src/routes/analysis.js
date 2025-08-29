import express from 'express';
import { getToday, getClassAnalysisController, getStudentsAnalysisController } from '../controllers/analysisController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.get('/basic', getToday);

router.get('/class', jwtRequire, getClassAnalysisController);

router.get('/student', getStudentsAnalysisController);

export default router;
