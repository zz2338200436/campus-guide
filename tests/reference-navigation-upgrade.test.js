const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { filterPlaces } = require('../utils/contentFilter');
const placeData = require('../utils/placeData');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

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

runTest('place search supports campus-navigation synonyms from reference app', () => {
  const teaching = filterPlaces(placeData, { type: '全部', keyword: '教室' });
  const canteen = filterPlaces(placeData, { type: '全部', keyword: '吃饭' });
  const dorm = filterPlaces(placeData, { type: '全部', keyword: '寝室' });
  const express = filterPlaces(placeData, { type: '全部', keyword: '取件' });
  const emergency = filterPlaces(placeData, { type: '全部', keyword: '看病' });

  assert.ok(teaching.some((item) => item.name === '格致楼'));
  assert.ok(canteen.some((item) => item.name.includes('饭堂')));
  assert.ok(dorm.some((item) => item.type === '宿舍楼'));
  assert.ok(express.some((item) => item.name === '菜鸟驿站'));
  assert.ok(emergency.some((item) => item.name === '校医务室'));
});

runTest('map page ports reference-app navigation modes and panorama affordance', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');

  assert.ok(wxml.includes('map-mode-bar'), 'map page should expose mode switching');
  assert.ok(wxml.includes('导航中'), 'map page should expose a navigation status strip');
  assert.ok(wxml.includes('bindtap="openSelectedPlacePanorama"'), 'selected place should expose panorama/reference view');
  assert.ok(js.includes('mapModes'), 'map page should define map modes');
  assert.ok(js.includes('switchMapMode'), 'map page should implement mode switching');
  assert.ok(js.includes("currentMapMode: 'standard'"), 'map page should default to stable standard campus mode');
  assert.ok(!js.includes("currentMapMode: '3d'"), 'map page should not default to 3D campus mode');
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
