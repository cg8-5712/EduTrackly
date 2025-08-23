// 错误码统一管理
export const AuthErrors = {
    INVALID_TOKEN: { code: 1001, message: "Invalid or expired token" },
    LOGIN_FAILED: { code: 1002, message: "Login failed" },
    UNAUTHORIZED: { code: 1003, message: "Unauthorized access" },
};

export const HomeworkErrors = {
    NOT_FOUND: { code: 2001, message: "Homework not found" },
    CREATE_FAILED: { code: 2002, message: "Failed to create homework" },
};

export const StudentErrors = {
    NOT_FOUND: { code: 3001, message: "Student not found" },
    CREATE_FAILED: { code: 3002, message: "Failed to create student" },
};

export const SystemErrors = {
    INTERNAL: { code: 9001, message: "Internal server error" },
};
