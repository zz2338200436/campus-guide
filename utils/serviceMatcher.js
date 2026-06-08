function groupByCategory(list) {
  const groupMap = {};
  (list || []).forEach((item) => {
    const key = item.category || '其他';
    if (!groupMap[key]) {
      groupMap[key] = [];
    }
    groupMap[key].push(item);
  });

  return Object.keys(groupMap).map((key) => ({
    title: key,
    items: groupMap[key]
  }));
}

function getServicesForPlace(place, serviceList) {
  if (!place || !place.id) {
    return [];
  }
  const placeId = Number(place.id);
  return (serviceList || []).filter((item) => {
    const placeIds = Array.isArray(item.placeIds) ? item.placeIds.map(Number) : [];
    return placeIds.includes(placeId);
  });
}

function getFreshmanQuickServices(list) {
  return (list || [])
    .filter((item) => item.freshmanPriority)
    .sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))
    .slice(0, 5);
}

function attachPrimaryPlace(serviceList, placeList) {
  const places = Array.isArray(placeList) ? placeList : [];
  return (serviceList || []).map((service) => {
    const placeIds = Array.isArray(service.placeIds) ? service.placeIds.map(Number) : [];
    const primaryPlaceId = placeIds.find((id) => places.some((place) => Number(place.id) === Number(id)));
    const primaryPlace = places.find((place) => Number(place.id) === Number(primaryPlaceId)) || null;
    return Object.assign({}, service, {
      primaryPlace,
      primaryPlaceId: primaryPlace ? primaryPlace.id : '',
      primaryPlaceName: primaryPlace ? primaryPlace.name : ''
    });
  });
}

function getCategoryTabs(list) {
  const categories = groupByCategory(list).map((group) => group.title);
  return ['全部'].concat(categories);
}

const ISSUE_DEFS = [
  {
    id: 'newcomer',
    question: '刚入学要先办什么？',
    title: '学生入学事务',
    desc: '学籍、证明、校园卡和入学材料先从这里确认。',
    serviceIds: [7, 2, 1]
  },
  {
    id: 'campus-card',
    question: '饭卡或支付出问题？',
    title: '校园卡与餐饮',
    desc: '处理校园卡、食堂支付、餐饮窗口和错峰用餐咨询。',
    serviceIds: [2, 6]
  },
  {
    id: 'network',
    question: '校园网连不上？',
    title: '网络与设备报修',
    desc: '校园网、账号异常、机房设备和基础设备报修。',
    serviceIds: [5]
  },
  {
    id: 'lost-found',
    question: '东西丢了怎么办？',
    title: '失物招领',
    desc: '登记失物、查询拾物、补充物品特征和紧急联系。',
    serviceIds: [9]
  },
  {
    id: 'study-space',
    question: '想找教室或自习空间？',
    title: '学习空间咨询',
    desc: '自习空间、临时教室、班级活动和教学楼路线咨询。',
    serviceIds: [3, 1]
  },
  {
    id: 'activity',
    question: '想参加社团活动？',
    title: '社团与校园活动',
    desc: '社团报名、志愿服务、比赛活动和综合体育馆开放提醒。',
    serviceIds: [4, 8]
  }
];

function getIssueSolutions(list) {
  const services = Array.isArray(list) ? list : [];
  return ISSUE_DEFS.map((issue) => {
    const issueServices = getServicesByIssue(issue.id, services);
    const primaryService = issueServices[0] || null;
    return Object.assign({}, issue, {
      serviceCount: issueServices.length,
      primaryService,
      services: issueServices
    });
  }).filter((issue) => issue.serviceCount > 0);
}

function getServicesByIssue(issueId, list) {
  const issue = ISSUE_DEFS.find((item) => item.id === issueId) || ISSUE_DEFS[0];
  const serviceIds = new Set((issue.serviceIds || []).map(Number));
  return (list || []).filter((service) => serviceIds.has(Number(service.id)));
}

module.exports = {
  groupByCategory,
  getServicesForPlace,
  getFreshmanQuickServices,
  attachPrimaryPlace,
  getCategoryTabs,
  getIssueSolutions,
  getServicesByIssue
};

