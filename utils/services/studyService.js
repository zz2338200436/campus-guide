const studyData = require('../studyData');
const learningProgressHelper = require('../learningProgressHelper');

function getStudyList(params) {
  const category = params && params.category;
  return studyData.filter((item) => !category || category === '全部' || item.category === category);
}

function getStudyCenterData(params) {
  const list = getStudyList(params);
  return {
    list: learningProgressHelper.annotateStudyList(list),
    paths: learningProgressHelper.getLearningPaths(studyData),
    learningSummary: learningProgressHelper.getSummary(studyData)
  };
}

function getStudyDetail(id) {
  const detail = studyData.find((item) => item.id === Number(id)) || null;
  if (!detail) {
    return null;
  }
  const completed = learningProgressHelper.isCompleted(detail.id);
  return Object.assign({}, detail, {
    completed,
    statusText: completed ? '已完成' : '未完成'
  });
}

module.exports = {
  getStudyList,
  getStudyCenterData,
  getStudyDetail
};
