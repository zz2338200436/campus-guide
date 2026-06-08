# 校园通 - 新生校园助手微信小程序

英文代号：`campus-guide`

## 项目简介

校园通是一款面向高校新生的微信小程序，核心亮点是“新生生存路线生成器”：用户选择报到、吃饭、自习、网络报修、失物招领等场景后，系统自动生成地点、服务、材料和行动顺序，帮助用户更快知道今天先去哪、每一步做什么。

当前版本是可运行的 MVP 原型，采用本地数据和微信小程序缓存模拟真实产品链路。页面统一通过 `utils/request.js` 获取数据，内部已拆分为 `utils/services/`，后续可以平滑迁移到云开发或真实后端。

## 技术栈

- 微信小程序原生框架
- WXML：页面结构
- WXSS：页面样式
- JavaScript：页面逻辑与工具封装
- JSON：页面、组件和全局配置
- 本地数据源：`utils/*Data.js`
- 本地缓存：`wx.setStorageSync` / `wx.getStorageSync`
- 设计模式：用户状态单例、收藏状态观察者
- Node smoke tests：`tests/*.test.js`

## 核心功能

- 首页：个人今日行动台、下一站推荐、首日路线进度、公告摘录、常用入口、学习动线。
- 新生生存路线：按场景生成校园行动路线，串联地点、服务、材料和步骤。
- 校园导览：首日探索路线、静态校园示意图、地点搜索、分类筛选、地点详情。
- 新生探索打卡：地点详情可打卡，首页和个人中心同步显示路线进度、下一站和探索足迹。
- 校园服务：问题解决器、新生服务台、高频服务、应急支持、办事材料、办理步骤和地点联动。
- 学习专区：三条成长路径、任务完成状态、学习详情、代码示例复制和学习记录。
- 公告通知：置顶提醒、最新动态、公告详情。
- 个人中心：模拟登录、用户信息、收藏统计、学习记录、探索进度和足迹。
- 运营中心：管理员查看数据概览、内容健康检查和运营维护建议。
- 我的收藏：地点、学习、公告三类收藏统一展示。
- 学习记录：最近浏览记录去重保存，最多保留 20 条。

## 项目目录结构

```text
campus-guide/
├─ app.js
├─ app.json
├─ app.wxss
├─ project.config.json
├─ sitemap.json
├─ README.md
├─ docs/
│  ├─ 产品体验验收清单.md
│  └─ 截图演示路径.md
├─ components/
├─ pages/
│  ├─ index/
│  ├─ map/
│  ├─ placeDetail/
│  ├─ survivalRoute/
│  ├─ service/
│  ├─ study/
│  ├─ studyDetail/
│  ├─ notice/
│  ├─ noticeDetail/
│  ├─ user/
│  ├─ operations/
│  ├─ favorite/
│  └─ studyHistory/
├─ utils/
│  ├─ services/
│  ├─ request.js
│  ├─ requestHelpers.js
│  ├─ storage.js
│  ├─ userManager.js
│  ├─ favoriteSubject.js
│  ├─ explorationCheckinHelper.js
│  ├─ learningProgressHelper.js
│  ├─ todayActionBuilder.js
│  ├─ survivalRouteBuilder.js
│  ├─ operationsCenter.js
│  ├─ serviceMatcher.js
│  ├─ flagshipSelectors.js
│  ├─ studyHistoryHelper.js
│  ├─ contentFilter.js
│  └─ *Data.js
└─ tests/
   ├─ content-filter.test.js
   ├─ exploration-checkin.test.js
   ├─ learning-progress.test.js
   ├─ operations-center.test.js
   ├─ survival-route.test.js
   ├─ today-action.test.js
   ├─ service-issue.test.js
   ├─ product-copy.test.js
   ├─ flagship-selectors.test.js
   ├─ service-center.test.js
   ├─ request-services.test.js
   └─ utils-smoke.test.js
```

## 运行步骤

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择：`D:\111\WeChatMiniProgram\campus-guide`。
4. `AppID` 可使用测试号或开发者工具提供的体验配置。
5. 导入后点击“编译”，默认进入首页。
6. 如需体验收藏、学习记录和探索足迹，请先进入“我的”页面完成模拟登录。

## 推荐体验路径

1. 首页打开“新生生存路线生成器”，选择入学报到、找饭吃、自习学习、网络报修或失物招领。
2. 查看系统生成的路线步骤、准备材料、关联服务和第一站入口。
3. 从路线步骤进入地点详情，完成地点打卡和收藏，并查看该地点可办理的服务。
4. 回到首页查看“个人今日行动台”、今天的下一站和首日路线进度。
5. 进入“校园导览”，按图书馆、第一教学楼、学生食堂完成首日探索路线。
6. 进入“服务中心”，按问题解决器继续查找服务方案。
7. 进入“学习专区”，按三条成长路径选择下一项任务，在学习详情中标记完成。
8. 回到首页或个人中心，查看成长进度、最近完成任务和入门路线徽章。
9. 使用 `admin001` 登录，在“我的”页面进入运营中心，查看内容健康检查。

## 交付与验收文档

- 产品体验验收清单：`docs/产品体验验收清单.md`
- 截图演示路径：`docs/截图演示路径.md`
- 校园坐标运维说明：`docs/coordinate-operations.md`

## 项目亮点

- 主卖点更清晰：新生生存路线生成器能把场景、地点、服务、材料和步骤合成一条可执行路线。
- 产品主线清晰：围绕“新生熟悉校园”建立首页、路线、导览、详情、个人中心的闭环。
- 探索打卡有反馈：路线任务、下一站、徽章条件和探索足迹都来自同一个 helper。
- 服务中心更像真实工具：可按问题找解决方案，服务有分类、材料、步骤、联系电话，并能和地点详情联动。
- 学习系统有留存价值：知识内容被组织成成长路径，完成状态会同步到首页和个人中心。
- 管理员侧可运营：运营中心能看到数据概览、健康检查和维护建议。
- 个人数据隔离：收藏、学习记录、探索打卡按登录用户分桶保存。
- 页面结构可扩展：页面统一依赖 request facade，数据服务内部拆分更清晰。
- 测试可复用：Node 测试覆盖筛选、服务 facade、用户隔离、探索打卡、学习成长、今日行动台、问题解决器、运营中心和产品文案守门。

## 快速验证命令

在项目根目录执行：

```powershell
node tests/exploration-checkin.test.js
node tests/learning-progress.test.js
node tests/operations-center.test.js
node tests/survival-route.test.js
node tests/today-action.test.js
node tests/service-issue.test.js
node tests/product-copy.test.js
node tests/content-filter.test.js
node tests/flagship-selectors.test.js
node tests/service-center.test.js
node tests/request-services.test.js
node tests/utils-smoke.test.js
```

这些测试主要验证纯工具层、服务层和关键产品文案，不替代微信开发者工具编译与真机检查。

## 测试账号

- 普通学生：`20260001`
- 普通学生：`20260002`
- 管理员：`admin001`

`admin001` 当前用于体验运营中心，后续可以扩展为真实内容维护、数据分析和审核入口。

## 本地缓存说明

- 当前登录用户：`campus-guide:current-user`
- 收藏列表：`campus-guide:favorites`
- 学习记录：`campus-guide:study-history`
- 探索打卡：`campus-guide:exploration-checkins`
- 学习完成：`campus-guide:learning-completed`

缓存读写统一由 `utils/storage.js` 封装。如果缓存被手动写坏，工具层会返回默认值，避免页面崩溃。

## 后续产品方向

- 接入微信云开发，保存真实用户、地点、公告和打卡数据。
- 将运营中心升级为真实内容后台，支持维护校园地点、公告、服务和探索任务。
- 引入真实定位校验，让打卡从“记录行为”升级为“到达确认”。
- 强化校园服务中心，增加报修、失物招领、校历、常用电话和办事预约。
- 深化学习成长系统，增加订阅提醒、周期目标、阶段徽章和成长复盘。
