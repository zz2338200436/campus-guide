const request = require('../../utils/request');
const userManager = require('../../utils/userManager');
const favoriteSubject = require('../../utils/favoriteSubject');
const themeManager = require('../../utils/themeManager');
const tabBarHelper = require('../../utils/tabBarHelper');
const communityStore = require('../../utils/communityStore');

Page({
  data: {
    theme: 'light',
    themeClass: '',
    themeLabel: '白天',
    themeIcon: '/images/theme/night.svg',
    isDarkTheme: false,
    studentId: '20260001',
    user: null,
    avatarText: '',
    favoriteCount: 0,
    postCount: 0,
    historyCount: 0,
    quickLinks: [
      { id: 'favorite', title: '我的收藏', desc: '' },
      { id: 'notice', title: '查看公告', desc: '' },
      { id: 'posts', title: '我的发布', desc: '' },
      { id: 'assistant', title: '校园助手', desc: '' }
    ],
    helperLinks: [],
    visibleHelperLinks: []
  },
  onLoad() {
    favoriteSubject.subscribe('user-page', () => {
      this.refreshCounts();
    });
  },
  onShow() {
    this.syncTheme();
    tabBarHelper.sync(this, 3);
    this.syncUser();
    this.refreshCounts();
  },
  onUnload() {
    favoriteSubject.unsubscribe('user-page');
  },
  syncTheme() {
    const theme = themeManager.applyToPage(this);
    this.setData({
      themeIcon: themeManager.getToggleIcon(theme)
    });
  },
  toggleTheme() {
    const nextTheme = themeManager.toggleTheme();
    this.syncTheme();
    wx.showToast({
      title: '已切换到' + themeManager.getThemeLabel(nextTheme),
      icon: 'none'
    });
  },
  syncUser() {
    const user = userManager.getUser();
    this.setData({
      user: user,
      avatarText: user && user.name ? user.name.charAt(0) : ''
    });
  },
  refreshCounts() {
    const favorites = favoriteSubject.getFavorites();
    const currentUser = userManager.getUser();
    const userPosts = currentUser ? communityStore.getPostsByUser(currentUser.studentId) : [];
    this.setData({
      favoriteCount: favorites.length,
      postCount: userPosts.length
    });
  },
  handleInput(event) {
    this.setData({
      studentId: event.detail.value.trim()
    });
  },
  quickFill(event) {
    this.setData({
      studentId: event.currentTarget.dataset.id
    });
  },
  login() {
    request.login({
      studentId: this.data.studentId
    }, {
      loading: true,
      loadingText: '正在登录'
    }).then((res) => {
      wx.showToast({
        title: res.message,
        icon: 'none'
      });
      if (res.code === 0) {
        this.syncUser();
      }
    });
  },
  logout() {
    userManager.logout();
    this.syncUser();
    this.refreshCounts();
    wx.showToast({
      title: '已退出登录',
      icon: 'none'
    });
  },
  goFavorite() {
    wx.navigateTo({
      url: '/pages/favorite/favorite'
    });
  },
  goMyPosts() {
    wx.navigateTo({
      url: '/pages/my-posts/my-posts'
    });
  },
  openQuickLink(event) {
    var type = event.currentTarget.dataset.type;
    switch (type) {
      case 'favorite':
        this.goFavorite();
        break;
      case 'notice':
        wx.navigateTo({ url: '/pages/notice/notice' });
        break;
      case 'posts':
        wx.navigateTo({ url: '/pages/my-posts/my-posts' });
        break;
      case 'assistant':
        wx.navigateTo({ url: '/pages/assistant/assistant' });
        break;
    }
  },
  goOperations() {
    wx.navigateTo({
      url: '/pages/operations/operations'
    });
  }
});
