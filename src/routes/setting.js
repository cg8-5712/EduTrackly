import express from 'express';
import * as settingController from '../controllers/settingController.js';

const router = express.Router();

router.get('/get', settingController.getSetting);
router.put('/update', settingController.updateSetting);

export default router;

