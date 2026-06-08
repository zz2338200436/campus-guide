const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../app.json'), 'utf8'));
const allowedPrivateInfos = new Set([
  'chooseAddress',
  'chooseLocation',
  'choosePoi',
  'getFuzzyLocation',
  'getLocation',
  'onLocationChange',
  'startLocationUpdate',
  'startLocationUpdateBackground'
]);

const invalidPrivateInfos = (appConfig.requiredPrivateInfos || []).filter((item) => !allowedPrivateInfos.has(item));

assert.deepEqual(invalidPrivateInfos, []);
assert.ok(appConfig.requiredPrivateInfos.includes('getLocation'));
assert.ok(appConfig.requiredPrivateInfos.includes('chooseLocation'));

console.log('PASS app config requiredPrivateInfos only declares allowed WeChat private APIs');
