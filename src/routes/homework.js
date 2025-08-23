// src/routes/homework.js
import express from "express";
import jwtRequire from "../middleware/jwt_require.js";
import * as homeworkController from "../controllers/homeworkController.js";

const router = express.Router();

// GET /api/v1/homework/get
router.get("/get", homeworkController.getHomework);

export default router;
