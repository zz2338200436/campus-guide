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
  assert.ok(result.length >= 4);
  assert.equal(result[0].featured, true);
});

runTest('featured places include next stop relationships', () => {
  const result = selectors.getFeaturedPlaces(placeData);
  assert.ok(result.some((item) => Array.isArray(item.nextStops) && item.nextStops.length));
});

runTest('study summary reports viewed and total counts', () => {
  const result = selectors.getStudyProgressSummary(studyData, [{ id: 1 }, { id: 4 }], [{ targetId: 5 }]);
  assert.equal(result.viewedCount, 2);
  assert.equal(result.totalCount, studyData.length);
  assert.equal(result.savedCount, 1);
});

runTest('study summary can render personal momentum counts', () => {
  const result = selectors.getStudyProgressSummary(studyData, [{ id: 1 }], [{ targetId: 2 }, { targetId: 3 }]);
  assert.equal(result.savedCount, 2);
});

runTest('related study recommendations exclude current item', () => {
  const result = selectors.getNextStudyRecommendations(studyData, 1, [{ id: 2 }]);
  assert.ok(result.every((item) => Number(item.id) !== 1));
});

runTest('next study recommendations use relatedIds first when available', () => {
  const result = selectors.getNextStudyRecommendations(studyData, 1, []);
  assert.ok(result.length > 0);
  assert.ok(Array.isArray(studyData.find((item) => Number(item.id) === 1).relatedIds));
});

runTest('services are grouped for flagship rendering', () => {
  const result = selectors.groupServices(serviceData);
  assert.ok(result.some((group) => group.items.length));
});

runTest('study data covers all flagship stages with multiple topics', () => {
  const stageCount = studyData.reduce((acc, item) => {
    acc[item.stage] = (acc[item.stage] || 0) + 1;
    return acc;
  }, {});
  assert.ok(stageCount.entry >= 3);
  assert.ok(stageCount.common >= 3);
  assert.ok(stageCount.advanced >= 3);
});

if (process.exitCode) process.exit(process.exitCode);
