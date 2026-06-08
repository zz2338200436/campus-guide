const fs = require('node:fs');
const path = require('node:path');
const coordinateWritebackPlan = require('../utils/coordinateWritebackPlan');

function run() {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = options.inputPath;
  if (!inputPath) {
    throw new Error('Usage: node scripts/build-coordinate-writeback-plan.js <revision-template.txt> [--output-dir <dir>]');
  }
  const templateText = fs.readFileSync(path.resolve(inputPath), 'utf8');
  const plan = coordinateWritebackPlan.buildWritebackPlan(templateText);
  const outputDir = options.outputDir || path.join(__dirname, '..', 'generated');
  const jsonPath = path.join(outputDir, 'place-coordinate-writeback-plan.json');
  const markdownPath = path.join(outputDir, 'place-coordinate-writeback-plan.md');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(plan, null, 2), 'utf8');
  fs.writeFileSync(markdownPath, plan.markdown, 'utf8');
  const missingReviewQualityCount = plan.items
    .filter((item) => item.ready && coordinateWritebackPlan.hasMissingReviewQuality(item))
    .length;
  console.log(`Coordinate writeback plan: total ${plan.total}, ready ${plan.readyCount}, blocked ${plan.blockedCount}, missing reviewQuality ${missingReviewQualityCount}.`);
  console.log(jsonPath);
  console.log(markdownPath);
}

function parseArgs(args) {
  const result = { inputPath: '', outputDir: '' };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
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
  parseArgs
};
