import express from 'express';
import * as countdownController from '../controllers/countdownController.js';

const router = express.Router();

router.post('/create', countdownController.createCountdown);
router.get('/get', countdownController.getCountdown);
router.get('/list', countdownController.listCountdowns);
router.put('/update', countdownController.updateCountdown);
router.delete('/delete', countdownController.deleteCountdown);

export default router;
