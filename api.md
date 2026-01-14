# EduTrackly API 文档

## 概述

### 用户角色

| 角色 | 说明 |
|------|------|
| `superadmin` | 超级管理员，拥有所有权限 |
| `admin` | 普通管理员，只能操作分配的班级 |
| 访客 | 未登录用户，只能访问公开接口 |

### 认证方式

- 使用 JWT Bearer Token 认证
- Header 格式：`Authorization: Bearer <access_token>`

### 通用响应格式

```json
{
  "code": 0,           // 0 表示成功，其他为错误码
  "message": "string", // 说明信息
  "data": {},          // 返回数据（可选）
  "pagination": {},    // 分页信息（列表接口）
  "timestamp": 123456  // 时间戳
}
```

### 分页对象

```json
{
  "page": 1,        // 当前页
  "size": 20,       // 每页大小
  "total": 100,     // 总记录数
  "pages": 5        // 总页数
}
```

---

## 1. Auth 模块（认证）

### POST /auth - 登录

| 权限要求 | 无需认证 |
|---------|---------|

**请求 Body**

```json
{
  "password": "string"  // 必填，密码（用于识别管理员账户）
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Login successful",
  "data": {
    "aid": 1,
    "role": "superadmin",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600,
    "last_login_time": 1234567890,
    "last_login_ip": "192.168.1.1"
  },
  "timestamp": 1234567890
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 400 | 1004 | Password is required |
| 401 | 1002 | Login failed |

---

## 2. Admin 模块（管理员管理）

### GET /admin/me - 获取当前管理员信息

| 权限要求 | superadmin / admin |
|---------|-------------------|

**请求参数**：无

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "aid": 1,
    "role": "admin",
    "time": "2025-01-01T00:00:00Z",
    "ip": "192.168.1.1",
    "classes": [
      {
        "cid": 1,
        "class_name": "Class1",
        "create_time": "2025-01-01T00:00:00Z",
        "assigned_at": "2025-01-01T00:00:00Z"
      }
    ]
  },
  "timestamp": 1234567890
}
```

**不同角色返回差异**

| 字段 | superadmin | admin |
|------|------------|-------|
| classes | `null` | 分配的班级数组 |

---

### PUT /admin/password - 修改密码

| 权限要求 | superadmin / admin |
|---------|-------------------|

**请求 Body**

```json
{
  "old_password": "string",  // 必填，当前密码
  "new_password": "string"   // 必填，新密码
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Password changed successfully",
  "timestamp": 1234567890
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 400 | 5009 | Old password is incorrect |
| 400 | 5010 | New password cannot be the same as old password |
| 401 | - | Unauthorized |

---

### POST /admin/create - 创建管理员

| 权限要求 | 仅 superadmin |
|---------|--------------|

**请求 Body**

```json
{
  "password": "string",  // 必填，至少8位
  "role": "admin"        // 可选，枚举: superadmin/admin，默认 admin
}
```

**成功响应 (201)**

```json
{
  "code": 0,
  "message": "Admin created successfully",
  "data": {
    "aid": 2,
    "role": "admin",
    "time": "2025-01-01T00:00:00Z",
    "ip": "192.168.1.1"
  },
  "timestamp": 1234567890
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 400 | - | Invalid request |
| 403 | 1011 | This action requires superadmin privileges |

---

### GET /admin/get - 获取指定管理员

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aid | integer | 是 | 管理员ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "aid": 2,
    "role": "admin",
    "time": "2025-01-01T00:00:00Z",
    "ip": "192.168.1.1",
    "classes": [...]
  },
  "timestamp": 1234567890
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 403 | 1011 | This action requires superadmin privileges |
| 404 | 5001 | Admin not found |

---

### GET /admin/list - 管理员列表

| 权限要求 | 仅 superadmin |
|---------|--------------|

**请求 Body**

```json
{
  "page": 1,           // 可选，默认 1
  "size": 20,          // 可选，默认 20
  "role": "admin"      // 可选，筛选角色: superadmin/admin
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": [
    {
      "aid": 1,
      "role": "superadmin",
      "time": "2025-01-01T00:00:00Z",
      "ip": "192.168.1.1"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": 1234567890
}
```

---

### PUT /admin/update - 更新管理员

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aid | integer | 是 | 管理员ID |

**请求 Body**

```json
{
  "password": "string",  // 可选，至少8位
  "role": "admin"        // 可选，枚举: superadmin/admin
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Admin updated successfully",
  "data": {
    "aid": 2,
    "role": "admin",
    "time": "2025-01-01T00:00:00Z",
    "ip": "192.168.1.1"
  },
  "timestamp": 1234567890
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 400 | 5005 | Cannot demote your own account |
| 403 | 1011 | This action requires superadmin privileges |
| 404 | 5001 | Admin not found |

---

### DELETE /admin/delete - 删除管理员

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aid | integer | 是 | 管理员ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Admin deleted successfully",
  "timestamp": 1234567890
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 400 | 5004 | Cannot delete your own account |
| 403 | 1011 | This action requires superadmin privileges |
| 404 | 5001 | Admin not found |

---

## 3. Admin Class 模块（管理员-班级分配）

### POST /admin/class/assign - 分配班级给管理员

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aid | integer | 是 | 管理员ID |
| cid | integer | 是 | 班级ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Class assigned successfully",
  "data": {
    "aid": 2,
    "cid": 1,
    "created_at": "2025-01-01T00:00:00Z"
  },
  "timestamp": 1234567890
}
```

---

### DELETE /admin/class/remove - 移除管理员的班级

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aid | integer | 是 | 管理员ID |
| cid | integer | 是 | 班级ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Class removed successfully",
  "timestamp": 1234567890
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 404 | 5008 | Assignment not found |

---

### GET /admin/class/list - 获取管理员的班级列表

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aid | integer | 是 | 管理员ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": [
    {
      "cid": 1,
      "class_name": "Class1",
      "create_time": "2025-01-01T00:00:00Z",
      "assigned_at": "2025-01-01T00:00:00Z"
    }
  ],
  "timestamp": 1234567890
}
```

---

### PUT /admin/class/replace - 替换管理员的所有班级

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| aid | integer | 是 | 管理员ID |

**请求 Body**

```json
{
  "cids": [1, 2, 3]  // 必填，班级ID数组
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Classes replaced successfully",
  "data": {
    "success": true,
    "assignedClasses": 3
  },
  "timestamp": 1234567890
}
```

---

## 4. Admin Rate Limit 模块（速率限制配置）

### GET /admin/rate-limit/list - 获取所有速率限制配置

| 权限要求 | 仅 superadmin |
|---------|--------------|

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": [
    {
      "key": "read",
      "window_ms": 60000,
      "max_requests": 100,
      "description": "Read operations rate limit",
      "enabled": true,
      "is_default": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "timestamp": 1234567890
}
```

---

### GET /admin/rate-limit/get - 获取单个配置

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 配置key |

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 400 | 4000 | Config key is required |
| 404 | 4004 | Rate limit config not found |

---

### POST /admin/rate-limit/create - 创建配置

| 权限要求 | 仅 superadmin |
|---------|--------------|

**请求 Body**

```json
{
  "key": "custom_api",      // 必填，配置唯一标识
  "window_ms": 60000,       // 可选，时间窗口（ms），最小1000
  "max_requests": 50,       // 可选，最大请求数，最小1
  "description": "string",  // 可选，配置描述
  "enabled": true           // 可选，是否启用，默认true
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 409 | 4009 | Rate limit config with this key already exists |

---

### PUT /admin/rate-limit/update - 更新配置

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 配置key |

**请求 Body**

```json
{
  "window_ms": 60000,       // 可选
  "max_requests": 100,      // 可选
  "description": "string",  // 可选
  "enabled": true           // 可选
}
```

---

### DELETE /admin/rate-limit/delete - 删除配置

| 权限要求 | 仅 superadmin |
|---------|--------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 配置key |

> 注意：不能删除默认配置（is_default: true）

---

## 5. Homework 模块（作业管理）

### GET /homework/get - 获取作业

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | integer | 否 | 8位日期如 20250823，默认今日 |
| cid | integer | 否 | 班级ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "cid": 1,
    "class_name": "Class1",
    "homework_content": {
      "chinese": "语文作业内容",
      "maths": "数学作业内容",
      "english": "英语作业内容",
      "physics": "物理作业内容",
      "chemistry": "化学作业内容",
      "biology": "生物作业内容",
      "history": "历史作业内容",
      "geography": "地理作业内容",
      "politics": "政治作业内容",
      "others": "其他作业内容"
    },
    "due_date": 20250823
  },
  "timestamp": 1234567890
}
```

---

### GET /homework/list - 获取作业列表

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 否 | 班级ID |
| startDate | integer | 否 | 起始日期 |
| endDate | integer | 否 | 结束日期 |
| order | string | 否 | 排序: desc / incs |

**请求 Body**

```json
{
  "page": 1,    // 可选
  "size": 20    // 必填
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": [
    {
      "cid": 1,
      "class_name": "Class1",
      "homework_content": {...},
      "due_date": 20250823
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": 1234567890
}
```

---

### POST /homework/post - 创建作业

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**请求 Body**

```json
{
  "cid": 1,                    // 必填，班级ID
  "homework_content": {        // 必填
    "chinese": "string",
    "maths": "string",
    "english": "string",
    "physics": "string",
    "chemistry": "string",
    "biology": "string",
    "history": "string",
    "geography": "string",
    "politics": "string",
    "others": "string"
  },
  "due_date": 20250823         // 必填，8位日期
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "timestamp": 1234567890
}
```

---

### DELETE /homework/delete - 删除作业

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 是 | 班级ID |
| date | integer | 否 | 日期 |

**权限说明**

| 角色 | 可操作范围 |
|------|-----------|
| superadmin | 所有班级 |
| admin | 仅分配的班级 |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "timestamp": 1234567890
}
```

---

## 6. Class 模块（班级管理）

### POST /class/create - 创建班级

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| class_name | string | 否 | 班级名称 |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "cid": 1,
    "class_name": "Class1",
    "create_time": 1234567890
  },
  "timestamp": 1234567890
}
```

---

### GET /class/get - 获取班级

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 否 | 班级ID |
| class_name | string | 否 | 班级名称 |

> 注意：cid 和 class_name 二选一

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "cid": 1,
    "class_name": "Class1",
    "create_time": 1234567890,
    "students": [
      {
        "sid": 1,
        "student_name": "Alice",
        "attendance": true
      }
    ]
  },
  "timestamp": 1234567890
}
```

---

### GET /class/list - 获取班级列表

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| order | string | 否 | 排序: acs / desc |

**请求 Body**

```json
{
  "page": 1,   // 必填
  "size": 20   // 必填
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": [
    {
      "cid": 1,
      "class_name": "Class1",
      "create_time": 1234567890
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": 1234567890
}
```

---

### DELETE /class/delete - 删除班级

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 否 | 班级ID |
| class_name | string | 否 | 班级名称 |

> 注意：cid 和 class_name 二选一

---

## 7. Student 模块（学生管理）

### POST /student/add - 添加学生

| 权限要求 | superadmin / admin |
|---------|-------------------|

**请求 Body**

```json
[
  {
    "cid": 1,                  // 必填，班级ID
    "student_name": "Alice",   // 必填，学生姓名
    "attendance": true         // 必填，出勤状态
  }
]
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "timestamp": 1234567890
}
```

---

### GET /student/get - 获取学生信息

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sid | integer | 否 | 学生ID |
| student_name | string | 否 | 学生姓名 |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "sid": 1,
    "cid": 1,
    "student_name": "Alice",
    "attendance": true,
    "event": [
      {
        "event_date": 20250823,
        "event_type": "sick"
      }
    ]
  },
  "timestamp": 1234567890
}
```

---

### GET /student/list - 获取学生列表

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 否 | 班级ID |

**请求 Body**

```json
{
  "page": 1,   // 必填
  "size": 20   // 必填
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": [
    {
      "sid": 1,
      "cid": 1,
      "student_name": "Alice",
      "attendance": true
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": 1234567890
}
```

---

### PUT /student/attendance-change - 更改出席情况

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sid | integer | 是 | 学生ID |
| attendance | boolean | 是 | 出席状态 |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "timestamp": 1234567890
}
```

---

### DELETE /student/delete - 删除学生

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sid | integer | 是 | 学生ID |

---

### PUT /student/event - 提交历史事件（当日）

| 权限要求 | superadmin / admin |
|---------|-------------------|

**请求 Body**

```json
[
  {
    "sid": 1,              // 必填，学生ID
    "event_type": "sick"   // 必填，事件类型: official/personal/sick/temp
  }
]
```

**事件类型说明**

| 类型 | 说明 |
|------|------|
| official | 公假 |
| personal | 事假 |
| sick | 病假 |
| temp | 临时请假 |

---

### PUT /student/event/{date} - 提交指定日期历史事件

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Path 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | integer | 是 | 8位日期 YYYYMMDD |

**请求 Body**

```json
[
  {
    "sid": 1,
    "event_type": "sick"
  }
]
```

---

## 8. Analysis 模块（数据分析）

### GET /analysis/basic - 基本情况

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 是 | 班级ID |
| date | integer | 否 | 日期，默认今日 |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "cid": 1,
    "class_name": "Class1",
    "expected_attend": 50,
    "actual_attend": 48,
    "event_list": [
      {
        "student_name": "Alice",
        "event_type": "sick"
      }
    ],
    "official_cnt": 0,
    "personal_cnt": 1,
    "sick_cnt": 1,
    "temp_cnt": 0
  },
  "timestamp": 1234567890
}
```

---

### GET /analysis/class - 获取班级分析

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 否 | 班级ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "cid": 1,
    "class_name": "Class1",
    "expected_attend": 50,
    "student_num": 50,
    "today_actual_attend": 48,
    "daily_attendance_rates": [
      {
        "date": 20250823,
        "attendance_rate": 0.96
      }
    ]
  },
  "timestamp": 1234567890
}
```

---

### GET /analysis/student - 获取学生分析

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sid | integer | 否 | 学生ID |
| startDate | integer | 否 | 起始日期 |
| endDate | integer | 否 | 结束日期 |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Get students analysis successfully",
  "data": {
    "sid": 2,
    "student_name": "Bob",
    "attendance": false,
    "event_time": {
      "official_cnt": 0,
      "personal_cnt": 0,
      "sick_cnt": 0,
      "temp_cnt": 3
    },
    "event_list": {
      "official_list": [],
      "personal_list": [],
      "sick_list": [],
      "temp_list": [20250825, 20250920, 20251001]
    }
  },
  "timestamp": 1759292013667
}
```

---

## 9. System 模块（系统信息）

### GET /system - 系统信息

| 权限要求 | superadmin / admin |
|---------|-------------------|

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "System info retrieved successfully",
  "data": {
    "cpu": [
      {
        "model": "AMD Ryzen 9 6900HS with Radeon Graphics",
        "speed": 3294,
        "usage_percent": "17.49"
      }
    ],
    "memory": {
      "total": 33550630912,
      "free": 6899228672,
      "usage_percent": "79.44"
    },
    "load": [0.32, 0.26, 0.18],
    "disk": [
      {
        "filesystem": "C",
        "size": 274804838400,
        "used": 270273372160,
        "free": 4531466240,
        "used_percent": 98,
        "mount": "C:\\"
      }
    ],
    "network": [
      {
        "interface": "WLAN",
        "addresses": [
          {
            "family": "IPv4",
            "address": "192.168.1.5",
            "mac": "d8:80:83:cf:af:a9",
            "internal": false
          }
        ]
      }
    ],
    "os": {
      "type": "Windows_NT",
      "platform": "win32",
      "release": "10.0.22631",
      "arch": "x64",
      "uptime": 123456,
      "hostname": "PC-001"
    }
  },
  "timestamp": 1756462514292
}
```

---

## 10. Countdown 模块（倒计时管理）

### POST /countdown/create - 创建倒计时

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**请求 Body**

```json
{
  "cid": 1,              // 必填，班级ID
  "content": "期末考试",  // 必填，倒计时内容
  "deadline": 20251231   // 必填，截止日期（8位）
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Create countdown successfully",
  "data": {
    "cdid": 1,
    "cid": 1,
    "content": "期末考试",
    "deadline": "20251231",
    "created_at": "2025-11-27T10:00:00.000Z"
  },
  "timestamp": 1234567890
}
```

---

### GET /countdown/get - 获取倒计时

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cdid | integer | 否 | 倒计时ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Countdown retrieved successfully",
  "data": {
    "cdid": 2,
    "cid": 1,
    "class_name": "Class1",
    "content": "英语演讲比赛",
    "deadline": "2025-12-19T16:00:00.000Z",
    "created_at": "2025-11-29T03:02:05.389Z"
  },
  "timestamp": 1764464911749
}
```

---

### GET /countdown/list - 获取倒计时列表

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 否 | 班级ID |
| deadline | integer | 否 | 截止日期 |
| order | string | 否 | 排序: asc / desc |

**请求 Body**

```json
{
  "page": 1,    // 可选
  "size": 20    // 必填
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Countdowns retrieved successfully",
  "data": [
    {
      "cdid": 1,
      "cid": 1,
      "class_name": "Class1",
      "content": "12月考",
      "deadline": "2025-12-14T16:00:00.000Z",
      "created_at": "2025-11-29T03:02:05.389Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 5,
    "pages": 1
  },
  "timestamp": 1764465674570
}
```

---

### PUT /countdown/update - 修改倒计时

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cdid | integer | 否 | 倒计时ID |

**请求 Body**

```json
{
  "content": "期末考试倒计时-new",  // 必填
  "deadline": "20251231"           // 必填
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Countdown updated successfully",
  "data": {
    "cdid": 1,
    "cid": 1,
    "content": "期末考试倒计时-new",
    "deadline": "2025-12-30T16:00:00.000Z",
    "created_at": "2025-11-29T03:02:05.389Z"
  },
  "timestamp": 1764466029780
}
```

---

### DELETE /countdown/delete - 删除倒计时

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cdid | integer | 否 | 倒计时ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Countdown deleted successfully",
  "timestamp": 1764466239930
}
```

---

## 11. Slogan 模块（标语管理）

### POST /slogan/create - 创建标语

| 权限要求 | superadmin / admin |
|---------|-------------------|

**请求 Body**

```json
{
  "cid": 1,                       // 必填，班级ID
  "content": "好好学习，天天向上"   // 必填，标语内容
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Slogan created successfully",
  "data": {
    "slid": 1,
    "cid": 1,
    "content": "好好学习，天天向上",
    "created_at": "2025-11-27T10:00:00.000Z"
  },
  "timestamp": 1764464911749
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 400 | - | 参数错误 |
| 404 | 4001 | Class not found |

---

### GET /slogan/get - 获取标语

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| slid | integer | 是 | 标语ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Slogan retrieved successfully",
  "data": {
    "slid": 1,
    "cid": 1,
    "class_name": "Class1",
    "content": "好好学习，天天向上",
    "created_at": "2025-11-27T10:00:00.000Z"
  },
  "timestamp": 1764464911749
}
```

**错误响应**

| 状态码 | code | message |
|--------|------|---------|
| 400 | - | 缺少参数 |
| 404 | 6101 | Slogan not found |

---

### GET /slogan/list - 获取标语列表

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 否 | 班级ID |
| order | string | 否 | 排序: asc / desc |

**请求 Body**

```json
{
  "page": 1,    // 可选，默认 1
  "size": 20    // 可选，默认 20
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Slogans retrieved successfully",
  "data": [
    {
      "slid": 1,
      "cid": 1,
      "class_name": "Class1",
      "content": "好好学习，天天向上",
      "created_at": "2025-11-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 2,
    "pages": 1
  },
  "timestamp": 1764464911749
}
```

---

### PUT /slogan/update - 修改标语

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| slid | integer | 是 | 标语ID |

**请求 Body**

```json
{
  "content": "勤奋学习，勇攀高峰"  // 必填
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Slogan updated successfully",
  "data": {
    "slid": 1,
    "cid": 1,
    "content": "勤奋学习，勇攀高峰",
    "created_at": "2025-11-27T10:00:00.000Z"
  },
  "timestamp": 1764464911749
}
```

---

### DELETE /slogan/delete - 删除标语

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| slid | integer | 是 | 标语ID |

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Slogan deleted successfully",
  "timestamp": 1764464911749
}
```

---

## 12. Setting 模块（设置管理）

### GET /setting/get - 获取设置

| 权限要求 | 无需认证（公开） |
|---------|----------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 否 | 班级ID |

---

### PUT /setting/update - 修改设置

| 权限要求 | superadmin / admin |
|---------|-------------------|

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cid | integer | 是 | 班级ID |

**请求 Body**

```json
{
  "is_countdown_display": true,  // 必填，是否显示倒计时
  "is_slogan_display": false     // 必填，是否显示标语
}
```

**成功响应 (200)**

```json
{
  "code": 0,
  "message": "Setting updated successfully",
  "data": {
    "cid": 1,
    "is_countdown_display": true,
    "is_slogan_display": false,
    "created_at": "2025-11-29T19:09:37.614Z",
    "updated_at": "2025-11-29T20:25:38.649Z"
  },
  "timestamp": 1764476738394
}
```

---

## 权限总结表

| 接口 | 访客 | admin | superadmin |
|------|:----:|:-----:|:----------:|
| **Auth** |
| POST /auth | ✓ | ✓ | ✓ |
| **Admin** |
| GET /admin/me | ✗ | ✓ | ✓ |
| PUT /admin/password | ✗ | ✓ | ✓ |
| POST /admin/create | ✗ | ✗ | ✓ |
| GET /admin/get | ✗ | ✗ | ✓ |
| GET /admin/list | ✗ | ✗ | ✓ |
| PUT /admin/update | ✗ | ✗ | ✓ |
| DELETE /admin/delete | ✗ | ✗ | ✓ |
| **Admin Class** |
| POST /admin/class/assign | ✗ | ✗ | ✓ |
| DELETE /admin/class/remove | ✗ | ✗ | ✓ |
| GET /admin/class/list | ✗ | ✗ | ✓ |
| PUT /admin/class/replace | ✗ | ✗ | ✓ |
| **Rate Limit** |
| GET /admin/rate-limit/list | ✗ | ✗ | ✓ |
| GET /admin/rate-limit/get | ✗ | ✗ | ✓ |
| POST /admin/rate-limit/create | ✗ | ✗ | ✓ |
| PUT /admin/rate-limit/update | ✗ | ✗ | ✓ |
| DELETE /admin/rate-limit/delete | ✗ | ✗ | ✓ |
| **Homework** |
| GET /homework/get | ✓ | ✓ | ✓ |
| GET /homework/list | ✓ | ✓ | ✓ |
| POST /homework/post | ✓ | ✓ | ✓ |
| DELETE /homework/delete | ✗ | ✓* | ✓ |
| **Class** |
| POST /class/create | ✗ | ✓ | ✓ |
| GET /class/get | ✓ | ✓ | ✓ |
| GET /class/list | ✓ | ✓ | ✓ |
| DELETE /class/delete | ✗ | ✓* | ✓ |
| **Student** |
| POST /student/add | ✗ | ✓ | ✓ |
| GET /student/get | ✓ | ✓ | ✓ |
| GET /student/list | ✓ | ✓ | ✓ |
| PUT /student/attendance-change | ✗ | ✓ | ✓ |
| DELETE /student/delete | ✗ | ✓ | ✓ |
| PUT /student/event | ✗ | ✓ | ✓ |
| PUT /student/event/{date} | ✗ | ✓ | ✓ |
| **Analysis** |
| GET /analysis/basic | ✓ | ✓ | ✓ |
| GET /analysis/class | ✗ | ✓ | ✓ |
| GET /analysis/student | ✗ | ✓ | ✓ |
| **System** |
| GET /system | ✗ | ✓ | ✓ |
| **Countdown** |
| POST /countdown/create | ✓ | ✓ | ✓ |
| GET /countdown/get | ✓ | ✓ | ✓ |
| GET /countdown/list | ✓ | ✓ | ✓ |
| PUT /countdown/update | ✓ | ✓ | ✓ |
| DELETE /countdown/delete | ✓ | ✓ | ✓ |
| **Slogan** |
| POST /slogan/create | ✗ | ✓ | ✓ |
| GET /slogan/get | ✓ | ✓ | ✓ |
| GET /slogan/list | ✓ | ✓ | ✓ |
| PUT /slogan/update | ✗ | ✓ | ✓ |
| DELETE /slogan/delete | ✗ | ✓ | ✓ |
| **Setting** |
| GET /setting/get | ✓ | ✓ | ✓ |
| PUT /setting/update | ✗ | ✓ | ✓ |

> **说明**:
> - `✓` 表示有权限
> - `✗` 表示无权限
> - `*` 表示 admin 只能操作分配给自己的班级
