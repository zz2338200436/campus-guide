# 校园通 Campus Guide

`campus-guide` 是一款面向高校新生和在校学生的校园服务微信小程序。当前版本定位为 **企业演示版**：以微信小程序体验为核心，提供校园导览、服务办理指引、公告通知、学习成长、收藏打卡和个人进度闭环，同时保留后续接入 Spring Boot + MySQL API 的轻量扩展空间。

## 产品定位

校园通希望解决新生进入校园后的三个高频问题：

- **今天先去哪**：把报到、吃饭、自习、报修、失物招领等场景转成可执行路线。
- **事情去哪办**：按问题找到服务事项、办理材料、联系电话和关联地点。
- **进度怎么看**：把探索打卡、收藏、学习记录和个人状态汇总到同一个身份中心。

当前版本使用本地演示数据和微信小程序缓存模拟真实业务链路，适合产品演示、作品集展示和后续后端接入前的体验验证。

## 核心能力

- 首页行动台：下一步行动、路线进度、常用入口、校园通知和继续学习。
- 校园导览：校园地图、地点搜索、分类筛选、路线点位、地点详情和导航入口。
- 地点详情：地点信息、收藏、打卡、关联服务和地图联动。
- 服务中心：按问题找入口，覆盖报到、网络报修、失物招领、学籍事务和安全应急。
- 学习专区：学习路径、任务完成状态、学习详情、代码示例复制和学习记录。
- 公告通知：置顶提醒、最新动态和公告详情。
- 身份中心：登录身份、收藏统计、学习记录、探索进度和最近活动。
- 运营视角：管理员可查看内容健康检查和维护建议，作为内部运营能力展示。

## 技术架构

```text
微信小程序页面
  ↓
utils/request.js 页面请求门面
  ↓
utils/requestAdapter.js 请求适配层
  ↓
Local services / future HTTP API
  ↓
本地数据与缓存 / future Spring Boot + MySQL
```

当前实现重点：

- 原生微信小程序：WXML、WXSS、JavaScript、JSON 配置。
- 本地 service 层：`utils/services/` 封装首页、地点、服务、学习、公告等数据逻辑。
- 请求门面：页面统一通过 `utils/request.js` 获取数据，降低未来 API 迁移成本。
- 本地缓存：登录用户、收藏、打卡、学习完成和学习记录按用户隔离。
- Smoke tests：`tests/*.test.js` 覆盖工具层、服务层和关键产品文案。
- 企业演示材料：`docs/校园通_企业演示指南.md`、`docs/校园通_企业演示交付清单.md`
- 录屏与截图材料：`docs/校园通_企业演示录屏讲解稿.md`、`docs/assets/screenshots/企业演示截图清单.md`
- 坐标运维说明：`docs/coordinate-operations.md`

未来可扩展为：

- Spring Boot REST API
- MySQL 数据库存储地点、公告、服务、用户、收藏、打卡和反馈
- JWT 登录态、角色权限、接口日志和真实内容运维

## 项目结构

```text
campus-guide/
├─ app.js
├─ app.json
├─ app.wxss
├─ pages/
│  ├─ index/            # 首页行动台
│  ├─ map/              # 校园导览
│  ├─ placeDetail/      # 地点详情
│  ├─ service/          # 服务中心
│  ├─ study/            # 学习专区
│  ├─ user/             # 身份中心
│  └─ ...
├─ components/
├─ utils/
│  ├─ services/         # Local service modules
│  ├─ request.js        # 页面请求门面
│  ├─ requestAdapter.js # Local / HTTP 适配边界
│  ├─ storage.js
│  └─ *Data.js
├─ tests/               # Node smoke tests
└─ docs/
```

## 运行方式

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择：`D:\111\WeChatMiniProgram\campus-guide`。
4. AppID 可使用测试号或开发者工具提供的体验配置。
5. 导入后点击“编译”，默认进入首页。
6. 如需体验收藏、学习记录和探索足迹，请先进入“我的”页面登录体验账号。

## 演示路径

推荐按 3-5 分钟产品演示节奏体验：

1. 首页：查看校园行动台、下一站和路线进度。
2. 导览：搜索“图书馆”或“食堂”，切换分类并打开地点详情。
3. 地点详情：完成收藏或打卡，查看关联服务。
4. 服务中心：按“网络报修”或“失物招领”查找办理入口。
5. 学习专区：打开学习详情并标记任务完成。
6. 身份中心：查看收藏、学习记录和探索进度同步结果。

更多演示说明见：

- `docs/校园通_企业演示指南.md`
- `docs/校园通_企业演示交付清单.md`
- `docs/校园通_企业演示录屏讲解稿.md`
- `docs/assets/screenshots/企业演示截图清单.md`

## 测试账号

- 普通学生：`20260001`
- 普通学生：`20260002`
- 内部运营：`admin001`

`admin001` 用于体验内部运营视角。普通学生路径不会把运营工具作为主功能展示。

## 快速验证

在项目根目录执行：

```powershell
npm test
```

如果未安装 npm，也可以逐条执行 `tests/*.test.js` 中的 Node smoke tests。测试主要验证纯工具层、本地 service、用户隔离、探索打卡、学习成长、今日行动台、问题解决器和请求门面，不替代微信开发者工具编译与真机检查。

## 本地缓存

- 当前登录用户：`campus-guide:current-user`
- 收藏列表：`campus-guide:favorites`
- 学习记录：`campus-guide:study-history`
- 探索打卡：`campus-guide:exploration-checkins`
- 学习完成：`campus-guide:learning-completed`

缓存读写由 `utils/storage.js` 统一封装。如果缓存被手动写坏，工具层会返回默认值，避免页面崩溃。

## 后续路线

- 接入 Spring Boot + MySQL，替换本地 service 数据来源。
- 增加真实微信登录和服务端用户会话。
- 增加反馈、报修、失物招领等可提交表单。
- 增加接口文档、部署脚本和运行监控。
- 在需要真实运营时再扩展 Web 管理后台。
