const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runtimeFiles = [
  'pages/map/map.wxml',
  'pages/placeDetail/placeDetail.wxml',
  'pages/study/study.wxml',
  'pages/studyDetail/studyDetail.wxml',
  'pages/survivalRoute/survivalRoute.wxml',
  'pages/user/user.wxml',
  'utils/noticeData.js',
  'utils/placeData.js',
  'utils/serviceData.js',
  'utils/serviceMatcher.js',
  'utils/survivalRouteBuilder.js',
  'utils/todayActionBuilder.js'
];

const bannedCopies = [
  '新生',
  '生存路线',
  '学习专区',
  '探索',
  '打卡'
];

const violations = [];

runtimeFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  bannedCopies.forEach((copy) => {
    if (content.includes(copy)) {
      violations.push(file + ' contains ' + copy);
    }
  });
});

assert.deepEqual(violations, []);
console.log('PASS enterprise runtime copy has no student-assistant leftovers');
