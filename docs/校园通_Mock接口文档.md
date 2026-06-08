# 校园通——Mock 接口文档

## 一、接口设计说明

本项目为微信小程序课程大作业，数据层采用"本地 Mock 数据 + request.js 统一封装"方案。所有接口不需要真实后端服务器，由 `utils/request.js` 读取本地 `utils/*Data.js` 文件模拟 `wx.request` 的请求效果。

接口设计遵循 RESTful 风格，便于后续升级到微信云开发或真实后端 API 时平滑切换。

### 数据流转路径

```
页面/组件 → request.js（统一封装） → 本地 Mock 数据（utils/*Data.js）
                                    ↓（后续可切换）
                                    → wx.cloud 云数据库
                                    → wx.request 真实后端 API
```

## 二、request.js 统一请求封装说明

### 2.1 设计原则

- 所有页面通过 `request.js` 获取数据，不直接 require 数据文件
- 返回 Promise，模拟异步请求效果（setTimeout 200-300ms）
- 统一返回格式，便于页面统一处理
- 支持 loading 状态、错误处理、空数据判断
- 切换数据源时只改 `request.js`，不影响页面代码

### 2.2 使用方式

```
const request = require('../../utils/request.js')

// 页面中调用
request.getPlaceList().then(res => {
  if (res.code === 0) {
    this.setData({ places: res.data })
  }
})
```

## 三、统一返回格式

### 3.1 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 3.2 列表响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "total": 0
  }
}
```

### 3.3 错误响应

```json
{
  "code": 1001,
  "message": "错误描述信息",
  "data": null
}
```

## 四、错误码设计

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 0 | 请求成功 | 正常渲染数据 |
| 1001 | 参数错误 | Toast 提示"参数错误" |
| 1002 | 数据不存在 | 展示空状态组件 |
| 2001 | 未登录 | Toast 提示"请先登录"，跳转个人中心 |
| 2002 | 登录信息无效 | 清除缓存，提示重新登录 |
| 3001 | 收藏已存在 | Toast 提示"已收藏" |
| 3002 | 收藏不存在 | 忽略，刷新列表 |
| 5001 | 网络异常 | 读取本地缓存兜底，Toast 提示"网络异常" |
| 5002 | 请求超时 | 读取本地缓存兜底，Toast 提示"请求超时" |


## 五、接口清单表

| 序号 | 接口名称 | 请求路径 | 请求方式 | 对应页面 |
|------|----------|----------|----------|----------|
| 1 | 获取首页数据 | /api/home | GET | 首页 |
| 2 | 获取公告列表 | /api/notices | GET | 首页、公告列表 |
| 3 | 获取公告详情 | /api/notices/:id | GET | 公告详情 |
| 4 | 获取校园地点列表 | /api/places | GET | 校园导览 |
| 5 | 获取地点详情 | /api/places/:id | GET | 地点详情 |
| 6 | 获取校园服务列表 | /api/services | GET | 校园服务 |
| 7 | 获取学习内容列表 | /api/studies | GET | 学习专区 |
| 8 | 获取学习内容详情 | /api/studies/:id | GET | 学习详情 |
| 9 | 模拟登录 | /api/login | POST | 个人中心 |
| 10 | 获取收藏列表 | /api/favorites | GET | 我的收藏 |
| 11 | 添加收藏 | /api/favorites | POST | 详情页 |
| 12 | 取消收藏 | /api/favorites/:id | DELETE | 详情页、我的收藏 |
| 13 | 获取学习记录 | /api/study-history | GET | 学习记录 |
| 14 | 添加学习记录 | /api/study-history | POST | 学习详情 |

## 六、接口详细说明

### 6.1 GET /api/home 获取首页数据

**功能说明：** 获取首页所需的轮播图、最新公告、推荐学习内容等聚合数据。

**请求参数：** 无

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| banners | Array | 轮播图列表 |
| banners[].id | Number | 轮播图编号 |
| banners[].image | String | 图片路径 |
| notices | Array | 最新公告（前 3 条置顶） |
| notices[].id | Number | 公告编号 |
| notices[].title | String | 公告标题 |
| notices[].date | String | 发布时间 |
| recommends | Array | 推荐学习内容（前 4 条） |
| recommends[].id | Number | 内容编号 |
| recommends[].title | String | 标题 |
| recommends[].category | String | 分类 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "banners": [
      { "id": 1, "image": "/images/banner1.jpg" },
      { "id": 2, "image": "/images/banner2.jpg" },
      { "id": 3, "image": "/images/banner3.jpg" }
    ],
    "notices": [
      { "id": 1, "title": "关于期末课程设计提交的通知", "date": "2026-05-12" },
      { "id": 2, "title": "校园活动报名通知", "date": "2026-05-15" }
    ],
    "recommends": [
      { "id": 1, "title": "WXML 基础", "category": "页面结构" },
      { "id": 2, "title": "wx.setStorage 本地缓存", "category": "小程序 API" }
    ]
  }
}
```

**错误情况：** 无特殊错误，Mock 数据始终返回成功。

---

### 6.2 GET /api/notices 获取公告列表

**功能说明：** 获取全部校园公告列表，按置顶和时间排序。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | 公告类型筛选（课程通知/活动通知） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Array | 公告列表 |
| list[].id | Number | 公告编号 |
| list[].title | String | 公告标题 |
| list[].type | String | 公告类型 |
| list[].date | String | 发布时间 |
| list[].publisher | String | 发布者 |
| list[].isTop | Boolean | 是否置顶 |
| total | Number | 公告总数 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "关于期末课程设计提交的通知",
        "type": "课程通知",
        "date": "2026-05-12",
        "publisher": "计算机学院",
        "isTop": true
      },
      {
        "id": 2,
        "title": "校园活动报名通知",
        "type": "活动通知",
        "date": "2026-05-15",
        "publisher": "学生工作处",
        "isTop": false
      }
    ],
    "total": 2
  }
}
```

**错误情况：** type 参数无效时返回全部列表。

---

### 6.3 GET /api/notices/:id 获取公告详情

**功能说明：** 根据公告 ID 获取公告完整内容。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 公告编号（URL 路径参数） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Number | 公告编号 |
| title | String | 公告标题 |
| type | String | 公告类型 |
| content | String | 公告完整内容 |
| date | String | 发布时间 |
| publisher | String | 发布者 |
| isTop | Boolean | 是否置顶 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "关于期末课程设计提交的通知",
    "type": "课程通知",
    "content": "请各小组按要求提交项目源代码、设计说明书、答辩 PPT 和讲解视频。",
    "date": "2026-05-12",
    "publisher": "计算机学院",
    "isTop": true
  }
}
```

**错误情况：** id 不存在时返回 `{ "code": 1002, "message": "公告不存在", "data": null }`

---

### 6.4 GET /api/places 获取校园地点列表

**功能说明：** 获取全部校园建筑地点列表，支持按类型筛选。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | 地点类型（学习场所/生活场所/运动场所/教学场所） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Array | 地点列表 |
| list[].id | Number | 地点编号 |
| list[].name | String | 地点名称 |
| list[].type | String | 地点类型 |
| list[].description | String | 地点介绍 |
| list[].openTime | String | 开放时间 |
| list[].latitude | Number | 纬度 |
| list[].longitude | Number | 经度 |
| list[].image | String | 图片路径 |
| total | Number | 地点总数 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "图书馆",
        "type": "学习场所",
        "description": "图书馆主要提供图书借阅、自习、电子资源查询等服务。",
        "openTime": "08:00-22:00",
        "latitude": 23.0601,
        "longitude": 112.4621,
        "image": "/images/places/library.jpg"
      },
      {
        "id": 2,
        "name": "第一教学楼",
        "type": "教学场所",
        "description": "第一教学楼主要用于日常课程教学和实验实训。",
        "openTime": "07:30-22:00",
        "latitude": 23.0615,
        "longitude": 112.4630,
        "image": "/images/places/building1.jpg"
      }
    ],
    "total": 2
  }
}
```

**错误情况：** type 参数无效时返回全部列表。

---

### 6.5 GET /api/places/:id 获取地点详情

**功能说明：** 根据地点 ID 获取建筑详细信息。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 地点编号（URL 路径参数） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Number | 地点编号 |
| name | String | 地点名称 |
| type | String | 地点类型 |
| description | String | 地点介绍 |
| openTime | String | 开放时间 |
| latitude | Number | 纬度 |
| longitude | Number | 经度 |
| image | String | 图片路径 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "图书馆",
    "type": "学习场所",
    "description": "图书馆主要提供图书借阅、自习、电子资源查询等服务。",
    "openTime": "08:00-22:00",
    "latitude": 23.0601,
    "longitude": 112.4621,
    "image": "/images/places/library.jpg"
  }
}
```

**错误情况：** id 不存在时返回 `{ "code": 1002, "message": "地点不存在", "data": null }`

---

### 6.6 GET /api/services 获取校园服务列表

**功能说明：** 获取校园服务信息列表。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | 服务类型（学习服务/生活服务/活动服务） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Array | 服务列表 |
| list[].id | Number | 服务编号 |
| list[].title | String | 服务名称 |
| list[].type | String | 服务类型 |
| list[].location | String | 服务地点 |
| list[].time | String | 服务时间 |
| list[].content | String | 服务说明 |
| total | Number | 服务总数 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "图书馆服务",
        "type": "学习服务",
        "location": "图书馆",
        "time": "08:00-22:00",
        "content": "提供图书借阅、自习座位、电子资源查询等服务。"
      },
      {
        "id": 2,
        "title": "食堂服务",
        "type": "生活服务",
        "location": "学生食堂",
        "time": "07:00-20:00",
        "content": "提供早餐、午餐、晚餐等餐饮服务。"
      }
    ],
    "total": 2
  }
}
```

**错误情况：** type 参数无效时返回全部列表。


---

### 6.7 GET /api/studies 获取学习内容列表

**功能说明：** 获取前端学习专区内容列表，支持按分类筛选。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | String | 否 | 内容分类（页面结构/页面样式/页面逻辑/生命周期/小程序 API/设计模式） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Array | 学习内容列表 |
| list[].id | Number | 内容编号 |
| list[].title | String | 标题 |
| list[].category | String | 分类 |
| list[].summary | String | 简介 |
| total | Number | 内容总数 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "WXML 基础",
        "category": "页面结构",
        "summary": "WXML 是微信小程序的页面结构语言，类似于 HTML。"
      },
      {
        "id": 2,
        "title": "wx.setStorage 本地缓存",
        "category": "小程序 API",
        "summary": "wx.setStorage 用于将数据存储到本地缓存中。"
      }
    ],
    "total": 2
  }
}
```

**错误情况：** category 参数无效时返回全部列表。

---

### 6.8 GET /api/studies/:id 获取学习内容详情

**功能说明：** 根据学习内容 ID 获取完整知识点和代码示例。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 内容编号（URL 路径参数） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Number | 内容编号 |
| title | String | 标题 |
| category | String | 分类 |
| summary | String | 简介 |
| content | String | 详细内容 |
| code | String | 示例代码 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "WXML 基础",
    "category": "页面结构",
    "summary": "WXML 是微信小程序的页面结构语言，类似于 HTML。",
    "content": "WXML 用于描述小程序页面结构，常见组件包括 view、text、image 等。",
    "code": "<view class='box'>这是一个容器</view>"
  }
}
```

**错误情况：** id 不存在时返回 `{ "code": 1002, "message": "内容不存在", "data": null }`

---

### 6.9 POST /api/login 模拟登录

**功能说明：** 模拟用户登录，使用预设用户数据。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | String | 是 | 学号（如 "20260001"） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Number | 用户编号 |
| studentId | String | 学号 |
| name | String | 姓名 |
| college | String | 学院 |
| major | String | 专业 |
| role | String | 用户角色（student） |
| avatar | String | 头像路径 |

**请求示例：**

```json
{
  "studentId": "20260001"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "id": 1,
    "studentId": "20260001",
    "name": "张三",
    "college": "计算机学院",
    "major": "软件工程",
    "role": "student",
    "avatar": "/images/avatar.png"
  }
}
```

**错误情况：**
- studentId 为空：`{ "code": 1001, "message": "请输入学号", "data": null }`
- studentId 不存在：`{ "code": 2002, "message": "用户不存在", "data": null }`

---

### 6.10 GET /api/favorites 获取收藏列表

**功能说明：** 获取当前用户的收藏列表，支持按类型筛选。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | 收藏类型（place/study/notice） |

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Array | 收藏列表 |
| list[].id | Number | 收藏编号 |
| list[].type | String | 收藏类型 |
| list[].targetId | Number | 目标编号 |
| list[].title | String | 收藏标题 |
| list[].createTime | String | 收藏时间 |
| total | Number | 收藏总数 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "type": "place",
        "targetId": 1,
        "title": "图书馆",
        "createTime": "2026-05-12 10:30"
      },
      {
        "id": 2,
        "type": "study",
        "targetId": 1,
        "title": "WXML 基础",
        "createTime": "2026-05-12 11:00"
      }
    ],
    "total": 2
  }
}
```

**错误情况：** 未登录时返回 `{ "code": 2001, "message": "请先登录", "data": null }`

---

### 6.11 POST /api/favorites 添加收藏

**功能说明：** 添加一条收藏记录。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 收藏类型（place/study/notice） |
| targetId | Number | 是 | 目标编号 |
| title | String | 是 | 收藏标题 |

**请求示例：**

```json
{
  "type": "place",
  "targetId": 1,
  "title": "图书馆"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "收藏成功",
  "data": {
    "id": 3,
    "type": "place",
    "targetId": 1,
    "title": "图书馆",
    "createTime": "2026-05-12 14:20"
  }
}
```

**错误情况：**
- 未登录：`{ "code": 2001, "message": "请先登录", "data": null }`
- 已收藏：`{ "code": 3001, "message": "已收藏", "data": null }`
- 参数缺失：`{ "code": 1001, "message": "参数错误", "data": null }`

---

### 6.12 DELETE /api/favorites/:id 取消收藏

**功能说明：** 根据收藏类型和目标 ID 取消收藏。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | 收藏类型 |
| targetId | Number | 是 | 目标编号 |

**请求示例：**

```json
{
  "type": "place",
  "targetId": 1
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "已取消收藏",
  "data": null
}
```

**错误情况：**
- 未登录：`{ "code": 2001, "message": "请先登录", "data": null }`
- 收藏不存在：`{ "code": 3002, "message": "收藏不存在", "data": null }`

---

### 6.13 GET /api/study-history 获取学习记录

**功能说明：** 获取当前用户的学习浏览记录。

**请求参数：** 无

**返回字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Array | 学习记录列表 |
| list[].id | Number | 学习内容编号 |
| list[].title | String | 标题 |
| list[].category | String | 分类 |
| list[].time | String | 浏览时间 |
| total | Number | 记录总数 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "WXML 基础",
        "category": "页面结构",
        "time": "2026-05-12 10:30"
      },
      {
        "id": 2,
        "title": "wx.setStorage 本地缓存",
        "category": "小程序 API",
        "time": "2026-05-12 11:00"
      }
    ],
    "total": 2
  }
}
```

**错误情况：** 未登录时返回 `{ "code": 2001, "message": "请先登录", "data": null }`

---

### 6.14 POST /api/study-history 添加学习记录

**功能说明：** 用户浏览学习详情时自动添加学习记录。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 学习内容编号 |
| title | String | 是 | 标题 |
| category | String | 是 | 分类 |

**请求示例：**

```json
{
  "id": 1,
  "title": "WXML 基础",
  "category": "页面结构"
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "记录成功",
  "data": {
    "id": 1,
    "title": "WXML 基础",
    "category": "页面结构",
    "time": "2026-05-12 14:30"
  }
}
```

**错误情况：** 参数缺失时返回 `{ "code": 1001, "message": "参数错误", "data": null }`

## 七、Loading、异常处理与空数据说明

### 7.1 Loading 处理

所有接口调用前应显示 loading 状态，调用完成后隐藏：

- 页面级加载：使用 `wx.showLoading({ title: '加载中' })` + `wx.hideLoading()`
- 列表加载更多：使用页面底部 loading 组件
- 按钮操作：按钮置灰 + 文字变为"处理中..."

### 7.2 异常处理

| 异常场景 | 处理方式 |
|----------|----------|
| 网络异常（wx.request fail） | 读取本地缓存兜底，Toast 提示"网络异常，展示缓存数据" |
| 请求超时（5s） | 同网络异常处理 |
| 接口返回 code ≠ 0 | 根据错误码展示对应提示 |
| 数据格式异常 | try-catch 捕获，展示默认值 |

### 7.3 空数据处理

| 场景 | 处理方式 |
|------|----------|
| 列表为空 | 展示 empty-state 组件（图标 + "暂无数据"文字） |
| 收藏列表为空 | 展示"暂无收藏，去逛逛吧" + 跳转按钮 |
| 学习记录为空 | 展示"暂无学习记录，去学习吧" + 跳转按钮 |
| 搜索无结果 | 展示"未找到相关内容" |

### 7.4 缓存兜底策略

对于公告列表等需要网络请求的数据，采用"请求成功写缓存，请求失败读缓存"策略：

1. 请求成功 → 更新页面数据 + 写入本地缓存
2. 请求失败 → 读取本地缓存 → 有缓存则展示 + 提示"展示历史数据" → 无缓存则展示空状态


## 八、可选扩展接口（P2）

以下接口为管理员模式下的数据维护接口，属于 P2 可选扩展功能。课程作业阶段不要求必须实现，如果时间允许可以实现简单的本地 storage 维护。

### 8.1 POST /api/admin/places 管理员添加地点

**功能说明：** 管理员添加新的校园地点，数据写入本地 storage。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 地点名称 |
| type | String | 是 | 地点类型 |
| description | String | 是 | 地点介绍 |
| openTime | String | 是 | 开放时间 |
| latitude | Number | 是 | 纬度 |
| longitude | Number | 是 | 经度 |
| image | String | 否 | 图片路径 |

**请求示例：**

```json
{
  "name": "实验楼",
  "type": "教学场所",
  "description": "计算机实验教学楼",
  "openTime": "08:00-21:00",
  "latitude": 23.0620,
  "longitude": 112.4635
}
```

**响应示例：**

```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "id": 6,
    "name": "实验楼",
    "type": "教学场所"
  }
}
```

---

### 8.2 PUT /api/admin/places/:id 管理员修改地点

**功能说明：** 管理员修改已有地点信息。

**请求参数：** 同添加接口，id 通过 URL 路径传递。

**响应示例：**

```json
{
  "code": 0,
  "message": "修改成功",
  "data": null
}
```

---

### 8.3 DELETE /api/admin/places/:id 管理员删除地点

**功能说明：** 管理员删除指定地点。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Number | 是 | 地点编号（URL 路径参数） |

**响应示例：**

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

---

### 8.4 POST /api/admin/notices 管理员添加公告

**功能说明：** 管理员发布新公告。

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 公告标题 |
| type | String | 是 | 公告类型 |
| content | String | 是 | 公告内容 |
| publisher | String | 是 | 发布者 |
| isTop | Boolean | 否 | 是否置顶，默认 false |

**响应示例：**

```json
{
  "code": 0,
  "message": "发布成功",
  "data": {
    "id": 5,
    "title": "新公告标题",
    "date": "2026-05-12"
  }
}
```

---

### 8.5 GET /api/weather 获取天气数据（真实 API）

**功能说明：** 接入和风天气公开 API，获取当前天气信息。此接口为唯一使用真实 wx.request 的接口。

**请求参数：** 无（内部使用固定 location 参数）

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "temp": "28",
    "text": "晴",
    "windDir": "东南风",
    "humidity": "65"
  }
}
```

**错误情况：** 网络异常时返回本地缓存的上次天气数据。

---

> **说明：** 以上 P2 接口在课程作业阶段为可选实现。管理员接口的数据操作直接写入本地 storage，不需要真实后端。天气接口需要申请和风天气开发者 Key。
