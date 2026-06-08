const SCENARIOS = [
  {
    id: 'checkin',
    title: '入学报到',
    question: '今天刚到学校，先去哪？',
    oneLiner: '从官方办事到吃饭回宿舍，少走回头路。',
    routeTitle: '入学报到场景路线',
    summary: '适合第一次到校的学生：先处理入学事务，再解决吃饭和住宿周边熟悉问题。',
    placeIds: [6, 3, 5],
    serviceIds: [7, 2, 6],
    materials: ['身份证', '录取信息', '校园卡或学生证'],
    finalTip: '先把证件、校园卡和食堂路线确认好，第一天会轻松很多。'
  },
  {
    id: 'meal',
    title: '找饭吃',
    question: '饿了，去哪吃最稳？',
    oneLiner: '先到食堂，再顺手处理校园卡和生活补给。',
    routeTitle: '吃饭补给场景路线',
    summary: '适合刚到饭点的学生：先找到一期桃园饭堂，再顺路熟悉菜鸟驿站和宿舍生活圈。',
    placeIds: [3, 8, 5],
    serviceIds: [2, 6, 9],
    materials: ['校园卡', '支付记录截图', '取件码'],
    finalTip: '饭点高峰建议错峰，第一次可以顺手记住食堂到宿舍的路线。'
  },
  {
    id: 'study',
    title: '自习学习',
    question: '想找地方学习，去哪？',
    oneLiner: '图书馆、教学楼、实训楼一次串起来。',
    routeTitle: '自习学习场景路线',
    summary: '适合想快速进入学习状态的学生：先熟悉图书馆，再确认教室和实训空间。',
    placeIds: [1, 2, 7],
    serviceIds: [1, 3, 5],
    materials: ['校园卡或学生证', '课程表', '电脑或学习资料'],
    finalTip: '如果只是安静自习优先去图书馆，如果要找教学楼或调试代码优先确认格致楼、博雅楼或 S5 致用楼。'
  },
  {
    id: 'network',
    title: '网络报修',
    question: '校园网连不上怎么办？',
    oneLiner: '先记录问题，再去技术支持点处理。',
    routeTitle: '网络报修场景路线',
    summary: '适合遇到校园网、账号异常或设备问题的学生：先准备截图，再去对应值班点。',
    placeIds: [2, 11, 1],
    serviceIds: [5, 6, 1],
    materials: ['学号', '设备型号', '故障截图或错误提示'],
    finalTip: '网络问题最好带上错误截图和设备型号，工作人员能更快判断原因。'
  },
  {
    id: 'lost',
    title: '失物招领',
    question: '东西丢了，先找谁？',
    oneLiner: '登记失物、补充特征、保留联系方式。',
    routeTitle: '失物招领场景路线',
    summary: '适合丢失物品或捡到物品的学生：先登记，再到高频地点补查。',
    placeIds: [6, 14, 3],
    serviceIds: [9, 7, 2],
    materials: ['学生证', '物品照片或特征说明', '联系方式'],
    finalTip: '越早记录丢失时间、地点和特征，找回概率越高。'
  }
];

function getScenarios() {
  return SCENARIOS.map((item) => ({
    id: item.id,
    title: item.title,
    question: item.question,
    oneLiner: item.oneLiner
  }));
}

function buildRoute(scenarioId, placeList, serviceList, options) {
  const scenario = findScenario(scenarioId);
  const places = Array.isArray(placeList) ? placeList : [];
  const services = Array.isArray(serviceList) ? serviceList : [];
  const checkedIds = normalizeCheckedIds(options && options.checkedPlaceIds);
  const steps = scenario.placeIds.map((placeId, index) => {
    const place = findById(places, placeId);
    const service = findById(services, scenario.serviceIds[index]);
    return buildStep(index, place, service);
  }).filter((item) => item.place);
  const progress = buildRouteProgress(steps, checkedIds);
  const actionStep = progress.nextStep || steps[steps.length - 1];

  return {
    id: scenario.id,
    title: scenario.routeTitle,
    scenarioTitle: scenario.title,
    question: scenario.question,
    summary: scenario.summary,
    oneLiner: scenario.oneLiner,
    switchFeedback: '已生成' + scenario.routeTitle,
    materials: scenario.materials.slice(),
    finalTip: scenario.finalTip,
    progress,
    steps: decorateSteps(steps, progress.nextStep, checkedIds),
    primaryAction: actionStep
      ? {
          text: progress.completedCount > 0 && progress.nextStep ? '继续下一站' : '开始第一站',
          url: actionStep.actionUrl,
          feedback: actionStep.feedback
        }
      : {
          text: '返回首页',
          url: '/pages/index/index',
          feedback: '返回首页'
        }
  };
}

function buildRouteCenter(selectedId, placeList, serviceList, options) {
  const scenarios = getScenarios();
  const currentRoute = buildRoute(selectedId, placeList, serviceList, options);
  return {
    scenarios,
    currentRoute,
    featuredRoutes: scenarios
      .filter((item) => item.id !== currentRoute.id)
      .slice(0, 3)
      .map((item) => buildRoute(item.id, placeList, serviceList, options))
  };
}

function buildRouteProgress(steps, checkedIds) {
  const completedCount = steps.filter((item) => checkedIds.has(Number(item.place.id))).length;
  const totalCount = steps.length;
  const nextStep = steps.find((item) => !checkedIds.has(Number(item.place.id))) || null;
  return {
    completedCount,
    totalCount,
    progressText: completedCount + '/' + totalCount,
    percent: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
    nextStep,
    completed: totalCount > 0 && completedCount >= totalCount
  };
}

function decorateSteps(steps, nextStep, checkedIds) {
  return steps.map((item) => {
    const checkedIn = checkedIds.has(Number(item.place.id));
    const isNext = !checkedIn && nextStep && Number(nextStep.place.id) === Number(item.place.id);
    return Object.assign({}, item, {
      checkedIn,
      isNext,
      statusText: checkedIn ? '已完成' : isNext ? '下一站' : '待到访'
    });
  });
}

function buildStep(index, place, service) {
  if (!place) {
    return null;
  }
  return {
    step: fillZero(index + 1),
    place,
    placeName: place.name,
    placeType: place.type,
    title: place.name,
    desc: place.tagline || place.description,
    bestTime: place.bestTime,
    tip: place.tips,
    service,
    serviceTitle: service ? service.title : '地点指引',
    serviceDesc: service ? service.content : place.description,
    actionText: '查看' + place.name,
    actionUrl: '/pages/placeDetail/placeDetail?id=' + place.id,
    feedback: '前往' + place.name
  };
}

function findScenario(id) {
  return SCENARIOS.find((item) => item.id === id) || SCENARIOS[0];
}

function findById(list, id) {
  return (list || []).find((item) => Number(item.id) === Number(id)) || null;
}

function normalizeCheckedIds(ids) {
  return new Set((Array.isArray(ids) ? ids : []).map((id) => Number(id)).filter((id) => !Number.isNaN(id)));
}

function fillZero(value) {
  return value < 10 ? '0' + value : String(value);
}

module.exports = {
  getScenarios,
  buildRoute,
  buildRouteCenter
};

