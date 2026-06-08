const request = require('../../utils/request');

Page({
  data: {
    types: ['全部', '课程通知', '活动通知'],
    currentType: '全部',
    list: [],
    loading: true,
    pinnedCount: 0,
    pinnedList: [],
    latestList: []
  },
  onLoad() {
    this.loadList();
  },
  loadList() {
    this.setData({ loading: true });
    request.getNoticeList({}, { loading: true, loadingText: '加载公告列表' }).then((res) => {
      if (res.code === 0) {
        this.allList = res.data.list || [];
        this.filterBy(this.data.currentType);
      }
      this.setData({ loading: false });
    });
  },
  filterBy(type) {
    const list = (this.allList || []).filter((item) => type === '全部' || item.type === type);
    const pinnedList = list.filter((item) => !!item.isTop);
    const latestList = list.filter((item) => !item.isTop);
    this.setData({
      currentType: type,
      list,
      pinnedCount: pinnedList.length,
      pinnedList,
      latestList
    });
  },
  selectType(event) {
    this.filterBy(event.currentTarget.dataset.type);
  },
  openDetail(event) {
    const detail = event.detail || {};
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    const id = detail.id || dataset.id;
    if (!id) {
      wx.showToast({ title: '内容不存在', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/noticeDetail/noticeDetail?id=' + id
    });
  }
});
