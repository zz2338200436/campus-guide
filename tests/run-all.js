const { spawnSync } = require('node:child_process');
const path = require('node:path');

const tests = [
  'app-config.test.js',
  'amap-poi-analysis.test.js',
  'amap-poi-fetcher.test.js',
  'campus-3d-map.test.js',
  'campus-coordinate-candidates.test.js',
  'campus-supplement-places.test.js',
  'content-filter.test.js',
  'coordinate-helper.test.js',
  'coordinate-operations-doc.test.js',
  'coordinate-writeback-plan.test.js',
  'enterprise-copy-cleanup.test.js',
  'enterprise-style-cleanup.test.js',
  'enterprise-upgrade-copy.test.js',
  'enterprise-visual-system.test.js',
  'exploration-checkin.test.js',
  'flagship-selectors.test.js',
  'learning-progress.test.js',
  'location-map.test.js',
  'map-page-interactions.test.js',
  'operations-center.test.js',
  'operations-dashboard.test.js',
  'page-slimming.test.js',
  'phone-helper.test.js',
  'place-coordinate-trust.test.js',
  'place-detail-navigation.test.js',
  'product-copy.test.js',
  'reference-navigation-upgrade.test.js',
  'request-services.test.js',
  'route-page-enterprise-style.test.js',
  'secondary-page-slimming.test.js',
  'service-center.test.js',
  'service-hall-copy.test.js',
  'service-issue.test.js',
  'survival-route.test.js',
  'today-action.test.js',
  'utils-smoke.test.js'
];

let failed = 0;

tests.forEach((file) => {
  const testPath = path.join(__dirname, file);
  process.stdout.write(`\n> node tests/${file}\n`);
  const result = spawnSync(process.execPath, [testPath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    failed += 1;
  }
});

if (failed) {
  console.error(`\n${failed} test file(s) failed.`);
  process.exit(1);
}

console.log('\nAll smoke tests passed.');
