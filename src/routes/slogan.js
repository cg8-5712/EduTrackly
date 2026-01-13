import express from 'express';
import * as sloganController from '../controllers/sloganController.js';
import jwtRequire, { optionalJwt } from '../middleware/jwt_require.js';
import { requireClassAccess, requireSloganClassAccess } from '../middleware/role_require.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// Create slogan - require JWT and class access (cid from body)
router.post('/create', jwtRequire, requireClassAccess({ cidSource: 'body' }), rateLimiter('write'), sloganController.createSlogan);

// Get slogan - optionalJwt for role-based filtering
router.get('/get', optionalJwt, rateLimiter('read'), sloganController.getSlogan);

// List slogans - optionalJwt for role-based filtering
router.get('/list', optionalJwt, rateLimiter('read'), sloganController.listSlogans);

// Update slogan - require JWT and slogan class access (slid from query)
router.put('/update', jwtRequire, requireSloganClassAccess({ slidSource: 'query' }), rateLimiter('write'), sloganController.updateSlogan);

// Delete slogan - require JWT and slogan class access (slid from query)
router.delete('/delete', jwtRequire, requireSloganClassAccess({ slidSource: 'query' }), rateLimiter('write'), sloganController.deleteSlogan);

export default router;
