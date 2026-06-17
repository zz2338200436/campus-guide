const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');
const favoriteSubject = require('../../utils/favoriteSubject');
const userManager = require('../../utils/userManager');

Page({
  data: {
    themeClass: '',
    tabs: [
      { label: '地点', value: 'place' },
      { label: '学习', value: 'study' },
      { label: '公告', value: 'notice' }
    ],
    currentType: 'place',
    list: [],
    loading: true,
    isLogin: false
  },
  onLoad() {
    favoriteSubject.subscribe('favorite-page', () => {
      this.loadList(false);
    });
  },
  onShow() {
    themeManager.applyToPage(this);
    this.setData({
      isLogin: userManager.isLogin()
    });
    this.loadList(true);
  },
  onUnload() {
    favoriteSubject.unsubscribe('favorite-page');
  },
  loadList(showLoading) {
    if (!userManager.isLogin()) {
      this.setData({
        loading: false,
        list: [],
        isLogin: false
      });
      return;
    }
    this.setData({ loading: true, isLogin: true });
    request.getFavorites({
      type: this.data.currentType
    }, {
      loading: !!showLoading,
      loadingText: '加载收藏列表'
    }).then((res) => {
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
  selectTab(event) {
    this.setData({
      currentType: event.currentTarget.dataset.type
    });
    this.loadList(false);
  },
  openDetail(event) {
    const item = this.data.list.find((entry) => entry.id === Number(event.currentTarget.dataset.id));
    if (!item) {
      return;
    }
    const pathMap = {
      place: '/pages/placeDetail/placeDetail?id=',
      study: '/pages/studyDetail/studyDetail?id=',
      notice: '/pages/noticeDetail/noticeDetail?id='
    };
    wx.navigateTo({
      url: pathMap[item.type] + item.targetId
    });
  }
});
