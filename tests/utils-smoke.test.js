const assert = require('node:assert/strict');

function createWxMock() {
  const store = new Map();
  return {
    getStorageSync(key) {
      return store.has(key) ? store.get(key) : '';
    },
    setStorageSync(key, value) {
      store.set(key, value);
    },
    removeStorageSync(key) {
      store.delete(key);
    },
    getStorageInfoSync() {
      return {
        keys: [...store.keys()]
      };
    }
  };
}

function clearModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

function clearProjectModules() {
  [
    '../utils/storage',
    '../utils/userManager',
    '../utils/studyHistoryHelper',
    '../utils/favoriteSubject',
    '../utils/contentFilter',
    '../utils/communityData',
    '../utils/communityStore'
  ].forEach((modulePath) => {
    try {
      clearModule(modulePath);
    } catch (error) {}
  });
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

runTest('storage keeps values by prefixed key and clear removes only project keys', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const storage = require('../utils/storage');

  storage.set('alpha', 1);
  storage.set('beta', { ok: true });
  wx.setStorageSync('other-app:key', 'keep');

  assert.equal(storage.get('alpha', 0), 1);
  assert.deepEqual(storage.get('beta', {}), { ok: true });

  storage.clear();

  assert.equal(storage.get('alpha', null), null);
  assert.equal(wx.getStorageSync('other-app:key'), 'keep');
});

runTest('userManager login and logout update login state', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });
  assert.equal(userManager.isLogin(), true);
  assert.equal(userManager.isAdmin(), false);

  userManager.logout();
  assert.equal(userManager.isLogin(), false);
});

runTest('studyHistoryHelper keeps history isolated per user and de-duplicates latest entry', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');
  const studyHistoryHelper = require('../utils/studyHistoryHelper');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });
  studyHistoryHelper.addHistory({ id: 1, title: 'WXML 基础', category: '页面结构', time: '2026-05-14 10:00' });
  studyHistoryHelper.addHistory({ id: 1, title: 'WXML 基础', category: '页面结构', time: '2026-05-14 10:05' });
  assert.equal(studyHistoryHelper.getHistory().length, 1);
  assert.equal(studyHistoryHelper.getHistory()[0].time, '2026-05-14 10:05');

  userManager.login({
    studentId: '20260002',
    name: '同学乙',
    role: 'student'
  });
  assert.deepEqual(studyHistoryHelper.getHistory(), []);
});

runTest('favoriteSubject keeps favorites isolated per user', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');
  const favoriteSubject = require('../utils/favoriteSubject');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });
  favoriteSubject.addFavorite({
    type: 'study',
    targetId: 3,
    title: 'Page 生命周期'
  });
  assert.equal(favoriteSubject.getFavorites().length, 1);

  userManager.login({
    studentId: '20260002',
    name: '同学乙',
    role: 'student'
  });
  assert.equal(favoriteSubject.getFavorites().length, 0);
});

runTest('contentFilter returns stable map pin fallback and keyword matches', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const { filterPlaces, getMapPins } = require('../utils/contentFilter');

  const filtered = filterPlaces([
    { id: 1, name: '图书馆', type: '学习场所', description: '自习', address: '东侧', tips: '安静' },
    { id: 2, name: '食堂', type: '生活场所', description: '就餐', address: '南侧', tips: '午餐人多' }
  ], {
    type: '生活场所',
    keyword: '午餐'
  });
  const pins = getMapPins(filtered);

  assert.deepEqual(filtered.map((item) => item.id), [2]);
  assert.equal(pins[0].x, 48);
  assert.equal(pins[0].y, 30);
});

runTest('communityStore keeps seeded-post replies after reload', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });

  let communityStore = require('../utils/communityStore');
  const seededPost = communityStore.getPostsByType('feed')[0];
  const seededComment = communityStore.getMergedComments(seededPost.id)[0];
  const result = communityStore.addReply(seededPost.id, seededComment.id, '收到', seededComment.author.name);

  assert.equal(result.code, 0);

  clearModule('../utils/communityStore');
  communityStore = require('../utils/communityStore');

  const reloaded = communityStore.getMergedComments(seededPost.id);
  assert.ok(reloaded[0].replies.some((reply) => reply.content === '收到'));
});

runTest('communityStore scopes custom posts by logged-in user', () => {
  global.wx = createWxMock();
  clearProjectModules();
  const userManager = require('../utils/userManager');
  const communityStore = require('../utils/communityStore');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });
  assert.equal(communityStore.createPost({ type: 'feed', content: '你好校园' }).code, 0);
  assert.ok(communityStore.getAllPosts().some((item) => item.content === '你好校园'));

  userManager.login({
    studentId: '20260002',
    name: '同学乙',
    role: 'student'
  });
  assert.ok(!communityStore.getAllPosts().some((item) => item.content === '你好校园'));
});

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

if (process.exitCode) {
  process.exit(process.exitCode);
}
