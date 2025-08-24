import express from 'express';
import { getHomework, listHomeworks } from '../controllers/homeworkController.js';

const router = express.Router();

router.get('/get', getHomework);

router.get('/list', listHomeworks);

export default router;
