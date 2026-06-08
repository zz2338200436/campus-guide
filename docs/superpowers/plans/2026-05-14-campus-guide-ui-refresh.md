# Campus Guide UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the WeChat Mini Program UI into a unified clean campus card style without changing the existing mock-driven business behavior.

**Architecture:** The implementation upgrades the shared visual system first, then rebuilds the four core tab pages, then aligns reusable components and secondary pages to the same design language. Data bindings and request flow stay in place; most changes live in WXML and WXSS with only small page-logic adjustments when structure needs extra display fields.

**Tech Stack:** WeChat Mini Program native framework, WXML, WXSS, JavaScript, local mock data

---

## File Structure

### Shared foundation

- Modify: `app.wxss`
  - Owns the global background, card, section title, button, tag, helper text, and common panel styling.

### Core pages

- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`
- Modify: `pages/map/map.wxml`
- Modify: `pages/map/map.wxss`
- Modify: `pages/study/study.wxml`
- Modify: `pages/study/study.wxss`
- Modify: `pages/user/user.wxml`
- Modify: `pages/user/user.wxss`

### Reusable components

- Modify: `components/place-card/place-card.wxml`
- Modify: `components/place-card/place-card.wxss`
- Modify: `components/study-card/study-card.wxml`
- Modify: `components/study-card/study-card.wxss`
- Modify: `components/notice-item/notice-item.wxml`
- Modify: `components/notice-item/notice-item.wxss`
- Modify: `components/empty-state/empty-state.wxml`
- Modify: `components/empty-state/empty-state.wxss`
- Modify: `components/favorite-btn/favorite-btn.wxss`

### Secondary pages

- Modify: `pages/service/service.wxml`
- Modify: `pages/service/service.wxss`
- Modify: `pages/notice/notice.wxml`
- Modify: `pages/notice/notice.wxss`
- Modify: `pages/favorite/favorite.wxml`
- Modify: `pages/favorite/favorite.wxss`
- Modify: `pages/studyHistory/studyHistory.wxml`
- Modify: `pages/studyHistory/studyHistory.wxss`
- Modify: `pages/placeDetail/placeDetail.wxml`
- Modify: `pages/placeDetail/placeDetail.wxss`
- Modify: `pages/studyDetail/studyDetail.wxml`
- Modify: `pages/studyDetail/studyDetail.wxss`
- Modify: `pages/noticeDetail/noticeDetail.wxml`
- Modify: `pages/noticeDetail/noticeDetail.wxss`

### Verification support

- No automated test files exist in this repository.
- Verification will use:
  - WX/WXML/WXSS/JS syntax parse checks through local scripts
  - targeted file inspection after edits
  - final pass across the refreshed page set to confirm structure consistency

## Task 1: Refresh Shared Visual Foundation

**Files:**
- Modify: `app.wxss`

- [ ] **Step 1: Rewrite shared page, card, title, tag, and button styles**

Replace the current shared visual tokens with a stronger campus card system:

```css
page {
  background:
    linear-gradient(180deg, #f4fcff 0%, #eef9fb 38%, #f8fcff 100%);
  color: #1e293b;
  font-size: 28rpx;
}

.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 56rpx;
  background:
    radial-gradient(circle at top right, rgba(34, 211, 238, 0.16), transparent 28%),
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.1), transparent 24%),
    linear-gradient(180deg, rgba(8, 145, 178, 0.06), rgba(255, 255, 255, 0) 360rpx);
}

.card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28rpx;
  padding: 28rpx;
  border: 1rpx solid rgba(8, 145, 178, 0.08);
  box-shadow: 0 18rpx 42rpx rgba(15, 23, 42, 0.06);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.section-title__text {
  position: relative;
  padding-left: 20rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #0f3f52;
}

.section-title__text::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8rpx;
  width: 8rpx;
  height: 30rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #22d3ee, #14b8a6);
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120rpx;
  min-height: 56rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #e8f8fb;
  color: #0f766e;
  font-size: 22rpx;
  font-weight: 600;
}
```

- [ ] **Step 2: Keep shared utility classes aligned with the new tone**

Add or update helper classes for content containers used by multiple pages:

```css
.surface-soft {
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.98), rgba(255, 255, 255, 0.98));
}

.section-shell {
  margin-bottom: 28rpx;
}

.panel-grid {
  display: grid;
  gap: 20rpx;
}

.loading-text,
.error-text {
  padding: 44rpx 0;
  text-align: center;
  font-size: 25rpx;
  color: #64748b;
}
```

- [ ] **Step 3: Verify the shared stylesheet structure**

Run:

```powershell
Get-Content -Raw 'app.wxss'
```

Expected:

- shared classes are present once
- no duplicate legacy definitions remain for the same selector block
- file reads cleanly without partial patch artifacts

## Task 2: Rebuild the Homepage

**Files:**
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`

- [ ] **Step 1: Restructure homepage WXML into hero, quick cards, intro, notices, and study feed**

Update the homepage markup to follow the refreshed section order:

```xml
<view class="page">
  <view class="home-hero card">
    <view class="home-hero__badge">Campus Guide</view>
    <view class="home-hero__title">校园通</view>
    <view class="home-hero__desc">把校园导览、服务入口、公告提醒和前端学习内容整理成一个清爽好用的小程序。</view>
    <view class="home-hero__sub">课程作业版，围绕 Mock 数据、本地收藏与学习记录构建完整体验。</view>
    <view class="home-hero__stats">
      <view class="home-hero__stat">
        <text class="home-hero__stat-num">11</text>
        <text class="home-hero__stat-label">页面模块</text>
      </view>
      <view class="home-hero__stat">
        <text class="home-hero__stat-num">4</text>
        <text class="home-hero__stat-label">核心导航</text>
      </view>
      <view class="home-hero__stat">
        <text class="home-hero__stat-num">Mock</text>
        <text class="home-hero__stat-label">可运行答辩</text>
      </view>
    </view>
  </view>

  <view class="section section-shell">
    <view class="section-title">
      <text class="section-title__text">常用入口</text>
    </view>
    <view class="entry-grid">
      <view class="entry-card card" data-url="/pages/map/map" data-tab="{{true}}" bindtap="goTab">
        <view class="entry-card__icon">导</view>
        <view class="entry-card__title">校园导览</view>
        <view class="entry-card__desc">看地图和地点</view>
      </view>
    </view>
  </view>
</view>
```

Use four `entry-card` items matching map, service, study, and user pages.

- [ ] **Step 2: Replace homepage WXSS with a cleaner hero and feature-card layout**

Add styles for:

```css
.home-hero {
  position: relative;
  overflow: hidden;
  padding: 34rpx 30rpx 32rpx;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.34), transparent 28%),
    linear-gradient(140deg, rgba(8, 145, 178, 0.96), rgba(20, 184, 166, 0.92), rgba(74, 222, 128, 0.8));
  color: #ffffff;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.entry-card {
  padding: 24rpx;
}

.entry-card__icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #dffafe, #ecfdf5);
  color: #0f766e;
  font-size: 34rpx;
  font-weight: 700;
}
```

Also add banner, intro, and responsive spacing styles aligned with the new card system.

- [ ] **Step 3: Verify homepage structure**

Run:

```powershell
Get-Content -Raw 'pages\index\index.wxml'
Get-Content -Raw 'pages\index\index.wxss'
```

Expected:

- hero, quick entry, intro, notice, and recommendation blocks appear in that order
- quick entry grid contains four destinations
- class naming is internally consistent

## Task 3: Rebuild Map, Study, and User Core Pages

**Files:**
- Modify: `pages/map/map.wxml`
- Modify: `pages/map/map.wxss`
- Modify: `pages/study/study.wxml`
- Modify: `pages/study/study.wxss`
- Modify: `pages/user/user.wxml`
- Modify: `pages/user/user.wxss`

- [ ] **Step 1: Upgrade map page structure**

Reshape the map page into a true feature page:

```xml
<view class="page">
  <view class="page-head page-head--map card">
    <view class="page-head__eyebrow">Campus Tour</view>
    <view class="page-head__title">校园导览</view>
    <view class="page-head__desc">先看示意图，再按分类浏览地点卡片，快速熟悉学习、生活和运动区域。</view>
  </view>

  <view class="map-stage card">
    <!-- keep existing static map pin loop -->
  </view>

  <view class="map-tip card surface-soft">
    <text class="map-tip__text">当前示意图适合开发者工具预览，地点详情和真机导航仍可正常体验。</text>
  </view>
</view>
```

Retain existing data bindings for `mapPins`, `categories`, and `filteredPlaces`.

- [ ] **Step 2: Upgrade study page structure**

Reshape the study page into a themed learning feed:

```xml
<view class="page">
  <view class="page-head page-head--study card">
    <view class="page-head__eyebrow">Learning Hub</view>
    <view class="page-head__title">前端课程学习专区</view>
    <view class="page-head__desc">围绕 WXML、WXSS、逻辑交互、小程序 API 和设计模式整理知识卡片。</view>
  </view>

  <scroll-view class="type-scroll filter-scroll" scroll-x enable-flex>
    <!-- existing category loop -->
  </scroll-view>

  <view class="study-list panel-grid">
    <!-- existing study-card loop -->
  </view>
</view>
```

- [ ] **Step 3: Upgrade user page structure**

Reshape the user page so both login states feel complete:

```xml
<view class="page">
  <view class="user-hero card" wx:if="{{user}}">
    <view class="user-hero__top">
      <view class="user-hero__avatar">{{avatarText}}</view>
      <view class="user-hero__content">
        <view class="user-hero__name">{{user.name}}</view>
        <view class="user-hero__meta">{{user.college}} · {{user.major}}</view>
        <view class="user-hero__meta">学号：{{user.studentId}}</view>
      </view>
    </view>
    <text class="tag user-hero__tag" wx:if="{{user.role === 'admin'}}">管理员模式已识别</text>
  </view>
```

Also convert favorites and history entries into separate utility cards while preserving `goFavorite` and `goHistory`.

- [ ] **Step 4: Replace page styles for map, study, and user pages**

Create matching `page-head`, `filter-scroll`, `utility-card`, and refreshed layout styles in these files. Keep naming aligned:

```css
.page-head {
  margin-bottom: 24rpx;
  padding: 30rpx 28rpx;
}

.page-head__eyebrow {
  font-size: 22rpx;
  color: #0891b2;
  letter-spacing: 2rpx;
}

.page-head__title {
  margin-top: 12rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: #0f3f52;
}
```

Use page-specific gradients that stay within the cyan-green palette.

- [ ] **Step 5: Verify the three core pages**

Run:

```powershell
Get-Content -Raw 'pages\map\map.wxml'
Get-Content -Raw 'pages\study\study.wxml'
Get-Content -Raw 'pages\user\user.wxml'
```

Expected:

- each page has a clear top feature block
- filters remain bound to existing data variables
- user page still covers both login states

## Task 4: Refresh Reusable Components

**Files:**
- Modify: `components/place-card/place-card.wxml`
- Modify: `components/place-card/place-card.wxss`
- Modify: `components/study-card/study-card.wxml`
- Modify: `components/study-card/study-card.wxss`
- Modify: `components/notice-item/notice-item.wxml`
- Modify: `components/notice-item/notice-item.wxss`
- Modify: `components/empty-state/empty-state.wxml`
- Modify: `components/empty-state/empty-state.wxss`
- Modify: `components/favorite-btn/favorite-btn.wxss`

- [ ] **Step 1: Redesign `place-card` as a fuller location card**

Update markup to use a header/meta/body structure:

```xml
<view class="place-card card" bindtap="handleTap">
  <view class="place-card__cover">
    <view class="place-card__cover-label">{{item.type}}</view>
    <view class="place-card__cover-name">{{item.name}}</view>
  </view>
  <view class="place-card__body">
    <view class="place-card__title-row">
      <view class="place-card__title">{{item.name}}</view>
      <view class="place-card__time">{{item.openTime}}</view>
    </view>
    <view class="place-card__desc">{{item.description}}</view>
  </view>
</view>
```

- [ ] **Step 2: Redesign `study-card`, `notice-item`, and `empty-state`**

Use stronger hierarchy:

```xml
<view class="study-card card" bindtap="handleTap">
  <view class="study-card__meta-row">
    <text class="tag">{{item.category}}</text>
    <text class="study-card__action">查看内容</text>
  </view>
  <view class="study-card__title">{{item.title}}</view>
  <view class="study-card__summary">{{item.summary}}</view>
</view>
```

```xml
<view class="notice-item" bindtap="handleTap">
  <view class="notice-item__main">
    <view class="notice-item__row">
      <text wx:if="{{item.isTop}}" class="notice-item__top">置顶</text>
      <text class="notice-item__type">{{item.type}}</text>
    </view>
    <view class="notice-item__title">{{item.title}}</view>
    <view class="notice-item__meta">{{item.publisher}} · {{item.date}}</view>
  </view>
  <text class="notice-item__arrow">查看</text>
</view>
```

- [ ] **Step 3: Refresh component styles and favorite button treatment**

Update component WXSS to match the new card system, including a lighter `favorite-btn`:

```css
.favorite {
  width: 192rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  border: 0;
  background: #e9f8fb;
  color: #0f766e;
}

.favorite--active {
  background: linear-gradient(135deg, #0891b2, #14b8a6);
  color: #ffffff;
}
```

- [ ] **Step 4: Verify reusable component consistency**

Run:

```powershell
Get-Content -Raw 'components\place-card\place-card.wxml'
Get-Content -Raw 'components\study-card\study-card.wxml'
Get-Content -Raw 'components\notice-item\notice-item.wxml'
Get-Content -Raw 'components\empty-state\empty-state.wxml'
```

Expected:

- components use shared class naming conventions
- component structure is cleaner and more layered than before
- no logic-binding attributes are removed by accident

## Task 5: Align Secondary Pages

**Files:**
- Modify: `pages/service/service.wxml`
- Modify: `pages/service/service.wxss`
- Modify: `pages/notice/notice.wxml`
- Modify: `pages/notice/notice.wxss`
- Modify: `pages/favorite/favorite.wxml`
- Modify: `pages/favorite/favorite.wxss`
- Modify: `pages/studyHistory/studyHistory.wxml`
- Modify: `pages/studyHistory/studyHistory.wxss`
- Modify: `pages/placeDetail/placeDetail.wxml`
- Modify: `pages/placeDetail/placeDetail.wxss`
- Modify: `pages/studyDetail/studyDetail.wxml`
- Modify: `pages/studyDetail/studyDetail.wxss`
- Modify: `pages/noticeDetail/noticeDetail.wxml`
- Modify: `pages/noticeDetail/noticeDetail.wxss`

- [ ] **Step 1: Add light page headers to list-style secondary pages**

For `service`, `notice`, `favorite`, and `studyHistory`, add a compact top header block before filters or list content:

```xml
<view class="page-head page-head--compact card">
  <view class="page-head__title">校园服务</view>
  <view class="page-head__desc">按服务类型快速查看学习、生活和活动支持信息。</view>
</view>
```

Keep existing loops and navigation bindings.

- [ ] **Step 2: Upgrade detail pages to match the new visual language**

For `placeDetail`, `studyDetail`, and `noticeDetail`, convert the top area into a stronger detail hero plus refined body cards:

```xml
<view class="detail-hero card">
  <view class="detail-hero__eyebrow">{{detail.type}}</view>
  <view class="detail-hero__title">{{detail.name}}</view>
  <view class="detail-hero__desc">{{detail.description}}</view>
</view>
```

Keep existing `favorite-btn`, detail fields, and action buttons, but place them inside calmer information sections.

- [ ] **Step 3: Replace secondary page styles with the shared card rhythm**

Add or replace styles so tabs, filters, detail bodies, and history/favorite cards use the same radius, shadow, spacing, and metadata styling introduced in the shared system.

- [ ] **Step 4: Verify secondary page structure**

Run:

```powershell
Get-Content -Raw 'pages\service\service.wxml'
Get-Content -Raw 'pages\favorite\favorite.wxml'
Get-Content -Raw 'pages\placeDetail\placeDetail.wxml'
Get-Content -Raw 'pages\studyDetail\studyDetail.wxml'
Get-Content -Raw 'pages\noticeDetail\noticeDetail.wxml'
```

Expected:

- each page begins with a clearer top block
- detail pages no longer open directly into plain content blocks
- existing navigation and favorite controls remain present

## Task 6: Syntax and Completion Verification

**Files:**
- Verify all touched WXML, WXSS, and JS files

- [ ] **Step 1: Run a syntax scan for changed markup and scripts**

Run:

```powershell
@'
const fs = require('fs');
const path = require('path');

const files = [
  'app.wxss',
  'pages/index/index.wxml',
  'pages/index/index.wxss',
  'pages/map/map.wxml',
  'pages/map/map.wxss',
  'pages/study/study.wxml',
  'pages/study/study.wxss',
  'pages/user/user.wxml',
  'pages/user/user.wxss',
  'components/place-card/place-card.wxml',
  'components/place-card/place-card.wxss',
  'components/study-card/study-card.wxml',
  'components/study-card/study-card.wxss',
  'components/notice-item/notice-item.wxml',
  'components/notice-item/notice-item.wxss',
  'components/empty-state/empty-state.wxml',
  'components/empty-state/empty-state.wxss',
  'components/favorite-btn/favorite-btn.wxss',
  'pages/service/service.wxml',
  'pages/service/service.wxss',
  'pages/notice/notice.wxml',
  'pages/notice/notice.wxss',
  'pages/favorite/favorite.wxml',
  'pages/favorite/favorite.wxss',
  'pages/studyHistory/studyHistory.wxml',
  'pages/studyHistory/studyHistory.wxss',
  'pages/placeDetail/placeDetail.wxml',
  'pages/placeDetail/placeDetail.wxss',
  'pages/studyDetail/studyDetail.wxml',
  'pages/studyDetail/studyDetail.wxss',
  'pages/noticeDetail/noticeDetail.wxml',
  'pages/noticeDetail/noticeDetail.wxss'
];

for (const file of files) {
  const full = path.resolve(file);
  const text = fs.readFileSync(full, 'utf8');
  if (!text.trim()) {
    throw new Error(`Empty file: ${file}`);
  }
}

console.log(`Checked ${files.length} files`);
'@ | node -
```

Expected:

- command exits with code 0
- output shows `Checked 32 files`

- [ ] **Step 2: Review changed files for the design checklist**

Run:

```powershell
Get-Content -Raw 'app.wxss'
Get-Content -Raw 'pages\index\index.wxss'
Get-Content -Raw 'pages\user\user.wxss'
```

Expected:

- no leftover legacy styling dominates the shared look
- core page styles clearly reflect the new card system
- no accidental truncation or malformed patch content appears

- [ ] **Step 3: Record environment constraints**

Document in the implementation summary:

- no git repository is available, so no commit-based checkpoints can be produced
- no automated Mini Program test suite exists, so verification is limited to static syntax checks and source inspection in this environment
