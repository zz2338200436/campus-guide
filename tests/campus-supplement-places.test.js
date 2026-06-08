const assert = require('node:assert/strict');
const placeData = require('../utils/placeData');
const supplementPlaces = require('../utils/campusSupplementPlaces');
const { buildSupplementReport } = require('../scripts/audit-campus-supplement-places');

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

runTest('campus supplement list covers hand-drawn map core zones', () => {
  assert.ok(supplementPlaces.length >= 35);
  assert.ok(supplementPlaces.some((item) => item.name === 'S4笃行楼'));
  assert.ok(supplementPlaces.some((item) => item.name === 'J1至善楼'));
  assert.ok(supplementPlaces.some((item) => item.name === '学思苑A栋'));
  assert.ok(supplementPlaces.some((item) => item.name === '集贤苑K栋'));
  assert.ok(supplementPlaces.some((item) => item.name === '风雨连廊'));
  assert.ok(supplementPlaces.every((item) => item.source === '手绘地图待校准'));
});

runTest('campus supplement list keeps valid categories and map positions', () => {
  const validTypes = new Set(['教学楼', '学习场所', '宿舍楼', '生活场所', '交通入口', '办事服务', '应急服务', '运动场所']);
  const names = new Set();

  supplementPlaces.forEach((item) => {
    assert.ok(!names.has(item.name), `duplicate supplement place: ${item.name}`);
    names.add(item.name);
    assert.ok(validTypes.has(item.type), `invalid type for ${item.name}`);
    assert.ok(Number.isFinite(item.mapX) && item.mapX >= 0 && item.mapX <= 100, `invalid mapX for ${item.name}`);
    assert.ok(Number.isFinite(item.mapY) && item.mapY >= 0 && item.mapY <= 100, `invalid mapY for ${item.name}`);
  });
});

runTest('campus supplement audit reports existing and pending places', () => {
  const report = buildSupplementReport(placeData, supplementPlaces);

  assert.ok(report.existing.length >= 5);
  assert.ok(report.pending.length >= 15);
  assert.ok(report.existing.some((item) => item.name === '图书馆' || item.name.includes('图书馆')));
  assert.ok(report.existing.some((item) => item.name === 'S4笃行楼'));
  assert.ok(report.pending.some((item) => item.name === '学思苑A栋'));
  assert.equal(report.invalid.length, 0);
});

runTest('place data includes first batch of estimated hand-drawn map places', () => {
  const names = ['校门', '西大门', 'S4笃行楼', 'J1至善楼', '田径场', '篮球场', '风雨连廊'];

  names.forEach((name) => {
    const place = placeData.find((item) => item.name === name);
    assert.ok(place, `${name} should exist in formal place data`);
    assert.equal(place.source, '手绘地图线性估算');
    assert.equal(place.coordinateStatus, 'estimated');
    assert.equal(place.reviewRequired, true);
    assert.ok(Number.isFinite(Number(place.latitude)), `${name} should have latitude`);
    assert.ok(Number.isFinite(Number(place.longitude)), `${name} should have longitude`);
  });
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
