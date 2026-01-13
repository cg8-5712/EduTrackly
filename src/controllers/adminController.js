// src/controllers/adminController.js
import * as adminService from '../services/admin.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from '../config/errorCodes.js';
import { handleControllerError } from '../middleware/error_handler.js';
import bcrypt from 'bcrypt';

// Error codes for admin operations
const AdminErrors = {
  NOT_FOUND: { code: 5001, message: 'Admin not found' },
  CREATE_FAILED: { code: 5003, message: 'Failed to create admin' },
  CANNOT_DELETE_SELF: { code: 5004, message: 'Cannot delete your own account' },
  CANNOT_DEMOTE_SELF: { code: 5005, message: 'Cannot demote your own account' },
  INVALID_ROLE: { code: 5006, message: 'Invalid role. Must be superadmin or admin' },
  CLASS_NOT_FOUND: { code: 5007, message: 'Class not found' },
  WRONG_OLD_PASSWORD: { code: 5009, message: 'Old password is incorrect' },
  SAME_PASSWORD: { code: 5010, message: 'New password cannot be the same as old password' },
};

/**
 * Create a new admin account
 */
export async function createAdmin(req, res) {
  const { password, role } = req.body;

  try {
    // Validate password
    if (!password) {
      return res.status(400).json({
        ...ErrorCodes.AuthErrors.PASSWORD_REQUIRED,
        timestamp: Date.now()
      });
    }

    // Validate role
    const validRoles = ['superadmin', 'admin'];
    const adminRole = role || 'admin';
    if (!validRoles.includes(adminRole)) {
      return res.status(400).json({
        ...AdminErrors.INVALID_ROLE,
        timestamp: Date.now()
      });
    }

    const admin = await adminService.createAdmin(password, adminRole);

    logger.info(`Admin created: aid=${admin.aid} by aid=${req.aid}`);

    return res.status(201).json({
      code: 0,
      message: 'Admin created successfully',
      data: admin,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Create admin error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Get admin by ID
 */
export async function getAdmin(req, res) {
  const { aid } = req.query;

  try {
    if (!aid) {
      return res.status(400).json({
        code: 7020,
        message: 'Admin ID is required',
        timestamp: Date.now()
      });
    }

    const admin = await adminService.getAdminById(parseInt(aid, 10));

    if (!admin) {
      return res.status(404).json({
        ...AdminErrors.NOT_FOUND,
        timestamp: Date.now()
      });
    }

    // Get assigned classes
    const classes = await adminService.getAdminClasses(admin.aid);

    return res.json({
      code: 0,
      message: 'Success',
      data: {
        ...admin,
        classes
      },
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Get admin error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * List all admins
 */
export async function listAdmins(req, res) {
  const { page = 1, size = 20, role } = req.query;

  try {
    const result = await adminService.listAdmins({
      page: parseInt(page, 10),
      size: parseInt(size, 10),
      role
    });

    return res.json({
      code: 0,
      message: 'Success',
      data: result.admins,
      pagination: result.pagination,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('List admins error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Update admin info
 */
export async function updateAdmin(req, res) {
  const { aid } = req.query;
  const { password, role } = req.body;

  try {
    if (!aid) {
      return res.status(400).json({
        code: 7020,
        message: 'Admin ID is required',
        timestamp: Date.now()
      });
    }

    const targetAid = parseInt(aid, 10);

    // Check if trying to demote self
    if (role && role !== 'superadmin' && targetAid === req.aid) {
      return res.status(400).json({
        ...AdminErrors.CANNOT_DEMOTE_SELF,
        timestamp: Date.now()
      });
    }

    // Validate role if provided
    if (role && !['superadmin', 'admin'].includes(role)) {
      return res.status(400).json({
        ...AdminErrors.INVALID_ROLE,
        timestamp: Date.now()
      });
    }

    const updatedAdmin = await adminService.updateAdmin(targetAid, {
      password,
      role
    });

    if (!updatedAdmin) {
      return res.status(404).json({
        ...AdminErrors.NOT_FOUND,
        timestamp: Date.now()
      });
    }

    logger.info(`Admin ${targetAid} updated by aid=${req.aid}`);

    return res.json({
      code: 0,
      message: 'Admin updated successfully',
      data: updatedAdmin,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Update admin error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Delete admin account
 */
export async function deleteAdmin(req, res) {
  const { aid } = req.query;

  try {
    if (!aid) {
      return res.status(400).json({
        code: 7020,
        message: 'Admin ID is required',
        timestamp: Date.now()
      });
    }

    const targetAid = parseInt(aid, 10);

    // Cannot delete self
    if (targetAid === req.aid) {
      return res.status(400).json({
        ...AdminErrors.CANNOT_DELETE_SELF,
        timestamp: Date.now()
      });
    }

    const deleted = await adminService.deleteAdmin(targetAid);

    if (!deleted) {
      return res.status(404).json({
        ...AdminErrors.NOT_FOUND,
        timestamp: Date.now()
      });
    }

    logger.info(`Admin ${targetAid} deleted by aid=${req.aid}`);

    return res.json({
      code: 0,
      message: 'Admin deleted successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Delete admin error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Assign a class to an admin
 */
export async function assignClass(req, res) {
  const { aid, cid } = req.query;

  try {
    if (!aid || !cid) {
      return res.status(400).json({
        code: 7021,
        message: 'Admin ID and Class ID are required',
        timestamp: Date.now()
      });
    }

    const result = await adminService.assignClassToAdmin(
      parseInt(aid, 10),
      parseInt(cid, 10)
    );

    logger.info(`Class ${cid} assigned to admin ${aid} by aid=${req.aid}`);

    return res.json({
      code: 0,
      message: 'Class assigned successfully',
      data: result,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Assign class error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Remove a class from an admin
 */
export async function removeClass(req, res) {
  const { aid, cid } = req.query;

  try {
    if (!aid || !cid) {
      return res.status(400).json({
        code: 7021,
        message: 'Admin ID and Class ID are required',
        timestamp: Date.now()
      });
    }

    const removed = await adminService.removeClassFromAdmin(
      parseInt(aid, 10),
      parseInt(cid, 10)
    );

    if (!removed) {
      return res.status(404).json({
        code: 5008,
        message: 'Assignment not found',
        timestamp: Date.now()
      });
    }

    logger.info(`Class ${cid} removed from admin ${aid} by aid=${req.aid}`);

    return res.json({
      code: 0,
      message: 'Class removed successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Remove class error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Get all classes assigned to an admin
 */
export async function getAdminClasses(req, res) {
  const { aid } = req.query;

  try {
    if (!aid) {
      return res.status(400).json({
        code: 7020,
        message: 'Admin ID is required',
        timestamp: Date.now()
      });
    }

    const classes = await adminService.getAdminClasses(parseInt(aid, 10));

    return res.json({
      code: 0,
      message: 'Success',
      data: classes,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Get admin classes error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Replace all class assignments for an admin
 */
export async function replaceClasses(req, res) {
  const { aid } = req.query;
  const { cids } = req.body;

  try {
    if (!aid) {
      return res.status(400).json({
        code: 7020,
        message: 'Admin ID is required',
        timestamp: Date.now()
      });
    }

    if (!Array.isArray(cids)) {
      return res.status(400).json({
        code: 7022,
        message: 'Class IDs array is required',
        timestamp: Date.now()
      });
    }

    const result = await adminService.replaceAdminClasses(
      parseInt(aid, 10),
      cids.map(cid => parseInt(cid, 10))
    );

    logger.info(`Classes replaced for admin ${aid} by aid=${req.aid}: ${cids.length} classes`);

    return res.json({
      code: 0,
      message: 'Classes replaced successfully',
      data: result,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Replace classes error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Get current admin's info and accessible classes
 */
export async function getCurrentAdmin(req, res) {
  try {
    const admin = await adminService.getAdminById(req.aid);

    if (!admin) {
      return res.status(404).json({
        ...AdminErrors.NOT_FOUND,
        timestamp: Date.now()
      });
    }

    // Get assigned classes (for regular admin)
    let classes = null;
    if (admin.role !== 'superadmin') {
      classes = await adminService.getAdminClasses(admin.aid);
    }

    return res.json({
      code: 0,
      message: 'Success',
      data: {
        ...admin,
        classes  // null for superadmin (all access), array for regular admin
      },
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Get current admin error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * Change current admin's password
 * Requires old password verification
 */
export async function changePassword(req, res) {
  const { old_password, new_password } = req.body;

  try {
    // Validate required fields
    if (!old_password || !new_password) {
      return res.status(400).json({
        ...ErrorCodes.AuthErrors.PASSWORD_REQUIRED,
        message: 'Both old_password and new_password are required',
        timestamp: Date.now()
      });
    }

    // Get current admin's password hash
    const adminWithPassword = await adminService.getAdminWithPassword(req.aid);

    if (!adminWithPassword) {
      return res.status(404).json({
        ...AdminErrors.NOT_FOUND,
        timestamp: Date.now()
      });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(old_password, adminWithPassword.password);

    if (!isOldPasswordValid) {
      return res.status(400).json({
        ...AdminErrors.WRONG_OLD_PASSWORD,
        timestamp: Date.now()
      });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(new_password, adminWithPassword.password);

    if (isSamePassword) {
      return res.status(400).json({
        ...AdminErrors.SAME_PASSWORD,
        timestamp: Date.now()
      });
    }

    // Update password
    await adminService.updateAdmin(req.aid, { password: new_password });

    logger.info(`Admin ${req.aid} changed their password`);

    return res.json({
      code: 0,
      message: 'Password changed successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Change password error:', error.message);
    handleControllerError(error, res, req);
  }
}
