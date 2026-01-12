import express from 'express';
import { getHomework, listHomeworks, createHomework, deleteHomework } from '../controllers/homeworkController.js';
import jwtRequire, { optionalJwt } from '../middleware/jwt_require.js';
import { requireClassAccess } from '../middleware/role_require.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// Get homework - optionalJwt for role-based filtering
router.get('/get', optionalJwt, rateLimiter('read'), getHomework);

// List homeworks - optionalJwt for role-based filtering
router.get('/list', optionalJwt, rateLimiter('read'), listHomeworks);

// Create homework - check class access
router.post('/post', jwtRequire, requireClassAccess({ cidSource: 'body' }), rateLimiter('write'), createHomework);

// Delete homework - check class access
router.delete('/delete', jwtRequire, requireClassAccess({ cidSource: 'query' }), rateLimiter('write'), deleteHomework);

export default router;
