import express from 'express';
import { createClassController, getClassController, listClass, deleteClassController } from '../controllers/classController.js';
import jwtRequire, { optionalJwt } from '../middleware/jwt_require.js';
import { requireClassAccess } from '../middleware/role_require.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// Create class - will auto-assign to current admin if not superadmin
router.post('/create', jwtRequire, rateLimiter('write'), createClassController);

// Get class - optionalJwt for role-based filtering
router.get('/get', optionalJwt, rateLimiter('read'), getClassController);

// List classes - optionalJwt for role-based filtering
router.get('/list', optionalJwt, rateLimiter('read'), listClass);

// Delete class - check class access
router.delete('/delete', jwtRequire, requireClassAccess({ cidSource: 'query' }), rateLimiter('write'), deleteClassController);

export default router;
