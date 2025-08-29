import express from "express";
import { getSystemController } from "../controllers/systemController.js";

const router = express.Router();

router.get("/", getSystemController);

export default router;
