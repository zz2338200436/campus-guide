const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runtimeFiles = [
  'app.js',
  'pages/index/index.wxml',
  'pages/map/map.wxml',
  'pages/operations/operations.wxml',
  'pages/placeDetail/placeDetail.wxml',
  'pages/service/service.wxml',
  'pages/study/study.wxml',
  'pages/studyDetail/studyDetail.wxml',
  'pages/survivalRoute/survivalRoute.wxml',
  'pages/user/user.wxml',
  'utils/services/homeService.js',
  'utils/noticeData.js',
  'utils/placeData.js',
  'utils/serviceData.js',
  'utils/serviceMatcher.js',
  'utils/survivalRouteBuilder.js',
  'utils/todayActionBuilder.js'
];

const bannedCopies = [
  '智慧校园服务门户',
  '校园服务工作台',
  '企业级',
  '旗舰',
  '统一聚合',
  '支撑学生日常事务',
  '校园服务工单',
  '运营数据看板',
  '业务指标',
  'SLA'
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

[
  'pages/index/index.wxml',
  'pages/index/index.wxss'
].forEach((file) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!content.includes('enterprise-'), file + ' should not keep enterprise class names on the student home page');
});

console.log('PASS runtime copy avoids over-polished enterprise wording');
