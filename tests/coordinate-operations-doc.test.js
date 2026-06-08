const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const docPath = path.join(root, 'docs', 'coordinate-operations.md');
const readmePath = path.join(root, 'README.md');

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

function readDoc() {
  return fs.readFileSync(docPath, 'utf8');
}

runTest('coordinate operations guide exists', () => {
  assert.ok(fs.existsSync(docPath), 'docs/coordinate-operations.md should exist');
});

runTest('coordinate operations guide documents the full maintenance workflow', () => {
  const doc = readDoc();

  [
    'AMAP_WEB_SERVICE_KEY',
    'node scripts\\fetch-amap-campus-pois.js',
    'node scripts\\analyze-amap-campus-pois.js',
    'node scripts\\build-campus-coordinate-candidates.js',
    'generated\\coordinate-revision-template.txt',
    'node scripts\\build-coordinate-writeback-plan.js generated\\coordinate-revision-template.txt --output-dir generated',
    'node scripts\\build-coordinate-writeback-patch.js --output-dir generated',
    'node scripts\\build-coordinate-writeback-patch.js --apply --output-dir generated',
    '--apply',
    'node scripts\\restore-place-data-backup.js',
    'generated\\place-coordinate-writeback-plan.json',
    'generated\\place-coordinate-writeback.patch',
    'utils\\placeData.js'
  ].forEach((text) => {
    assert.ok(doc.includes(text), `guide should mention ${text}`);
  });
});

runTest('coordinate operations guide includes mini program validation steps', () => {
  const doc = readDoc();

  ['微信开发者工具', '地图页', '运维页', '校准备注', 'reviewRequired', '入口', '楼栋', '坐标依据'].forEach((text) => {
    assert.ok(doc.includes(text), `guide should mention ${text}`);
  });
});

runTest('readme links to coordinate operations guide', () => {
  const readme = fs.readFileSync(readmePath, 'utf8');

  assert.ok(readme.includes('docs/coordinate-operations.md'), 'README should link to the coordinate operations guide');
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
