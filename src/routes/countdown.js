import express from 'express';
import * as countdownController from '../controllers/countdownController.js';
import jwtRequire from '../middleware/jwt_require.js';

const router = express.Router();

router.post('/create', countdownController.createCountdown);

router.get('/get', countdownController.getCountdown);

router.get('/list', jwtRequire, countdownController.listCountdowns);

router.put('/update', jwtRequire, countdownController.updateCountdown);

router.delete('/delete', jwtRequire, countdownController.deleteCountdown);

export default router;
