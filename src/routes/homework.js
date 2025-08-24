import express from 'express';
import { getHomework, listHomeworks, createHomework } from '../controllers/homeworkController.js';

const router = express.Router();

router.get('/get', getHomework);

router.get('/list', listHomeworks);

router.post('/post', createHomework);

export default router;
