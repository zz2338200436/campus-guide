function buildTodayAction(options) {
  const explorationSummary = options.explorationSummary || {};
  const learningSummary = options.learningSummary || {};
  const notices = Array.isArray(options.notices) ? options.notices : [];
  const nextRoutePlace = options.nextRoutePlace || explorationSummary.nextRoutePlace || null;
  const nextTask = learningSummary.nextTask || null;
  const routeProgressText = explorationSummary.routeProgressText || '0/3';

  return {
    title: '今天建议先完成这 3 件事',
    subtitle: '按顺序完成到访、服务和学习，今天的小程序就真的帮上忙了。',
    progressText: '到访 ' + routeProgressText + ' · 学习 ' + Number(learningSummary.completedCount || 0) + '/' + Number(learningSummary.totalCount || 0),
    cards: [
      buildExploreCard(nextRoutePlace, explorationSummary),
      buildServiceCard(notices),
      buildLearnCard(nextTask, learningSummary)
    ]
  };
}

function buildExploreCard(nextRoutePlace, explorationSummary) {
  if (nextRoutePlace) {
    return {
      id: 'explore',
      type: 'explore',
      label: '先去一站',
      title: nextRoutePlace.name,
      desc: nextRoutePlace.tagline || '完成首日路线的下一站。',
      reason: nextRoutePlace.bestFor || nextRoutePlace.bestTime || '这是学生首日最值得先熟悉的地点。',
      actionText: '查看路线',
      targetUrl: '/pages/placeDetail/placeDetail?id=' + nextRoutePlace.id,
      tab: false
    };
  }

  return {
    id: 'explore',
    type: 'explore',
    label: '路线完成',
    title: '继续扩展校园地图',
    desc: '首日核心路线已经完成，可以继续到访行政中心、综合体育馆和菜鸟驿站。',
    reason: explorationSummary.hasCampusBadge ? '你已经拿到熟悉校园徽章。' : '继续到访能补全个人足迹。',
    actionText: '打开导览',
    targetUrl: '/pages/map/map',
    tab: true
  };
}

function buildServiceCard(notices) {
  const topNotice = notices[0];
  return {
    id: 'service',
    type: 'service',
    label: '解决一个问题',
    title: '查校园服务入口',
    desc: '按“我遇到什么问题”找到办事、餐饮、网络、失物等解决方案。',
    reason: topNotice ? '近期提醒：' + topNotice.title : '学生常见问题会集中在服务中心。',
    actionText: '去服务台',
    targetUrl: '/pages/service/service',
    tab: false
  };
}

function buildLearnCard(nextTask, learningSummary) {
  if (nextTask) {
    return {
      id: 'learn',
      type: 'learn',
      label: '学一点',
      title: nextTask.title,
      desc: nextTask.summary || nextTask.content || '完成成长路径里的下一项任务。',
      reason: nextTask.stageLabel || nextTask.category || '完成后会同步到首页和个人中心。',
      actionText: '继续学习',
      targetUrl: '/pages/studyDetail/studyDetail?id=' + nextTask.id,
      tab: false
    };
  }

  return {
    id: 'learn',
    type: 'learn',
    label: '成长完成',
    title: '回看学习记录',
    desc: '当前成长路径已经完成，可以从学习记录里复盘最近看过的内容。',
    reason: '已完成 ' + Number(learningSummary.completedCount || 0) + ' 项学习任务。',
    actionText: '查看记录',
    targetUrl: '/pages/studyHistory/studyHistory',
    tab: false
  };
}

module.exports = {
  buildTodayAction
};

