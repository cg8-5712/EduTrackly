import express from 'express';
import { getHomework, listHomeworks, createHomework, deleteHomework } from '../controllers/homeworkController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.get('/get', getHomework);

router.get('/list', listHomeworks);

router.post('/post', createHomework);

router.delete('/delete', jwtRequire, deleteHomework);

export default router;
