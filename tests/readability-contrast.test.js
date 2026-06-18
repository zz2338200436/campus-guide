const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const checkedFiles = [
  'pages/index/index.wxss',
  'pages/map/map.wxss',
  'pages/placeDetail/placeDetail.wxss',
  'pages/community/community.wxss',
  'pages/community-detail/community-detail.wxss',
  'pages/community-post/community-post.wxss',
  'pages/assistant/assistant.wxss',
  'pages/service/service.wxss',
  'pages/user/user.wxss',
  'pages/noticeDetail/noticeDetail.wxss',
  'pages/studyHistory/studyHistory.wxss',
  'components/place-card/place-card.wxss',
  'components/notice-item/notice-item.wxss',
  'components/study-card/study-card.wxss'
];

checkedFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!content.includes('color: #94a3b8;'), file + ' should not use low-contrast light gray');
  assert.ok(!content.includes('color: #64748b;'), file + ' should use stronger secondary text');
  assert.equal(/font-size:\s*(1[0-9]|2[0-3])rpx;/.test(content), false, file + ' should not use tiny readable text');
});

const indexWxss = fs.readFileSync(path.join(root, 'pages/index/index.wxss'), 'utf8');
assert.ok(indexWxss.includes('font-size: 26rpx;'), 'home should use larger readable secondary text');
assert.ok(indexWxss.includes('color: #475569;'), 'home should use stronger light-mode body color');
assert.ok(indexWxss.includes('color: #cbd5e1;'), 'home dark mode body text should stay readable');

const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
assert.equal(appConfig.tabBar.custom, true);
assert.equal(appConfig.tabBar.color, '#334155');
assert.equal(appConfig.tabBar.selectedColor, '#0E7490');

console.log('PASS readable text contrast and size baseline');
