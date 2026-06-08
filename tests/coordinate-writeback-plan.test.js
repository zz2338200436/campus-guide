const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const writebackPlan = require('../utils/coordinateWritebackPlan');

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

const templateText = [
  'placeData 坐标修订模板',
  '{',
  '  id: 28,',
  '  name: "明德楼",',
  '  type: "教学楼",',
  '  oldLatitude: 23.2698269,',
  '  oldLongitude: 112.6814309,',
  '  source: "高德地图POI",',
  '  validation: "校验:ready",',
  '  reviewQuality: "备注:合格",',
  '  reviewNote: "现场入口在道路东侧"',
  '}'
].join('\n');

runTest('coordinate writeback plan parses copied revision template blocks', () => {
  const items = writebackPlan.parseRevisionTemplate(templateText);

  assert.equal(items.length, 1);
  assert.equal(items[0].id, 28);
  assert.equal(items[0].name, '明德楼');
  assert.equal(items[0].oldLatitude, 23.2698269);
  assert.equal(items[0].oldLongitude, 112.6814309);
  assert.equal(items[0].validation, '校验:ready');
  assert.equal(items[0].reviewQuality, '备注:合格');
  assert.equal(items[0].reviewNote, '现场入口在道路东侧');
});

runTest('coordinate writeback plan builds review-only suggestions without mutating placeData', () => {
  const plan = writebackPlan.buildWritebackPlan(templateText);

  assert.equal(plan.total, 1);
  assert.equal(plan.readyCount, 1);
  assert.equal(plan.items[0].action, '人工确认后回写');
  assert.equal(plan.items[0].targetFile, 'utils/placeData.js');
  assert.ok(plan.items[0].suggestedPatch.includes('id: 28'));
  assert.ok(plan.items[0].suggestedPatch.includes('reviewRequired: false'));
  assert.equal(plan.items[0].reviewQuality, '备注:合格');
  assert.ok(plan.markdown.includes('坐标回写建议'));
  assert.ok(plan.markdown.includes('明德楼'));
  assert.ok(plan.markdown.includes('- 备注质量: 备注:合格'));
});

runTest('coordinate writeback plan builds an apply-later patch for ready items only', () => {
  const plan = {
    items: [
      { id: 28, name: '明德楼', ready: true, reviewQuality: '备注:合格', suggestedPatch: 'id: 28\nreviewRequired: false' },
      { id: 29, name: '待处理点', ready: false, reviewQuality: '备注:校准备注过短', suggestedPatch: 'id: 29\nreviewRequired: true' }
    ]
  };
  const patch = writebackPlan.buildReviewPatch(plan);

  assert.ok(patch.includes('坐标回写人工确认 patch'));
  assert.ok(patch.includes('## 回写前检查'));
  assert.ok(patch.includes('- 已确认 generated/place-coordinate-writeback-plan.json 来自最新运维页复制模板'));
  assert.ok(patch.includes('- 仅回写校验通过的 ready 点位：1 处'));
  assert.ok(patch.includes('- 已检查每个点位的备注质量和现场依据'));
  assert.ok(patch.includes('- 回写后运行 node scripts\\build-coordinate-writeback-patch.js --apply --output-dir generated 的内置校验'));
  assert.ok(patch.includes('明德楼'));
  assert.ok(patch.includes('id: 28'));
  assert.ok(patch.includes('reviewRequired: false'));
  assert.ok(patch.includes('- 备注质量: 备注:合格'));
  assert.ok(!patch.includes('备注:校准备注过短'));
  assert.ok(!patch.includes('id: 29'));
  assert.ok(!patch.includes('待处理点'));
});

runTest('coordinate writeback patch warns when ready items come from old plans without review quality', () => {
  const plan = {
    items: [
      { id: 28, name: '明德楼', ready: true, suggestedPatch: 'id: 28\nreviewRequired: false' }
    ]
  };
  const patch = writebackPlan.buildReviewPatch(plan);

  assert.ok(patch.includes('## 风险提醒'));
  assert.ok(patch.includes('- 发现 1 个 ready 点位缺少备注质量，可能来自旧版 generated/place-coordinate-writeback-plan.json'));
  assert.ok(patch.includes('- 缺少备注质量：明德楼'));
  assert.ok(patch.includes('- 建议从运维页重新复制坐标修订模板后再生成 plan'));
  assert.ok(patch.includes('- 备注质量: 未标注'));
});

runTest('coordinate writeback patch treats unmarked review quality as a risk', () => {
  const plan = {
    items: [
      { id: 28, name: '明德楼', ready: true, reviewQuality: '未标注', suggestedPatch: 'id: 28\nreviewRequired: false' }
    ]
  };
  const patch = writebackPlan.buildReviewPatch(plan);

  assert.ok(patch.includes('## 风险提醒'));
  assert.ok(patch.includes('- 发现 1 个 ready 点位缺少备注质量，可能来自旧版 generated/place-coordinate-writeback-plan.json'));
  assert.ok(patch.includes('- 缺少备注质量：明德楼'));
});

runTest('coordinate writeback apply mode updates only ready records and returns backup text', () => {
  const source = [
    'module.exports = [',
    '  {',
    '    id: 28,',
    '    name: "明德楼",',
    '    latitude: 23.2698269,',
    '    longitude: 112.6814309,',
    '    reviewRequired: true',
    '  },',
    '  {',
    '    id: 29,',
    '    name: "待处理点",',
    '    latitude: 23.2,',
    '    longitude: 112.6,',
    '    reviewRequired: true',
    '  }',
    '];'
  ].join('\n');
  const plan = {
    items: [
      { id: 28, ready: true, suggestedPatch: 'id: 28\nlatitude: 23.2698269\nlongitude: 112.6814309\ncoordinateSystem: "GCJ-02"\nsource: "高德地图POI"\nreviewRequired: false\nreviewNote: "现场入口在道路东侧"' },
      { id: 29, ready: false, suggestedPatch: 'id: 29\nreviewRequired: false' }
    ]
  };
  const result = writebackPlan.applyReadyUpdatesToSource(source, plan);

  assert.equal(result.appliedCount, 1);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.backupText, source);
  assert.ok(result.updatedSource.includes('reviewRequired: false'));
  assert.ok(result.updatedSource.includes('coordinateSystem: "GCJ-02"'));
  assert.ok(result.updatedSource.includes('reviewNote: "现场入口在道路东侧"'));
  assert.ok(result.updatedSource.includes('name: "待处理点"'));
});

runTest('coordinate writeback script is present and non-destructive', () => {
  const script = read('scripts/build-coordinate-writeback-plan.js');

  assert.ok(script.includes('coordinateWritebackPlan'), 'script should use the shared writeback plan module');
  assert.ok(script.includes('place-coordinate-writeback-plan.json'), 'script should write JSON plan to generated');
  assert.ok(script.includes('place-coordinate-writeback-plan.md'), 'script should write Markdown plan to generated');
  assert.ok(!script.includes('placeData.js'), 'script should not write directly to placeData.js');
});

runTest('coordinate writeback plan script reports missing review quality in terminal output', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coordinate-plan-'));
  const templatePath = path.join(tempDir, 'revision-template.txt');
  const outputDir = path.join(tempDir, 'generated');
  fs.writeFileSync(templatePath, [
    'placeData 坐标修订模板',
    '{',
    '  id: 28,',
    '  name: "明德楼",',
    '  type: "教学楼",',
    '  oldLatitude: 23.2698269,',
    '  oldLongitude: 112.6814309,',
    '  source: "高德地图POI",',
    '  validation: "校验:ready",',
    '  reviewNote: "现场入口在道路东侧"',
    '}'
  ].join('\n'), 'utf8');
  const result = spawnSync(process.execPath, ['scripts\\build-coordinate-writeback-plan.js', templatePath, '--output-dir', outputDir], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('missing reviewQuality 1'));
  assert.ok(result.stdout.includes(path.join(outputDir, 'place-coordinate-writeback-plan.json')));
  assert.ok(fs.existsSync(path.join(outputDir, 'place-coordinate-writeback-plan.json')));
  assert.ok(fs.existsSync(path.join(outputDir, 'place-coordinate-writeback-plan.md')));
});

runTest('coordinate writeback patch script is present and non-destructive', () => {
  const script = read('scripts/build-coordinate-writeback-patch.js');

  assert.ok(script.includes('buildReviewPatch'), 'patch script should use the shared patch builder');
  assert.ok(script.includes('applyReadyUpdatesToSource'), 'patch script should use the guarded apply helper');
  assert.ok(script.includes('--apply'), 'patch script should require an explicit apply flag');
  assert.ok(script.includes('--place-data'), 'patch script should support a test-only apply target');
  assert.ok(script.includes('--output-dir'), 'patch script should support isolated output directories');
  assert.ok(script.includes('placeData.backup'), 'apply mode should create a backup artifact');
  assert.ok(script.includes('place-coordinate-writeback-plan.json'), 'patch script should read the generated plan');
  assert.ok(script.includes('place-coordinate-writeback.patch'), 'patch script should write a reviewable patch artifact');
  assert.ok(script.includes('writeFileSync(placeDataPath'), 'placeData write should be gated behind --apply');
});

runTest('coordinate writeback apply mode runs focused verification after writing', () => {
  const script = read('scripts/build-coordinate-writeback-patch.js');

  assert.ok(script.includes('runPostApplyChecks'), 'apply mode should run post-apply verification');
  assert.ok(script.includes('tests\\\\coordinate-helper.test.js'), 'post-apply checks should validate coordinate helpers');
  assert.ok(script.includes('tests\\\\location-map.test.js'), 'post-apply checks should validate map behavior');
  assert.ok(script.includes('tests\\\\operations-center.test.js'), 'post-apply checks should validate operations summary');
  assert.ok(script.includes('tests\\\\place-coordinate-trust.test.js'), 'post-apply checks should validate coordinate trust UI/data');
  assert.ok(script.includes('tests\\\\request-services.test.js'), 'post-apply checks should validate service facade');
  assert.ok(script.includes('Post-apply verification failed'), 'apply mode should fail loudly when checks fail');
  assert.ok(script.includes('backupPath'), 'failure message should keep the backup path visible');
});

runTest('coordinate writeback apply mode refuses plans with no ready items', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coordinate-empty-apply-'));
  const planPath = path.join(tempDir, 'place-coordinate-writeback-plan.json');
  const placeDataPath = path.join(tempDir, 'placeData.js');
  const outputDir = path.join(tempDir, 'generated');
  fs.writeFileSync(placeDataPath, read('utils/placeData.js'), 'utf8');
  fs.writeFileSync(planPath, JSON.stringify({
    readyCount: 0,
    blockedCount: 1,
    items: [
      { id: 29, name: '待处理点', ready: false, suggestedPatch: 'id: 29\nreviewRequired: true' }
    ]
  }, null, 2), 'utf8');

  const result = spawnSync(process.execPath, ['scripts\\build-coordinate-writeback-patch.js', '--apply', '--place-data', placeDataPath, '--output-dir', outputDir, planPath], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.ok(result.stderr.includes('暂无可回写点位'));
  assert.ok(fs.existsSync(path.join(outputDir, 'place-coordinate-writeback.patch')));
  assert.equal(fs.readdirSync(outputDir).filter((file) => file.startsWith('placeData.backup.')).length, 0);
});

runTest('coordinate writeback apply mode refuses ready items without review quality', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coordinate-old-plan-'));
  const planPath = path.join(tempDir, 'place-coordinate-writeback-plan.json');
  const placeDataPath = path.join(tempDir, 'placeData.js');
  const outputDir = path.join(tempDir, 'generated');
  fs.writeFileSync(placeDataPath, read('utils/placeData.js'), 'utf8');
  fs.writeFileSync(planPath, JSON.stringify({
    readyCount: 1,
    blockedCount: 0,
    items: [
      { id: 28, name: '明德楼', ready: true, suggestedPatch: 'id: 28\nreviewRequired: false' }
    ]
  }, null, 2), 'utf8');

  const result = spawnSync(process.execPath, ['scripts\\build-coordinate-writeback-patch.js', '--apply', '--place-data', placeDataPath, '--output-dir', outputDir, planPath], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.ok(result.stderr.includes('ready 点位缺少备注质量'));
  assert.ok(result.stderr.includes('明德楼'));
  assert.ok(fs.existsSync(path.join(outputDir, 'place-coordinate-writeback.patch')));
  assert.equal(fs.readdirSync(outputDir).filter((file) => file.startsWith('placeData.backup.')).length, 0);
});

runTest('coordinate writeback failure message includes an explicit restore command', () => {
  const script = read('scripts/build-coordinate-writeback-patch.js');

  assert.ok(script.includes('restore-place-data-backup.js'), 'failure message should name the restore script');
  assert.ok(script.includes('node scripts\\\\restore-place-data-backup.js'), 'failure message should include a copyable restore command');
});

runTest('placeData restore script accepts only generated backups', () => {
  const script = read('scripts/restore-place-data-backup.js');

  assert.ok(script.includes('placeData.backup.'), 'restore script should require the backup naming convention');
  assert.ok(script.includes('generated'), 'restore script should restrict backups to generated artifacts');
  assert.ok(script.includes('utils'), 'restore script should restore utils/placeData.js');
  assert.ok(script.includes('writeFileSync(placeDataPath'), 'restore script should write the selected backup to placeData');
  assert.ok(script.includes('path.resolve'), 'restore script should resolve and validate paths');
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
