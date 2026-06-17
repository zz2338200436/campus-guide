# Campus Community Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the existing `校园圈` feed, detail, and publish pages so they read as one finished community module while staying inside the current Mini Program shell and visual system.

**Architecture:** Keep the current WeChat Mini Program page structure and storage-backed `communityStore` model. Add only the minimum new store APIs needed for overview counts, normalized post display, and publish validation, then rebuild the three community pages around that shared data contract.

**Tech Stack:** WeChat Mini Program native WXML/WXSS/JavaScript, CommonJS utility modules, local storage helpers, Node smoke tests.

---

## File Structure

- Modify `utils/communityData.js`: expand seed content so the refreshed feed has enough variety for `动态` and `集市`.
- Modify `utils/communityStore.js`: add overview counts, normalized display helpers, status normalization, and publish validation.
- Create `tests/community-refresh.test.js`: source-level regression coverage for the refreshed feed, detail, and publish page structures.
- Modify `tests/utils-smoke.test.js`: validate store-level publish rejection and overview summary behavior.
- Modify `pages/community/community.js`: load overview, hot summaries, and normalized feed cards.
- Modify `pages/community/community.wxml`: add structured module header, compact overview row, hot list, and differentiated feed cards.
- Modify `pages/community/community.wxss`: implement the refreshed feed layout and typed card styling.
- Modify `pages/community-detail/community-detail.js`: load normalized post detail, expose reply state, and handle missing-post fallback.
- Modify `pages/community-detail/community-detail.wxml`: add structured post header, interaction summary, nested reply UI, and invalid-post fallback.
- Modify `pages/community-detail/community-detail.wxss`: style the detail header, summary row, reply state, and comment composer.
- Modify `pages/community-post/community-post.js`: manage grouped form state, marketplace status options, and clearer mode metadata.
- Modify `pages/community-post/community-post.wxml`: split shared fields from marketplace-only fields and add stronger mode presentation.
- Modify `pages/community-post/community-post.wxss`: style the grouped form sections and status switch.

### Task 1: Community Store Contract And Validation

**Files:**
- Modify: `tests/utils-smoke.test.js`
- Modify: `utils/communityData.js`
- Modify: `utils/communityStore.js`

- [ ] **Step 1: Write the failing store tests**

```javascript
runTest('communityStore rejects empty content and missing marketplace price', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');
  const communityStore = require('../utils/communityStore');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });

  assert.equal(
    communityStore.createPost({ type: 'feed', title: '空内容', content: '' }).code,
    1003
  );
  assert.equal(
    communityStore.createPost({ type: 'marketplace', content: '转让小风扇', price: '' }).code,
    1005
  );
});

runTest('communityStore builds stable community overview counts', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');
  const communityStore = require('../utils/communityStore');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });
  communityStore.createPost({
    type: 'feed',
    content: '今晚图书馆四楼还有位置',
    tags: ['自习']
  });

  const overview = communityStore.getFeedOverview('all');
  assert.ok(overview.totalCount >= 5);
  assert.equal(overview.currentTab, 'all');
  assert.ok(overview.currentCount >= 5);
  assert.ok(overview.hotCount >= 1);
  assert.ok(Array.isArray(overview.tabCounts));
  assert.ok(overview.tabCounts.some((item) => item.value === 'feed' && item.count >= 1));
  assert.ok(overview.tabCounts.some((item) => item.value === 'marketplace' && item.count >= 1));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/utils-smoke.test.js`
Expected: FAIL because `createPost` still accepts empty content, does not reject missing marketplace price, and `getFeedOverview` does not exist yet.

- [ ] **Step 3: Expand the seeded community data**

```javascript
const seededPosts = [
  {
    id: 'feed_001',
    type: 'feed',
    author: { studentId: '20260002', name: '林小悦', avatar: '悦' },
    title: '',
    content: '图书馆四楼这周晚上人不算多，适合复习和赶作业。',
    images: [],
    tags: ['自习', '图书馆'],
    location: '图书馆',
    likes: ['20260001', '20260003'],
    comments: [
      {
        id: 'cmt_feed_001',
        author: { studentId: '20260001', name: '张学长', avatar: '张' },
        content: '晚上八点后更安静。',
        time: '2026-06-17 19:20',
        replies: []
      }
    ],
    createdAt: '2026-06-17 19:00',
    viewCount: 18
  },
  {
    id: 'feed_002',
    type: 'feed',
    author: { studentId: '20260004', name: '周同学', avatar: '周' },
    title: '求问打印店营业时间',
    content: '明天一早要交材料，谁知道校内打印店今晚几点关门？',
    images: [],
    tags: ['求助', '打印'],
    location: '教学楼北侧',
    likes: ['20260002'],
    comments: [
      {
        id: 'cmt_feed_002',
        author: { studentId: '20260005', name: '陈学姐', avatar: '陈' },
        content: '工作日通常到晚上九点，最好八点半前过去。',
        time: '2026-06-17 18:55',
        replies: []
      }
    ],
    createdAt: '2026-06-17 18:40',
    viewCount: 11
  },
  {
    id: 'market_001',
    type: 'marketplace',
    author: { studentId: '20260003', name: '陈同学', avatar: '陈' },
    title: '转让二手台灯',
    content: '宿舍用的小台灯，亮度正常，10 元可拿走。',
    images: [],
    tags: ['宿舍', '二手'],
    location: '第二食堂',
    price: '¥10',
    status: '在售',
    likes: [],
    comments: [],
    createdAt: '2026-06-17 18:30',
    viewCount: 7
  },
  {
    id: 'market_002',
    type: 'marketplace',
    author: { studentId: '20260006', name: '李同学', avatar: '李' },
    title: '出九成新计算器',
    content: '课程结束后闲置，功能正常，面交优先。',
    images: [],
    tags: ['学习用品', '二手'],
    location: '格致楼',
    price: '¥35',
    status: '可议价',
    likes: ['20260001'],
    comments: [
      {
        id: 'cmt_market_002',
        author: { studentId: '20260007', name: '王同学', avatar: '王' },
        content: '今晚还能看吗？',
        time: '2026-06-17 18:25',
        replies: []
      }
    ],
    createdAt: '2026-06-17 18:10',
    viewCount: 13
  }
];

module.exports = {
  seededPosts
};
```

- [ ] **Step 4: Add overview, display, and validation support in the store**

```javascript
const MARKETPLACE_STATUSES = ['在售', '可议价', '已预订'];

function normalizeStatus(status) {
  return MARKETPLACE_STATUSES.includes(status) ? status : '在售';
}

function buildDisplayPost(post) {
  const enriched = getEnrichedPost(post.id);
  const likeCount = enriched.enrichedLikes.length;
  const commentCount = enriched.enrichedComments.length;
  const typeLabel = post.type === 'marketplace' ? '集市' : '动态';

  return {
    ...enriched,
    likeCount,
    commentCount,
    typeLabel,
    priceText: post.type === 'marketplace' ? (post.price || '面议') : '',
    statusText: post.type === 'marketplace' ? normalizeStatus(post.status) : '',
    excerpt: (post.content || '').slice(0, 56)
  };
}

function getDisplayPostsByType(type) {
  return getPostsByType(type).map((post) => buildDisplayPost(post));
}

function getDisplayPost(postId) {
  const post = getPostById(postId);
  return post ? buildDisplayPost(post) : null;
}

function getHotPostSummaries(limit = 3) {
  return getHotPosts().slice(0, limit).map((post) => {
    const display = buildDisplayPost(post);
    return {
      id: display.id,
      type: display.type,
      typeLabel: display.typeLabel,
      title: display.title || display.content,
      excerpt: display.excerpt,
      meta: display.type === 'marketplace'
        ? display.priceText + ' · ' + display.statusText
        : '赞 ' + display.likeCount + ' · 评 ' + display.commentCount
    };
  });
}

function getFeedOverview(currentTab) {
  const allPosts = getAllPosts();
  const defs = [
    { label: '全部', value: 'all' },
    { label: '动态', value: 'feed' },
    { label: '集市', value: 'marketplace' }
  ];
  const tabCounts = defs.map((item) => ({
    ...item,
    count: getPostsByType(item.value).length
  }));

  return {
    currentTab,
    currentTabLabel: (tabCounts.find((item) => item.value === currentTab) || defs[0]).label,
    totalCount: allPosts.length,
    currentCount: getPostsByType(currentTab).length,
    hotCount: getHotPosts().length,
    tabCounts
  };
}

function createPost(postData) {
  const user = getCurrentUser();
  if (!user) {
    return { code: 1001, msg: '请先登录' };
  }

  const type = postData.type === 'marketplace' ? 'marketplace' : 'feed';
  const content = (postData.content || '').trim();
  const price = type === 'marketplace' ? (postData.price || '').trim() : '';

  if (!content) {
    return { code: 1003, msg: '内容不能为空' };
  }
  if (type === 'marketplace' && !price) {
    return { code: 1005, msg: '请填写价格' };
  }

  const customPosts = getCustomPosts();
  const newPost = buildCustomPost({
    ...postData,
    type,
    content,
    price,
    status: normalizeStatus(postData.status)
  }, user);
  customPosts.unshift(newPost);
  setCustomPosts(customPosts);
  return { code: 0, msg: '发布成功', data: newPost };
}

module.exports = {
  MARKETPLACE_STATUSES,
  getAllPosts,
  getPostsByType,
  getPostById,
  getEnrichedPost,
  getMergedLikes,
  getMergedComments,
  getDisplayPostsByType,
  getDisplayPost,
  getFeedOverview,
  getHotPosts,
  getHotPostSummaries,
  createPost,
  toggleLike,
  addComment,
  addReply
};
```

- [ ] **Step 5: Run the store tests to verify they pass**

Run: `node tests/utils-smoke.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tests/utils-smoke.test.js utils/communityData.js utils/communityStore.js
git commit -m "feat: add community overview and publish validation"
```

### Task 2: Refresh The Community Feed Page

**Files:**
- Create: `tests/community-refresh.test.js`
- Modify: `pages/community/community.js`
- Modify: `pages/community/community.wxml`
- Modify: `pages/community/community.wxss`

- [ ] **Step 1: Write the failing feed-page regression test**

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

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

runTest('community feed page exposes overview, hot items, and typed cards', () => {
  const communityJs = read('pages/community/community.js');
  const communityWxml = read('pages/community/community.wxml');
  const communityWxss = read('pages/community/community.wxss');

  assert.ok(communityJs.includes('getFeedOverview'));
  assert.ok(communityJs.includes('getDisplayPostsByType'));
  assert.ok(communityJs.includes('getHotPostSummaries'));
  assert.ok(communityWxml.includes('community-overview'));
  assert.ok(communityWxml.includes('community-hot-card'));
  assert.ok(communityWxml.includes('community-card__badge'));
  assert.ok(communityWxml.includes('community-card__market'));
  assert.ok(communityWxml.includes('community-empty'));
  assert.ok(communityWxss.includes('.community-overview'));
  assert.ok(communityWxss.includes('.community-hot-card'));
  assert.ok(communityWxss.includes('.community-card__badge'));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/community-refresh.test.js`
Expected: FAIL because the refreshed feed structure and new store calls are not present yet.

- [ ] **Step 3: Update the feed page controller**

```javascript
const communityStore = require('../../utils/communityStore');
const userManager = require('../../utils/userManager');

const BASE_TABS = [
  { label: '全部', value: 'all' },
  { label: '动态', value: 'feed' },
  { label: '集市', value: 'marketplace' }
];

Page({
  data: {
    tabs: BASE_TABS,
    currentTab: 'all',
    overview: null,
    list: [],
    hotPosts: [],
    isLogin: false
  },
  onShow() {
    this.setData({
      isLogin: userManager.isLogin()
    });
    this.loadData();
  },
  loadData() {
    const currentTab = this.data.currentTab;
    const overview = communityStore.getFeedOverview(currentTab);
    const tabCountMap = overview.tabCounts.reduce((acc, item) => {
      acc[item.value] = item.count;
      return acc;
    }, {});

    this.setData({
      tabs: BASE_TABS.map((item) => ({
        ...item,
        count: tabCountMap[item.value] || 0
      })),
      overview,
      list: communityStore.getDisplayPostsByType(currentTab),
      hotPosts: communityStore.getHotPostSummaries(3)
    });
  },
  switchTab(event) {
    this.setData({
      currentTab: event.currentTarget.dataset.value
    });
    this.loadData();
  },
  openDetail(event) {
    wx.navigateTo({
      url: '/pages/community-detail/community-detail?id=' + event.currentTarget.dataset.id
    });
  },
  openCreate() {
    if (!userManager.isLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/community-post/community-post'
    });
  },
  toggleLike(event) {
    if (!userManager.isLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    communityStore.toggleLike(event.currentTarget.dataset.id);
    this.loadData();
  }
});
```

- [ ] **Step 4: Replace the feed-page markup**

```xml
<view class="page community-page">
  <view class="community-hero card">
    <view class="community-hero__head">
      <view>
        <view class="community-hero__label">校园互助</view>
        <view class="community-hero__title">校园圈</view>
        <view class="community-hero__desc">看动态、发求助、逛二手，保持和当前项目一致的轻界面。</view>
      </view>
      <button class="btn-primary community-hero__button" bindtap="openCreate">{{isLogin ? '发布内容' : '登录后发布'}}</button>
    </view>

    <view class="community-overview" wx:if="{{overview}}">
      <view class="community-overview__item">
        <text class="community-overview__num">{{overview.totalCount}}</text>
        <text class="community-overview__label">全部内容</text>
      </view>
      <view class="community-overview__item">
        <text class="community-overview__num">{{overview.currentCount}}</text>
        <text class="community-overview__label">{{overview.currentTabLabel}}</text>
      </view>
      <view class="community-overview__item">
        <text class="community-overview__num">{{overview.hotCount}}</text>
        <text class="community-overview__label">热度靠前</text>
      </view>
    </view>
  </view>

  <scroll-view class="community-tabs" scroll-x enhanced show-scrollbar="{{false}}">
    <view class="community-tabs__row">
      <view
        wx:for="{{tabs}}"
        wx:key="value"
        class="community-tab {{currentTab === item.value ? 'community-tab--active' : ''}}"
        data-value="{{item.value}}"
        bindtap="switchTab"
      >
        <text>{{item.label}}</text>
        <text class="community-tab__count">{{item.count}}</text>
      </view>
    </view>
  </scroll-view>

  <view class="community-hot card" wx:if="{{hotPosts.length}}">
    <view class="section-title">
      <text class="section-title__text">热度靠前</text>
      <text class="section-title__action">{{hotPosts.length}} 条</text>
    </view>
    <view class="community-hot__list">
      <view
        wx:for="{{hotPosts}}"
        wx:key="id"
        class="community-hot-card"
        data-id="{{item.id}}"
        bindtap="openDetail"
      >
        <view class="community-hot-card__top">
          <text class="community-hot-card__badge">{{item.typeLabel}}</text>
          <text class="community-hot-card__meta">{{item.meta}}</text>
        </view>
        <view class="community-hot-card__title">{{item.title}}</view>
        <view class="community-hot-card__desc">{{item.excerpt}}</view>
      </view>
    </view>
  </view>

  <view class="community-list" wx:if="{{list.length}}">
    <view wx:for="{{list}}" wx:key="id" class="community-card card">
      <view class="community-card__head">
        <view>
          <view class="community-card__author">{{item.author.name}}</view>
          <view class="community-card__meta">{{item.location || '校园里'}} · {{item.createdAt}}</view>
        </view>
        <view class="community-card__badge {{item.type === 'marketplace' ? 'community-card__badge--marketplace' : ''}}">
          {{item.typeLabel}}
        </view>
      </view>

      <view class="community-card__title" wx:if="{{item.title}}">{{item.title}}</view>
      <view class="community-card__content">{{item.excerpt}}</view>

      <view class="community-card__market" wx:if="{{item.type === 'marketplace'}}">
        <text class="community-card__price">{{item.priceText}}</text>
        <text class="community-card__status">{{item.statusText}}</text>
      </view>

      <view class="community-card__tags" wx:if="{{item.tags && item.tags.length}}">
        <text wx:for="{{item.tags}}" wx:key="*this" class="community-card__tag">{{item}}</text>
      </view>

      <view class="community-card__actions">
        <text class="community-card__action" data-id="{{item.id}}" bindtap="toggleLike">赞 {{item.likeCount}}</text>
        <text class="community-card__action" data-id="{{item.id}}" bindtap="openDetail">评论 {{item.commentCount}}</text>
        <text class="community-card__action community-card__action--primary" data-id="{{item.id}}" bindtap="openDetail">查看详情</text>
      </view>
    </view>
  </view>

  <view class="community-empty card" wx:else>
    <view class="community-empty__title">当前分区还没有内容</view>
    <view class="community-empty__desc">切换分区看看，或者直接发一条新的内容。</view>
    <button class="btn-primary community-empty__button" bindtap="openCreate">{{isLogin ? '立即发布' : '登录后发布'}}</button>
  </view>
</view>
```

- [ ] **Step 5: Update the feed-page styles**

```css
.community-page {
  padding-bottom: 24rpx;
}

.community-hero,
.community-hot,
.community-card,
.community-empty {
  margin-bottom: 18rpx;
  padding: 24rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 8rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.04);
}

.community-hero__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.community-hero__label,
.community-hot-card__badge,
.community-card__badge,
.community-card__status {
  color: #0369a1;
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.35;
}

.community-hero__title,
.community-hot-card__title,
.community-card__title,
.community-card__author,
.community-empty__title {
  margin-top: 8rpx;
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.38;
}

.community-hero__desc,
.community-card__meta,
.community-card__content,
.community-hot-card__desc,
.community-hot-card__meta,
.community-empty__desc {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 23rpx;
  line-height: 1.55;
}

.community-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 18rpx;
}

.community-overview__item {
  padding: 16rpx;
  border-radius: 8rpx;
  background: #f8fafc;
}

.community-overview__num {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 800;
}

.community-overview__label {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  display: block;
}

.community-tabs {
  margin-bottom: 18rpx;
}

.community-tabs__row {
  display: flex;
  gap: 10rpx;
}

.community-tab {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  min-width: 132rpx;
  height: 58rpx;
  padding: 0 18rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 8rpx;
  background: #ffffff;
  color: #0369a1;
  font-size: 22rpx;
  font-weight: 700;
  box-sizing: border-box;
}

.community-tab--active {
  background: #eff6ff;
}

.community-tab__count {
  color: #64748b;
  font-size: 20rpx;
}

.community-hot__list,
.community-list {
  display: grid;
  gap: 12rpx;
}

.community-hot-card {
  padding: 18rpx;
  border-radius: 8rpx;
  background: #f8fafc;
}

.community-hot-card__top,
.community-card__head,
.community-card__actions,
.community-card__market {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.community-card__badge {
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #eff6ff;
}

.community-card__badge--marketplace {
  background: #ecfeff;
  color: #0f766e;
}

.community-card__market {
  margin-top: 12rpx;
}

.community-card__price {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 800;
}

.community-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 10rpx;
}

.community-card__tag {
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
  background: #eff6ff;
  color: #0369a1;
  font-size: 21rpx;
  font-weight: 700;
}

.community-card__action {
  color: #0369a1;
  font-size: 21rpx;
  font-weight: 700;
}

.community-card__action--primary {
  text-align: right;
}

.community-empty__button,
.community-hero__button {
  margin-top: 16rpx;
}
```

- [ ] **Step 6: Run the feed regression test**

Run: `node tests/community-refresh.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add tests/community-refresh.test.js pages/community/community.js pages/community/community.wxml pages/community/community.wxss
git commit -m "feat: refresh community feed page"
```

### Task 3: Refresh The Community Detail Page

**Files:**
- Modify: `tests/community-refresh.test.js`
- Modify: `pages/community-detail/community-detail.js`
- Modify: `pages/community-detail/community-detail.wxml`
- Modify: `pages/community-detail/community-detail.wxss`

- [ ] **Step 1: Add the failing detail-page regression test**

```javascript
runTest('community detail page exposes summary, reply state, and missing fallback', () => {
  const detailJs = read('pages/community-detail/community-detail.js');
  const detailWxml = read('pages/community-detail/community-detail.wxml');
  const detailWxss = read('pages/community-detail/community-detail.wxss');

  assert.ok(detailJs.includes('missingState'));
  assert.ok(detailJs.includes('getDisplayPost'));
  assert.ok(detailWxml.includes('detail-empty'));
  assert.ok(detailWxml.includes('community-post-summary'));
  assert.ok(detailWxml.includes('reply-state'));
  assert.ok(detailWxml.includes('comment-composer'));
  assert.ok(detailWxss.includes('.reply-state'));
  assert.ok(detailWxss.includes('.community-post-summary'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/community-refresh.test.js`
Expected: FAIL because the detail page does not yet expose the new structure or missing-post state.

- [ ] **Step 3: Update the detail-page controller**

```javascript
const communityStore = require('../../utils/communityStore');
const userManager = require('../../utils/userManager');

Page({
  data: {
    post: null,
    comments: [],
    inputValue: '',
    mode: 'comment',
    replyCommentId: '',
    replyToName: '',
    missingState: false
  },
  onLoad(options) {
    this.postId = options.id;
  },
  onShow() {
    this.loadPost();
  },
  loadPost() {
    const post = communityStore.getDisplayPost(this.postId);
    this.setData({
      post,
      comments: post ? post.enrichedComments : [],
      missingState: !post
    });
  },
  handleCommentInput(event) {
    this.setData({
      inputValue: event.detail.value
    });
  },
  handleSubmit() {
    if (this.data.mode === 'reply') {
      this.submitReply();
      return;
    }
    this.submitComment();
  },
  submitComment() {
    if (!userManager.isLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const result = communityStore.addComment(this.postId, (this.data.inputValue || '').trim());
    if (result.code === 0) {
      this.setData({
        inputValue: '',
        mode: 'comment',
        replyCommentId: '',
        replyToName: ''
      });
      this.loadPost();
      return;
    }
    wx.showToast({ title: result.msg, icon: 'none' });
  },
  prepareReply(event) {
    if (!userManager.isLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.setData({
      mode: 'reply',
      replyCommentId: event.currentTarget.dataset.commentId,
      replyToName: event.currentTarget.dataset.replyTo,
      inputValue: ''
    });
  },
  submitReply() {
    const result = communityStore.addReply(
      this.postId,
      this.data.replyCommentId,
      (this.data.inputValue || '').trim(),
      this.data.replyToName
    );
    if (result.code === 0) {
      this.setData({
        inputValue: '',
        mode: 'comment',
        replyCommentId: '',
        replyToName: ''
      });
      this.loadPost();
      return;
    }
    wx.showToast({ title: result.msg, icon: 'none' });
  },
  cancelReply() {
    this.setData({
      mode: 'comment',
      replyCommentId: '',
      replyToName: '',
      inputValue: ''
    });
  }
});
```

- [ ] **Step 4: Replace the detail-page markup**

```xml
<view class="page">
  <view class="detail-empty card" wx:if="{{missingState}}">
    <view class="detail-empty__title">帖子不存在</view>
    <view class="detail-empty__desc">这条内容可能已失效，返回校园圈再看看别的内容。</view>
  </view>

  <block wx:elif="{{post}}">
    <view class="detail-card card">
      <view class="detail-card__head">
        <view>
          <view class="detail-card__author">{{post.author.name}}</view>
          <view class="detail-card__meta">{{post.location || '校园里'}} · {{post.createdAt}}</view>
        </view>
        <view class="detail-card__badge {{post.type === 'marketplace' ? 'detail-card__badge--marketplace' : ''}}">
          {{post.typeLabel}}
        </view>
      </view>

      <view class="detail-card__title" wx:if="{{post.title}}">{{post.title}}</view>
      <view class="detail-card__content">{{post.content}}</view>

      <view class="detail-card__market" wx:if="{{post.type === 'marketplace'}}">
        <text class="detail-card__price">{{post.priceText}}</text>
        <text class="detail-card__status">{{post.statusText}}</text>
      </view>

      <view class="community-post-summary">
        <text class="community-post-summary__item">赞 {{post.likeCount}}</text>
        <text class="community-post-summary__item">评论 {{post.commentCount}}</text>
      </view>
    </view>

    <view class="comment-section card">
      <view class="comment-section__title">全部评论 {{comments.length}}</view>

      <view wx:for="{{comments}}" wx:key="id" class="comment-card">
        <view class="comment-card__head">
          <text class="comment-card__name">{{item.author.name}}</text>
          <text class="comment-card__time">{{item.time}}</text>
        </view>
        <view class="comment-card__content">{{item.content}}</view>

        <view class="reply-list" wx:if="{{item.replies && item.replies.length}}">
          <view wx:for="{{item.replies}}" wx:key="index" class="reply-item">
            {{reply.author.name}}{{reply.replyTo ? ' 回复 ' + reply.replyTo : ''}}：{{reply.content}}
          </view>
        </view>

        <text class="comment-card__reply" data-comment-id="{{item.id}}" data-reply-to="{{item.author.name}}" bindtap="prepareReply">回复这条评论</text>
      </view>
    </view>

    <view class="comment-composer">
      <view class="reply-state" wx:if="{{mode === 'reply'}}">
        <text class="reply-state__label">正在回复 {{replyToName}}</text>
        <text class="reply-state__action" bindtap="cancelReply">取消</text>
      </view>
      <view class="comment-bar">
        <input
          class="comment-bar__input"
          placeholder="{{mode === 'reply' ? '回复 ' + replyToName : '发表评论'}}"
          value="{{inputValue}}"
          bindinput="handleCommentInput"
          bindconfirm="handleSubmit"
        />
        <text class="comment-bar__send" bindtap="handleSubmit">发送</text>
      </view>
    </view>
  </block>
</view>
```

- [ ] **Step 5: Update the detail-page styles**

```css
.detail-card,
.comment-section,
.detail-empty,
.comment-composer {
  margin-bottom: 18rpx;
  padding: 24rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 8rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.04);
}

.detail-card__head,
.community-post-summary,
.comment-card__head,
.comment-bar,
.reply-state,
.detail-card__market {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.detail-card__author,
.comment-section__title,
.comment-card__name,
.detail-empty__title,
.detail-card__title {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.35;
}

.detail-card__meta,
.detail-card__content,
.comment-card__time,
.comment-card__content,
.reply-item,
.detail-empty__desc,
.reply-state__label {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 23rpx;
  line-height: 1.55;
}

.detail-card__badge {
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #eff6ff;
  color: #0369a1;
  font-size: 21rpx;
  font-weight: 800;
}

.detail-card__badge--marketplace {
  background: #ecfeff;
  color: #0f766e;
}

.detail-card__price {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 800;
}

.detail-card__status {
  color: #0f766e;
  font-size: 21rpx;
  font-weight: 800;
}

.community-post-summary {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e5e7eb;
}

.community-post-summary__item,
.comment-card__reply,
.comment-bar__send,
.reply-state__action {
  color: #0369a1;
  font-size: 22rpx;
  font-weight: 700;
}

.comment-card {
  padding-top: 16rpx;
  border-top: 1rpx solid #e5e7eb;
}

.reply-list {
  margin-top: 10rpx;
  padding: 12rpx;
  border-radius: 8rpx;
  background: #f8fafc;
}

.comment-composer {
  position: sticky;
  bottom: 0;
}

.reply-state {
  margin-bottom: 12rpx;
  padding: 12rpx 14rpx;
  border-radius: 8rpx;
  background: #f8fafc;
}

.comment-bar__input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  padding: 0 18rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 8rpx;
  background: #ffffff;
  font-size: 24rpx;
}
```

- [ ] **Step 6: Run the detail regression test**

Run: `node tests/community-refresh.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add tests/community-refresh.test.js pages/community-detail/community-detail.js pages/community-detail/community-detail.wxml pages/community-detail/community-detail.wxss
git commit -m "feat: refresh community detail page"
```

### Task 4: Refresh The Publish Page And Run Full Verification

**Files:**
- Modify: `tests/community-refresh.test.js`
- Modify: `pages/community-post/community-post.js`
- Modify: `pages/community-post/community-post.wxml`
- Modify: `pages/community-post/community-post.wxss`

- [ ] **Step 1: Add the failing publish-page regression test**

```javascript
runTest('community publish page groups shared and marketplace fields', () => {
  const postJs = read('pages/community-post/community-post.js');
  const postWxml = read('pages/community-post/community-post.wxml');
  const postWxss = read('pages/community-post/community-post.wxss');

  assert.ok(postJs.includes('statusOptions'));
  assert.ok(postWxml.includes('post-section'));
  assert.ok(postWxml.includes('post-mode-note'));
  assert.ok(postWxml.includes('marketplace-fields'));
  assert.ok(postWxml.includes('post-status-switch'));
  assert.ok(postWxss.includes('.post-section'));
  assert.ok(postWxss.includes('.post-submit-bar'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/community-refresh.test.js`
Expected: FAIL because the publish page still uses a flat input stack.

- [ ] **Step 3: Update the publish-page controller**

```javascript
const communityStore = require('../../utils/communityStore');
const userManager = require('../../utils/userManager');

Page({
  data: {
    postType: 'feed',
    title: '',
    content: '',
    tags: '',
    location: '',
    price: '',
    status: '在售',
    modeNote: '分享动态、求助或经验，内容会显示在校园圈里。',
    statusOptions: communityStore.MARKETPLACE_STATUSES
  },
  onLoad() {
    if (!userManager.isLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }
  },
  switchType(event) {
    const nextType = event.currentTarget.dataset.type;
    this.setData({
      postType: nextType,
      modeNote: nextType === 'marketplace'
        ? '填写价格和状态，方便别人快速判断是否合适。'
        : '分享动态、求助或经验，内容会显示在校园圈里。'
    });
  },
  switchStatus(event) {
    this.setData({
      status: event.currentTarget.dataset.status
    });
  },
  handleField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [field]: event.detail.value
    });
  },
  submit() {
    const result = communityStore.createPost({
      type: this.data.postType,
      title: (this.data.title || '').trim(),
      content: (this.data.content || '').trim(),
      tags: (this.data.tags || '').split(/[,，\s]+/).filter(Boolean),
      location: (this.data.location || '').trim(),
      price: this.data.postType === 'marketplace' ? (this.data.price || '').trim() : '',
      status: this.data.status
    });

    if (result.code !== 0) {
      wx.showToast({ title: result.msg, icon: 'none' });
      return;
    }

    wx.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 600);
  }
});
```

- [ ] **Step 4: Replace the publish-page markup**

```xml
<view class="page">
  <view class="post-card card">
    <view class="post-hero">
      <view class="post-hero__label">发布内容</view>
      <view class="post-hero__title">发一条新的校园圈内容</view>
      <view class="post-mode-note">{{modeNote}}</view>
    </view>

    <view class="post-switch">
      <text class="post-switch__item {{postType === 'feed' ? 'post-switch__item--active' : ''}}" data-type="feed" bindtap="switchType">动态</text>
      <text class="post-switch__item {{postType === 'marketplace' ? 'post-switch__item--active' : ''}}" data-type="marketplace" bindtap="switchType">集市</text>
    </view>

    <view class="post-section">
      <view class="post-section__title">基础信息</view>
      <input class="post-input" data-field="title" placeholder="标题（可选）" value="{{title}}" bindinput="handleField" />
      <textarea class="post-textarea" data-field="content" placeholder="写点内容（必填）" value="{{content}}" bindinput="handleField"></textarea>
      <input class="post-input" data-field="tags" placeholder="标签，用空格或逗号分隔" value="{{tags}}" bindinput="handleField" />
      <input class="post-input" data-field="location" placeholder="地点（可选）" value="{{location}}" bindinput="handleField" />
    </view>

    <view class="post-section marketplace-fields" wx:if="{{postType === 'marketplace'}}">
      <view class="post-section__title">集市信息</view>
      <input class="post-input" data-field="price" placeholder="价格（必填）" value="{{price}}" bindinput="handleField" />
      <view class="post-status-switch">
        <view
          wx:for="{{statusOptions}}"
          wx:key="*this"
          class="post-status-switch__item {{status === item ? 'post-status-switch__item--active' : ''}}"
          data-status="{{item}}"
          bindtap="switchStatus"
        >
          {{item}}
        </view>
      </view>
    </view>

    <view class="post-submit-bar">
      <button class="btn-primary post-submit-bar__button" bindtap="submit">
        {{postType === 'marketplace' ? '发布集市信息' : '发布动态'}}
      </button>
    </view>
  </view>
</view>
```

- [ ] **Step 5: Update the publish-page styles**

```css
.post-card {
  padding: 24rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 8rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.04);
}

.post-hero__label,
.post-section__title {
  color: #0369a1;
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.35;
}

.post-hero__title {
  margin-top: 8rpx;
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.38;
}

.post-mode-note {
  margin-top: 8rpx;
  color: #64748b;
  font-size: 23rpx;
  line-height: 1.55;
}

.post-switch,
.post-status-switch {
  display: flex;
  gap: 10rpx;
  margin-top: 18rpx;
}

.post-switch__item,
.post-status-switch__item {
  min-width: 110rpx;
  height: 54rpx;
  padding: 0 16rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 8rpx;
  background: #ffffff;
  color: #0369a1;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 54rpx;
  text-align: center;
  box-sizing: border-box;
}

.post-switch__item--active,
.post-status-switch__item--active {
  background: #eff6ff;
}

.post-section {
  margin-top: 18rpx;
  padding: 18rpx;
  border-radius: 8rpx;
  background: #f8fafc;
}

.marketplace-fields {
  background: #f0fdfa;
}

.post-input,
.post-textarea {
  width: 100%;
  margin-top: 14rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 8rpx;
  background: #ffffff;
  color: #0f172a;
  font-size: 24rpx;
  box-sizing: border-box;
}

.post-textarea {
  min-height: 220rpx;
}

.post-submit-bar {
  margin-top: 22rpx;
  padding-bottom: 6rpx;
}

.post-submit-bar__button {
  width: 100%;
}
```

- [ ] **Step 6: Run focused tests and the full suite**

Run: `node tests/community-refresh.test.js`
Expected: PASS

Run: `node tests/utils-smoke.test.js`
Expected: PASS

Run: `npm test`
Expected: all smoke tests pass

- [ ] **Step 7: Commit**

```bash
git add tests/community-refresh.test.js tests/utils-smoke.test.js pages/community-post/community-post.js pages/community-post/community-post.wxml pages/community-post/community-post.wxss
git commit -m "feat: refresh community publish flow"
```
