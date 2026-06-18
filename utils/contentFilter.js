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

/**
 * Expand a keyword into search tokens and optional type filters.
 * Returns { tokens: string[], typeFilter: string|null }
 */
function expandPlaceKeyword(keyword) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return { tokens: [], typeFilter: null };

  // Split by spaces for multi-word search
  const tokens = normalized.split(/\s+/).filter(Boolean);

  // Map common intent words → type filter
  const typeMap = {
    '教学楼': '教学楼', '教室': '教学楼', '上课': '教学楼',
    '宿舍': '宿舍楼', '寝室': '宿舍楼', '住宿': '宿舍楼',
    '食堂': '生活场所', '饭堂': '生活场所', '吃饭': '生活场所', '餐饮': '生活场所',
    '快递': '生活场所', '驿站': '生活场所', '奶茶': '生活场所', '咖啡': '生活场所',
    '超市': '生活场所', '汉堡': '生活场所',
    '门': '交通入口', '校门': '交通入口', '入口': '交通入口', '交通': '交通入口',
    '图书馆': '学习场所', '自习': '学习场所', '学习': '学习场所',
    '运动': '运动场所', '体育馆': '运动场所', '健身': '运动场所',
    '办事': '办事服务', '应急': '应急服务', '医务': '应急服务',
  };

  let typeFilter = null;
  const nameTokens = [];
  for (const token of tokens) {
    nameTokens.push(token);
    const tf = typeMap[token];
    if (tf && !typeFilter) typeFilter = tf;
  }

  return { tokens: nameTokens, typeFilter };
}

function matchKeyword(fields, keyword) {
  if (!keyword) return true;
  return fields.some((field) => String(field || '').toLowerCase().includes(keyword));
}

function filterPlaces(list, options) {
  const settings = options || {};
  const type = settings.type || '全部';
  const keyword = normalizeKeyword(settings.keyword);
  const { tokens, typeFilter } = expandPlaceKeyword(keyword);
  return (list || []).filter((item) => {
    const typeMatched = type === '全部' || item.type === type;
    const fields = [
      item.name,
      item.description,
      item.address,
      item.tagline,
    ];
    // Name/token matching: any token matches any field
    const nameMatched = !tokens.length || tokens.some((k) => matchKeyword(fields, k));
    // Type filter: item.type matches the mapped type (only applies when type filter is set)
    const typeFilterMatched = typeFilter ? item.type === typeFilter : false;
    // Name match OR type match
    return typeMatched && (nameMatched || typeFilterMatched);
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
