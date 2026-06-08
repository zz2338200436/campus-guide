const assert = require('assert');

const storageState = {};
global.wx = {
  getStorageSync(key) {
    return storageState[key];
  },
  setStorageSync(key, value) {
    storageState[key] = value;
  },
  removeStorageSync(key) {
    delete storageState[key];
  },
  getStorageInfoSync() {
    return {
      keys: Object.keys(storageState)
    };
  }
};

const userManager = require('../utils/userManager');
const placeData = require('../utils/placeData');
const checkinHelper = require('../utils/explorationCheckinHelper');

function resetState() {
  Object.keys(storageState).forEach((key) => {
    delete storageState[key];
  });
  userManager.logout();
}

function testCheckinHelperKeepsCheckinsPerUser() {
  resetState();
  userManager.login({ studentId: '20260001', name: '测试用户一' });
  checkinHelper.addCheckin(placeData[0]);
  checkinHelper.addCheckin(placeData[1]);

  let summary = checkinHelper.getSummary(placeData);
  assert.strictEqual(summary.completedCount, 2);
  assert.strictEqual(summary.totalCount, placeData.length);
  assert.strictEqual(summary.routeCompletedCount >= 1, true);

  userManager.logout();
  userManager.login({ studentId: '20260002', name: '测试用户二' });
  summary = checkinHelper.getSummary(placeData);
  assert.strictEqual(summary.completedCount, 0);
  assert.strictEqual(checkinHelper.getCheckins().length, 0);
}

function testCheckinHelperDeduplicatesAndBuildsRouteProgress() {
  resetState();
  userManager.login({ studentId: '20260001', name: '测试用户一' });
  checkinHelper.addCheckin(placeData[0]);
  checkinHelper.addCheckin(placeData[0]);
  checkinHelper.addCheckin(placeData[1]);
  checkinHelper.addCheckin(placeData[2]);

  const checkins = checkinHelper.getCheckins();
  const summary = checkinHelper.getSummary(placeData);
  assert.strictEqual(checkins.length, 3);
  assert.strictEqual(summary.routeCompletedCount, 3);
  assert.strictEqual(summary.hasCampusBadge, true);
}

function testCheckinHelperBuildsRouteTasksAndNextStop() {
  resetState();
  userManager.login({ studentId: '20260001', name: '测试用户一' });
  checkinHelper.addCheckin(placeData[0]);

  const tasks = checkinHelper.getRouteTasks(placeData);
  const nextPlace = checkinHelper.getNextRoutePlace(placeData);
  const summary = checkinHelper.getSummary(placeData);

  assert.strictEqual(tasks.length, checkinHelper.ROUTE_IDS.length);
  assert.deepStrictEqual(tasks.map((item) => item.id), checkinHelper.ROUTE_IDS);
  assert.strictEqual(tasks[0].checkedIn, true);
  assert.strictEqual(tasks[0].statusText, '已完成');
  assert.strictEqual(tasks[1].checkedIn, false);
  assert.strictEqual(tasks[1].statusText, '下一站');
  assert.strictEqual(nextPlace.id, placeData[1].id);
  assert.strictEqual(summary.nextRoutePlace.id, placeData[1].id);
  assert.strictEqual(summary.routeProgressText, '1/3');
}

function testCheckinHelperBuildsReadableFootprint() {
  resetState();
  userManager.login({ studentId: '20260001', name: '测试用户一' });
  checkinHelper.addCheckin(placeData[2]);
  checkinHelper.addCheckin(placeData[0]);

  const history = checkinHelper.getCheckinHistory(placeData);

  assert.strictEqual(history.length, 2);
  assert.strictEqual(history[0].id, placeData[0].id);
  assert.strictEqual(history[0].title, placeData[0].name);
  assert.strictEqual(history[0].subtitle, placeData[0].tagline);
  assert.strictEqual(history[0].badgeText, placeData[0].type);
}

testCheckinHelperKeepsCheckinsPerUser();
console.log('PASS checkinHelper keeps checkins isolated per user');

testCheckinHelperDeduplicatesAndBuildsRouteProgress();
console.log('PASS checkinHelper de-duplicates places and builds route progress');

testCheckinHelperBuildsRouteTasksAndNextStop();
console.log('PASS checkinHelper builds route tasks and next stop');

testCheckinHelperBuildsReadableFootprint();
console.log('PASS checkinHelper builds readable exploration footprint');
