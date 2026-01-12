import express from 'express';
import { getToday, getClassAnalysisController, getStudentsAnalysisController } from '../controllers/analysisController.js';
import jwtRequire, { optionalJwt } from '../middleware/jwt_require.js';
import { requireClassAccess } from '../middleware/role_require.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// Basic analysis - optionalJwt for role-based filtering
router.get('/basic', optionalJwt, rateLimiter('read'), getToday);

// Class analysis - require JWT and class access
router.get('/class', jwtRequire, requireClassAccess({ cidSource: 'query' }), rateLimiter('read'), getClassAnalysisController);

// Student analysis - optionalJwt for role-based filtering
router.get('/student', optionalJwt, rateLimiter('read'), getStudentsAnalysisController);

export default router;
