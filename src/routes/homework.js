import express from 'express';
import { getHomework, listHomeworks, createHomework, deleteHomework } from '../controllers/homeworkController.js';
import jwtRequire, { optionalJwt, conditionalHomeworkJwt } from '../middleware/jwt_require.js';
import { requireClassAccess, conditionalClassAccess } from '../middleware/role_require.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// Get homework - optionalJwt for role-based filtering
router.get('/get', optionalJwt, rateLimiter('read'), getHomework);

// List homeworks - optionalJwt for role-based filtering
router.get('/list', optionalJwt, rateLimiter('read'), listHomeworks);

// Create homework - conditional JWT: today's homework doesn't require auth, future/past requires auth and class access
router.post('/post', conditionalHomeworkJwt, conditionalClassAccess({ cidSource: 'body' }), rateLimiter('write'), createHomework);

// Delete homework - check class access
router.delete('/delete', jwtRequire, requireClassAccess({ cidSource: 'query' }), rateLimiter('write'), deleteHomework);

export default router;
