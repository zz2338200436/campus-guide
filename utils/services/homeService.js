const favoriteSubject = require('../favoriteSubject');
const noticeData = require('../noticeData');
const checkinHelper = require('../explorationCheckinHelper');
const placeData = require('../placeData');
const studyData = require('../studyData');
const studyHistoryHelper = require('../studyHistoryHelper');
const learningProgressHelper = require('../learningProgressHelper');
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

  return {
    banners: [
      { id: 1, image: '', title: '校园地图服务', desc: '统一查看楼栋、服务地点和导航入口' },
      { id: 2, image: '', title: '常用服务', desc: '查看办事、生活、后勤和应急入口' },
      { id: 3, image: '', title: '学习资源', desc: '保留学习记录，继续推进个人成长任务' }
    ],
    notices,
    recommends: studyData.slice(0, 4),
    todayAction,
    continueStudy,
    quickActions: [
      { id: 'survival', title: '推荐路线', desc: '按场景生成行动路线', url: '/pages/survivalRoute/survivalRoute' },
      { id: 'map', title: '地图导览', desc: '查看楼栋与导航', url: '/pages/map/map', tab: true },
      { id: 'service', title: '常用服务', desc: '办事与日常支持', url: '/pages/service/service' },
      { id: 'notice', title: '公告通知', desc: '查看重要提醒', url: '/pages/notice/notice' },
      { id: 'study', title: '学习资源', desc: '进入成长路径', url: '/pages/study/study', tab: true },
      { id: 'favorite', title: '我的收藏', desc: '回看重要内容', url: '/pages/favorite/favorite' },
      { id: 'history', title: '浏览记录', desc: '继续最近内容', url: '/pages/studyHistory/studyHistory' }
    ],
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

module.exports = {
  buildHomeData
};
