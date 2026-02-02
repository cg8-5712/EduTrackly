import express from 'express';
import { addStudentsController,
  getStudentController,
  getStudentlistController,
  attendanceChangeController,
  deleteStudentController,
  putStudentEventController } from '../controllers/studentController.js';
import jwtRequire, { optionalJwt, conditionalStudentEventJwt } from '../middleware/jwt_require.js';
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

// Event update with date param - conditional JWT: today's events don't require auth, future/past requires auth (class access checked in controller)
router.put('/event/:date', conditionalStudentEventJwt, rateLimiter('write'), putStudentEventController);

// Event update without date - conditional JWT: defaults to today, no auth required (class access checked in controller)
router.put('/event', conditionalStudentEventJwt, rateLimiter('write'), putStudentEventController);

export default router;