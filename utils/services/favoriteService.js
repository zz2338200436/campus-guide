const placeData = require('../placeData');
const studyData = require('../studyData');
const noticeData = require('../noticeData');
const userManager = require('../userManager');
const favoriteSubject = require('../favoriteSubject');

function ensureLogin() {
  if (!userManager.isLogin()) {
    return {
      code: 2001,
      message: '请先登录',
      data: null
    };
  }
  return null;
}

function enrichFavorite(item) {
  const sourceMap = {
    place: placeData,
    study: studyData,
    notice: noticeData
  };
  const target = (sourceMap[item.type] || []).find((entry) => entry.id === item.targetId) || {};
  return Object.assign({}, target, item);
}

function getFavorites(params) {
  const loginError = ensureLogin();
  if (loginError) {
    return loginError;
  }
  const type = params && params.type;
  const list = favoriteSubject.getFavorites()
    .filter((item) => !type || type === '全部' || item.type === type)
    .map(enrichFavorite);
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      total: list.length
    }
  };
}

function addFavorite(data) {
  const loginError = ensureLogin();
  if (loginError) {
    return loginError;
  }
  if (!data || !data.type || !data.targetId || !data.title) {
    return {
      code: 1001,
      message: '参数错误',
      data: null
    };
  }
  return favoriteSubject.addFavorite(data);
}

function removeFavorite(type, targetId) {
  const loginError = ensureLogin();
  if (loginError) {
    return loginError;
  }
  return favoriteSubject.removeFavorite(type, targetId);
}

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite
};
