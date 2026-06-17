const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');

Page({
  data: {
    themeClass: '',
    loading: true,
    detail: null
  },
  onLoad(options) {
    this.id = options.id;
    this.loadDetail();
  },
  onShow() {
    themeManager.applyToPage(this);
    const favoriteBtn = this.selectComponent('#favoriteBtn');
    if (favoriteBtn) {
      favoriteBtn.syncStatus();
    }
  },
  loadDetail() {
    if (!this.id) {
      wx.showToast({
        title: '内容不存在',
        icon: 'none'
      });
      this.setData({
        loading: false,
        detail: null
      });
      return;
    }
    this.setData({ loading: true });
    request.getNoticeDetail(this.id, { loading: true, loadingText: '加载公告详情' }).then((res) => {
      if (res.code === 0) {
        this.setData({
          detail: res.data,
          loading: false
        });
      } else {
        wx.showToast({
          title: res.message || '内容不存在',
          icon: 'none'
        });
        this.setData({
          loading: false,
          detail: null
        });
      }
    });
  }
});
