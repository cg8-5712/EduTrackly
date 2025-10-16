# 日志和错误处理系统文档

## 概述

本项目采用了全面的日志记录和错误处理系统，旨在解决以下问题：
- 避免日志中出现 `[object Object]`
- 提供详细、结构化的错误分类
- 统一的错误处理和日志格式
- 更好的错误追踪和调试能力

## 目录结构

```
src/
├── utils/
│   ├── errors/
│   │   └── AppError.js          # 自定义错误类
│   └── logging/
│       └── logUtils.js          # 日志工具函数
├── middleware/
│   ├── loggerMiddleware.js      # 日志中间件
│   └── error_handler.js         # 错误处理中间件
└── config/
    └── errorCodes.js            # 错误代码定义
```

## 1. 错误类系统

### 1.1 基础错误类 `AppError`

所有自定义错误都继承自 `AppError` 类：

```javascript
import { AppError } from '../utils/errors/AppError.js';

throw new AppError('Error message', 1001, 400, true, { detail: 'Additional info' });
```

参数说明：
- `message`: 错误信息
- `code`: 错误代码
- `statusCode`: HTTP 状态码（默认 500）
- `isOperational`: 是否为可操作错误（默认 true）
- `details`: 额外的错误详情

### 1.2 专用错误类

#### ValidationError - 验证错误
```javascript
import { ValidationError } from '../utils/errors/AppError.js';

throw new ValidationError('Invalid email format', 9002, { field: 'email' });
```

#### AuthenticationError - 认证错误
```javascript
import { AuthenticationError } from '../utils/errors/AppError.js';

throw new AuthenticationError('Invalid token', 1001);
```

#### DatabaseError - 数据库错误
```javascript
import { DatabaseError } from '../utils/errors/AppError.js';

throw new DatabaseError('Query failed', originalError, 9004);
```

#### BusinessError - 业务逻辑错误
```javascript
import { BusinessError } from '../utils/errors/AppError.js';

throw new BusinessError('Insufficient balance', 5001, { balance: 100, required: 200 });
```

#### NotFoundError - 资源未找到
```javascript
import { NotFoundError } from '../utils/errors/AppError.js';

throw new NotFoundError('User not found', 3001, { userId: 123 });
```

## 2. 日志记录最佳实践

### 2.1 避免 `[object Object]` 问题

**❌ 错误的做法：**
```javascript
// 这会导致 [object Object]
logger.error('Error occurred', { error });

// 这也会导致问题
logger.info('User data', JSON.stringify({ user }));
```

**✅ 正确的做法：**
```javascript
// 方式 1: 手动序列化错误对象
logger.error('Error occurred', {
    error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
    }
});

// 方式 2: 使用日志工具函数
import { serializeError } from '../utils/logging/logUtils.js';

logger.error('Error occurred', {
    error: serializeError(error)
});

// 方式 3: 直接传递简单对象
logger.info('User logged in', {
    userId: user.id,
    username: user.name,
    ip: req.ip
});
```

### 2.2 不同日志级别的使用

#### DEBUG - 调试信息
```javascript
logger.debug('Received request', {
    cid,
    date,
    params: req.params
});
```

#### INFO - 一般信息
```javascript
logger.info('User logged in successfully', {
    userId: user.id,
    ip: req.ip,
    timestamp: Date.now()
});
```

#### WARN - 警告信息
```javascript
logger.warn('Invalid request parameter', {
    parameter: 'cid',
    provided: undefined,
    expected: 'number'
});
```

#### ERROR - 错误信息
```javascript
logger.error('Database query failed', {
    error: {
        message: error.message,
        code: error.code,
        stack: error.stack
    },
    query: sql,
    params: queryParams
});
```

### 2.3 Controller 中的日志记录模式

```javascript
export async function createUser(req, res) {
    const { username, email } = req.body;

    // 1. 记录请求接收
    logger.debug('Create user request received', { username, email });

    try {
        // 2. 记录操作开始
        logger.info('Creating new user', { username });

        const user = await userService.createUser({ username, email });

        // 3. 记录成功结果
        logger.info('User created successfully', {
            userId: user.id,
            username
        });

        return res.json({ code: 0, data: user });

    } catch (error) {
        // 4. 记录错误详情
        logger.error('Failed to create user', {
            error: {
                message: error.message,
                name: error.name,
                code: error.code,
                stack: error.stack
            },
            username,
            email
        });

        // 5. 使用错误处理器
        handleControllerError(error, res, req);
    }
}
```

## 3. 错误处理

### 3.1 在 Controller 中处理错误

```javascript
import { handleControllerError } from '../middleware/error_handler.js';

export async function myController(req, res) {
    try {
        // 业务逻辑
        const result = await someService();
        return res.json({ code: 0, data: result });
    } catch (error) {
        // 使用统一的错误处理器
        handleControllerError(error, res, req);
    }
}
```

### 3.2 在 Service 中抛出错误

```javascript
import { BusinessError, NotFoundError } from '../utils/errors/AppError.js';
import * as ErrorCodes from '../config/errorCodes.js';

export async function getUserById(userId) {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (!user) {
        // 抛出 NotFoundError
        throw new NotFoundError('User not found', 3001, { userId });
    }

    if (!user.isActive) {
        // 抛出 BusinessError
        throw new BusinessError('User account is inactive', 3002, { userId });
    }

    return user;
}
```

### 3.3 使用现有错误代码

```javascript
import * as ErrorCodes from '../config/errorCodes.js';

// 直接返回错误代码对象
if (!password) {
    return res.status(400).json({
        ...ErrorCodes.AuthErrors.PASSWORD_REQUIRED,
        timestamp: Date.now()
    });
}
```

## 4. 错误分类和 HTTP 状态码

### 错误代码范围

- **1000-1999**: 认证和授权错误（401/403）
- **2000-2999**: 资源未找到错误（404）
- **3000-3999**: 资源未找到错误（404）
- **4000-4999**: 资源未找到错误（404）
- **7000-7999**: 参数验证错误（400）
- **8000-8999**: 格式错误（400）
- **9000-9999**: 系统错误（500）

### 自动错误映射

错误处理中间件会自动映射：
- **PostgreSQL 错误** → `DatabaseError`
- **JWT 错误** → `AuthenticationError`
- **业务错误**（带 code 和 message）→ `BusinessError`

## 5. 日志工具函数

### serializeError(error)
安全地序列化错误对象：
```javascript
import { serializeError } from '../utils/logging/logUtils.js';

const serialized = serializeError(error);
logger.error('Error occurred', { error: serialized });
```

### createLogContext(params)
创建日志上下文对象：
```javascript
import { createLogContext } from '../utils/logging/logUtils.js';

const context = createLogContext({
    userId: user.id,
    action: 'login',
    timestamp: Date.now()
});
logger.info('User action', context);
```

### formatRequestInfo(req)
格式化请求信息：
```javascript
import { formatRequestInfo } from '../utils/logging/logUtils.js';

const reqInfo = formatRequestInfo(req);
logger.info('Request received', reqInfo);
```

### sanitizeLogData(data)
清理敏感数据：
```javascript
import { sanitizeLogData } from '../utils/logging/logUtils.js';

const sanitized = sanitizeLogData({
    username: 'john',
    password: 'secret123',
    token: 'abc123'
});
// 结果: { username: 'john', password: '[REDACTED]', token: '[REDACTED]' }
```

## 6. 日志格式示例

### 请求日志
```
→ POST /api/auth/login
  type: "request"
  method: "POST"
  url: "/api/auth/login"
  ip: "::1"
  userAgent: "Mozilla/5.0..."
```

### 响应日志
```
← POST /api/auth/login 200 (45ms)
  type: "response"
  method: "POST"
  url: "/api/auth/login"
  status: 200
  durationMs: 45
  duration: "45ms"
  ip: "::1"
```

### 错误日志
```
⚠️  Client error occurred
  errorType: "ValidationError"
  isOperational: true
  error: {
    name: "ValidationError"
    message: "Invalid email format"
    code: 9002
    statusCode: 400
    details: { field: "email" }
    stack: "ValidationError: Invalid email format\n    at..."
  }
  method: "POST"
  url: "/api/users"
  ip: "::1"
```

## 7. 测试建议

### 测试错误处理
```javascript
describe('Error Handling', () => {
    it('should handle ValidationError correctly', async () => {
        const error = new ValidationError('Invalid input', 9002);
        expect(error.statusCode).toBe(400);
        expect(error.isOperational).toBe(true);
    });

    it('should serialize error without [object Object]', () => {
        const error = new Error('Test error');
        const serialized = serializeError(error);
        const json = JSON.stringify(serialized);
        expect(json).not.toContain('[object Object]');
    });
});
```

## 8. 生产环境注意事项

1. **敏感信息**: 生产环境会自动隐藏 500 错误的详细信息
2. **日志级别**: 生产环境默认使用 `info` 级别
3. **堆栈跟踪**: 生产环境不向客户端暴露堆栈信息
4. **性能**: 使用 pino 提供高性能日志记录

## 9. 迁移指南

### 从旧代码迁移

**旧代码：**
```javascript
catch (error) {
    logger.error('Error', { error });  // ❌ 会显示 [object Object]
    handleControllerError(error, res);  // ❌ 缺少 req 参数
}
```

**新代码：**
```javascript
catch (error) {
    logger.error('Error occurred', {
        error: {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack
        }
    });
    handleControllerError(error, res, req);  // ✅ 包含 req 参数
}
```

## 10. 常见问题

### Q: 为什么日志中还是出现 `[object Object]`？
A: 确保不要直接传递 Error 对象或复杂对象。使用 `serializeError()` 或手动提取需要的属性。

### Q: 什么时候应该使用 AppError 类？
A: 在 service 层抛出业务错误时使用。Controller 层主要负责捕获和处理错误。

### Q: 如何添加新的错误代码？
A: 在 `src/config/errorCodes.js` 中添加新的错误代码对象。

### Q: 日志太多怎么办？
A: 调整 LOG_LEVEL 环境变量：`LOG_LEVEL=warn` 或 `LOG_LEVEL=error`

## 总结

- ✅ 使用专用错误类来抛出错误
- ✅ 在日志中手动序列化错误对象
- ✅ 使用 `handleControllerError(error, res, req)` 处理错误
- ✅ 在 Controller 中记录详细的上下文信息
- ✅ 避免在日志中直接使用 `{ error }` 或 `JSON.stringify()`
- ✅ 使用适当的日志级别（debug, info, warn, error）
