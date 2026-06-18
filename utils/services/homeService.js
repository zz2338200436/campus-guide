const favoriteSubject = require('../favoriteSubject');
const noticeData = require('../noticeData');
const checkinHelper = require('../explorationCheckinHelper');
const placeData = require('../placeData');
const studyData = require('../studyData');
const studyHistoryHelper = require('../studyHistoryHelper');
const learningProgressHelper = require('../learningProgressHelper');
const communityStore = require('../communityStore');
const selectors = require('../flagshipSelectors');
const todayActionBuilder = require('../todayActionBuilder');

function buildHomeData() {
  const history = studyHistoryHelper.getHistory();
  const favorites = favoriteSubject.getFavorites();
  const continueStudy = history.length
    ? studyData.find((item) => Number(item.id) === Number(history[0].id)) || null
    : null;
  const featuredPlaces = selectors.getFeaturedPlaces(placeData);
  const favoriteStudyList = favorites.filter((item) => item.type === 'study');
  const studySummary = selectors.getStudyProgressSummary(studyData, history, favoriteStudyList);
  const learningSummary = learningProgressHelper.getSummary(studyData);
  const explorationSummary = checkinHelper.getSummary(placeData);
  const routeTasks = checkinHelper.getRouteTasks(placeData);
  const nextRoutePlace = checkinHelper.getNextRoutePlace(placeData);
  const checkinHistory = checkinHelper.getCheckinHistory(placeData, 3);
  const nextStudyList = selectors.getNextStudyRecommendations(
    studyData,
    continueStudy ? continueStudy.id : 0,
    history
  );
  const notices = noticeData
    .slice()
    .sort((a, b) => {
      if (a.isTop === b.isTop) {
        return b.date.localeCompare(a.date);
      }
      return a.isTop ? -1 : 1;
    })
    .slice(0, 3);
  const todayAction = todayActionBuilder.buildTodayAction({
    explorationSummary,
    learningSummary,
    nextRoutePlace,
    notices
  });
  const communitySpotlight = buildCommunitySpotlight();
  const nextRouteCard = nextRoutePlace
    ? {
        id: nextRoutePlace.id,
        title: nextRoutePlace.name,
        desc: nextRoutePlace.guide || nextRoutePlace.desc,
        note: '推荐下一站',
        symbol: '站',
        meta: '路线继续'
      }
    : null;
  const coreActions = [
    { id: 'map', title: '校园地图', desc: '楼栋、路线和导航', note: '查地点', symbol: '图', url: '/pages/map/map', tab: true },
    { id: 'community', title: '校园圈', desc: '动态、求助和二手', note: '看动态', symbol: '圈', url: '/pages/community/community', tab: true },
    { id: 'service', title: '常用服务', desc: '办事、后勤和应急', note: '去办理', symbol: '服', url: '/pages/service/service' },
    { id: 'survival', title: '推荐路线', desc: '按场景规划下一站', note: '看路线', symbol: '路', url: '/pages/survivalRoute/survivalRoute' }
  ];

  return {
    banners: [
      { id: 1, image: '/images/campus/admin-center.jpg', title: '行政中心', desc: '校园事务和办事咨询入口' },
      { id: 2, image: '/images/campus/mingde-building-wide.jpg', title: '明德楼', desc: '教学区楼栋和课程导航' },
      { id: 3, image: '/images/campus/stadium-aerial.jpg', title: '田径场', desc: '运动、集合和体育课程场地' },
      { id: 4, image: '/images/campus/basketball-gym.jpg', title: '篮球馆', desc: '体育活动和校园生活场景' },
      { id: 5, image: '/images/campus/swimming-pool.jpg', title: '游泳馆', desc: '校区运动场馆资源' },
      { id: 6, image: '/images/campus/lianhua-theater.jpg', title: '莲花大剧院', desc: '演出、讲座和大型活动地点' }
    ],
    notices,
    recommends: studyData.slice(0, 4),
    todayAction,
    continueStudy,
    nextRouteCard,
    coreActions,
    quickActions: [
      { id: 'survival', title: '推荐路线', desc: '按场景生成行动路线', url: '/pages/survivalRoute/survivalRoute' },
      { id: 'map', title: '地图导览', desc: '查看楼栋与导航', url: '/pages/map/map', tab: true },
      { id: 'service', title: '常用服务', desc: '办事与日常支持', url: '/pages/service/service' },
      { id: 'notice', title: '公告通知', desc: '查看重要提醒', url: '/pages/notice/notice' },
      { id: 'study', title: '学习资源', desc: '进入成长路径', url: '/pages/study/study', tab: false },
      { id: 'favorite', title: '我的收藏', desc: '回看重要内容', url: '/pages/favorite/favorite' },
      { id: 'history', title: '浏览记录', desc: '继续最近内容', url: '/pages/studyHistory/studyHistory' }
    ],
    helperEntry: {
      title: '校园互助',
      assistantLabel: '智能助手',
      assistantUrl: '/pages/assistant/assistant',
      communityLabel: '校园圈',
      communityUrl: '/pages/community/community'
    },
    communitySpotlight,
    featuredPlaces,
    studySummary,
    learningSummary,
    nextStudyList,
    explorationSummary,
    routeTasks,
    nextRoutePlace,
    checkinHistory
  };
}

function buildCommunitySpotlight() {
  const overview = communityStore.getFeedOverview('all');
  const hotPost = communityStore.getHotPostSummaries(1)[0] || null;

  return {
    title: hotPost ? hotPost.title : '校园圈',
    excerpt: hotPost ? hotPost.excerpt : '看动态、发求助、逛二手，快速了解校园生活。',
    meta: hotPost ? hotPost.meta : '全部 ' + overview.totalCount,
    typeLabel: hotPost ? hotPost.typeLabel : '动态',
    totalCount: overview.totalCount,
    hotCount: overview.hotCount,
    url: '/pages/community/community'
  };
}

module.exports = {
  buildHomeData
};
