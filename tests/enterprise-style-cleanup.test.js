const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const styleFiles = [
  'app.json',
  'components/favorite-btn/favorite-btn.wxss',
  'components/notice-item/notice-item.wxss',
  'components/place-card/place-card.wxss',
  'components/study-card/study-card.wxss',
  'pages/favorite/favorite.wxss',
  'pages/map/map.wxss',
  'pages/notice/notice.wxss',
  'pages/noticeDetail/noticeDetail.wxss',
  'pages/placeDetail/placeDetail.wxss',
  'pages/study/study.wxss',
  'pages/studyDetail/studyDetail.wxss',
  'pages/studyHistory/studyHistory.wxss',
  'pages/survivalRoute/survivalRoute.wxss',
  'pages/user/user.wxss'
];

const violations = [];

styleFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  [
    'Campus atlas v3',
    '#0891b2',
    '#22c55e',
    'linear-gradient(135deg, #0891b2',
    'linear-gradient(145deg, #164e63'
  ].forEach((legacyToken) => {
    if (content.includes(legacyToken)) {
      violations.push(file + ' contains ' + legacyToken);
    }
  });
});

assert.deepEqual(violations, []);
console.log('PASS enterprise style cleanup removed legacy teal visual system');

const noticeWxml = fs.readFileSync(path.join(root, 'pages/notice/notice.wxml'), 'utf8');
const noticeWxss = fs.readFileSync(path.join(root, 'pages/notice/notice.wxss'), 'utf8');
const noticeItemWxss = fs.readFileSync(path.join(root, 'components/notice-item/notice-item.wxss'), 'utf8');

assert.ok(!noticeWxml.includes('查看说明'), 'notice page should not show a large instructional card');
assert.ok(!noticeWxml.includes('先处理置顶提醒'), 'notice page should not use promotional helper copy');
assert.ok(!noticeWxss.includes('radial-gradient'), 'notice page should avoid decorative gradient cards');
assert.ok(!noticeItemWxss.includes('radial-gradient'), 'notice items should avoid decorative top-card gradients');
assert.ok(noticeWxml.includes('notice-toolbar'), 'notice page should use a compact enterprise toolbar');
assert.ok(noticeWxss.includes('background: #ffffff;'), 'notice page should use white enterprise surfaces');
console.log('PASS notice page uses compact enterprise notification styling');

const studyWxss = fs.readFileSync(path.join(root, 'pages/study/study.wxss'), 'utf8');

assert.ok(!studyWxss.includes('radial-gradient'), 'study page should avoid decorative gradient cards');
assert.ok(!studyWxss.includes('linear-gradient'), 'study page should avoid layered legacy gradients');
assert.ok(!studyWxss.includes('999rpx'), 'study page should avoid oversized pill styling');
assert.ok(!studyWxss.includes('rgba(250, 244, 236'), 'study page should remove old warm theme surfaces');
assert.ok(studyWxss.includes('.study-summary'), 'study page should keep compact progress summary styling');
assert.ok(studyWxss.includes('background: #ffffff;'), 'study page should use white enterprise surfaces');
assert.ok(studyWxss.includes('-webkit-line-clamp'), 'study page should clamp long titles and descriptions');
console.log('PASS study page uses compact enterprise learning center styling');

const userWxss = fs.readFileSync(path.join(root, 'pages/user/user.wxss'), 'utf8');

assert.ok(!userWxss.includes('radial-gradient'), 'user page should avoid decorative gradient cards');
assert.ok(!userWxss.includes('linear-gradient'), 'user page should avoid layered legacy gradients');
assert.ok(!userWxss.includes('999rpx'), 'user page should avoid oversized pill styling');
assert.ok(!userWxss.includes('rgba(255, 250, 243'), 'user page should remove old warm theme surfaces');
assert.ok(userWxss.includes('.utility-grid'), 'user page should keep utility grid styling');
assert.ok(userWxss.includes('background: #ffffff;'), 'user page should use white enterprise surfaces');
assert.ok(userWxss.includes('-webkit-line-clamp'), 'user page should clamp long utility descriptions');
console.log('PASS user page uses compact enterprise account styling');

[
  ['pages/studyDetail/studyDetail.wxss', 'study detail page'],
  ['pages/noticeDetail/noticeDetail.wxss', 'notice detail page']
].forEach(([file, label]) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!content.includes('radial-gradient'), label + ' should avoid decorative gradient heroes');
  assert.ok(!content.includes('linear-gradient'), label + ' should avoid layered legacy gradients');
  assert.ok(!content.includes('999rpx'), label + ' should avoid oversized pill styling');
  assert.ok(content.includes('background: #ffffff;'), label + ' should use white enterprise surfaces');
  assert.ok(content.includes('border-radius: 8rpx;'), label + ' should use compact enterprise radii');
});
console.log('PASS detail pages use compact enterprise article styling');

[
  ['pages/placeDetail/placeDetail.wxss', 'place detail page'],
  ['components/place-card/place-card.wxss', 'place card component'],
  ['components/study-card/study-card.wxss', 'study card component']
].forEach(([file, label]) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!content.includes('radial-gradient'), label + ' should avoid decorative gradient layers');
  assert.ok(!content.includes('linear-gradient'), label + ' should avoid layered legacy gradients');
  assert.ok(!content.includes('999rpx'), label + ' should avoid oversized pill styling');
  assert.ok(content.includes('background: #ffffff;'), label + ' should use white enterprise surfaces');
  assert.ok(content.includes('border-radius: 8rpx;'), label + ' should use compact enterprise radii');
  assert.ok(content.includes('-webkit-line-clamp'), label + ' should clamp long text');
});
console.log('PASS place detail and cards use compact enterprise styling');

const mapWxss = fs.readFileSync(path.join(root, 'pages/map/map.wxss'), 'utf8');
const mapLineCount = mapWxss.trim().split(/\r?\n/).length;

assert.ok(!mapWxss.includes('radial-gradient'), 'map page should avoid decorative gradient layers');
assert.ok(!mapWxss.includes('linear-gradient'), 'map page should avoid layered legacy gradients');
assert.ok(!mapWxss.includes('999rpx'), 'map page should avoid oversized pill styling');
assert.ok(!mapWxss.includes('campus-static-map'), 'map page should not keep removed local static map styles');
assert.ok(mapWxss.includes('.campus-real-map'), 'map page should keep native WeChat map sizing');
assert.ok(mapWxss.includes('.nav-info-panel'), 'map page should keep in-app navigation panel styling');
assert.ok(mapWxss.includes('background: #ffffff;'), 'map page should use white enterprise surfaces');
assert.ok(mapWxss.includes('-webkit-line-clamp'), 'map page should clamp long place and directory text');
assert.ok(mapLineCount <= 500, 'map wxss should be <= 500 lines after removing legacy layers');
console.log('PASS map page uses compact enterprise map styling');

[
  ['pages/favorite/favorite.wxss', 'favorite page'],
  ['pages/studyHistory/studyHistory.wxss', 'study history page'],
  ['components/favorite-btn/favorite-btn.wxss', 'favorite button component']
].forEach(([file, label]) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!content.includes('radial-gradient'), label + ' should avoid decorative gradient layers');
  assert.ok(!content.includes('linear-gradient'), label + ' should avoid layered legacy gradients');
  assert.ok(!content.includes('999rpx'), label + ' should avoid oversized pill styling');
  assert.ok(content.includes('background: #ffffff;'), label + ' should use white enterprise surfaces');
  assert.ok(content.includes('border-radius: 8rpx;'), label + ' should use compact enterprise radii');
});
console.log('PASS utility pages and buttons use compact enterprise styling');
