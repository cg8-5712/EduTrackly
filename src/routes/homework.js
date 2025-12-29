import express from 'express';
import { getHomework, listHomeworks, createHomework, deleteHomework } from '../controllers/homeworkController.js';
import jwtRequire from '../middleware/jwt_require.js';
import { requireClassAccess } from '../middleware/role_require.js';
const router = express.Router();

router.get('/get', getHomework);

router.get('/list', listHomeworks);

// Create homework - check class access
router.post('/post', jwtRequire, requireClassAccess({ cidSource: 'query' }), createHomework);

// Delete homework - check class access
router.delete('/delete', jwtRequire, requireClassAccess({ cidSource: 'query' }), deleteHomework);

export default router;
