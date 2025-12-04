import express from 'express';
import * as settingController from '../controllers/settingController.js';
import jwtRequire from "../middleware/jwt_require.js";

const router = express.Router();

router.get('/get', settingController.getSetting);

router.put('/update', jwtRequire, settingController.updateSetting);

export default router;

