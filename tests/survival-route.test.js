const assert = require('node:assert/strict');
const placeData = require('../utils/placeData');
const serviceData = require('../utils/serviceData');
const survivalRouteBuilder = require('../utils/survivalRouteBuilder');
const survivalService = require('../utils/services/survivalService');
const checkinHelper = require('../utils/explorationCheckinHelper');
const userManager = require('../utils/userManager');

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

function resetState() {
  Object.keys(storageState).forEach((key) => {
    delete storageState[key];
  });
  userManager.logout();
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

runTest('survival route builder exposes memorable freshman scenarios', () => {
  const scenarios = survivalRouteBuilder.getScenarios();

  assert.equal(scenarios.length, 5);
  assert.deepEqual(
    scenarios.map((item) => item.id),
    ['checkin', 'meal', 'study', 'network', 'lost']
  );
  assert.ok(scenarios.every((item) => item.title && item.question && item.oneLiner));
});

runTest('survival route builder creates default checkin route', () => {
  const route = survivalRouteBuilder.buildRoute('checkin', placeData, serviceData);

  assert.equal(route.id, 'checkin');
  assert.equal(route.title, '入学报到场景路线');
  assert.equal(route.steps.length, 3);
  assert.deepEqual(route.steps.map((item) => item.place.id), [6, 3, 5]);
  assert.equal(route.steps[0].service.title, '学生办事与证明咨询');
  assert.equal(route.primaryAction.url, '/pages/placeDetail/placeDetail?id=6');
  assert.equal(route.primaryAction.feedback, '前往行政中心');
  assert.ok(route.switchFeedback.includes('已生成'));
  assert.ok(route.materials.includes('身份证'));
});

runTest('survival route builder decorates route progress from checked places', () => {
  const route = survivalRouteBuilder.buildRoute('checkin', placeData, serviceData, {
    checkedPlaceIds: [6]
  });

  assert.deepEqual(route.steps.map((item) => item.statusText), ['已完成', '下一站', '待到访']);
  assert.equal(route.steps[0].checkedIn, true);
  assert.equal(route.steps[1].isNext, true);
  assert.equal(route.progress.completedCount, 1);
  assert.equal(route.progress.totalCount, 3);
  assert.equal(route.progress.progressText, '1/3');
  assert.equal(route.progress.percent, 33);
  assert.equal(route.progress.nextStep.place.id, 3);
  assert.equal(route.primaryAction.url, '/pages/placeDetail/placeDetail?id=3');
  assert.equal(route.primaryAction.text, '继续下一站');
});

runTest('survival route builder creates practical emergency routes', () => {
  const network = survivalRouteBuilder.buildRoute('network', placeData, serviceData);
  const lost = survivalRouteBuilder.buildRoute('lost', placeData, serviceData);

  assert.equal(network.steps[0].place.name, '格致楼');
  assert.equal(network.steps[0].service.title, '校园网与设备报修');
  assert.equal(lost.steps[0].service.title, '失物招领与紧急联系');
  assert.ok(lost.summary.includes('失物'));
  assert.ok(network.steps.every((item) => item.actionUrl.includes('/pages/placeDetail/placeDetail?id=')));
  assert.ok(network.steps.every((item) => item.feedback.includes('前往')));
});

runTest('survival service returns route center data and falls back safely', () => {
  const data = survivalService.getSurvivalRouteData('unknown');

  assert.equal(data.currentRoute.id, 'checkin');
  assert.equal(data.scenarios.length, 5);
  assert.ok(data.featuredRoutes.some((item) => item.id === 'network'));
  assert.ok(data.currentRoute.steps.every((item) => item.placeName && item.serviceTitle));
});

runTest('survival service personalizes route progress from checkins', () => {
  resetState();
  userManager.login({ studentId: '20260001', name: '测试用户' });
  checkinHelper.addCheckin(placeData.find((item) => Number(item.id) === 6));

  const data = survivalService.getSurvivalRouteData('checkin');

  assert.equal(data.currentRoute.progress.progressText, '1/3');
  assert.deepEqual(data.currentRoute.steps.map((item) => item.statusText), ['已完成', '下一站', '待到访']);
  assert.equal(data.currentRoute.primaryAction.url, '/pages/placeDetail/placeDetail?id=3');
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
