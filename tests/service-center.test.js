const assert = require('node:assert/strict');
const serviceData = require('../utils/serviceData');
const placeData = require('../utils/placeData');
const serviceMatcher = require('../utils/serviceMatcher');

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

runTest('service data supports productized service center fields', () => {
  const campusCard = serviceData.find((item) => item.id === 2);
  assert.ok(campusCard);
  assert.ok(campusCard.category);
  assert.ok(Array.isArray(campusCard.materials));
  assert.ok(campusCard.materials.length >= 2);
  assert.ok(Array.isArray(campusCard.steps));
  assert.ok(campusCard.steps.length >= 2);
  assert.ok(Array.isArray(campusCard.placeIds));
  assert.ok(campusCard.placeIds.includes(3));
  assert.ok(campusCard.actionText);
});

runTest('service matcher groups services by product category', () => {
  const groups = serviceMatcher.groupByCategory(serviceData);
  assert.ok(groups.some((group) => group.title === '宿舍后勤'));
  assert.ok(groups.some((group) => group.title === '学籍事务'));
  assert.ok(groups.some((group) => group.title === '安全应急'));
});

runTest('service matcher returns services linked to a place', () => {
  const cafeteria = placeData.find((item) => Number(item.id) === 3);
  const result = serviceMatcher.getServicesForPlace(cafeteria, serviceData);

  assert.ok(result.some((item) => item.title === '校园卡与餐饮咨询'));
  assert.ok(result.every((item) => Array.isArray(item.placeIds)));
});

runTest('service matcher builds freshman quick services', () => {
  const result = serviceMatcher.getFreshmanQuickServices(serviceData);
  assert.ok(result.length >= 4);
  assert.ok(result.every((item) => item.freshmanPriority));
});

runTest('service matcher attaches primary place for navigation', () => {
  const result = serviceMatcher.attachPrimaryPlace(serviceData, placeData);
  const campusCard = result.find((item) => item.title === '校园卡与餐饮咨询');

  assert.ok(campusCard.primaryPlace);
  assert.equal(campusCard.primaryPlace.id, 3);
  assert.equal(campusCard.primaryPlaceName, '一期桃园饭堂');
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
