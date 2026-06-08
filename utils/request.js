const { simulate, response, listResponse } = require('./requestHelpers');
const homeService = require('./services/homeService');
const noticeService = require('./services/noticeService');
const placeService = require('./services/placeService');
const serviceService = require('./services/serviceService');
const studyService = require('./services/studyService');
const userService = require('./services/userService');
const favoriteService = require('./services/favoriteService');
const historyService = require('./services/historyService');
const operationsService = require('./services/operationsService');
const survivalService = require('./services/survivalService');

module.exports = {
  getHomeData(options) {
    return simulate(() => response(0, 'success', homeService.buildHomeData()), options);
  },
  getNoticeList(params, options) {
    return simulate(() => listResponse(noticeService.getNoticeList(params)), options);
  },
  getNoticeDetail(id, options) {
    return simulate(() => {
      const detail = noticeService.getNoticeDetail(id);
      return detail ? response(0, 'success', detail) : response(1002, '公告不存在', null);
    }, options);
  },
  getPlaceList(params, options) {
    return simulate(() => listResponse(placeService.getPlaceList(params)), options);
  },
  getPlaceDetail(id, options) {
    return simulate(() => {
      const detail = placeService.getPlaceDetail(id);
      return detail ? response(0, 'success', detail) : response(1002, '地点不存在', null);
    }, options);
  },
  getServiceList(params, options) {
    return simulate(() => listResponse(serviceService.getServiceList(params)), options);
  },
  getServiceCenterData(options) {
    return simulate(() => response(0, 'success', serviceService.getServiceCenterData()), options);
  },
  getSurvivalRouteData(params, options) {
    return simulate(() => response(0, 'success', survivalService.getSurvivalRouteData(params && params.scene)), options);
  },
  getStudyList(params, options) {
    return simulate(() => listResponse(studyService.getStudyList(params)), options);
  },
  getStudyCenterData(params, options) {
    return simulate(() => response(0, 'success', studyService.getStudyCenterData(params)), options);
  },
  getStudyDetail(id, options) {
    return simulate(() => {
      const detail = studyService.getStudyDetail(id);
      return detail ? response(0, 'success', detail) : response(1002, '学习内容不存在', null);
    }, options);
  },
  login(data, options) {
    return simulate(() => userService.login(data), options);
  },
  getFavorites(params, options) {
    return simulate(() => favoriteService.getFavorites(params), options);
  },
  addFavorite(data, options) {
    return simulate(() => favoriteService.addFavorite(data), options);
  },
  removeFavorite(type, targetId, options) {
    return simulate(() => favoriteService.removeFavorite(type, targetId), options);
  },
  getStudyHistory(options) {
    return simulate(() => historyService.getStudyHistory(), options);
  },
  addStudyHistory(data, options) {
    return simulate(() => historyService.addStudyHistory(data), options);
  },
  completeStudyTask(data, options) {
    return simulate(() => response(0, 'success', require('./learningProgressHelper').markCompleted(data)), options);
  },
  getOperationsData(options) {
    return simulate(() => response(0, 'success', operationsService.getOperationsData()), options);
  }
};
