import express from 'express';
import * as settingController from '../controllers/settingController.js';
import jwtRequire from "../middleware/jwt_require.js";
import { requireClassAccess } from '../middleware/role_require.js';

const router = express.Router();

router.get('/get', settingController.getSetting);

// Update setting - require JWT and class access (cid from query)
router.put('/update', jwtRequire, requireClassAccess({ cidSource: 'query' }), settingController.updateSetting);

export default router;