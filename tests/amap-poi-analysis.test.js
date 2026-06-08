const assert = require('node:assert/strict');
const {
  classifyAmapCandidate,
  buildAmapAnalysisReport
} = require('../scripts/analyze-amap-campus-pois');
const placeData = require('../utils/placeData');

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

runTest('amap analysis recommends campus facilities and skips off-purpose shops', () => {
  assert.equal(classifyAmapCandidate({ name: '广州应用科技学院音乐厅', amapType: '科教文化服务;学校;高等院校' }), 'recommended');
  assert.equal(classifyAmapCandidate({ name: '广州应用科技学院诊所(医务室)', amapType: '医疗保健服务;诊所;诊所' }), 'recommended');
  assert.equal(classifyAmapCandidate({ name: '麦当劳(广州应用科技学院店)', amapType: '餐饮服务;快餐厅;麦当劳' }), 'review');
  assert.equal(classifyAmapCandidate({ name: '摩戏电竞酒店(广州应用科技学院肇庆校区店)', amapType: '住宿服务;宾馆酒店;宾馆酒店' }), 'skip');
});

runTest('amap analysis separates matched and fresh candidates', () => {
  const report = buildAmapAnalysisReport(
    [
      { name: '广州应用科技学院(肇庆校区)行政中心', amapType: '科教文化服务;科教文化场所;科教文化场所', latitude: 23.269, longitude: 112.681 },
      { name: '广州应用科技学院音乐厅', amapType: '科教文化服务;学校;高等院校', latitude: 23.266, longitude: 112.673 },
      { name: '摩戏电竞酒店(广州应用科技学院肇庆校区店)', amapType: '住宿服务;宾馆酒店;宾馆酒店', latitude: 23.263, longitude: 112.680 }
    ],
    [
      { id: 6, name: '行政中心' }
    ]
  );

  assert.equal(report.matched.length, 1);
  assert.equal(report.recommended.length, 1);
  assert.equal(report.skipped.length, 1);
});

runTest('place data includes approved amap campus poi batch', () => {
  const names = [
    '学生交流中心',
    '学术交流中心',
    '二期驿站',
    '内部地面停车场',
    '内部地面停车场出入口',
    '苹果校园体验中心',
    '莲花大剧院',
    '音乐学院',
    '音乐厅',
    '桃蹊餐厅'
  ];

  names.forEach((name) => {
    const place = placeData.find((item) => item.name === name);
    assert.ok(place, `${name} should exist in formal place data`);
    assert.equal(place.source, '高德地图POI');
    assert.equal(place.coordinateStatus, 'amap');
    assert.ok(place.amapId, `${name} should keep amap id`);
  });
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
