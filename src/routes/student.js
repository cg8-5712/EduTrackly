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

// Add students - check class access for each student's cid
router.post('/add', jwtRequire, addStudentsController);

router.get('/get', getStudentController);

router.get('/list', getStudentlistController);

// Attendance change - check student's class access
router.put('/attendance-change', jwtRequire, requireStudentClassAccess({ sidSource: 'query' }), attendanceChangeController);

// Delete student - check student's class access
router.delete('/delete', jwtRequire, requireStudentClassAccess({ sidSource: 'query' }), deleteStudentController);

// Update student events - requires JWT
router.put('/event/:date', jwtRequire, putStudentEventController);

router.put('/event', jwtRequire, putStudentEventController);

export default router;
