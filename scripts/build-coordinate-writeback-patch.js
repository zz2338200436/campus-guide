const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildReviewPatch, hasMissingReviewQuality, applyReadyUpdatesToSource } = require('../utils/coordinateWritebackPlan');

const POST_APPLY_TESTS = [
  'tests\\coordinate-helper.test.js',
  'tests\\location-map.test.js',
  'tests\\operations-center.test.js',
  'tests\\place-coordinate-trust.test.js',
  'tests\\request-services.test.js'
];

function run() {
  const options = parseArgs(process.argv.slice(2));
  const shouldApply = options.apply;
  const inputPath = options.inputPath || path.join(__dirname, '..', 'generated', 'place-coordinate-writeback-plan.json');
  if (!fs.existsSync(inputPath)) {
    throw new Error('Missing generated/place-coordinate-writeback-plan.json. Run scripts/build-coordinate-writeback-plan.js first.');
  }
  const plan = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const patch = buildReviewPatch(plan);
  const outputDir = options.outputDir || path.join(__dirname, '..', 'generated');
  const outputPath = path.join(outputDir, 'place-coordinate-writeback.patch');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, patch, 'utf8');
  console.log(`Coordinate writeback patch: ready ${plan.readyCount || 0}, blocked ${plan.blockedCount || 0}.`);
  console.log(outputPath);
  if (shouldApply) {
    const readyItems = Array.isArray(plan.items) ? plan.items.filter((item) => item.ready) : [];
    if (!readyItems.length) {
      throw new Error('暂无可回写点位，已停止 apply。');
    }
    const missingReviewQualityItems = readyItems.filter(hasMissingReviewQuality);
    if (missingReviewQualityItems.length) {
      const names = missingReviewQualityItems.map((item) => item.name || ('ID ' + item.id)).join('、');
      throw new Error('ready 点位缺少备注质量，已停止 apply：' + names);
    }
    const placeDataPath = options.placeDataPath || path.join(__dirname, '..', 'utils', 'placeData.js');
    const sourceText = fs.readFileSync(placeDataPath, 'utf8');
    const result = applyReadyUpdatesToSource(sourceText, plan);
    const backupPath = path.join(outputDir, 'placeData.backup.' + Date.now() + '.js');
    fs.writeFileSync(backupPath, result.backupText, 'utf8');
    fs.writeFileSync(placeDataPath, result.updatedSource, 'utf8');
    console.log(`Applied ${result.appliedCount} ready coordinate updates, skipped ${result.skippedCount}.`);
    console.log(backupPath);
    runPostApplyChecks(backupPath);
  }
}

function parseArgs(args) {
  const result = { apply: false, inputPath: '', outputDir: '', placeDataPath: '' };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--apply') {
      result.apply = true;
      continue;
    }
    if (value === '--place-data') {
      result.placeDataPath = path.resolve(args[index + 1] || '');
      index += 1;
      continue;
    }
    if (value === '--output-dir') {
      result.outputDir = path.resolve(args[index + 1] || '');
      index += 1;
      continue;
    }
    if (!result.inputPath) {
      result.inputPath = value;
    }
  }
  return result;
}

function runPostApplyChecks(backupPath) {
  POST_APPLY_TESTS.forEach((testFile) => {
    const result = spawnSync(process.execPath, [testFile], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    if (result.status !== 0) {
      const restoreCommand = 'node scripts\\restore-place-data-backup.js "' + backupPath + '"';
      throw new Error('Post-apply verification failed. Backup is available at ' + backupPath + '\nRestore with: ' + restoreCommand);
    }
  });
  console.log('Post-apply verification passed.');
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  run,
  parseArgs,
  runPostApplyChecks
};
