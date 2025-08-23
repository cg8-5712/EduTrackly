// src/routes/auth.js
import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

// GET /api/v1/auth
router.post("/", login);

export default router;
