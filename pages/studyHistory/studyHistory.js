const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');
const userManager = require('../../utils/userManager');

Page({
  data: {
    themeClass: '',
    list: [],
    loading: true,
    isLogin: false
  },
  onShow() {
    themeManager.applyToPage(this);
    this.setData({
      isLogin: userManager.isLogin()
    });
    this.loadList();
  },
  loadList() {
    if (!userManager.isLogin()) {
      this.setData({
        list: [],
        loading: false
      });
      return;
    }
    this.setData({ loading: true });
    request.getStudyHistory({ loading: true, loadingText: '加载学习记录' }).then((res) => {
      if (res.code === 0) {
        this.setData({
          list: res.data.list || [],
          loading: false
        });
        return;
      }
      this.setData({ loading: false });
    });
  },
  openDetail(event) {
    wx.navigateTo({
      url: '/pages/studyDetail/studyDetail?id=' + event.currentTarget.dataset.id
    });
  }
});
