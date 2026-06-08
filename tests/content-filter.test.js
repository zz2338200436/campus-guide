const assert = require('node:assert/strict');
const { filterPlaces, filterStudyList, getMapPins } = require('../utils/contentFilter');
const placeData = require('../utils/placeData');

const samplePlaces = [
  {
    id: 1,
    name: '图书馆',
    type: '学习场所',
    description: '提供自习与图书借阅。',
    tagline: '适合安静自习和资料检索',
    bestFor: '学生熟悉学习资源',
    address: '校园中轴线东侧',
    tips: '高峰时段建议提前占座。',
    mapX: 46,
    mapY: 28
  },
  {
    id: 2,
    name: '学生食堂',
    type: '生活场所',
    description: '提供三餐和轻食。',
    address: '宿舍区旁',
    tips: '午餐时段较拥挤。'
  },
  {
    id: 3,
    name: '学生宿舍区',
    type: '生活场所',
    description: '配套洗衣房和便利店。',
    address: '校园西南侧',
    tips: '晚间实行门禁管理。'
  }
];

const sampleStudyList = [
  {
    id: 1,
    title: 'WXML 基础',
    category: '页面结构',
    stage: 'entry',
    keywords: ['wxml', '组件', '结构'],
    summary: '了解基础结构组件。',
    content: '适合入门页面开发。'
  },
  {
    id: 2,
    title: '常用小程序 API',
    category: '小程序API',
    stage: 'common',
    keywords: ['api', 'navigateTo', 'showToast'],
    summary: '掌握 navigateTo、showToast 等交互能力。',
    content: '课程作业常见能力合集。'
  },
  {
    id: 3,
    title: '单例与观察者模式',
    category: '设计模式',
    stage: 'advanced',
    keywords: ['观察者', '收藏同步'],
    summary: '通过收藏同步理解观察者。',
    content: '项目里用观察者模式解决收藏同步。'
  }
];

function runTest(name, testFn) {
  try {
    testFn();
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name);
    console.error(error.message);
    process.exitCode = 1;
  }
}

runTest('filterPlaces supports type filtering', () => {
  const result = filterPlaces(samplePlaces, {
    type: '生活场所',
    keyword: ''
  });

  assert.deepEqual(result.map((item) => item.id), [2, 3]);
});

runTest('filterPlaces supports keyword filtering', () => {
  const result = filterPlaces(samplePlaces, {
    type: '全部',
    keyword: '图书'
  });

  assert.deepEqual(result.map((item) => item.id), [1]);
});

runTest('filterPlaces supports combined type and keyword filtering', () => {
  const result = filterPlaces(samplePlaces, {
    type: '生活场所',
    keyword: '门禁'
  });

  assert.deepEqual(result.map((item) => item.id), [3]);
});

runTest('filterPlaces supports coordinate trust review filtering', () => {
  const result = filterPlaces([
    { id: 1, name: '已校准点', type: '学习场所', coordinateTrust: { level: 'stable' } },
    { id: 2, name: '待复核点', type: '学习场所', coordinateTrust: { level: 'review' } },
    { id: 3, name: '估算入口', type: '交通入口', coordinateTrust: { level: 'review' } }
  ], {
    type: '全部',
    keyword: '',
    coordinateLevel: 'review'
  });

  assert.deepEqual(result.map((item) => item.id), [2, 3]);
});

runTest('filterPlaces searches coordinate trust source and review labels', () => {
  const places = [
    {
      id: 1,
      name: '图书馆',
      type: '学习场所',
      coordinateTrust: {
        label: '已校准',
        sourceText: 'OpenStreetMap',
        reviewText: '已转换为微信地图坐标'
      }
    },
    {
      id: 2,
      name: '校门',
      type: '交通入口',
      coordinateTrust: {
        label: '估算坐标',
        sourceText: '手绘地图线性估算',
        reviewText: '需现场复核'
      }
    },
    {
      id: 3,
      name: '学生交流中心',
      type: '学习场所',
      coordinateTrust: {
        label: '高德POI',
        sourceText: '高德地图POI',
        reviewText: '需现场复核'
      }
    }
  ];

  assert.deepEqual(filterPlaces(places, { type: '全部', keyword: '高德' }).map((item) => item.id), [3]);
  assert.deepEqual(filterPlaces(places, { type: '全部', keyword: '手绘' }).map((item) => item.id), [2]);
  assert.deepEqual(filterPlaces(places, { type: '全部', keyword: '待复核' }).map((item) => item.id), [2, 3]);
  assert.deepEqual(filterPlaces(places, { type: '全部', keyword: '已校准' }).map((item) => item.id), [1]);
});

runTest('filterPlaces matches exploration guidance fields', () => {
  const result = filterPlaces(samplePlaces, {
    type: '全部',
    keyword: '学习资源'
  });

  assert.deepEqual(result.map((item) => item.id), [1]);
});

runTest('getMapPins prefers data-defined coordinates', () => {
  const result = getMapPins(samplePlaces);

  assert.equal(result[0].x, 46);
  assert.equal(result[0].y, 28);
});

runTest('getMapPins falls back to stable defaults when coordinates are missing', () => {
  const result = getMapPins(samplePlaces);

  assert.equal(result[1].x, 66);
  assert.equal(result[1].y, 42);
});

runTest('zhaoqing campus map data covers real campus navigation scenes', () => {
  const names = placeData.map((item) => item.name);
  const types = new Set(placeData.map((item) => item.type));

  assert.ok(placeData.length >= 14);
  assert.ok(placeData.every((item) => String(item.address || '').includes('广东省肇庆市鼎湖区莲花镇丰乐路20号')));
  assert.ok(names.includes('广州应用科技学院公交站'));
  assert.ok(names.includes('校医务室'));
  assert.ok(names.includes('菜鸟驿站'));
  assert.ok(types.has('交通入口'));
  assert.ok(types.has('应急服务'));
});

runTest('zhaoqing campus teaching buildings use verified OSM coordinates', () => {
  const requiredBuildings = ['格致楼', '博雅楼', '明德楼', 'J3修齐楼', 'J4治平楼', 'S5致用楼'];

  requiredBuildings.forEach((name) => {
    const place = placeData.find((item) => item.name === name);
    assert.ok(place, name + ' should exist');
    assert.equal(place.type, '教学楼');
    assert.equal(place.source, 'OpenStreetMap');
    assert.equal(place.coordinateSystem, 'GCJ-02');
    assert.ok(place.osmId, name + ' should include OSM id');
    assert.ok(typeof place.wgs84Latitude === 'number' && place.wgs84Latitude > 23.26 && place.wgs84Latitude < 23.28);
    assert.ok(typeof place.wgs84Longitude === 'number' && place.wgs84Longitude > 112.66 && place.wgs84Longitude < 112.69);
    assert.ok(typeof place.latitude === 'number' && place.latitude > 23.26 && place.latitude < 23.28);
    assert.ok(typeof place.longitude === 'number' && place.longitude > 112.67 && place.longitude < 112.69);
    assert.notEqual(place.longitude, place.wgs84Longitude);
  });
});

runTest('filterPlaces searches campus address and route helper keywords', () => {
  const addressResult = filterPlaces(placeData, {
    type: '全部',
    keyword: '丰乐路20号'
  });
  const busResult = filterPlaces(placeData, {
    type: '全部',
    keyword: '公交'
  });

  assert.equal(addressResult.length, placeData.length);
  assert.ok(busResult.some((item) => item.name === '广州应用科技学院公交站'));
});

runTest('filterStudyList supports category filtering', () => {
  const result = filterStudyList(sampleStudyList, {
    category: '小程序API',
    stage: '全部',
    keyword: ''
  });

  assert.deepEqual(result.map((item) => item.id), [2]);
});

runTest('filterStudyList supports keyword search across title and content', () => {
  const result = filterStudyList(sampleStudyList, {
    category: '全部',
    stage: '全部',
    keyword: '收藏同步'
  });

  assert.deepEqual(result.map((item) => item.id), [3]);
});

runTest('filterStudyList supports stage filtering', () => {
  const result = filterStudyList(sampleStudyList, {
    category: '全部',
    stage: 'entry',
    keyword: ''
  });

  assert.deepEqual(result.map((item) => item.id), [1]);
});

runTest('filterStudyList searches stage keywords and concept keywords', () => {
  const result = filterStudyList(sampleStudyList, {
    category: '全部',
    stage: '全部',
    keyword: 'navigateTo'
  });

  assert.deepEqual(result.map((item) => item.id), [2]);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
