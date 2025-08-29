---
title: EduTrackly
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# EduTrackly

Base URLs:

# Authentication

- HTTP Authentication, scheme: bearer

# Default

## GET 系统信息

GET /system

> 返回示例

> 200 Response

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
    "load": [
      0.32,
      0.26,
      0.18
    ],
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
            "family": null,
            "address": null,
            "mac": null,
            "internal": null
          }
        ]
      }
    ]
  },
  "timestamp": 1756462514292
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» cpu|[object]|true|none||none|
|»»» model|string|true|none||none|
|»»» speed|integer|true|none||none|
|»»» usage_percent|string|true|none||none|
|»» memory|object|true|none||none|
|»»» total|integer|true|none||none|
|»»» free|integer|true|none||none|
|»»» usage_percent|string|true|none||none|
|»» load|any|true|none||none|

*oneOf*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»» *anonymous*|[number]|false|none||none|

*xor*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»» *anonymous*|null|false|none||none|

*continued*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»» disk|[object]|true|none||none|
|»»» filesystem|string|true|none||none|
|»»» size|integer|true|none||none|
|»»» used|integer|true|none||none|
|»»» free|integer|true|none||none|
|»»» used_percent|integer|true|none||none|
|»»» mount|string|true|none||none|
|»» network|[object]|true|none||none|
|»»» interface|string|true|none||none|
|»»» addresses|[object]|true|none||none|
|»»»» family|string|true|none||none|
|»»»» address|string|true|none||none|
|»»»» mac|string|true|none||none|
|»»»» internal|boolean|true|none||none|
|» timestamp|integer|true|none||none|

# auth

## POST 管理员登录

POST /auth

管理员登录

> Body 请求参数

```json
{
  "password": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» password|body|string| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "aid": 0,
    "access_token": "string",
    "expires_in": 0,
    "last_login_time": 0,
    "last_login_ip": "string"
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» data|object|true|none||none|
|»» aid|integer|true|none||管理员ID|
|»» access_token|string|true|none||jwt|
|»» expires_in|integer|true|none||expiration|
|»» last_login_time|integer|true|none||上次登录时间|
|»» last_login_ip|string|true|none||上次登录ip|
|» timestamp|integer|true|none||时间|

# homework

## GET 获取作业

GET /homework/get

获取指定日期作业，日期可选，默认今日

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|date|query|integer| 否 |8位日期|
|cid|query|integer| 否 |班级|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "cid": 0,
    "class_name": "string",
    "homework_content": "string",
    "due_date": 0
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» data|object|true|none||none|
|»» cid|integer|true|none||班级ID|
|»» class_name|string|true|none||班级名称|
|»» homework_content|string|true|none||作业内容|
|»» due_date|integer|true|none||作业日期 8 位数字|
|» timestamp|integer|true|none||时间|

## GET 获取作业列表

GET /homework/list

获取作业列表，支持分页；
可以按cid、起止日期筛选
支持 increase 和 decrease

> Body 请求参数

```json
{
  "page": 0,
  "size": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 否 |none|
|startDate|query|integer| 否 |none|
|endDate|query|integer| 否 |none|
|order|query|string| 否 |none|
|body|body|object| 否 |none|
|» page|body|integer| 否 |none|
|» size|body|integer| 是 |none|

#### 枚举值

|属性|值|
|---|---|
|order|desc|
|order|incs|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "cid": 0,
      "class_name": "string",
      "homework_content": "string",
      "due_date": 0
    }
  ],
  "pagination": {
    "page": 0,
    "size": 0,
    "total": 0,
    "pages": 0
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» data|[object]|true|none||none|
|»» cid|integer|true|none||班级ID|
|»» class_name|string|true|none||班级名称|
|»» homework_content|string|true|none||作业内容|
|»» due_date|integer|true|none||作业日期|
|» pagination|object|true|none||none|
|»» page|integer|true|none||当前页|
|»» size|integer|true|none||当前页大小|
|»» total|integer|true|none||总数据数|
|»» pages|integer|true|none||总页数|
|» timestamp|integer|true|none||时间|

## POST 创建作业

POST /homework/post

> Body 请求参数

```json
{
  "cid": 0,
  "homework_content": "string",
  "due_date": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|object| 否 |none|
|» cid|body|integer| 是 |none|
|» homework_content|body|string| 是 |none|
|» due_date|body|integer| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||信息|
|» timestamp|integer|true|none||none|

## DELETE 删除作业

DELETE /homework/delete

删除作业
需管理员权限
传入 cid 和 date

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 是 |班级|
|date|query|integer| 否 |日期|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» timestamp|integer|true|none||none|

# class

## POST 创建班级

POST /class/create

创建班级 admin 权限 classname 需要

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|class_name|query|string| 否 |class name|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "cid": 0,
    "class_name": "string",
    "create_time": 0
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» data|object|true|none||none|
|»» cid|integer|true|none||class id|
|»» class_name|string|true|none||class name|
|»» create_time|integer|true|none||create time|
|» timestamp|integer|true|none||none|

## GET 获取班级

GET /class/get

获取班级 cid 或 class_name

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 否 |班级id|
|class_name|query|string| 否 |班级名称|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "cid": 0,
    "class_name": "string",
    "create_time": 0,
    "students": [
      {
        "sid": 0,
        "student_name": "string",
        "attendance": true
      }
    ]
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» data|object|true|none||none|
|»» cid|integer|true|none||班级ID|
|»» class_name|string|true|none||班级名称|
|»» create_time|integer|true|none||创建时间|
|»» students|[object]|true|none||none|
|»»» sid|integer|true|none||none|
|»»» student_name|string|true|none||none|
|»»» attendance|boolean|true|none||none|
|» timestamp|integer|true|none||时间|

## GET 获取班级列表

GET /class/list

获取班级列表 
param order enum acs desc
body page size

> Body 请求参数

```json
{
  "page": 0,
  "size": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|order|query|string| 否 |none|
|body|body|object| 否 |none|
|» page|body|integer| 是 |none|
|» size|body|integer| 是 |none|

#### 枚举值

|属性|值|
|---|---|
|order|acs|
|order|desc|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "cid": 0,
      "class_name": "string",
      "create_time": 0
    }
  ],
  "pagination": {
    "page": 0,
    "size": 0,
    "total": 0,
    "pages": 0
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» data|[object]|true|none||none|
|»» cid|integer|true|none||班级ID|
|»» class_name|string|true|none||班级名称|
|»» create_time|integer|true|none||创建时间|
|» pagination|object|true|none||none|
|»» page|integer|true|none||当前页|
|»» size|integer|true|none||当前页大小|
|»» total|integer|true|none||总数据数|
|»» pages|integer|true|none||总页数|
|» timestamp|integer|true|none||时间|

## DELETE 删除班级

DELETE /class/delete

删除班级
提供 cid 或 class_name

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 否 |none|
|class_name|query|string| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» timestamp|integer|true|none||none|

# student

## POST 添加学生

POST /student/add

添加学生

> Body 请求参数

```json
[
  {
    "student_name": "string",
    "attendance": true
  }
]
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 否 |班级 id|
|body|body|array[object]| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» timestamp|integer|true|none||none|

## GET 获取学生信息

GET /student/get

获取学生列表
sid 或 studnet name

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|sid|query|integer| 否 |none|
|student_name|query|string| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "sid": 0,
    "cid": 0,
    "student_name": "string",
    "attendance": true,
    "event": [
      {
        "event_date": 0,
        "event_type": "string"
      }
    ]
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» data|object|true|none||none|
|»» sid|integer|true|none||学生ID|
|»» cid|integer|true|none||班级ID|
|»» student_name|string|true|none||学生名称|
|»» attendance|boolean|true|none||none|
|»» event|[object]|true|none||none|
|»»» event_date|integer|true|none||none|
|»»» event_type|string|true|none||none|
|» timestamp|integer|true|none||时间|

## GET 获取学生列表

GET /student/list

param cid option

> Body 请求参数

```json
{
  "page": 0,
  "size": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 否 |班级id|
|body|body|object| 否 |none|
|» page|body|integer| 是 |none|
|» size|body|integer| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": [
    {
      "cid": 0,
      "sid": 0,
      "student_name": "string",
      "attendance": true
    }
  ],
  "pagination": {
    "page": 0,
    "size": 0,
    "total": 0,
    "pages": 0
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||状态|
|» message|string|true|none||说明|
|» data|[object]|true|none||none|
|»» cid|integer|true|none||班级ID|
|»» sid|integer|true|none||none|
|»» student_name|string|true|none||班级名称|
|»» attendance|boolean|true|none||创建时间|
|» pagination|object|true|none||none|
|»» page|integer|true|none||当前页|
|»» size|integer|true|none||当前页大小|
|»» total|integer|true|none||总数据数|
|»» pages|integer|true|none||总页数|
|» timestamp|integer|true|none||时间|

## PUT 更改出席情况

PUT /studnet/attendance-change

更改attendance

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|sid|query|integer| 是 |none|
|attendance|query|boolean| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» timestamp|integer|true|none||none|

## DELETE 删除学生

DELETE /student/delete

param sid
删除学生

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|sid|query|integer| 是 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» timestamp|integer|true|none||none|

## PUT 提交今日事件

PUT /student/event

> Body 请求参数

```json
[
  {
    "sid": 0,
    "event_type": "string"
  }
]
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|array[object]| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» timestamp|integer|true|none||none|

# analysis

## GET 基本情况

GET /analysis/basic

获取今日情况 
param cid date ( date is option )

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 否 |none|
|date|query|integer| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "cid": 0,
    "class_name": "string",
    "expected_attend": 0,
    "actual_attend": 0,
    "event_list": [
      {
        "student_name": "string",
        "event_type": "string"
      }
    ],
    "official_cnt": 0,
    "personal_cnt": 0,
    "sick_cnt": 0,
    "temp_cnt": 0
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» cid|integer|true|none||none|
|»» class_name|string|true|none||none|
|»» expected_attend|integer|true|none||none|
|»» actual_attend|integer|true|none||none|
|»» event_list|[object]¦null|true|none||none|
|»»» student_name|string|true|none||none|
|»»» event_type|string|true|none||none|
|»» official_cnt|integer|false|none||none|
|»» personal_cnt|integer|false|none||none|
|»» sick_cnt|integer|false|none||none|
|»» temp_cnt|integer|false|none||none|
|» timestamp|integer|true|none||none|

## GET 获取班级

GET /analysis/class

获取班级情况
param class

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "data": {
    "cid": 0,
    "class_name": "string",
    "expected_attend": 0,
    "student_num": 0,
    "attend_student": [
      {
        "sid": 0,
        "student_name": "string"
      }
    ],
    "absent_student": [
      {
        "sid": 0,
        "student_name": "string"
      }
    ],
    "today_attend": [
      {
        "sid": 0,
        "student_name": "string"
      }
    ],
    "today_absent": [
      {
        "sid": 0,
        "student_name": "string",
        "event_type": "string"
      }
    ],
    "today_temp": [
      {
        "sid": 0,
        "student_name": "string"
      }
    ]
  },
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» cid|integer|true|none||none|
|»» class_name|string|true|none||none|
|»» expected_attend|integer|true|none||none|
|»» student_num|integer|true|none||none|
|»» attend_student|[object]|true|none||none|
|»»» sid|integer|true|none||none|
|»»» student_name|string|true|none||none|
|»» absent_student|[object]|true|none||none|
|»»» sid|integer|true|none||none|
|»»» student_name|string|true|none||none|
|»» today_attend|[object]|true|none||none|
|»»» sid|integer|true|none||none|
|»»» student_name|string|true|none||none|
|»» today_absent|[object]|true|none||none|
|»»» sid|integer|true|none||none|
|»»» student_name|string|true|none||none|
|»»» event_type|string|true|none||none|
|»» today_temp|[object]|true|none||none|
|»»» sid|integer|true|none||none|
|»»» student_name|string|true|none||none|
|» timestamp|integer|true|none||none|

## GET 获取学生信息

GET /analysis/student

获取学生信息
param cid startDate endDate

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|cid|query|integer| 否 |none|
|startDate|query|integer| 否 |none|
|endDate|query|integer| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 0,
  "message": "string",
  "students": [
    {
      "sid": 0,
      "student_name": "string",
      "attendance": true,
      "event_time": {
        "official_cnt": 0,
        "personal_cnt": 0,
        "sick_cnt": 0,
        "temp_cnt": 0
      },
      "event_list": {
        "official_list": [
          0
        ],
        "personal_list": [
          0
        ],
        "sick_list": [
          0
        ],
        "temp_list": [
          0
        ]
      }
    }
  ],
  "timestamp": 0
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» students|[object]|true|none||none|
|»» sid|integer|true|none||none|
|»» student_name|string|true|none||none|
|»» attendance|boolean|true|none||none|
|»» event_time|object|true|none||none|
|»»» official_cnt|integer|true|none||none|
|»»» personal_cnt|integer|true|none||none|
|»»» sick_cnt|integer|true|none||none|
|»»» temp_cnt|integer|true|none||none|
|»» event_list|object|true|none||none|
|»»» official_list|[integer]|true|none||none|
|»»» personal_list|[integer]|true|none||none|
|»»» sick_list|[integer]|true|none||none|
|»»» temp_list|[integer]|true|none||none|
|» timestamp|integer|true|none||none|

# 数据模型

<h2 id="tocS_Pet">Pet</h2>

<a id="schemapet"></a>
<a id="schema_Pet"></a>
<a id="tocSpet"></a>
<a id="tocspet"></a>

```json
{
  "id": 1,
  "category": {
    "id": 1,
    "name": "string"
  },
  "name": "doggie",
  "photoUrls": [
    "string"
  ],
  "tags": [
    {
      "id": 1,
      "name": "string"
    }
  ],
  "status": "available"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|true|none||宠物ID编号|
|category|[Category](#schemacategory)|true|none||分组|
|name|string|true|none||名称|
|photoUrls|[string]|true|none||照片URL|
|tags|[[Tag](#schematag)]|true|none||标签|
|status|string|true|none||宠物销售状态|

#### 枚举值

|属性|值|
|---|---|
|status|available|
|status|pending|
|status|sold|

<h2 id="tocS_Category">Category</h2>

<a id="schemacategory"></a>
<a id="schema_Category"></a>
<a id="tocScategory"></a>
<a id="tocscategory"></a>

```json
{
  "id": 1,
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||分组ID编号|
|name|string|false|none||分组名称|

<h2 id="tocS_Tag">Tag</h2>

<a id="schematag"></a>
<a id="schema_Tag"></a>
<a id="tocStag"></a>
<a id="tocstag"></a>

```json
{
  "id": 1,
  "name": "string"
}

```

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|id|integer(int64)|false|none||标签ID编号|
|name|string|false|none||标签名称|

