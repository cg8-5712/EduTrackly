import express from "express";
import { getSystemController } from "../controllers/systemController.js";
import jwtRequire from "../middleware/jwt_require.js";

const router = express.Router();

router.get("/", jwtRequire, getSystemController);

export default router;
