import express from 'express';
import * as countdownController from '../controllers/countdownController.js';
import jwtRequire from '../middleware/jwt_require.js';
import { requireClassAccess, requireCountdownClassAccess } from '../middleware/role_require.js';

const router = express.Router();

// Create countdown - require JWT and class access (cid from body)
router.post('/create', jwtRequire, requireClassAccess({ cidSource: 'body' }), countdownController.createCountdown);

router.get('/get', countdownController.getCountdown);

router.get('/list', countdownController.listCountdowns);

// Update countdown - require JWT and countdown class access (cdid from query)
router.put('/update', jwtRequire, requireCountdownClassAccess({ cdidSource: 'query' }), countdownController.updateCountdown);

// Delete countdown - require JWT and countdown class access (cdid from query)
router.delete('/delete', jwtRequire, requireCountdownClassAccess({ cdidSource: 'query' }), countdownController.deleteCountdown);

export default router;