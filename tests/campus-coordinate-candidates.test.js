const assert = require('node:assert/strict');
const placeData = require('../utils/placeData');
const supplementPlaces = require('../utils/campusSupplementPlaces');
const { buildCoordinateCandidates, buildLinearModel } = require('../scripts/build-campus-coordinate-candidates');

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

runTest('coordinate candidate model estimates campus coordinates from map positions', () => {
  const model = buildLinearModel(placeData);
  const estimate = model.estimate(60, 42);

  assert.ok(estimate.latitude > 23.263 && estimate.latitude < 23.275);
  assert.ok(estimate.longitude > 112.670 && estimate.longitude < 112.6845);
  assert.ok(model.averageErrorMeters > 0);
  assert.ok(model.averageErrorMeters < 250);
});

runTest('coordinate candidates are produced for pending supplement places', () => {
  const candidates = buildCoordinateCandidates(placeData, supplementPlaces);

  assert.ok(candidates.length >= 15);
  assert.ok(candidates.some((item) => item.name === '学思苑A栋'));
  assert.ok(candidates.some((item) => item.name === '集贤苑K栋'));
  assert.ok(candidates.every((item) => item.coordinateStatus === 'estimated'));
  assert.ok(candidates.every((item) => item.latitude >= 23.2635 && item.latitude <= 23.275));
  assert.ok(candidates.every((item) => item.longitude >= 112.670 && item.longitude <= 112.6845));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
