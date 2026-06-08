const assert = require('node:assert/strict');
const coordinateHelper = require('../utils/coordinateHelper');

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

runTest('coordinate helper converts Guangzhou campus WGS84 to GCJ-02 for WeChat maps', () => {
  const result = coordinateHelper.wgs84ToGcj02(23.272863, 112.6755196);

  assert.ok(result.latitude > 23.270 && result.latitude < 23.276);
  assert.ok(result.longitude > 112.678 && result.longitude < 112.683);
  assert.notEqual(result.latitude, 23.272863);
  assert.notEqual(result.longitude, 112.6755196);
});

runTest('coordinate helper keeps overseas coordinates unchanged', () => {
  const result = coordinateHelper.wgs84ToGcj02(40.7128, -74.006);

  assert.equal(result.latitude, 40.7128);
  assert.equal(result.longitude, -74.006);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
