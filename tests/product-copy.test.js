const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runtimeFiles = [
  'pages/index/index.wxml',
  'pages/map/map.wxml',
  'pages/notice/notice.wxml',
  'pages/study/study.wxml',
  'pages/user/user.wxml',
  'utils/services/homeService.js',
  'utils/noticeData.js',
  'utils/placeData.js',
  'utils/studyData.js',
  'README.md'
];

const bannedPatterns = [
  /课程作业/,
  /课程设计/,
  /答辩/,
  /Mock 数据/,
  /Campus Today/,
  /Campus Tour/,
  /Route Overview/,
  />Account</
];

const violations = [];

runtimeFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  bannedPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      violations.push(file + ' contains ' + pattern);
    }
  });
});

assert.deepEqual(violations, []);
console.log('PASS runtime product copy has no course-demo positioning');
