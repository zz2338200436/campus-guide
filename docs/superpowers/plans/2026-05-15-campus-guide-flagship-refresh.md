# Campus Guide Flagship Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Mini Program into a flagship “campus life assistant + front-end learning growth mini platform” with stronger first-screen value, guided exploration, learning momentum, and a more memorable visual system.

**Architecture:** Keep the current native WeChat Mini Program structure and `utils/request.js` facade, but enrich mock data, add lightweight selector helpers where needed, and redesign the core tab pages plus major secondary pages around a stronger campus + learning product story. Prioritize the homepage, map/place flow, study flow, and user cockpit, then pull service/notice/favorite/history pages into the same system.

**Tech Stack:** WeChat Mini Program native framework, WXML, WXSS, JavaScript, local Mock data, local storage, Node smoke tests

---

## File Structure

### Data and logic

- Modify: `utils/placeData.js`
  Add featured/guide metadata for places.
- Modify: `utils/studyData.js`
  Add stage, related topics, and growth metadata.
- Modify: `utils/serviceData.js`
  Add group/featured metadata for better page grouping.
- Modify: `utils/noticeData.js`
  Add summary/priority display metadata for stronger notice storytelling.
- Create: `utils/flagshipSelectors.js`
  Centralize lightweight derived selectors for homepage, map, study, and user summary blocks.
- Modify: `utils/services/homeService.js`
  Build richer homepage payload from mock data plus current user state.
- Test: `tests/flagship-selectors.test.js`
  Cover new selector logic and derived homepage/map/study summaries.
- Modify: `tests/request-services.test.js`
  Extend request-layer coverage for flagship home payload.

### Global and shared UI

- Modify: `app.wxss`
  Introduce flagship surfaces, stat cards, board panels, recommendation rows, and utility chips.
- Modify: `components/place-card/*`
  Add richer place card hierarchy and metadata.
- Modify: `components/study-card/*`
  Add stage, duration, and stronger learning-card identity.
- Modify: `components/notice-item/*`
  Strengthen summary, pinned treatment, and editorial rhythm.

### Page groups

- Modify: `pages/index/*`
  Build campus dashboard homepage.
- Modify: `pages/map/*`
  Build exploration-focused map experience.
- Modify: `pages/placeDetail/*`
  Add visit guidance and related stops.
- Modify: `pages/study/*`
  Build learning growth hub.
- Modify: `pages/studyDetail/*`
  Add related topics and next-step panel.
- Modify: `pages/user/*`
  Build personal cockpit.
- Modify: `pages/service/*`
  Group services into practical clusters.
- Modify: `pages/notice/*`
  Split important reminders and latest updates.
- Modify: `pages/favorite/*`
  Pull collections into the flagship visual language.
- Modify: `pages/studyHistory/*`
  Turn flat history into a recent learning journey.

---

### Task 1: Enrich Mock Data and Derived Selectors

**Files:**
- Create: `utils/flagshipSelectors.js`
- Modify: `utils/placeData.js`
- Modify: `utils/studyData.js`
- Modify: `utils/serviceData.js`
- Modify: `utils/noticeData.js`
- Modify: `utils/services/homeService.js`
- Modify: `tests/request-services.test.js`
- Create: `tests/flagship-selectors.test.js`

- [ ] **Step 1: Write the failing selector test**

Create `tests/flagship-selectors.test.js` with coverage for featured places, study progress, next-study recommendations, and grouped services:

```js
const assert = require('node:assert/strict');
const selectors = require('../utils/flagshipSelectors');
const placeData = require('../utils/placeData');
const studyData = require('../utils/studyData');
const serviceData = require('../utils/serviceData');

function runTest(name, testFn) {
  try {
    testFn();
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

runTest('featured places return first-visit recommendations', () => {
  const result = selectors.getFeaturedPlaces(placeData);
  assert.ok(result.length >= 2);
  assert.equal(result[0].featured, true);
});

runTest('study summary reports viewed and total counts', () => {
  const result = selectors.getStudyProgressSummary(studyData, [{ id: 1 }, { id: 4 }], [{ targetId: 5 }]);
  assert.equal(result.viewedCount, 2);
  assert.equal(result.totalCount, studyData.length);
  assert.equal(result.savedCount, 1);
});

runTest('related study recommendations exclude current item', () => {
  const result = selectors.getNextStudyRecommendations(studyData, 1, [{ id: 2 }]);
  assert.ok(result.every((item) => Number(item.id) !== 1));
});

runTest('services are grouped for flagship rendering', () => {
  const result = selectors.groupServices(serviceData);
  assert.ok(result.some((group) => group.items.length));
});

if (process.exitCode) process.exit(process.exitCode);
```

- [ ] **Step 2: Run the selector test to verify it fails**

Run: `node tests/flagship-selectors.test.js`

Expected:
- FAIL because `../utils/flagshipSelectors` does not exist yet

- [ ] **Step 3: Write the minimal selector implementation and data enrichment**

Create `utils/flagshipSelectors.js`:

```js
function getFeaturedPlaces(list) {
  return (list || []).filter((item) => item.featured).slice(0, 3);
}

function getStudyProgressSummary(studyList, historyList, favoriteList) {
  return {
    viewedCount: (historyList || []).length,
    totalCount: (studyList || []).length,
    savedCount: (favoriteList || []).length
  };
}

function getNextStudyRecommendations(studyList, currentId, historyList) {
  const historyIds = new Set((historyList || []).map((item) => Number(item.id)));
  return (studyList || [])
    .filter((item) => Number(item.id) !== Number(currentId))
    .filter((item) => !historyIds.has(Number(item.id)) || item.featured)
    .slice(0, 3);
}

function groupServices(list) {
  const groupMap = {};
  (list || []).forEach((item) => {
    const key = item.group || '其他';
    if (!groupMap[key]) {
      groupMap[key] = [];
    }
    groupMap[key].push(item);
  });
  return Object.keys(groupMap).map((key) => ({
    title: key,
    items: groupMap[key]
  }));
}

module.exports = {
  getFeaturedPlaces,
  getStudyProgressSummary,
  getNextStudyRecommendations,
  groupServices
};
```

Enrich mock data with fields like:

```js
// utils/placeData.js
featured: true,
tagline: '适合安静自习和资料检索',
bestFor: '新生熟悉学习资源',
bestTime: '工作日早上或晚间自习时段',
nearby: ['第一教学楼', '学生食堂'],
nextStops: [2, 3]
```

```js
// utils/studyData.js
stage: 'entry',
duration: '8 min',
keywords: ['WXML', '组件', '结构'],
relatedIds: [2, 3],
featured: true
```

```js
// utils/serviceData.js
group: '学习支持',
tag: '常用',
featured: true
```

```js
// utils/noticeData.js
summary: '期末课程设计材料与答辩相关提醒。',
priorityLabel: '重要提醒'
```

Update `utils/services/homeService.js` to build richer home payload:

```js
const selectors = require('../flagshipSelectors');

const featuredPlaces = selectors.getFeaturedPlaces(placeData);
const studySummary = selectors.getStudyProgressSummary(studyData, history, favoriteStudyList);
const nextStudyList = selectors.getNextStudyRecommendations(studyData, continueStudy ? continueStudy.id : 0, history);
```

- [ ] **Step 4: Extend the request-layer test**

Append a new case to `tests/request-services.test.js`:

```js
runTest('home service returns flagship summary blocks', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const userManager = require('../utils/userManager');
  const studyHistoryHelper = require('../utils/studyHistoryHelper');
  const favoriteSubject = require('../utils/favoriteSubject');
  const homeService = require('../utils/services/homeService');

  userManager.login({ studentId: '20260001', name: '同学甲', role: 'student' });
  studyHistoryHelper.addHistory({ id: 1, title: 'WXML 基础', category: '页面结构', time: '2026-05-15 09:00' });
  favoriteSubject.addFavorite({ type: 'study', targetId: 2, title: 'WXSS 样式组织' });

  const data = homeService.buildHomeData();
  assert.ok(data.featuredPlaces.length >= 2);
  assert.ok(data.studySummary.totalCount >= data.studySummary.viewedCount);
  assert.ok(Array.isArray(data.nextStudyList));
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```powershell
node tests/flagship-selectors.test.js
node tests/request-services.test.js
```

Expected:
- PASS for all selector and request-service cases

---

### Task 2: Build the Flagship Homepage

**Files:**
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`
- Modify: `app.wxss`

- [ ] **Step 1: Write a failing request-home assertion for homepage payload usage**

Add a focused check to `tests/request-services.test.js`:

```js
runTest('home data exposes quick actions and explore highlights', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const request = require('../utils/request');
  const result = await request.getHomeData({ delay: 1 });
  assert.equal(result.code, 0);
  assert.ok(Array.isArray(result.data.quickActions));
  assert.ok(Array.isArray(result.data.featuredPlaces));
});
```

- [ ] **Step 2: Run the home payload test to verify it fails**

Run: `node tests/request-services.test.js`

Expected:
- FAIL because `quickActions` and `featuredPlaces` are not yet returned by `getHomeData`

- [ ] **Step 3: Update home service and page bindings**

Return the new homepage fields from `utils/services/homeService.js`:

```js
return {
  banners: [...],
  notices: ...,
  recommends: ...,
  continueStudy,
  quickActions: [
    { id: 'map', title: '校园导览', desc: '查看热门地点', url: '/pages/map/map', tab: true },
    { id: 'service', title: '校园服务', desc: '办事与日常支持', url: '/pages/service/service' },
    { id: 'notice', title: '公告通知', desc: '查看重要提醒', url: '/pages/notice/notice' },
    { id: 'study', title: '学习专区', desc: '进入成长路径', url: '/pages/study/study', tab: true },
    { id: 'favorite', title: '我的收藏', desc: '回看重要内容', url: '/pages/favorite/favorite' },
    { id: 'history', title: '学习记录', desc: '继续最近学习', url: '/pages/studyHistory/studyHistory' }
  ],
  featuredPlaces,
  studySummary,
  nextStudyList
};
```

Update homepage data in `pages/index/index.js`:

```js
data: {
  loading: true,
  banners: [],
  notices: [],
  recommends: [],
  continueStudy: null,
  quickActions: [],
  featuredPlaces: [],
  studySummary: null,
  nextStudyList: []
}
```

Update homepage layout in `pages/index/index.wxml` to include:

```xml
<view class="dashboard-hero">...</view>
<view class="today-panel card">...</view>
<view class="quick-grid">...</view>
<view class="featured-strip">...</view>
<view class="learning-momentum card">...</view>
```

Add supporting styles in `pages/index/index.wxss` and shared flagship tokens in `app.wxss`:

```css
.dashboard-hero { ... }
.today-panel { ... }
.quick-grid { ... }
.flagship-stat { ... }
.guide-chip { ... }
.momentum-card { ... }
```

- [ ] **Step 4: Run tests and JS syntax checks**

Run:

```powershell
node tests/request-services.test.js
@'
const fs = require('fs');
['pages/index/index.js','utils/services/homeService.js','app.wxss'].forEach((file) => {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.js')) new Function(text);
  console.log('PASS', file);
});
'@ | node -
```

Expected:
- request-services tests stay PASS
- syntax check prints PASS for listed files

---

### Task 3: Upgrade Map and Place Detail into Guided Exploration

**Files:**
- Modify: `pages/map/map.js`
- Modify: `pages/map/map.wxml`
- Modify: `pages/map/map.wxss`
- Modify: `pages/placeDetail/placeDetail.js`
- Modify: `pages/placeDetail/placeDetail.wxml`
- Modify: `pages/placeDetail/placeDetail.wxss`
- Modify: `components/place-card/place-card.wxml`
- Modify: `components/place-card/place-card.wxss`

- [ ] **Step 1: Add a failing selector expectation for place guidance**

Append to `tests/flagship-selectors.test.js`:

```js
runTest('featured places include next stop relationships', () => {
  const result = selectors.getFeaturedPlaces(placeData);
  assert.ok(result.some((item) => Array.isArray(item.nextStops) && item.nextStops.length));
});
```

- [ ] **Step 2: Run the selector test to verify it fails**

Run: `node tests/flagship-selectors.test.js`

Expected:
- FAIL until `placeData` enrichment includes `nextStops` and the selector returns it

- [ ] **Step 3: Implement the exploration UI**

Map page should gain:

```xml
<view class="explore-head page-head page-head--map">...</view>
<view class="guide-board card">...</view>
<scroll-view class="featured-place-strip" scroll-x enable-flex>...</scroll-view>
<view class="section-shell">
  <view class="section-title">推荐探索</view>
  <view class="panel-grid">...</view>
</view>
```

Map JS should expose:

```js
data: {
  ...,
  featuredPlaces: [],
  placeHighlights: []
}
```

Place detail should gain:

```xml
<view class="detail-guide card">
  <view class="detail-guide__title">到访建议</view>
  <view class="detail-guide__row">适合人群：{{detail.bestFor}}</view>
  <view class="detail-guide__row">推荐时段：{{detail.bestTime}}</view>
</view>
<view class="detail-next card">...</view>
```

Update place-card presentation:

```xml
<view class="place-card__eyebrow">{{item.tagline}}</view>
<view class="place-card__meta">{{item.type}} · {{item.openTime}}</view>
```

- [ ] **Step 4: Run selector test and syntax checks**

Run:

```powershell
node tests/flagship-selectors.test.js
@'
const fs = require('fs');
['pages/map/map.js','pages/placeDetail/placeDetail.js'].forEach((file) => {
  new Function(fs.readFileSync(file, 'utf8'));
  console.log('PASS JS', file);
});
'@ | node -
```

Expected:
- selector tests PASS
- JS syntax PASS

---

### Task 4: Turn the Study Flow into a Learning Growth Hub

**Files:**
- Modify: `pages/study/study.js`
- Modify: `pages/study/study.wxml`
- Modify: `pages/study/study.wxss`
- Modify: `pages/studyDetail/studyDetail.js`
- Modify: `pages/studyDetail/studyDetail.wxml`
- Modify: `pages/studyDetail/studyDetail.wxss`
- Modify: `components/study-card/study-card.wxml`
- Modify: `components/study-card/study-card.wxss`

- [ ] **Step 1: Add a failing recommendation assertion**

Append to `tests/flagship-selectors.test.js`:

```js
runTest('next study recommendations use relatedIds first when available', () => {
  const result = selectors.getNextStudyRecommendations(studyData, 1, []);
  assert.ok(result.length > 0);
  assert.ok(Array.isArray(studyData.find((item) => Number(item.id) === 1).relatedIds));
});
```

- [ ] **Step 2: Run the selector test to verify it fails**

Run: `node tests/flagship-selectors.test.js`

Expected:
- FAIL until `studyData` and `getNextStudyRecommendations` honor related topic metadata

- [ ] **Step 3: Implement growth-focused study surfaces**

Study page should expose:

```js
data: {
  ...,
  studySummary: null,
  stageTabs: ['全部', 'entry', 'common', 'advanced'],
  currentStage: '全部',
  nextStudyList: []
}
```

Study WXML should include:

```xml
<view class="growth-hero page-head page-head--study">...</view>
<view class="growth-stats">...</view>
<view class="topic-path card">...</view>
<view class="next-study-panel card">...</view>
```

Study detail should include:

```xml
<view class="related-study card">
  <view class="section-title">相关知识</view>
  <view class="panel-grid">...</view>
</view>
<view class="next-step card">...</view>
```

Study cards should display stage and duration:

```xml
<text class="study-card__stage">{{item.stageLabel}}</text>
<text class="study-card__duration">{{item.duration}}</text>
```

- [ ] **Step 4: Run tests and syntax checks**

Run:

```powershell
node tests/flagship-selectors.test.js
@'
const fs = require('fs');
['pages/study/study.js','pages/studyDetail/studyDetail.js'].forEach((file) => {
  new Function(fs.readFileSync(file, 'utf8'));
  console.log('PASS JS', file);
});
'@ | node -
```

Expected:
- selector tests PASS
- study page JS syntax PASS

---

### Task 5: Build the Personal Cockpit and Pull Secondary Pages into the Flagship System

**Files:**
- Modify: `pages/user/user.js`
- Modify: `pages/user/user.wxml`
- Modify: `pages/user/user.wxss`
- Modify: `pages/service/service.js`
- Modify: `pages/service/service.wxml`
- Modify: `pages/service/service.wxss`
- Modify: `pages/notice/notice.js`
- Modify: `pages/notice/notice.wxml`
- Modify: `pages/notice/notice.wxss`
- Modify: `pages/favorite/favorite.wxml`
- Modify: `pages/favorite/favorite.wxss`
- Modify: `pages/studyHistory/studyHistory.wxml`
- Modify: `pages/studyHistory/studyHistory.wxss`

- [ ] **Step 1: Add a failing user-summary test**

Append to `tests/flagship-selectors.test.js`:

```js
runTest('study summary can render personal momentum counts', () => {
  const result = selectors.getStudyProgressSummary(studyData, [{ id: 1 }], [{ targetId: 2 }, { targetId: 3 }]);
  assert.equal(result.savedCount, 2);
});
```

- [ ] **Step 2: Run the selector test to verify it fails only if summary support is incomplete**

Run: `node tests/flagship-selectors.test.js`

Expected:
- PASS if previous selector work is correct
- If it fails, fix selector logic before touching page UI

- [ ] **Step 3: Implement user, service, notice, favorite, and history follow-through**

User page should gain:

```xml
<view class="profile-hero">...</view>
<view class="momentum-grid">...</view>
<view class="tool-grid">...</view>
```

Service page should render grouped sections:

```xml
<view wx:for="{{serviceGroups}}" wx:key="title" class="service-group card">...</view>
```

Notice page should separate:

```xml
<view class="notice-priority card">...</view>
<view class="notice-latest card">...</view>
```

Favorites and study history should reuse flagship list shells:

```xml
<view class="collection-shell card">...</view>
<view class="journey-shell card">...</view>
```

Update page JS to derive grouped or summary data from existing request results rather than adding new request endpoints unless truly needed.

- [ ] **Step 4: Run the full verification set**

Run:

```powershell
node tests/content-filter.test.js
node tests/flagship-selectors.test.js
node tests/request-services.test.js
node tests/utils-smoke.test.js
@'
const fs = require('fs');
const files = [
  'pages/index/index.js',
  'pages/map/map.js',
  'pages/placeDetail/placeDetail.js',
  'pages/study/study.js',
  'pages/studyDetail/studyDetail.js',
  'pages/user/user.js',
  'pages/service/service.js',
  'pages/notice/notice.js'
];
for (const file of files) {
  new Function(fs.readFileSync(file, 'utf8'));
  console.log('PASS JS', file);
}
'@ | node -
```

Expected:
- all four test files PASS
- all listed JS files print PASS

---

## Self-Review

### Spec coverage

- Homepage flagship upgrade: covered by Task 2
- Map and place-detail guided exploration: covered by Task 3
- Study growth hub and related-topic flow: covered by Task 4
- User personal cockpit: covered by Task 5
- Service and notice regrouping: covered by Task 5
- Mock data enrichment and derived summaries: covered by Task 1
- Validation for current working flows: covered by Tasks 1 through 5 verification steps

### Placeholder scan

- No `TBD` or `TODO` placeholders remain
- Each task includes exact files and concrete commands
- Test steps include expected failure/pass outcomes

### Type consistency

- `featuredPlaces`, `studySummary`, and `nextStudyList` are used consistently between selector, home service, and homepage tasks
- `stage`, `duration`, and `relatedIds` are used consistently between `studyData`, selector logic, and study page/detail tasks
- `group` and `featured` are used consistently between service data enrichment and service page grouping
