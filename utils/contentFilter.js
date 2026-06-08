const DEFAULT_PIN_POSITIONS = [
  { x: 48, y: 30 },
  { x: 66, y: 42 },
  { x: 34, y: 56 },
  { x: 72, y: 68 },
  { x: 25, y: 74 }
];

function normalizeKeyword(keyword) {
  return String(keyword || '').trim().toLowerCase();
}

function expandPlaceKeyword(keyword) {
  const normalized = normalizeKeyword(keyword);
  const synonymGroups = [
    ['教室', '上课', '教学', '教学楼', '格致', '博雅', '明德', '修齐', '治平', '致用'],
    ['吃饭', '用餐', '食堂', '饭堂', '餐饮', '桃园', '桃蹊'],
    ['宿舍', '寝室', '住宿', '集贤苑', '学思苑'],
    ['快递', '取件', '包裹', '菜鸟', '驿站'],
    ['医务', '看病', '身体不适', '应急', '校医', '诊所'],
    ['高德', '高德poi', '高德地图poi'],
    ['手绘', '手绘地图', '估算坐标', '线性估算'],
    ['待复核', '需现场复核', '复核'],
    ['已校准', '已转换为微信地图坐标', 'openstreetmap', 'osm']
  ];
  const matchedGroup = synonymGroups.find((group) => group.includes(normalized));
  return matchedGroup || (normalized ? [normalized] : []);
}

function matchKeyword(fields, keyword) {
  if (!keyword) {
    return true;
  }
  return fields.some((field) => String(field || '').toLowerCase().includes(keyword));
}

function filterPlaces(list, options) {
  const settings = options || {};
  const type = settings.type || '全部';
  const coordinateLevel = settings.coordinateLevel || '全部';
  const keyword = normalizeKeyword(settings.keyword);
  const keywords = expandPlaceKeyword(keyword);
  return (list || []).filter((item) => {
    const typeMatched = type === '全部' || item.type === type;
    const coordinateMatched = coordinateLevel === '全部' ||
      (item.coordinateTrust && item.coordinateTrust.level === coordinateLevel);
    const trust = item.coordinateTrust || {};
    const fields = [
      item.name,
      item.type,
      item.description,
      item.tagline,
      item.bestFor,
      item.bestTime,
      item.address,
      item.tips,
      trust.label,
      trust.sourceText,
      trust.reviewText,
      trust.desc
    ];
    const keywordMatched = !keywords.length || keywords.some((itemKeyword) => matchKeyword(fields, itemKeyword));
    return typeMatched && coordinateMatched && keywordMatched;
  });
}

function getMapPins(list) {
  return (list || []).map((item, index) => {
    const fallback = DEFAULT_PIN_POSITIONS[index % DEFAULT_PIN_POSITIONS.length];
    return Object.assign({}, item, {
      x: typeof item.mapX === 'number' ? item.mapX : fallback.x,
      y: typeof item.mapY === 'number' ? item.mapY : fallback.y
    });
  });
}

function filterStudyList(list, options) {
  const settings = options || {};
  const category = settings.category || '全部';
  const stage = settings.stage || '全部';
  const keyword = normalizeKeyword(settings.keyword);
  return (list || []).filter((item) => {
    const categoryMatched = category === '全部' || item.category === category;
    const stageMatched = stage === '全部' || item.stage === stage;
    const keywordMatched = matchKeyword(
      [item.title, item.summary, item.content, item.stage, (item.keywords || []).join(' ')],
      keyword
    );
    return categoryMatched && stageMatched && keywordMatched;
  });
}

module.exports = {
  filterPlaces,
  getMapPins,
  filterStudyList,
  expandPlaceKeyword
};
