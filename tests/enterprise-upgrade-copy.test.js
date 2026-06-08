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

assertIncludes(indexWxml, '校园服务工作台', 'pages/index/index.wxml');
assertIncludes(indexWxml, '广州应用科技学院肇庆校区', 'pages/index/index.wxml');
assertIncludes(indexWxml, '常用服务', 'pages/index/index.wxml');
assertIncludes(indexWxml, '未读通知', 'pages/index/index.wxml');
assertIncludes(mapWxml, '校园地图服务', 'pages/map/map.wxml');
assertIncludes(mapWxml, '应急入口', 'pages/map/map.wxml');
assertIncludes(mapWxml, '搜索地点、楼栋、坐标来源、待复核或高德', 'pages/map/map.wxml');
assertIncludes(homeService, '办事大厅', 'utils/services/homeService.js');
assertIncludes(homeService, '学习资源', 'utils/services/homeService.js');

[
  '新生校园助手',
  '今天的下一站',
  '手册目录',
  '手册章节',
  '新生探索'
].forEach((copy) => {
  assertExcludes(indexWxml, copy, 'pages/index/index.wxml');
});

assertExcludes(mapWxml, '新生探索', 'pages/map/map.wxml');
assertExcludes(mapWxml, '定位 API 操作台', 'pages/map/map.wxml');

console.log('PASS enterprise upgrade copy is positioned as a campus service portal');
