// src/routes/auth.js
import express from 'express';
import { login } from '../controllers/authController.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// POST /api/v1/auth - Login with strict rate limiting
router.post('/', rateLimiter('auth'), login);

export default router;
