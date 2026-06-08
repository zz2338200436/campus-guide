const noticeData = require('../noticeData');

function sortNotices(list) {
  return list.slice().sort((a, b) => {
    if (a.isTop === b.isTop) {
      return b.date.localeCompare(a.date);
    }
    return a.isTop ? -1 : 1;
  });
}

function getNoticeList(params) {
  const type = params && params.type;
  return sortNotices(noticeData).filter((item) => !type || type === '全部' || item.type === type);
}

function getNoticeDetail(id) {
  return noticeData.find((item) => item.id === Number(id)) || null;
}

module.exports = {
  sortNotices,
  getNoticeList,
  getNoticeDetail
};
