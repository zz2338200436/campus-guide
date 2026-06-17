const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

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

runTest('community feed page exposes overview, hot items, and typed cards', () => {
  const communityJs = read('pages/community/community.js');
  const communityWxml = read('pages/community/community.wxml');
  const communityWxss = read('pages/community/community.wxss');

  assert.ok(communityJs.includes('getFeedOverview'));
  assert.ok(communityJs.includes('getDisplayPostsByType'));
  assert.ok(communityJs.includes('getHotPostSummaries'));
  assert.ok(communityWxml.includes('community-overview'));
  assert.ok(communityWxml.includes('community-hot-card'));
  assert.ok(communityWxml.includes('community-card__badge'));
  assert.ok(communityWxml.includes('community-card__market'));
  assert.ok(communityWxml.includes('community-empty'));
  assert.ok(communityWxss.includes('.community-overview'));
  assert.ok(communityWxss.includes('.community-hot-card'));
  assert.ok(communityWxss.includes('.community-card__badge'));
});

runTest('community detail page exposes summary, reply state, and missing fallback', () => {
  const detailJs = read('pages/community-detail/community-detail.js');
  const detailWxml = read('pages/community-detail/community-detail.wxml');
  const detailWxss = read('pages/community-detail/community-detail.wxss');

  assert.ok(detailJs.includes('missingState'));
  assert.ok(detailJs.includes('getDisplayPost'));
  assert.ok(detailWxml.includes('detail-empty'));
  assert.ok(detailWxml.includes('community-post-summary'));
  assert.ok(detailWxml.includes('reply-state'));
  assert.ok(detailWxml.includes('comment-composer'));
  assert.ok(detailWxss.includes('.reply-state'));
  assert.ok(detailWxss.includes('.community-post-summary'));
});

runTest('community publish page groups shared and marketplace fields', () => {
  const postJs = read('pages/community-post/community-post.js');
  const postWxml = read('pages/community-post/community-post.wxml');
  const postWxss = read('pages/community-post/community-post.wxss');

  assert.ok(postJs.includes('statusOptions'));
  assert.ok(postWxml.includes('post-section'));
  assert.ok(postWxml.includes('post-mode-note'));
  assert.ok(postWxml.includes('marketplace-fields'));
  assert.ok(postWxml.includes('post-status-switch'));
  assert.ok(postWxss.includes('.post-section'));
  assert.ok(postWxss.includes('.post-submit-bar'));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
