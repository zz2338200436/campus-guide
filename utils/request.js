const { response, listResponse } = require('./requestHelpers');
const adapter = require('./requestAdapter');
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
const aiEngine = require('./aiEngine');

module.exports = {
  getHomeData(options) {
    return adapter.mock(() => response(0, 'success', homeService.buildHomeData()), options);
  },
  getNoticeList(params, options) {
    return adapter.mock(() => listResponse(noticeService.getNoticeList(params)), options);
  },
  getNoticeDetail(id, options) {
    return adapter.mock(() => {
      const detail = noticeService.getNoticeDetail(id);
      return detail ? response(0, 'success', detail) : response(1002, '公告不存在', null);
    }, options);
  },
  getPlaceList(params, options) {
    return adapter.mock(() => listResponse(placeService.getPlaceList(params)), options);
  },
  getPlaceDetail(id, options) {
    return adapter.mock(() => {
      const detail = placeService.getPlaceDetail(id);
      return detail ? response(0, 'success', detail) : response(1002, '地点不存在', null);
    }, options);
  },
  getServiceList(params, options) {
    return adapter.mock(() => listResponse(serviceService.getServiceList(params)), options);
  },
  getServiceCenterData(options) {
    return adapter.mock(() => response(0, 'success', serviceService.getServiceCenterData()), options);
  },
  getSurvivalRouteData(params, options) {
    return adapter.mock(() => response(0, 'success', survivalService.getSurvivalRouteData(params && params.scene)), options);
  },
  getStudyList(params, options) {
    return adapter.mock(() => listResponse(studyService.getStudyList(params)), options);
  },
  getStudyCenterData(params, options) {
    return adapter.mock(() => response(0, 'success', studyService.getStudyCenterData(params)), options);
  },
  getStudyDetail(id, options) {
    return adapter.mock(() => {
      const detail = studyService.getStudyDetail(id);
      return detail ? response(0, 'success', detail) : response(1002, '学习内容不存在', null);
    }, options);
  },
  login(data, options) {
    return adapter.mock(() => userService.login(data), options);
  },
  getFavorites(params, options) {
    return adapter.mock(() => favoriteService.getFavorites(params), options);
  },
  addFavorite(data, options) {
    return adapter.mock(() => favoriteService.addFavorite(data), options);
  },
  removeFavorite(type, targetId, options) {
    return adapter.mock(() => favoriteService.removeFavorite(type, targetId), options);
  },
  getStudyHistory(options) {
    return adapter.mock(() => historyService.getStudyHistory(), options);
  },
  addStudyHistory(data, options) {
    return adapter.mock(() => historyService.addStudyHistory(data), options);
  },
  completeStudyTask(data, options) {
    return adapter.mock(() => response(0, 'success', require('./learningProgressHelper').markCompleted(data)), options);
  },
  getOperationsData(options) {
    return adapter.mock(() => response(0, 'success', operationsService.getOperationsData()), options);
  },
  getAssistantReply(data, options) {
    // 委托给 aiService 统一处理策略编排和回退
    const aiService = require('./aiService');
    return aiService.chat(
      data && data.question,
      data && data.messages
    ).then(function (result) {
      return response(0, 'success', result);
    }).catch(function () {
      return response(0, 'fallback', {
        answer: aiEngine.ask(data && data.question).answer,
        provider: 'fallback'
      });
    });
  }
};
