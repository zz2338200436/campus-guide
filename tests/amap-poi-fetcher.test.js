const assert = require('node:assert/strict');
const {
  AMAP_POLYGON,
  buildAmapPoiUrl,
  mapAmapPoiToCandidate,
  dedupePois,
  isAmapQpsLimitError
} = require('../scripts/fetch-amap-campus-pois');

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

runTest('amap fetcher builds polygon search url without exposing key in code', () => {
  const url = buildAmapPoiUrl({
    key: 'test-key',
    keywords: '广州应用科技学院肇庆校区',
    page: 2,
    offset: 25
  });

  assert.equal(AMAP_POLYGON, '112.6700,23.2635|112.6845,23.2750');
  assert.ok(url.startsWith('https://restapi.amap.com/v3/place/polygon?'));
  assert.ok(url.includes('key=test-key'));
  assert.ok(url.includes('polygon=112.6700%2C23.2635%7C112.6845%2C23.2750'));
  assert.ok(url.includes('keywords='));
  assert.ok(url.includes('page=2'));
  assert.ok(url.includes('offset=25'));
  assert.ok(url.includes('extensions=all'));
});

runTest('amap fetcher maps poi response to campus candidate format', () => {
  const candidate = mapAmapPoiToCandidate({
    id: 'B123',
    name: '广州应用科技学院肇庆校区图书馆',
    type: '科教文化服务;学校;高等院校',
    address: '莲花镇丰乐路20号',
    location: '112.6800859,23.2720399'
  });

  assert.equal(candidate.name, '广州应用科技学院肇庆校区图书馆');
  assert.equal(candidate.source, '高德地图POI');
  assert.equal(candidate.amapId, 'B123');
  assert.equal(candidate.longitude, 112.6800859);
  assert.equal(candidate.latitude, 23.2720399);
  assert.equal(candidate.coordinateSystem, 'GCJ-02');
  assert.equal(candidate.reviewRequired, true);
});

runTest('amap fetcher dedupes poi by name and location', () => {
  const result = dedupePois([
    { name: '图书馆', location: '112.6800,23.2720' },
    { name: '图书馆', location: '112.6800,23.2720' },
    { name: '行政中心', location: '112.6810,23.2690' }
  ]);

  assert.equal(result.length, 2);
});

runTest('amap fetcher detects qps limit errors for retry', () => {
  assert.equal(isAmapQpsLimitError({ status: '0', infocode: '10021', info: 'CUQPS_HAS_EXCEEDED_THE_LIMIT' }), true);
  assert.equal(isAmapQpsLimitError({ status: '0', infocode: '10009', info: 'USERKEY_PLAT_NOMATCH' }), false);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
