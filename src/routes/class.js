import express from 'express';
import { createClassController, getClassController, listClass, deleteClassController } from '../controllers/classController.js';
import jwtRequire from '../middleware/jwt_require.js';
import { requireClassAccess } from '../middleware/role_require.js';
const router = express.Router();

// Create class - will auto-assign to current admin if not superadmin
router.post('/create', jwtRequire, createClassController);

router.get('/get', getClassController);

router.get('/list', listClass);

// Delete class - check class access
router.delete('/delete', jwtRequire, requireClassAccess({ cidSource: 'query' }), deleteClassController);

export default router;
