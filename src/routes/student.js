import express from 'express';
import { addStudentsController,
  getStudentController,
  getStudentlistController,
  attendanceChangeController,
  deleteStudentController,
  putStudentEventController } from '../controllers/studentController.js';
import jwtRequire, { optionalJwt } from '../middleware/jwt_require.js';
import { requireStudentClassAccess } from '../middleware/role_require.js';
import { rateLimiter } from '../middleware/rate_limiter.js';

const router = express.Router();

// Add students - JWT required, class access checked in controller
router.post('/add', jwtRequire, rateLimiter('write'), addStudentsController);

// Get student - optionalJwt for role-based filtering
router.get('/get', optionalJwt, rateLimiter('read'), getStudentController);

// List students - optionalJwt for role-based filtering
router.get('/list', optionalJwt, rateLimiter('read'), getStudentlistController);

// Attendance change - require JWT and student class access
router.put('/attendance-change', jwtRequire, requireStudentClassAccess({ sidSource: 'query' }), rateLimiter('write'), attendanceChangeController);

// Delete student - require JWT and student class access
router.delete('/delete', jwtRequire, requireStudentClassAccess({ sidSource: 'query' }), rateLimiter('write'), deleteStudentController);

// Event update with date param - require JWT (class access checked in controller for batch operations)
router.put('/event/:date', jwtRequire, rateLimiter('write'), putStudentEventController);

// Event update without date - require JWT (class access checked in controller for batch operations)
router.put('/event', jwtRequire, rateLimiter('write'), putStudentEventController);

export default router;