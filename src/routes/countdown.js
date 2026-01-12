import express from 'express';
import * as countdownController from '../controllers/countdownController.js';
import jwtRequire, { optionalJwt } from '../middleware/jwt_require.js';
import { requireClassAccess, requireCountdownClassAccess } from '../middleware/role_require.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// Create countdown - require JWT and class access (cid from body)
router.post('/create', jwtRequire, requireClassAccess({ cidSource: 'body' }), rateLimiter('write'), countdownController.createCountdown);

// Get countdown - optionalJwt for role-based filtering
router.get('/get', optionalJwt, rateLimiter('read'), countdownController.getCountdown);

// List countdowns - optionalJwt for role-based filtering
router.get('/list', optionalJwt, rateLimiter('read'), countdownController.listCountdowns);

// Update countdown - require JWT and countdown class access (cdid from query)
router.put('/update', jwtRequire, requireCountdownClassAccess({ cdidSource: 'query' }), rateLimiter('write'), countdownController.updateCountdown);

// Delete countdown - require JWT and countdown class access (cdid from query)
router.delete('/delete', jwtRequire, requireCountdownClassAccess({ cdidSource: 'query' }), rateLimiter('write'), countdownController.deleteCountdown);

export default router;