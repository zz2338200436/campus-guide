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
    '../utils/explorationCheckinHelper',
    '../utils/learningProgressHelper',
    '../utils/todayActionBuilder',
    '../utils/services/homeService'
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

runTest('home service builds a personal today action board', () => {
  clearProjectModules();
  global.wx = createWxMock();

  const userManager = require('../utils/userManager');
  const homeService = require('../utils/services/homeService');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });

  const data = homeService.buildHomeData();

  assert.ok(data.todayAction);
  assert.equal(data.todayAction.title, '今天建议先完成这 3 件事');
  assert.ok(Array.isArray(data.todayAction.cards));
  assert.equal(data.todayAction.cards.length, 3);
  assert.deepEqual(data.todayAction.cards.map((item) => item.type), ['explore', 'service', 'learn']);
  assert.equal(data.todayAction.cards[0].targetUrl, '/pages/placeDetail/placeDetail?id=1');
  assert.equal(data.todayAction.cards[1].targetUrl, '/pages/service/service');
  assert.equal(data.todayAction.cards[2].targetUrl.includes('/pages/studyDetail/studyDetail?id='), true);
  assert.ok(data.todayAction.cards.every((item) => item.reason && item.actionText));
});

runTest('today action board changes after exploration and learning progress', () => {
  clearProjectModules();
  global.wx = createWxMock();

  const userManager = require('../utils/userManager');
  const checkinHelper = require('../utils/explorationCheckinHelper');
  const learningProgressHelper = require('../utils/learningProgressHelper');
  const placeData = require('../utils/placeData');
  const studyData = require('../utils/studyData');
  const homeService = require('../utils/services/homeService');

  userManager.login({
    studentId: '20260001',
    name: '同学甲',
    role: 'student'
  });
  checkinHelper.addCheckin(placeData.find((item) => Number(item.id) === 1));
  learningProgressHelper.markCompleted(studyData.find((item) => Number(item.id) === 1));

  const data = homeService.buildHomeData();
  const exploreCard = data.todayAction.cards.find((item) => item.type === 'explore');
  const learnCard = data.todayAction.cards.find((item) => item.type === 'learn');

  assert.equal(exploreCard.targetUrl, '/pages/placeDetail/placeDetail?id=2');
  assert.match(exploreCard.title, /格致楼/);
  assert.notEqual(learnCard.targetUrl, '/pages/studyDetail/studyDetail?id=1');
  assert.match(data.todayAction.progressText, /到访 1\/3/);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
