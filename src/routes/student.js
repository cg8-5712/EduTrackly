import express from 'express';
import { addStudentsController,
  getStudentController,
  getStudentlistController,
  attendanceChangeController,
  deleteStudentController,
  putStudentEventController } from '../controllers/studentController.js';
import jwtRequire from '../middleware/jwt_require.js';
import { requireStudentClassAccess } from '../middleware/role_require.js';

const router = express.Router();

router.post('/add', jwtRequire, addStudentsController);

router.get('/get', getStudentController);

router.get('/list', getStudentlistController);

// Attendance change - require JWT and student class access
router.put('/attendance-change', jwtRequire, requireStudentClassAccess({ sidSource: 'query' }), attendanceChangeController);

// Delete student - require JWT and student class access
router.delete('/delete', jwtRequire, requireStudentClassAccess({ sidSource: 'query' }), deleteStudentController);

// Event update with date param - require JWT (class access checked in controller for batch operations)
router.put('/event/:date', jwtRequire, putStudentEventController);

// Event update without date - require JWT (class access checked in controller for batch operations)
router.put('/event', jwtRequire, putStudentEventController);

export default router;