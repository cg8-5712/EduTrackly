// 错误码统一管理
export const AuthErrors = {
    INVALID_TOKEN: { code: 1001, message: "Invalid or expired token" },
    LOGIN_FAILED: { code: 1002, message: "Login failed" },
    UNAUTHORIZED: { code: 1003, message: "Unauthorized access" },
};

export const HomeworkErrors = {
    NOT_FOUND: { code: 2001, message: "Homework not found" },
    CREATE_FAILED: { code: 2002, message: "Failed to create homework" }
};

export const StudentErrors = {
    NOT_FOUND: { code: 3001, message: "Student not found" },
    CREATE_FAILED: { code: 3002, message: "Failed to create student" },
};

export const ClassErrors = {
    NOT_FOUND: { code: 4001, message: "Class not found" },
    ALREADY_EXIST: { code: 4002, message: "Class name already exist" },
};

export const SystemErrors = {
    INTERNAL: { code: 9001, message: "Internal server error" },
    BAD_REQUEST: { code: 9002, message: "Bad request" },
};

export const FormatErrors = {
    NOT_YYYYMMDD_DATE: { code: 8001, message: "Date format must be YYYYMMDD" },
    NOT_YYYYMMDDHHMMSS_DATE: { code: 8002, message: "Date format must be YYYYMMDDHHMMSS" },
    DATE_ILLEGAL: { code: 8003, message: "Illegal date" },
}

export const ParamsErrors = {
    REQUIRE_CID: {code: 7001, message: "Required class id parameter"},
    REQUIRE_HOMEWORK_CONTENT: {code: 7002, message: "Required homework content parameter"},
    REQUIRE_DATE: {code: 7003, message: "Required due date parameter"},
    REQUIRE_CLASS_NAME: {code: 7004, message: "Required class name parameter"},
    REQUIRE_CLASS_NAME_OR_ID: {code: 7005, message: "Required class name or id parameter"},
    TOO_MUCH_PARAMS: { code: 7006, message: "Too much parameters" }
}