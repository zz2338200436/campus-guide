const assert = require('node:assert/strict');

function createWxMock() {
  const store = new Map();
  const calls = {
    showLoading: [],
    hideLoading: 0,
    showToast: []
  };

  return {
    wx: {
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
      },
      showLoading(payload) {
        calls.showLoading.push(payload);
      },
      hideLoading() {
        calls.hideLoading += 1;
      },
      showToast(payload) {
        calls.showToast.push(payload);
      }
    },
    calls
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
    '../utils/explorationCheckinHelper',
    '../utils/learningProgressHelper',
    '../utils/request',
    '../utils/requestHelpers',
    '../utils/services/homeService',
    '../utils/services/noticeService',
    '../utils/services/placeService',
    '../utils/services/serviceService',
    '../utils/services/studyService',
    '../utils/services/userService',
    '../utils/services/favoriteService',
    '../utils/services/operationsService'
  ].forEach((modulePath) => {
    try {
      clearModule(modulePath);
    } catch (error) {}
  });
}

let testQueue = Promise.resolve();

function runTest(name, testFn) {
  testQueue = testQueue.then(async () => {
    try {
      await testFn();
      console.log('PASS', name);
    } catch (error) {
      console.error('FAIL', name);
      console.error(error.stack || error.message);
      process.exitCode = 1;
    }
  });
}

runTest('request facade exposes core service methods', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const request = require('../utils/request');

  [
    'getHomeData',
    'getNoticeList',
    'getPlaceList',
    'getServiceList',
    'getServiceCenterData',
    'getSurvivalRouteData',
    'getStudyList',
    'getStudyCenterData',
    'login',
    'getFavorites',
    'addFavorite',
    'removeFavorite',
    'getStudyHistory',
    'addStudyHistory',
    'completeStudyTask',
    'getOperationsData'
  ].forEach((method) => {
    assert.equal(typeof request[method], 'function', method + ' should be a function');
  });
});

runTest('home service returns continueStudy for logged-in history', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const userManager = require('../utils/userManager');
  const studyHistoryHelper = require('../utils/studyHistoryHelper');
  const homeService = require('../utils/services/homeService');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });
  studyHistoryHelper.addHistory({
    id: 3,
    title: 'Page 生命周期',
    category: '逻辑交互',
    time: '2026-05-14 23:00'
  });

  const data = homeService.buildHomeData();
  assert.equal(data.continueStudy.id, 3);
});

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
  assert.ok(Array.isArray(data.featuredPlaces));
  assert.ok(data.featuredPlaces.length >= 2);
  assert.ok(data.studySummary.totalCount >= data.studySummary.viewedCount);
  assert.ok(Array.isArray(data.nextStudyList));
});

runTest('home service exposes exploration mission state', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const userManager = require('../utils/userManager');
  const homeService = require('../utils/services/homeService');

  userManager.login({ studentId: '20260001', name: '同学甲', role: 'student' });

  const data = homeService.buildHomeData();
  assert.ok(data.explorationSummary);
  assert.equal(data.explorationSummary.routeProgressText, '0/3');
  assert.equal(data.nextRoutePlace.name, '广州应用科技学院(肇庆校区)图书馆');
  assert.deepEqual(data.routeTasks.map((item) => item.statusText), ['下一站', '待到访', '待到访']);
  assert.deepEqual(data.checkinHistory, []);
});

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

runTest('service center data exposes categories and quick services', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const request = require('../utils/request');
  const result = await request.getServiceCenterData({ delay: 1 });

  assert.equal(result.code, 0);
  assert.ok(result.data.categoryTabs.includes('学籍事务'));
  assert.ok(result.data.quickList.length >= 4);
  assert.ok(result.data.groups.some((group) => group.title === '安全应急'));
});

runTest('survival route data exposes scenario route center', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const request = require('../utils/request');
  const result = await request.getSurvivalRouteData({ scene: 'network' }, { delay: 1 });

  assert.equal(result.code, 0);
  assert.equal(result.data.currentRoute.id, 'network');
  assert.ok(result.data.scenarios.length >= 5);
  assert.ok(result.data.currentRoute.steps.some((item) => item.placeName === '格致楼'));
});

runTest('study center data exposes learning paths and completion state', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const userManager = require('../utils/userManager');
  const request = require('../utils/request');

  userManager.login({ studentId: '20260001', name: '同学甲', role: 'student' });
  await request.completeStudyTask({ id: 1, title: 'WXML 基础', category: '页面结构', stage: 'entry' }, { delay: 1 });
  const result = await request.getStudyCenterData({}, { delay: 1 });

  assert.equal(result.code, 0);
  assert.ok(result.data.paths.some((path) => path.title === '小程序入门路径'));
  assert.equal(result.data.list.find((item) => Number(item.id) === 1).statusText, '已完成');
  assert.equal(result.data.learningSummary.completedCount, 1);
});

runTest('operations data exposes overview and health report', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const request = require('../utils/request');
  const result = await request.getOperationsData({ delay: 1 });

  assert.equal(result.code, 0);
  assert.ok(result.data.overviewCards.some((item) => item.label === '地点'));
  assert.ok(Array.isArray(result.data.health.items));
  assert.ok(result.data.suggestions.length >= 2);
});

runTest('notice service sorts pinned notices before newer non-pinned ones', async () => {
  clearProjectModules();
  const { wx } = createWxMock();
  global.wx = wx;
  const noticeService = require('../utils/services/noticeService');
  const list = noticeService.getNoticeList({ type: '全部' });

  assert.equal(list[0].isTop, true);
  assert.equal(list[1].isTop, true);
  assert.equal(list[2].isTop, false);
});

runTest('simulate handles loading and toast options', async () => {
  clearProjectModules();
  const { wx, calls } = createWxMock();
  global.wx = wx;
  const { simulate } = require('../utils/requestHelpers');

  const result = await simulate(() => ({
    code: 5001,
    message: '网络异常',
    data: null
  }), {
    loading: true,
    loadingText: '测试加载',
    delay: 1
  });

  assert.equal(result.code, 5001);
  assert.equal(calls.showLoading.length, 1);
  assert.equal(calls.hideLoading, 1);
  assert.equal(calls.showToast.length, 1);
});

testQueue.then(() => {
  if (process.exitCode) {
    process.exit(process.exitCode);
  }
});
