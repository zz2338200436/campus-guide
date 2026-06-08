const PATH_STAGES = [
  { value: 'entry', label: '入门' },
  { value: 'common', label: '常用' },
  { value: 'advanced', label: '进阶' }
];
const locationMapHelper = require('./locationMapHelper');
const coordinateReviewStore = require('./coordinateReviewStore');

const ISSUE_TAG_PRIORITY = {
  '坐标无效': 10,
  '坐标越界': 20,
  '坐标系错误': 30,
  '非复核点': 40,
  '备注过短': 50,
  '依据缺失': 60
};
const ISSUE_SUMMARY_GROUPS = [
  { label: '坐标问题', level: 'danger' },
  { label: '状态问题', level: 'warning' },
  { label: '备注问题', level: 'info' }
];

function buildOverview(data) {
  const places = data.places || [];
  const services = data.services || [];
  const notices = data.notices || [];
  const studies = data.studies || [];
  const checkins = data.checkins || [];

  return {
    placeCount: places.length,
    serviceCount: services.length,
    noticeCount: notices.length,
    studyCount: studies.length,
    checkinCount: checkins.length
  };
}

function buildHealthReport(data, now) {
  const currentDate = now || new Date();
  const places = data.places || [];
  const services = data.services || [];
  const notices = data.notices || [];
  const studies = data.studies || [];
  const items = [];
  const placeIds = new Set(places.map((item) => Number(item.id)));

  places.forEach((place) => {
    const matched = services.some((service) => {
      const ids = Array.isArray(service.placeIds) ? service.placeIds.map(Number) : [];
      return ids.includes(Number(place.id));
    });
    if (!matched) {
      items.push({
        type: 'place-service-link',
        level: 'warning',
        title: '地点缺少服务关联',
        desc: place.name + ' 暂未关联任何校园服务，建议补充“这里能办什么”。',
        actionText: '补充地点服务'
      });
    }
  });

  services.forEach((service) => {
    const ids = Array.isArray(service.placeIds) ? service.placeIds.map(Number) : [];
    const invalidIds = ids.filter((id) => !placeIds.has(id));
    if (!ids.length || invalidIds.length) {
      items.push({
        type: 'service-place-link',
        level: 'warning',
        title: '服务关联地点异常',
        desc: service.title + ' 的地点关联需要维护。',
        actionText: '修正关联地点'
      });
    }
  });

  notices.forEach((notice) => {
    if (isExpired(notice.date, currentDate)) {
      items.push({
        type: 'notice-expired',
        level: notice.isTop ? 'danger' : 'info',
        title: '公告可能已过期',
        desc: notice.title + ' 发布于 ' + notice.date + '，建议确认是否继续展示。',
        actionText: notice.isTop ? '检查置顶公告' : '确认公告状态'
      });
    }
  });

  PATH_STAGES.forEach((stage) => {
    const count = studies.filter((item) => item.stage === stage.value).length;
    if (count === 0) {
      items.push({
        type: 'study-path-empty',
        level: 'danger',
        title: '学习路径缺少任务',
        desc: stage.label + '路径暂无任务，学习系统会失去连续性。',
        actionText: '补充学习任务'
      });
    }
  });

  return {
    issueCount: items.length,
    items
  };
}

function buildOperationsData(data, now) {
  const overview = buildOverview(data);
  const health = buildHealthReport(data, now);
  const trafficCards = buildTrafficCards(data, overview);
  const serviceQuality = buildServiceQuality(data, overview);
  const placeQuality = buildPlaceQuality(data);
  const coordinateReviewSummary = buildCoordinateReviewSummary(data);
  return {
    overview,
    overviewCards: [
      { label: '地点', value: overview.placeCount, desc: '导览内容' },
      { label: '服务', value: overview.serviceCount, desc: '办事入口' },
      { label: '公告', value: overview.noticeCount, desc: '通知动态' },
      { label: '学习', value: overview.studyCount, desc: '成长任务' },
      { label: '到访', value: overview.checkinCount, desc: '当前账号足迹' }
    ],
    trafficCards,
    serviceQuality,
    placeQuality,
    coordinateReviewSummary,
    hotPlaces: buildHotPlaces(data),
    health,
    suggestions: buildSuggestions(overview, health, placeQuality)
  };
}

function buildCoordinateReviewSummary(data) {
  const reviews = data.coordinateReviews || {};
  const places = data.places || [];
  const items = Object.keys(reviews).map((key) => {
    const review = reviews[key] || {};
    const placeId = Number(review.placeId || key);
    const place = places.find((item) => Number(item.id) === placeId) || {};
    return {
      placeId,
      placeName: place.name || '未知地点',
      placeType: place.type || '待核对',
      oldLatitude: place.latitude || '',
      oldLongitude: place.longitude || '',
      coordinateSystem: place.coordinateSystem || '',
      reviewRequired: !!place.reviewRequired,
      source: place.source || '未知来源',
      note: review.note || '',
      statusText: review.statusText || '已备注',
      updatedAt: review.updatedAt || 0
    };
  }).filter((item) => item.note);

  items.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
  const validation = buildCoordinateRevisionValidation(items);
  return {
    total: items.length,
    items: items.slice(0, 5),
    exportText: buildCoordinateReviewExportText(items),
    revisionText: buildCoordinateRevisionText(items, validation.items),
    validation
  };
}

function buildCoordinateReviewExportText(items) {
  if (!items.length) {
    return '';
  }
  return ['校准备注清单'].concat(items.map((item, index) => {
    return [
      (index + 1) + '. ' + item.placeName,
      'ID:' + item.placeId,
      '类型:' + item.placeType,
      '状态:' + item.statusText,
      '备注:' + item.note
    ].join(' / ');
  })).join('\n');
}

function buildCoordinateRevisionText(items, validationItems) {
  if (!items.length) {
    return '';
  }
  const validationMap = {};
  (validationItems || []).forEach((item) => {
    validationMap[item.placeId] = item;
  });
  return ['placeData 坐标修订模板'].concat(items.map((item) => {
    const validation = validationMap[item.placeId] || {};
    return [
      '{',
      '  id: ' + item.placeId + ',',
      '  name: "' + escapeText(item.placeName) + '",',
      '  type: "' + escapeText(item.placeType) + '",',
      '  oldLatitude: ' + item.oldLatitude + ',',
      '  oldLongitude: ' + item.oldLongitude + ',',
      '  source: "' + escapeText(item.source) + '",',
      '  validation: "校验:' + (validation.status || 'blocked') + '",',
      '  reviewQuality: "' + escapeText(buildReviewQualityText(validation)) + '",',
      '  reviewNote: "' + escapeText(item.note) + '"',
      '}'
    ].join('\n');
  })).join('\n\n');
}

function buildReviewQualityText(validation) {
  const issues = validation && Array.isArray(validation.issues) ? validation.issues : [];
  const noteIssues = issues.filter((item) => String(item || '').includes('校准备注'));
  return noteIssues.length ? '备注:' + noteIssues.join('；') : '备注:合格';
}

function buildCoordinateRevisionValidation(items) {
  const list = items.map((item) => {
    const issues = [];
    const latitude = Number(item.oldLatitude);
    const longitude = Number(item.oldLongitude);
    const hasValidNumber = isFinite(latitude) && isFinite(longitude);
    if (!hasValidNumber) {
      issues.push('坐标不是有效数字');
    } else if (!locationMapHelper.isInsideCampusBounds({ latitude, longitude })) {
      issues.push('坐标超出校区范围');
    }
    if (item.coordinateSystem !== 'GCJ-02') {
      issues.push('坐标系不是 GCJ-02');
    }
    if (!item.reviewRequired) {
      issues.push('点位未标记为待复核');
    }
    issues.push(...coordinateReviewStore.validateReviewNote(item.note));
    return {
      placeId: item.placeId,
      placeName: item.placeName,
      status: issues.length ? 'blocked' : 'ready',
      issues
    };
  });
  const blockedItems = list
    .filter((item) => item.status !== 'ready')
    .map((item) => Object.assign({}, item, {
      issueText: item.issues.join('；'),
      issueTags: buildIssueTags(item.issues),
      issueTagItems: buildIssueTagItems(item.issues)
    }));
  const readyItems = list
    .filter((item) => item.status === 'ready')
    .map((item) => ({
      placeId: item.placeId,
      placeName: item.placeName
    }));
  return {
    readyCount: readyItems.length,
    issueCount: list.filter((item) => item.status !== 'ready').length,
    readyItems,
    readyItemsPreview: readyItems.slice(0, 3),
    readyMoreCount: Math.max(readyItems.length - 3, 0),
    issueSummary: buildIssueSummary(blockedItems),
    blockedItems,
    items: list
  };
}

function buildIssueTags(issues) {
  const tags = (issues || []).map(issueToTag);
  return Array.from(new Set(tags)).sort((a, b) => getIssueTagPriority(a) - getIssueTagPriority(b));
}

function buildIssueTagItems(issues) {
  return buildIssueTags(issues).map((label) => ({
    label,
    level: getIssueTagLevel(label)
  }));
}

function issueToTag(issue) {
  if (issue === '坐标不是有效数字') return '坐标无效';
  if (issue === '坐标超出校区范围') return '坐标越界';
  if (issue === '坐标系不是 GCJ-02') return '坐标系错误';
  if (issue === '点位未标记为待复核') return '非复核点';
  if (issue === '校准备注过短') return '备注过短';
  if (issue === '校准备注缺少入口、楼栋或坐标依据') return '依据缺失';
  return issue;
}

function getIssueTagPriority(tag) {
  return ISSUE_TAG_PRIORITY[tag] || 999;
}

function getIssueTagLevel(tag) {
  if (tag === '坐标无效' || tag === '坐标越界' || tag === '坐标系错误') {
    return 'danger';
  }
  if (tag === '非复核点') {
    return 'warning';
  }
  return 'info';
}

function buildIssueSummary(blockedItems) {
  return ISSUE_SUMMARY_GROUPS.map((group) => ({
    label: group.label,
    value: blockedItems.filter((item) => {
      return (item.issueTagItems || []).some((tag) => tag.level === group.level);
    }).length,
    level: group.level
  })).filter((item) => item.value > 0);
}

function escapeText(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildTrafficCards(data, overview) {
  const notices = data.notices || [];
  const services = data.services || [];
  const places = data.places || [];
  const checkins = data.checkins || [];
  const todayVisits = 120 + overview.placeCount * 3 + checkins.length * 8;
  const serviceClicks = services.filter((item) => item.featured || item.freshmanPriority).length * 18;
  const noticeReads = notices.length * 42;
  return [
    { label: '今日访问', value: todayVisits, desc: '模拟小程序访问量' },
    { label: '服务点击', value: serviceClicks, desc: '高频服务入口点击' },
    { label: '热门地点', value: Math.min(places.length, 5), desc: '导览重点点位' },
    { label: '公告阅读', value: noticeReads, desc: '通知触达阅读量' }
  ];
}

function buildServiceQuality(data, overview) {
  const services = data.services || [];
  const urgentCount = services.filter((item) => item.category === '安全应急' || item.tag === '应急').length;
  const pending = Math.max(urgentCount, Math.ceil(overview.serviceCount / 4));
  const finished = Math.max(overview.serviceCount * 3 - pending, 0);
  const overdue = Math.max(0, pending - urgentCount);
  const cards = [
    { label: '待处理工单', value: pending, desc: '咨询、报修和反馈待处理' },
    { label: '已完成工单', value: finished, desc: '本周期模拟完成量' },
    { label: '平均响应时间', value: urgentCount ? '1.8h' : '2.4h', desc: '按服务分类估算' },
    { label: '超时提醒', value: overdue, desc: '需要运营跟进' }
  ];
  return {
    cards,
    pendingTickets: cards[0],
    finishedTickets: cards[1],
    averageResponse: cards[2],
    overdueTickets: cards[3]
  };
}

function buildPlaceQuality(data) {
  const places = data.places || [];
  const supplementPlaces = data.supplementPlaces || [];
  const amapPlaces = places.filter((item) => item.coordinateStatus === 'amap');
  const estimatedPlaces = places.filter((item) => item.coordinateStatus === 'estimated');
  const reviewPlaces = places.filter((item) => item.reviewRequired);
  const pendingSupplementPlaces = supplementPlaces.filter((item) => !findExistingPlace(places, item));

  return {
    totalPlaces: places.length,
    amapCount: amapPlaces.length,
    estimatedCount: estimatedPlaces.length,
    reviewRequiredCount: reviewPlaces.length,
    supplementPendingCount: pendingSupplementPlaces.length,
    sourceCards: [
      { label: '总点位', value: places.length, desc: '正式展示地点' },
      { label: '高德POI', value: amapPlaces.length, desc: '第三方坐标来源' },
      { label: '手绘估算', value: estimatedPlaces.length, desc: '由手绘地图换算' },
      { label: '待复核', value: reviewPlaces.length, desc: '需现场确认入口' },
      { label: '手绘待补', value: pendingSupplementPlaces.length, desc: '候选但未入库' }
    ],
    reviewPlaces: reviewPlaces.slice(0, 6).map((place) => ({
      id: place.id,
      name: place.name,
      type: place.type,
      source: place.source || '未知来源',
      status: place.coordinateStatus || 'unknown'
    })),
    pendingSupplementPlaces: pendingSupplementPlaces.slice(0, 6).map((place) => ({
      name: place.name,
      type: place.type,
      zone: place.zone
    }))
  };
}

function buildHotPlaces(data) {
  const places = data.places || [];
  const services = data.services || [];
  return places
    .map((place) => {
      const linkedServiceCount = services.filter((service) => {
        const ids = Array.isArray(service.placeIds) ? service.placeIds.map(Number) : [];
        return ids.includes(Number(place.id));
      }).length;
      return {
        id: place.id,
        name: place.name,
        type: place.type,
        value: linkedServiceCount + (place.featured ? 2 : 0),
        desc: linkedServiceCount + ' 项关联服务'
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function buildSuggestions(overview, health, placeQuality) {
  const suggestions = [];
  if (health.issueCount > 0) {
    suggestions.push('优先处理内容健康检查中的异常项，避免用户进入空链路。');
  } else {
    suggestions.push('当前内容结构比较健康，可以继续扩展真实数据源。');
  }
  if (overview.serviceCount >= overview.placeCount) {
    suggestions.push('服务内容已覆盖主要地点，建议把高频服务继续放在首页或地点详情中突出。');
  } else {
    suggestions.push('服务数量少于地点数量，建议补充每个地点对应的办事入口。');
  }
  if (placeQuality && placeQuality.reviewRequiredCount > 0) {
    suggestions.push('地图点位仍有待复核坐标，建议优先核对入口、楼栋名称和高德 POI 误差。');
  }
  suggestions.push('后续可把本地数据维护迁移到云开发集合，保留现有字段结构。');
  return suggestions;
}

function normalizePlaceName(name) {
  return String(name || '')
    .replace('广州应用科技学院(肇庆校区)', '')
    .replace('广州应用科技学院肇庆校区', '')
    .replace(/[（）()·\s]/g, '')
    .toLowerCase();
}

function findExistingPlace(existingPlaces, supplement) {
  const target = normalizePlaceName(supplement && supplement.name);
  return existingPlaces.find((place) => {
    const current = normalizePlaceName(place && place.name);
    return current === target || current.includes(target) || target.includes(current);
  });
}

function isExpired(dateText, now) {
  const date = new Date(dateText + 'T00:00:00+08:00');
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const diff = now.getTime() - date.getTime();
  return diff > 30 * 24 * 60 * 60 * 1000;
}

module.exports = {
  buildOverview,
  buildHealthReport,
  buildOperationsData,
  buildTrafficCards,
  buildServiceQuality,
  buildPlaceQuality,
  buildCoordinateReviewSummary,
  buildHotPlaces,
  buildIssueTags,
  buildIssueTagItems
};
