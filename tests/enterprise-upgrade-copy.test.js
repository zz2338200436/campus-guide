const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function assertIncludes(content, expected, file) {
  assert.ok(content.includes(expected), file + ' should include "' + expected + '"');
}

function assertExcludes(content, banned, file) {
  assert.ok(!content.includes(banned), file + ' should not include "' + banned + '"');
}

const indexWxml = read('pages/index/index.wxml');
const mapWxml = read('pages/map/map.wxml');
const homeService = read('utils/services/homeService.js');

assertIncludes(indexWxml, '今天先去哪', 'pages/index/index.wxml');
assertIncludes(indexWxml, '广州应用科技学院肇庆校区', 'pages/index/index.wxml');
assertIncludes(indexWxml, '常用入口', 'pages/index/index.wxml');
assertIncludes(indexWxml, '最近通知', 'pages/index/index.wxml');
assertIncludes(mapWxml, '校园地图服务', 'pages/map/map.wxml');
assertIncludes(mapWxml, '应急入口', 'pages/map/map.wxml');
assertIncludes(mapWxml, '搜索地点、楼栋或高德来源', 'pages/map/map.wxml');
assertIncludes(homeService, '常用服务', 'utils/services/homeService.js');
assertIncludes(homeService, '学习资源', 'utils/services/homeService.js');

[
  '智慧校园服务门户',
  '校园服务工作台',
  '统一聚合',
  '未读通知',
  '我的工单'
].forEach((copy) => {
  assertExcludes(indexWxml, copy, 'pages/index/index.wxml');
});

assertExcludes(mapWxml, '新生探索', 'pages/map/map.wxml');
assertExcludes(mapWxml, '定位 API 操作台', 'pages/map/map.wxml');

console.log('PASS home copy is positioned as a natural student campus helper');
