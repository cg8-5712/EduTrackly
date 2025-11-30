import express from 'express';
import * as countdownController from '../controllers/countdownController.js';
import jwtRequire from '../middleware/jwt_require.js';

const router = express.Router();

router.post('/create', countdownController.createCountdown);

export default router;
