// src/routes/admin.js
import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import jwtRequire from '../middleware/jwt_require.js';
import { requireSuperAdmin } from '../middleware/role_require.js';

const router = Router();

// Get current admin info (requires authentication)
router.get('/me', jwtRequire, adminController.getCurrentAdmin);

// All routes below require superadmin role
// Create admin account
router.post('/create', jwtRequire, requireSuperAdmin, adminController.createAdmin);

// Get admin by ID
router.get('/get', jwtRequire, requireSuperAdmin, adminController.getAdmin);

// List all admins
router.get('/list', jwtRequire, requireSuperAdmin, adminController.listAdmins);

// Update admin
router.put('/update', jwtRequire, requireSuperAdmin, adminController.updateAdmin);

// Delete admin
router.delete('/delete', jwtRequire, requireSuperAdmin, adminController.deleteAdmin);

// Class assignment management
// Assign a class to an admin
router.post('/class/assign', jwtRequire, requireSuperAdmin, adminController.assignClass);

// Remove a class from an admin
router.delete('/class/remove', jwtRequire, requireSuperAdmin, adminController.removeClass);

// Get all classes assigned to an admin
router.get('/class/list', jwtRequire, requireSuperAdmin, adminController.getAdminClasses);

// Replace all class assignments for an admin
router.put('/class/replace', jwtRequire, requireSuperAdmin, adminController.replaceClasses);

export default router;
