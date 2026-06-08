const fs = require('node:fs');
const path = require('node:path');

function run() {
  const backupArg = process.argv[2];
  if (!backupArg) {
    throw new Error('Usage: node scripts\\restore-place-data-backup.js generated\\placeData.backup.<timestamp>.js');
  }
  const root = path.join(__dirname, '..');
  const generatedDir = path.resolve(root, 'generated');
  const backupPath = path.resolve(backupArg);
  if (!backupPath.startsWith(generatedDir + path.sep) || !path.basename(backupPath).startsWith('placeData.backup.')) {
    throw new Error('Refusing to restore: backup must be generated\\placeData.backup.<timestamp>.js');
  }
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file does not exist: ' + backupPath);
  }
  const placeDataPath = path.join(root, 'utils', 'placeData.js');
  fs.writeFileSync(placeDataPath, fs.readFileSync(backupPath, 'utf8'), 'utf8');
  console.log('Restored utils/placeData.js from backup:');
  console.log(backupPath);
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
  run
};
