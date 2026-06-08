const assert = require('node:assert/strict');
const operationsCenter = require('../utils/operationsCenter');
const placeData = require('../utils/placeData');
const serviceData = require('../utils/serviceData');
const noticeData = require('../utils/noticeData');
const studyData = require('../utils/studyData');
const supplementPlaces = require('../utils/campusSupplementPlaces');

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

runTest('operations center builds content overview metrics', () => {
  const overview = operationsCenter.buildOverview({
    places: placeData,
    services: serviceData,
    notices: noticeData,
    studies: studyData,
    checkins: [{ id: 1 }, { id: 2 }]
  });

  assert.equal(overview.placeCount, placeData.length);
  assert.equal(overview.serviceCount, serviceData.length);
  assert.equal(overview.noticeCount, noticeData.length);
  assert.equal(overview.studyCount, studyData.length);
  assert.equal(overview.checkinCount, 2);
});

runTest('operations center detects content health issues', () => {
  const health = operationsCenter.buildHealthReport({
    places: [{ id: 1, name: '孤立地点' }],
    services: [{ id: 1, title: '孤立服务', placeIds: [99] }],
    notices: [{ id: 1, title: '旧公告', date: '2026-01-01' }],
    studies: [{ id: 1, title: '只有入门', stage: 'entry' }]
  }, new Date('2026-05-19T00:00:00+08:00'));

  assert.ok(health.items.some((item) => item.type === 'place-service-link'));
  assert.ok(health.items.some((item) => item.type === 'service-place-link'));
  assert.ok(health.items.some((item) => item.type === 'notice-expired'));
  assert.ok(health.items.some((item) => item.type === 'study-path-empty'));
  assert.ok(health.items.every((item) => item.actionText && item.actionText.length > 0));
  assert.equal(health.issueCount, health.items.length);
});

runTest('operations center returns actionable suggestions for current data', () => {
  const data = operationsCenter.buildOperationsData({
    places: placeData,
    services: serviceData,
    notices: noticeData,
    studies: studyData,
    supplementPlaces,
    checkins: []
  }, new Date('2026-05-19T00:00:00+08:00'));

  assert.ok(Array.isArray(data.overviewCards));
  assert.ok(data.overviewCards.some((item) => item.label === '地点'));
  assert.ok(data.health.issueCount >= 0);
  assert.ok(data.suggestions.length >= 2);
});

runTest('operations center exposes place quality for map data maintenance', () => {
  const data = operationsCenter.buildOperationsData({
    places: placeData,
    services: serviceData,
    notices: noticeData,
    studies: studyData,
    supplementPlaces,
    checkins: []
  }, new Date('2026-05-19T00:00:00+08:00'));

  assert.equal(data.placeQuality.totalPlaces, placeData.length);
  assert.equal(data.placeQuality.amapCount, placeData.filter((item) => item.coordinateStatus === 'amap').length);
  assert.equal(data.placeQuality.estimatedCount, placeData.filter((item) => item.coordinateStatus === 'estimated').length);
  assert.equal(data.placeQuality.reviewRequiredCount, placeData.filter((item) => item.reviewRequired).length);
  assert.equal(data.placeQuality.supplementPendingCount, 19);
  assert.ok(data.placeQuality.sourceCards.some((item) => item.label === '高德POI'));
  assert.ok(data.placeQuality.sourceCards.some((item) => item.label === '待复核'));
  assert.ok(data.placeQuality.reviewPlaces.length > 0);
});

runTest('operations center summarizes local coordinate review notes', () => {
  const data = operationsCenter.buildOperationsData({
    places: placeData,
    services: serviceData,
    notices: noticeData,
    studies: studyData,
    supplementPlaces,
    coordinateReviews: {
      28: { placeId: 28, note: '现场入口在道路东侧', statusText: '已备注', updatedAt: 1780800000000 }
    },
    checkins: []
  }, new Date('2026-05-19T00:00:00+08:00'));

  assert.equal(data.coordinateReviewSummary.total, 1);
  assert.equal(data.coordinateReviewSummary.items[0].placeId, 28);
  assert.equal(data.coordinateReviewSummary.items[0].note, '现场入口在道路东侧');
  assert.ok(data.coordinateReviewSummary.items[0].placeName);
  assert.equal(data.coordinateReviewSummary.items[0].statusText, '已备注');
});

runTest('operations center builds a copyable coordinate review checklist', () => {
  const summary = operationsCenter.buildCoordinateReviewSummary({
    places: placeData,
    coordinateReviews: {
      28: { placeId: 28, note: '现场入口在道路东侧', statusText: '已备注', updatedAt: 1780800000000 }
    }
  });

  assert.ok(summary.exportText.includes('校准备注清单'));
  assert.ok(summary.exportText.includes('现场入口在道路东侧'));
  assert.ok(summary.exportText.includes('ID:28'));
  assert.ok(summary.exportText.includes('状态:已备注'));
});

runTest('operations center builds a placeData revision template from review notes', () => {
  const summary = operationsCenter.buildCoordinateReviewSummary({
    places: placeData,
    coordinateReviews: {
      28: { placeId: 28, note: '现场入口在道路东侧', statusText: '已备注', updatedAt: 1780800000000 }
    }
  });

  assert.ok(summary.revisionText.includes('placeData 坐标修订模板'));
  assert.ok(summary.revisionText.includes('id: 28'));
  assert.ok(summary.revisionText.includes('oldLatitude:'));
  assert.ok(summary.revisionText.includes('oldLongitude:'));
  assert.ok(summary.revisionText.includes('source:'));
  assert.ok(summary.revisionText.includes('reviewQuality: "备注:合格"'));
  assert.ok(summary.revisionText.includes('reviewNote: "现场入口在道路东侧"'));
});

runTest('operations center validates coordinate revision candidates before writeback', () => {
  const summary = operationsCenter.buildCoordinateReviewSummary({
    places: [
      { id: 1, name: '合法待复核点', type: '教学楼', latitude: 23.27, longitude: 112.68, coordinateSystem: 'GCJ-02', reviewRequired: true, source: '高德地图POI' },
      { id: 2, name: '越界点', type: '教学楼', latitude: 22.1, longitude: 113.2, coordinateSystem: 'GCJ-02', reviewRequired: true },
      { id: 3, name: '坐标格式错误', type: '教学楼', latitude: 'abc', longitude: 112.68, coordinateSystem: 'GCJ-02', reviewRequired: true },
      { id: 4, name: '坐标系错误', type: '教学楼', latitude: 23.27, longitude: 112.68, coordinateSystem: 'WGS-84', reviewRequired: true },
      { id: 5, name: '非待复核点', type: '教学楼', latitude: 23.27, longitude: 112.68, coordinateSystem: 'GCJ-02', reviewRequired: false }
    ],
    coordinateReviews: {
      1: { placeId: 1, note: '现场确认入口在道路东侧', statusText: '已备注' },
      2: { placeId: 2, note: '越界', statusText: '已备注' },
      3: { placeId: 3, note: '格式错', statusText: '已备注' },
      4: { placeId: 4, note: '坐标系错', statusText: '已备注' },
      5: { placeId: 5, note: '不应回写', statusText: '已备注' }
    }
  });

  assert.equal(summary.validation.readyCount, 1);
  assert.equal(summary.validation.issueCount, 4);
  assert.deepEqual(summary.validation.readyItems, [
    { placeId: 1, placeName: '合法待复核点' }
  ]);
  assert.deepEqual(summary.validation.readyItemsPreview, [
    { placeId: 1, placeName: '合法待复核点' }
  ]);
  assert.equal(summary.validation.readyMoreCount, 0);
  assert.equal(summary.validation.blockedItems.length, 4);
  assert.ok(summary.validation.items.find((item) => item.placeId === 1 && item.status === 'ready'));
  assert.ok(summary.validation.items.find((item) => item.placeId === 2).issues.includes('坐标超出校区范围'));
  assert.ok(summary.validation.items.find((item) => item.placeId === 3).issues.includes('坐标不是有效数字'));
  assert.ok(summary.validation.items.find((item) => item.placeId === 4).issues.includes('坐标系不是 GCJ-02'));
  assert.ok(summary.validation.items.find((item) => item.placeId === 5).issues.includes('点位未标记为待复核'));
  assert.ok(summary.validation.blockedItems.find((item) => item.placeId === 2).issueText.includes('坐标超出校区范围'));
  assert.ok(summary.validation.blockedItems.find((item) => item.placeId === 2).issueTags.includes('坐标越界'));
  assert.deepEqual(summary.validation.blockedItems.find((item) => item.placeId === 2).issueTagItems[0], { label: '坐标越界', level: 'danger' });
  assert.ok(summary.validation.blockedItems.find((item) => item.placeId === 3).issueTags.includes('坐标无效'));
  assert.ok(summary.validation.blockedItems.find((item) => item.placeId === 4).issueTags.includes('坐标系错误'));
  assert.deepEqual(summary.validation.issueSummary, [
    { label: '坐标问题', value: 3, level: 'danger' },
    { label: '状态问题', value: 1, level: 'warning' },
    { label: '备注问题', value: 4, level: 'info' }
  ]);
  assert.ok(summary.validation.blockedItems.every((item) => item.issueText && item.status === 'blocked'));
  assert.ok(summary.validation.blockedItems.every((item) => Array.isArray(item.issueTags) && item.issueTags.length));
  assert.ok(summary.revisionText.includes('校验:ready'));
});

runTest('operations center blocks vague coordinate review notes', () => {
  const summary = operationsCenter.buildCoordinateReviewSummary({
    places: [
      { id: 1, name: '备注太短', type: '教学楼', latitude: 23.27, longitude: 112.68, coordinateSystem: 'GCJ-02', reviewRequired: true, source: '高德地图POI' },
      { id: 2, name: '缺少依据词', type: '教学楼', latitude: 23.27, longitude: 112.68, coordinateSystem: 'GCJ-02', reviewRequired: true, source: '高德地图POI' },
      { id: 3, name: '有效备注', type: '教学楼', latitude: 23.27, longitude: 112.68, coordinateSystem: 'GCJ-02', reviewRequired: true, source: '高德地图POI' }
    ],
    coordinateReviews: {
      1: { placeId: 1, note: '通过', statusText: '已备注' },
      2: { placeId: 2, note: '已经确认位置正确', statusText: '已备注' },
      3: { placeId: 3, note: '现场确认入口在道路东侧', statusText: '已备注' }
    }
  });

  assert.equal(summary.validation.readyCount, 1);
  assert.equal(summary.validation.issueCount, 2);
  assert.ok(summary.validation.items.find((item) => item.placeId === 1).issues.includes('校准备注过短'));
  assert.ok(summary.validation.items.find((item) => item.placeId === 2).issues.includes('校准备注缺少入口、楼栋或坐标依据'));
  assert.ok(summary.validation.blockedItems.find((item) => item.placeId === 1).issueTags.includes('备注过短'));
  assert.ok(summary.validation.blockedItems.find((item) => item.placeId === 2).issueTags.includes('依据缺失'));
  assert.ok(summary.validation.items.find((item) => item.placeId === 3 && item.status === 'ready'));
  assert.ok(summary.revisionText.includes('reviewQuality: "备注:校准备注过短'));
  assert.ok(summary.revisionText.includes('reviewQuality: "备注:合格"'));
});

runTest('operations center keeps ready coordinate preview compact', () => {
  const places = [1, 2, 3, 4].map((id) => ({
    id,
    name: '可回写点' + id,
    type: '教学楼',
    latitude: 23.27,
    longitude: 112.68,
    coordinateSystem: 'GCJ-02',
    reviewRequired: true,
    source: '高德地图POI'
  }));
  const coordinateReviews = {};
  places.forEach((place) => {
    coordinateReviews[place.id] = {
      placeId: place.id,
      note: '现场确认入口在道路东侧',
      statusText: '已备注'
    };
  });

  const summary = operationsCenter.buildCoordinateReviewSummary({ places, coordinateReviews });

  assert.equal(summary.validation.readyCount, 4);
  assert.deepEqual(summary.validation.readyItemsPreview.map((item) => item.placeName), ['可回写点1', '可回写点2', '可回写点3']);
  assert.equal(summary.validation.readyMoreCount, 1);
});

runTest('operations center sorts coordinate issue tags by operational priority', () => {
  assert.deepEqual(operationsCenter.buildIssueTags([
    '校准备注过短',
    '坐标系不是 GCJ-02',
    '校准备注缺少入口、楼栋或坐标依据',
    '坐标不是有效数字',
    '点位未标记为待复核'
  ]), ['坐标无效', '坐标系错误', '非复核点', '备注过短', '依据缺失']);
  assert.deepEqual(operationsCenter.buildIssueTagItems([
    '校准备注过短',
    '点位未标记为待复核',
    '坐标不是有效数字'
  ]), [
    { label: '坐标无效', level: 'danger' },
    { label: '非复核点', level: 'warning' },
    { label: '备注过短', level: 'info' }
  ]);

  const summary = operationsCenter.buildCoordinateReviewSummary({
    places: [
      { id: 1, name: '多问题点', type: '教学楼', latitude: 'abc', longitude: 112.68, coordinateSystem: 'WGS-84', reviewRequired: false, source: '高德地图POI' }
    ],
    coordinateReviews: {
      1: { placeId: 1, note: '入口', statusText: '已备注' }
    }
  });

  assert.deepEqual(summary.validation.blockedItems[0].issueTags, ['坐标无效', '坐标系错误', '非复核点', '备注过短']);
  assert.deepEqual(summary.validation.blockedItems[0].issueTagItems.map((item) => item.level), ['danger', 'danger', 'warning', 'info']);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
