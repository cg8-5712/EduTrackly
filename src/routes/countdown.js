import express from 'express';
import * as countdownController from '../controllers/countdownController.js';

const router = express.Router();

router.post('/create', countdownController.createCountdown);
router.get('/get', countdownController.getCountdown);
router.get('/list', countdownController.listCountdowns);

export default router;
