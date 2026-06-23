const userManager = require('../../utils/userManager');
const communityStore = require('../../utils/communityStore');
const themeManager = require('../../utils/themeManager');

Page({
  data: {
    themeClass: '',
    isLogin: false,
    user: null,
    currentTab: 'all',
    tabs: [
      { label: '全部', value: 'all', count: 0 },
      { label: '动态', value: 'feed', count: 0 },
      { label: '集市', value: 'marketplace', count: 0 }
    ],
    list: [],
    totalCount: 0
  },

  onLoad() {
    this.syncTheme();
  },

  onShow() {
    this.syncTheme();
    this.syncUser();
    this.refreshList();
  },

  syncTheme() {
    const theme = themeManager.applyToPage(this);
    this.setData({ themeClass: theme === 'dark' ? 'theme-dark' : '' });
  },

  syncUser() {
    const user = userManager.getUser();
    this.setData({
      user,
      isLogin: !!user
    });
    if (!user) {
      this.setData({ list: [], totalCount: 0 });
    }
  },

  refreshList() {
    const user = this.data.user;
    if (!user) return;

    const all = communityStore.getDisplayPostsByUser(user.studentId);
    const feeds = all.filter(function (item) { return item.type === 'feed'; });
    const markets = all.filter(function (item) { return item.type === 'marketplace'; });

    let list;
    if (this.data.currentTab === 'feed') {
      list = feeds;
    } else if (this.data.currentTab === 'marketplace') {
      list = markets;
    } else {
      list = all;
    }

    this.setData({
      list: list,
      totalCount: all.length,
      tabs: [
        { label: '全部', value: 'all', count: all.length },
        { label: '动态', value: 'feed', count: feeds.length },
        { label: '集市', value: 'marketplace', count: markets.length }
      ]
    });
  },

  switchTab(e) {
    var value = e.currentTarget.dataset.value;
    this.setData({ currentTab: value }, function () {
      this.refreshList();
    }.bind(this));
  },

  openDetail(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/community-detail/community-detail?id=' + id
    });
  },

  toggleLike(e) {
    var id = e.currentTarget.dataset.id;
    var result = communityStore.toggleLike(id);
    if (result.code === 1001) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.refreshList();
  },

  goPublish() {
    wx.navigateTo({
      url: '/pages/community-post/community-post'
    });
  }
});
