import express from 'express';
import * as settingController from '../controllers/settingController.js';
import jwtRequire from "../middleware/jwt_require.js";
import { requireClassAccess } from '../middleware/role_require.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// Get setting - public access with rate limiting
router.get('/get', rateLimiter('read'), settingController.getSetting);

// Update setting - require JWT and class access (cid from query)
router.put('/update', jwtRequire, requireClassAccess({ cidSource: 'query' }), rateLimiter('write'), settingController.updateSetting);

export default router;