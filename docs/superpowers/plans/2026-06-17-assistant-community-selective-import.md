# Assistant And Community Selective Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local AI assistant and community module to the current enterprise-demo Mini Program without replacing the existing four-tab app structure.

**Architecture:** Keep the current native Mini Program shell, request facade, and enterprise-demo visual system. Import the external contribution as focused local modules and pages, then connect them through compact entry points from the existing homepage and user center.

**Tech Stack:** WeChat Mini Program native WXML/WXSS/JavaScript, CommonJS utility modules, local storage helpers, Node smoke tests.

---

## File Structure

- Create `utils/aiEngine.js`: deterministic assistant Q&A rules aligned to current campus-helper copy.
- Create `utils/communityData.js`: seeded feed and marketplace posts.
- Create `utils/communityStore.js`: storage-backed likes, comments, replies, publish flow, and seeded-post merge logic.
- Create `pages/assistant/*`: standalone assistant chat page.
- Create `pages/community/*`: community list page.
- Create `pages/community-detail/*`: post detail page with comments and replies.
- Create `pages/community-post/*`: publish page for feed and marketplace posts.
- Create `components/ai-fab/*`: floating assistant entry only if it fits current UX constraints after tests stay green.
- Modify `app.json`: register new pages, keep current four-tab structure unchanged.
- Modify `utils/services/homeService.js`: expose one compact assistant/community entry block for the homepage.
- Modify `pages/index/index.js`, `pages/index/index.json`, `pages/index/index.wxml`, `pages/index/index.wxss`: add compact entry UI without breaking the current line budget.
- Modify `pages/user/user.js`, `pages/user/user.wxml`, `pages/user/user.wxss`: add compact assistant/community access in the current account hub.
- Modify `tests/request-services.test.js`: cover home-data assistant/community entry exposure.
- Create `tests/assistant-community-import.test.js`: page registration and compact IA assertions.
- Modify `tests/utils-smoke.test.js`: cover community persistence regression and assistant/community storage behavior.
- Modify `tests/page-slimming.test.js` and `tests/secondary-page-slimming.test.js` only if line budgets need a small, explicit update.

## Task 1: Page Registration And Home Data Contract

**Files:**
- Create: `tests/assistant-community-import.test.js`
- Modify: `tests/request-services.test.js`
- Modify: `app.json`
- Modify: `utils/services/homeService.js`

- [ ] **Step 1: Write the failing structure test**

```javascript
runTest('assistant/community pages are registered without changing the four-tab layout', () => {
  const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  assert.ok(appConfig.pages.includes('pages/assistant/assistant'));
  assert.ok(appConfig.pages.includes('pages/community/community'));
  assert.ok(appConfig.pages.includes('pages/community-detail/community-detail'));
  assert.ok(appConfig.pages.includes('pages/community-post/community-post'));
  assert.equal(appConfig.tabBar.list.length, 4);
  assert.ok(!appConfig.tabBar.list.some((item) => item.pagePath === 'pages/community/community'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/assistant-community-import.test.js`
Expected: FAIL because the new pages are not yet registered.

- [ ] **Step 3: Write the failing home-data test**

```javascript
runTest('home data exposes one compact assistant/community entry group', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const homeService = require('../utils/services/homeService');

  const data = homeService.buildHomeData();
  assert.ok(data.helperEntry);
  assert.equal(data.helperEntry.assistantUrl, '/pages/assistant/assistant');
  assert.equal(data.helperEntry.communityUrl, '/pages/community/community');
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `node tests/request-services.test.js`
Expected: FAIL because `helperEntry` does not exist yet.

- [ ] **Step 5: Implement minimal config and service changes**

```json
{
  "pages": [
    "pages/index/index",
    "pages/map/map",
    "pages/placeDetail/placeDetail",
    "pages/survivalRoute/survivalRoute",
    "pages/service/service",
    "pages/study/study",
    "pages/studyDetail/studyDetail",
    "pages/notice/notice",
    "pages/noticeDetail/noticeDetail",
    "pages/user/user",
    "pages/operations/operations",
    "pages/favorite/favorite",
    "pages/studyHistory/studyHistory",
    "pages/assistant/assistant",
    "pages/community/community",
    "pages/community-detail/community-detail",
    "pages/community-post/community-post"
  ]
}
```

```javascript
return {
  // existing fields...
  helperEntry: {
    title: '校园互助',
    assistantLabel: '智能助手',
    assistantUrl: '/pages/assistant/assistant',
    communityLabel: '校园圈',
    communityUrl: '/pages/community/community'
  }
};
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node tests/assistant-community-import.test.js`
Expected: PASS

Run: `node tests/request-services.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app.json utils/services/homeService.js tests/assistant-community-import.test.js tests/request-services.test.js
git commit -m "test: lock assistant and community app registration"
```

## Task 2: Community Storage And Regression Fix

**Files:**
- Create: `utils/communityData.js`
- Create: `utils/communityStore.js`
- Modify: `tests/utils-smoke.test.js`

- [ ] **Step 1: Write the failing storage tests**

```javascript
runTest('communityStore keeps seeded-post replies after reload', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');
  userManager.login({ studentId: '20260001', name: '同学甲', role: 'student' });

  let communityStore = require('../utils/communityStore');
  const seededPost = communityStore.getPostsByType('feed')[0];
  const seededComment = communityStore.getMergedComments(seededPost.id)[0];
  const result = communityStore.addReply(seededPost.id, seededComment.id, '收到', seededComment.author.name);
  assert.equal(result.code, 0);

  delete require.cache[require.resolve('../utils/communityStore')];
  communityStore = require('../utils/communityStore');
  const reloaded = communityStore.getMergedComments(seededPost.id);
  assert.ok(reloaded[0].replies.some((reply) => reply.content === '收到'));
});
```

```javascript
runTest('communityStore scopes custom posts by logged-in user', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');
  const communityStore = require('../utils/communityStore');

  userManager.login({ studentId: '20260001', name: '同学甲', role: 'student' });
  assert.equal(communityStore.createPost({ type: 'feed', content: '你好校园' }).code, 0);
  assert.ok(communityStore.getAllPosts().some((item) => item.content === '你好校园'));

  userManager.login({ studentId: '20260002', name: '同学乙', role: 'student' });
  assert.ok(!communityStore.getAllPosts().some((item) => item.content === '你好校园'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/utils-smoke.test.js`
Expected: FAIL because `communityStore` does not exist yet.

- [ ] **Step 3: Write minimal seeded data and store implementation**

```javascript
const storage = require('./storage');
const userManager = require('./userManager');
const { seededPosts } = require('./communityData');

function getUserKey(suffix) {
  const user = userManager.getUser() || {};
  return 'community:' + (user.studentId || 'guest') + ':' + suffix;
}
```

```javascript
function getMergedComments(postId) {
  const seeded = cloneSeededPost(postId).comments || [];
  const extra = storage.get(getUserKey('comments:' + postId), []);
  const replyBuckets = storage.get(getUserKey('replies:' + postId), {});

  return seeded.map((comment) => ({
    ...comment,
    replies: [...(comment.replies || []), ...(replyBuckets[comment.id] || [])]
  })).concat(extra);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/utils-smoke.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add utils/communityData.js utils/communityStore.js tests/utils-smoke.test.js
git commit -m "feat: add storage-backed community store"
```

## Task 3: Community Pages And Compact Entry Points

**Files:**
- Create: `pages/community/community.js`
- Create: `pages/community/community.json`
- Create: `pages/community/community.wxml`
- Create: `pages/community/community.wxss`
- Create: `pages/community-detail/community-detail.js`
- Create: `pages/community-detail/community-detail.json`
- Create: `pages/community-detail/community-detail.wxml`
- Create: `pages/community-detail/community-detail.wxss`
- Create: `pages/community-post/community-post.js`
- Create: `pages/community-post/community-post.json`
- Create: `pages/community-post/community-post.wxml`
- Create: `pages/community-post/community-post.wxss`
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.json`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`
- Modify: `pages/user/user.js`
- Modify: `pages/user/user.wxml`
- Modify: `pages/user/user.wxss`
- Modify: `tests/page-slimming.test.js`
- Modify: `tests/secondary-page-slimming.test.js`

- [ ] **Step 1: Write failing compact-entry tests**

```javascript
runTest('homepage and user page expose compact community entry points', () => {
  const indexWxml = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
  const userWxml = fs.readFileSync(path.join(root, 'pages/user/user.wxml'), 'utf8');

  assert.ok(indexWxml.includes('校园互助'));
  assert.ok(indexWxml.includes('/pages/community/community'));
  assert.ok(userWxml.includes('校园圈'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/assistant-community-import.test.js`
Expected: FAIL because the compact entry UI does not exist yet.

- [ ] **Step 3: Implement minimal community pages**

```javascript
Page({
  data: {
    tabs: [
      { label: '全部', value: 'all' },
      { label: '动态', value: 'feed' },
      { label: '集市', value: 'marketplace' }
    ],
    currentTab: 'all',
    list: []
  },
  onShow() {
    this.loadData();
  },
  loadData() {
    this.setData({ list: communityStore.getPostsByType(this.data.currentTab) });
  }
});
```

```xml
<view class="helper-entry card">
  <view class="helper-entry__body">
    <view class="helper-entry__label">{{helperEntry.title}}</view>
    <view class="helper-entry__desc">问路线、发求助、看二手与校园动态</view>
  </view>
  <view class="helper-entry__actions">
    <text data-url="{{helperEntry.assistantUrl}}" bindtap="openQuickAction">助手</text>
    <text data-url="{{helperEntry.communityUrl}}" bindtap="openQuickAction">校园圈</text>
  </view>
</view>
```

- [ ] **Step 4: Keep detail-page bindings explicit**

```xml
<input
  class="comment-bar__input"
  value="{{inputValue}}"
  bindinput="handleCommentInput"
  bindconfirm="handleSubmit"
/>
```

```javascript
handleSubmit() {
  if (this.data.mode === 'reply') {
    this.submitReply();
    return;
  }
  this.submitComment();
}
```

- [ ] **Step 5: Run focused tests**

Run: `node tests/assistant-community-import.test.js`
Expected: PASS

Run: `node tests/page-slimming.test.js`
Expected: PASS, or fail only on explicit line-budget changes that are then updated deliberately.

Run: `node tests/secondary-page-slimming.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pages/community pages/community-detail pages/community-post pages/index pages/user tests/assistant-community-import.test.js tests/page-slimming.test.js tests/secondary-page-slimming.test.js
git commit -m "feat: add community pages and compact entry points"
```

## Task 4: Assistant Engine, Page, And Entry Points

**Files:**
- Create: `utils/aiEngine.js`
- Create: `pages/assistant/assistant.js`
- Create: `pages/assistant/assistant.json`
- Create: `pages/assistant/assistant.wxml`
- Create: `pages/assistant/assistant.wxss`
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.json`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`
- Modify: `pages/user/user.js`
- Modify: `pages/user/user.wxml`
- Modify: `pages/user/user.wxss`

- [ ] **Step 1: Write failing assistant-page tests**

```javascript
runTest('assistant page is student-facing and does not claim real AI integration', () => {
  const assistantWxml = fs.readFileSync(path.join(root, 'pages/assistant/assistant.wxml'), 'utf8');
  const aiEngine = require('../utils/aiEngine');

  assert.ok(assistantWxml.includes('校园助手'));
  assert.ok(aiEngine.quickQuestions.length >= 4);
  assert.equal(aiEngine.ask('图书馆在哪').answer.includes('API'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/assistant-community-import.test.js`
Expected: FAIL because assistant page and engine do not exist yet.

- [ ] **Step 3: Implement the minimal engine and page**

```javascript
const knowledgeBase = [
  { keywords: ['图书馆', '自习'], answer: '可以先打开导览页搜索图书馆，再直接导航。' },
  { keywords: ['报修', '网络'], answer: '去服务页的网络报修入口，能直接看到处理步骤。' }
];
```

```javascript
sendMessage() {
  const text = (this.data.inputText || '').trim();
  if (!text || this.data.isThinking) return;
  const result = aiEngine.ask(text);
  this.addMessage('assistant', result.answer);
}
```

- [ ] **Step 4: Run focused tests**

Run: `node tests/assistant-community-import.test.js`
Expected: PASS

Run: `node tests/request-services.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add utils/aiEngine.js pages/assistant pages/index pages/user tests/assistant-community-import.test.js tests/request-services.test.js
git commit -m "feat: add assistant page and helper entry"
```

## Task 5: Floating Assistant Button And Full Verification

**Files:**
- Create: `components/ai-fab/ai-fab.js`
- Create: `components/ai-fab/ai-fab.json`
- Create: `components/ai-fab/ai-fab.wxml`
- Create: `components/ai-fab/ai-fab.wxss`
- Modify: `pages/index/index.json`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`
- Modify: `tests/assistant-community-import.test.js`

- [ ] **Step 1: Write the failing floating-entry test**

```javascript
runTest('homepage floating assistant entry stays compact and component-driven', () => {
  const indexJson = JSON.parse(fs.readFileSync(path.join(root, 'pages/index/index.json'), 'utf8'));
  const indexWxml = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');

  assert.equal(indexJson.usingComponents['ai-fab'], '/components/ai-fab/ai-fab');
  assert.ok(indexWxml.includes('<ai-fab'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/assistant-community-import.test.js`
Expected: FAIL because the component is not registered yet.

- [ ] **Step 3: Implement viewport-safe floating behavior**

```javascript
const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: 375, windowHeight: 667 };
const rpxRatio = 750 / (systemInfo.windowWidth || 375);
const maxX = Math.max(20, 750 - 110);
const maxY = Math.max(140, Math.round((systemInfo.windowHeight || 667) * rpxRatio) - 220);
```

- [ ] **Step 4: Run full verification**

Run: `node tests/assistant-community-import.test.js`
Expected: PASS

Run: `npm test`
Expected: all smoke tests pass

- [ ] **Step 5: Commit**

```bash
git add components/ai-fab pages/index tests/assistant-community-import.test.js
git commit -m "feat: add compact floating assistant entry"
```
