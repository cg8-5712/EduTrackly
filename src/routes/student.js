import express from 'express';
import { addStudentsController,
  getStudentController,
  getStudentlistController,
  attendanceChangeController,
  deleteStudentController,
  putStudentEventController } from '../controllers/studentController.js';
import jwtRequire from '../middleware/jwt_require.js';
const router = express.Router();

router.post('/add', jwtRequire, addStudentsController);

router.get('/get', getStudentController);

router.get('/list', getStudentlistController);

router.put('/attendance-change', jwtRequire, attendanceChangeController);

router.delete('/delete', jwtRequire, deleteStudentController);

router.put('/event/:date', jwtRequire, putStudentEventController);
router.put('/event', putStudentEventController);

export default router;
