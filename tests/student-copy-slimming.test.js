const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

const studentPages = [
  'pages/index/index.wxml',
  'pages/placeDetail/placeDetail.wxml',
  'pages/community/community.wxml',
  'pages/studyDetail/studyDetail.wxml'
].map((file) => ({
  file,
  content: read(file)
}));

[
  '保持和当前项目一致',
  '点击后会根据当前环境',
  '同步到推荐路线和我的足迹',
  '导航坐标',
  'coordinateTrust.sourceText',
  'coordinateTrust.desc',
  '完成记录会同步到'
].forEach((copy) => {
  studentPages.forEach(({ file, content }) => {
    assert.ok(!content.includes(copy), file + ' should not expose "' + copy + '"');
  });
});

assert.ok(!read('pages/map/map.wxml').includes('coordinateSystem'));
assert.ok(!read('pages/map/map.wxml').includes('高德来源'));
assert.ok(read('pages/map/map.wxml').includes('placeholder="搜索地点或楼栋"'));
assert.ok(read('pages/placeDetail/placeDetail.wxml').includes('到访记录'));
assert.ok(read('pages/community/community.wxml').includes('看动态、发求助、逛二手'));

console.log('PASS student-facing copy stays short and non-technical');
