// Unified error code management
export const AuthErrors = {
  INVALID_TOKEN: { code: 1001, message: 'Invalid or expired token' },
  LOGIN_FAILED: { code: 1002, message: 'Login failed' },
  UNAUTHORIZED: { code: 1003, message: 'Unauthorized access' },
  PASSWORD_REQUIRED: {
    code: 1004,
    message: 'Password is required'
  },
  INVALID_PASSWORD_FORMAT: {
    code: 1005,
    message: 'Invalid password format'
  },
  TOO_MANY_ATTEMPTS: {
    code: 1006,
    message: 'Too many login attempts. Please try again later'
  },
  IP_BLOCKED: {
    code: 1007,
    message: 'Access blocked due to suspicious activity'
  },
  SESSION_EXPIRED: {
    code: 1008,
    message: 'Session has expired, please login again'
  },
  USERNAME_REQUIRED: {
    code: 1009,
    message: 'Username is required'
  },
  FORBIDDEN: {
    code: 1010,
    message: 'You do not have permission to perform this action'
  },
  SUPERADMIN_REQUIRED: {
    code: 1011,
    message: 'This action requires superadmin privileges'
  },
  CLASS_ACCESS_DENIED: {
    code: 1012,
    message: 'You do not have permission to access this class'
  }
};

export const HomeworkErrors = {
  NOT_FOUND: { code: 2001, message: 'Homework not found' },
  CREATE_FAILED: { code: 2002, message: 'Failed to create homework' }
};

export const StudentErrors = {
  NOT_FOUND: { code: 3001, message: 'Student not found' },
  CREATE_FAILED: { code: 3002, message: 'Failed to create student' },
};

export const ClassErrors = {
  NOT_FOUND: { code: 4001, message: 'Class not found' },
  ALREADY_EXIST: { code: 4002, message: 'Class name already exist' },
  DELETE_FAILED: { code: 4003, message: 'Failed to delete class' },
  UPDATE_FAILED: { code: 4004, message: 'Failed to update class' },
  INVALID_CLASS_SIZE: { code: 4005, message: 'Invalid class size' },
  MAX_STUDENTS_REACHED: { code: 4006, message: 'Maximum number of students reached' },
  DUPLICATE_STUDENT: { code: 4007, message: 'Student already exists in class' },
  NO_STUDENTS_FOUND: { code: 4008, message: 'No students found in class' }

};

export const SystemErrors = {
  INTERNAL: { code: 9001, message: 'Internal server error' },
  BAD_REQUEST: { code: 9002, message: 'Bad request' },
  NOT_FOUND: { code: 9003, message: 'Resource not found' },
  DATABASE_ERROR: { code: 9004, message: 'Database operation failed' },
  EXTERNAL_SERVICE_ERROR: { code: 9005, message: 'External service error' },
  FOREIGN_KEY_VIOLATION: { code: 9006, message: 'Referenced record not found or constraint violation' },
  NOT_NULL_VIOLATION: { code: 9007, message: 'Required field missing' },
  CHECK_VIOLATION: { code: 9008, message: 'Invalid value constraint violation' },
  INVALID_DATA_TYPE: { code: 9009, message: 'Invalid data type or format' },
  ROUTE_NOT_FOUND: { code: 9010, message: 'Route not found' },
};

export const CountdownErrors = {
  NOT_FOUND: { code: 6001, message: 'Countdown not found' },
  CREATE_FAILED: { code: 6002, message: 'Failed to create countdown' },
  UPDATE_FAILED: { code: 6003, message: 'Failed to update countdown' },
  DELETE_FAILED: { code: 6004, message: 'Failed to delete countdown' }
};

export const FormatErrors = {
  NOT_YYYYMMDD_DATE: { code: 8001, message: 'Date format must be YYYYMMDD' },
  NOT_YYYYMMDDHHMMSS_DATE: { code: 8002, message: 'Date format must be YYYYMMDDHHMMSS' },
  DATE_ILLEGAL: { code: 8003, message: 'Illegal date' },
};

export const ParamsErrors = {
  REQUIRE_CID: {code: 7001, message: 'Required class id parameter'},
  REQUIRE_HOMEWORK_CONTENT: {code: 7002, message: 'Required homework content parameter'},
  REQUIRE_DATE: {code: 7003, message: 'Required due date parameter'},
  REQUIRE_CLASS_NAME: {code: 7004, message: 'Required class name parameter'},
  REQUIRE_CLASS_NAME_OR_ID: {code: 7005, message: 'Required class name or id parameter'},
  TOO_MUCH_PARAMS: {code: 7006, message: 'Too much parameters'},
  REQUIRE_STUDENT_NAME: {code: 7007, message: 'Required student name parameter'},
  REQUIRE_STUDENT_NAME_OR_ID: {code: 7008, message: 'Required student name or id parameter'},
  REQUIRE_STUDENT_ID: {code: 7009, message: 'Required student id parameter'},
  REQUIRE_STATUS: {code: 7010, message: 'Required status parameter'},
  REQUIRE_VALID_ATTENDANCE: {code: 7011, message: 'Attendance must be true or false'},
  REQUIRE_EVENT_TYPE: {code: 7012, message: 'Required event type parameter'},
  ILLEGAL_EVENT_TYPE: {code: 7013, message: 'Illegal event type parameter'},
  INVALID_EVENT_TYPE_FOR_PERMANENT_ABSENT_STUDENT: {code: 7014, message: 'Invalid event type for permanent absent student'},
  INVALID_PAGE_NUMBER: { code: 7015, message: 'Invalid page number' },
  INVALID_PAGE_SIZE: { code: 7016, message: 'Invalid page size' },
  INVALID_SORT_ORDER: { code: 7017, message: 'Sort order must be \'asc\' or \'desc\'' },
  REQUIRE_STUDENTS_ARRAY: { code: 7018, message: 'Students array is required' },
  REQUIRE_EVENTS_ARRAY: { code: 7019, message: 'Events array is required' },
};