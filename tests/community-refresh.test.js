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

if (process.exitCode) {
  process.exit(process.exitCode);
}
