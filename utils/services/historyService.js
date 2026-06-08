const userManager = require('../userManager');
const studyHistoryHelper = require('../studyHistoryHelper');

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

function getStudyHistory() {
  const loginError = ensureLogin();
  if (loginError) {
    return loginError;
  }
  const list = studyHistoryHelper.getHistory();
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      total: list.length
    }
  };
}

function addStudyHistory(data) {
  const loginError = ensureLogin();
  if (loginError) {
    return loginError;
  }
  if (!data || !data.id) {
    return {
      code: 1001,
      message: '参数错误',
      data: null
    };
  }
  const list = studyHistoryHelper.addHistory(data);
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      total: list.length
    }
  };
}

module.exports = {
  getStudyHistory,
  addStudyHistory
};
