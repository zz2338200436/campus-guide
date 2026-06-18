# 校园通小程序架构设计文档

> 日期：2026-06-18 | 版本：v2.0 | 广州应用科技学院肇庆校区

---

## 一、整体架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    校园通 Mini Program                        │
├───────────┬───────────┬───────────┬───────────┬─────────────┤
│  首页      │  校园地图   │  校园圈    │  我的     │             │
│  (Tab 1)  │  (Tab 2)  │  (Tab 3)  │  (Tab 4)  │             │
├───────────┴───────────┴───────────┴───────────┴─────────────┤
│                    次级页面 (16 Pages)                        │
│  assistant | placeDetail | service | study | community-*    │
│  notice* | survivalRoute | favorite | operations           │
├─────────────────────────────────────────────────────────────┤
│                  基础设施层 (Utils Layer)                      │
│  aiService | aiEngine | request → adapter | storage         │
│  themeManager | userManager | communityStore | ...          │
├─────────────────────────────────────────────────────────────┤
│                   数据层 (Data Layer)                        │
│  Mock Mode (开发/Demo)  ↔  Real API Mode (生产)             │
│  Xiaomi AI Proxy (开发代理) → Cloud API (生产)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、页面架构与分包策略

### 当前状态（单包模式）

17 个页面全在主包中，已启用 `lazyCodeLoading: "requiredComponents"`。

### 优化建议：两步走

**阶段一（当前）：保持单包 + 懒加载**
- 主包估算：~1.2MB（图片用 CDN 托管）
- 通过 `lazyCodeLoading` 按需加载页级组件
- 适合快速迭代和审核上线

**阶段二（用户量 > 1万后）：引入分包**
```
主包（Tab + 核心）
├── pages/index        # 首页
├── pages/map          # 校园地图
├── pages/community    # 校园圈
├── pages/user         # 我的
├── pages/assistant    # AI 助手（通过 ai-fab 进入）
└── components/        # 全局复用组件

分包 A：内容
├── pages/placeDetail
├── pages/service
├── pages/study
├── pages/studyDetail

分包 B：社交
├── pages/community-detail
├── pages/community-post
├── pages/notice + noticeDetail

分包 C：工具
├── pages/survivalRoute
├── pages/favorite
├── pages/studyHistory
├── pages/operations
```

---

## 三、AI 助手架构 —— 本次核心优化

### 优化前的问题

```
assistant.js ──→ request.getAssistantReply() ──→ requestAdapter.http()
                                                        │
                        ┌───────────────────────────────┤
                        ▼                               ▼
                mock 模式也发 HTTP           双重 catch + 回退逻辑混乱
                (总是失败)                   knowlegeBase 仅 4 条规则
```

### 优化后的架构

```
┌──────────────────┐
│  assistant.js    │  纯 UI 层：状态管理 + 消息渲染 + 取消控制
└────────┬─────────┘
         │ chat(question, history)
         ▼
┌──────────────────┐
│  aiService.js    │  策略编排层：按 mode 选择策略
│  (新增)          │
│                  │  LOCAL_ONLY  → requestLocal()  → aiEngine.ask()
│  getStrategy()   │  CLOUD_FIRST → healthCheck()   → requestCloud()
│                  │              └─ 失败 → requestLocal()
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌───────────┐
│aiEngine │ │wx.request │  → Xiaomi API Proxy (开发)
│(10条)   │ │(15s超时) │  → Cloud API (生产)
└────────┘ └───────────┘
```

### 关键优化点

| 优化项 | 优化前 | 优化后 |
|--------|--------|--------|
| 请求策略 | mock 模式也发 HTTP，必失败 | `mode !== 'http'` 时走纯本地，零延迟 |
| 连接检测 | 无 | `healthCheck()` 先验证云端可达性 |
| 知识库 | 4 条规则 | 10 条 + 智能路由提示 |
| 超时控制 | 无限等待 | 15 秒超时 + `request.abort()` 取消 |
| 错误恢复 | 双重 catch 逻辑重复 | 统一 `aiService.chat()` 内部回退 |
| 上下文窗口 | 10 条消息，无限制 | 8 条，单条最长 200 字符 |
| UX 反馈 | "正在思考..."无变化 | 状态文本 + 脉动动画 + 取消按钮 |
| 消息持久化 | 无 | 自动保存最近 20 条到 Storage |

---

## 四、数据流设计

```
用户操作
   │
   ▼
Page/Component (UI 层)
   │  data binding (setData)
   ▼
Service Layer (utils/*)
   │  Promise-based API
   ▼
Adapter Layer (utils/requestAdapter)
   │  mode switch: mock ↔ http
   ▼
Data Layer
   ├── Mock: local JSON / Store  → 即时响应，适合开发/演示
   └── HTTP: wx.request          → 真实 API，生产环境
```

### API 模式切换

```javascript
// utils/apiConfig.js
module.exports = {
  mode: 'mock',        // 'mock' | 'http'
  baseUrl: '',         // 生产 API 地址
  assistantBaseUrl: 'http://127.0.0.1:4318',  // AI 代理地址
  assistantApiPrefix: '/api',
  timeout: 8000
};
```

生产环境切换步骤：
1. 设置 `mode: 'http'`
2. 填入真实 `baseUrl` 和 `assistantBaseUrl`
3. 在微信后台注册 request 合法域名
4. 部署 Xiaomi API Proxy 到云服务器（而非 localhost）

---

## 五、组件体系

```
components/
├── ai-fab/          # AI 助手悬浮按钮（可拖拽、位置记忆）
├── empty-state/     # 空状态组件
├── favorite-btn/    # 收藏按钮
├── place-card/      # 地点卡片
├── study-card/      # 学习卡片
├── notice-item/     # 公告条目
└── custom-tab-bar/  # 自定义底部导航（在 /custom-tab-bar）
```

### AI-FAB 组件交互

- 首页右下角悬浮，可拖拽到屏幕两侧
- 长按隐藏为小圆点，再次点击恢复
- 位置记忆存入 Storage
- 点击跳转 `/pages/assistant/assistant`

---

## 六、性能策略

| 策略 | 实现方式 |
|------|----------|
| 懒加载 | `"lazyCodeLoading": "requiredComponents"` |
| setData 优化 | 页面内单次 setData 合并多个字段 |
| 图片管理 | 本地小图标 + 远程 CDN 大图 |
| 消息持久化 | 500ms 防抖延迟写入 Storage |
| AI 请求取消 | `wx.request.abort()` 释放等待的连接 |
| 滚动优化 | scroll-view + scroll-into-view 精确定位 |

---

## 七、生产上线清单

- [ ] **域名白名单**：在微信后台注册 API 域名和 WebSocket 域名
- [ ] **AI 服务部署**：将 xiaomi-ai-proxy 或等价服务部署到云
- [ ] **隐私合规**：确保隐私政策和用户协议页可访问
- [ ] **Tab 图标**：确认 `/images/tab/*.png` 路径下所有图标存在
- [ ] **审核准备**：检查内容合规、不做诱导分享、功能完整可达
- [ ] **性能审查**：WeChat DevTools → 体验评分 → 目标 > 90分
- [ ] **真机测试**：iOS + Android 微信最新版各测一轮
- [ ] **灰度发布**：先 10% → 50% → 100%

---

## 八、文件变更清单

### 新增
- `utils/aiService.js` — 统一 AI 服务层，策略编排 + 回退 + 取消

### 修改
- `utils/requestAdapter.js` — 修复 mock 模式也发 HTTP 的 bug
- `utils/request.js` — 简化 `getAssistantReply`，委托给 aiService
- `utils/aiEngine.js` — 知识库从 4 条扩充到 10 条 + 智能路由提示
- `pages/assistant/assistant.js` — 重构：策略感知 + 取消 + 持久化消息
- `pages/assistant/assistant.wxml` — 增加取消按钮 + 连接状态提示
- `pages/assistant/assistant.wxss` — 新增动画 + 取消按钮样式
