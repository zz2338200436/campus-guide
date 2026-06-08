const request = require('../../utils/request');
const checkinHelper = require('../../utils/explorationCheckinHelper');
const userManager = require('../../utils/userManager');
const favoriteSubject = require('../../utils/favoriteSubject');
const placeData = require('../../utils/placeData');
const studyHistoryHelper = require('../../utils/studyHistoryHelper');
const studyData = require('../../utils/studyData');
const learningProgressHelper = require('../../utils/learningProgressHelper');
const selectors = require('../../utils/flagshipSelectors');

Page({
  data: {
    studentId: '20260001',
    user: null,
    avatarText: '',
    favoriteCount: 0,
    historyCount: 0,
    studySummary: null,
    learningSummary: null,
    explorationSummary: null,
    checkinHistory: [],
    quickLinks: [
      { id: 'favorite', title: '我的收藏', desc: '地点、学习和公告统一管理', countKey: 'favoriteCount' },
      { id: 'history', title: '学习记录', desc: '保留最近 20 条学习浏览历史', countKey: 'historyCount' },
      { id: 'continue', title: '继续学习', desc: '快速回到最近一次学习内容', countKey: '' },
      { id: 'notice', title: '查看公告', desc: '及时回看校园提醒和活动动态', countKey: '' }
    ]
  },
  onLoad() {
    favoriteSubject.subscribe('user-page', () => {
      this.refreshCounts();
    });
  },
  onShow() {
    this.syncUser();
    this.refreshCounts();
  },
  onUnload() {
    favoriteSubject.unsubscribe('user-page');
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
    const history = studyHistoryHelper.getHistory();
    this.setData({
      favoriteCount: favorites.length,
      historyCount: history.length,
      explorationSummary: checkinHelper.getSummary(placeData),
      checkinHistory: checkinHelper.getCheckinHistory(placeData, 4),
      learningSummary: learningProgressHelper.getSummary(studyData),
      studySummary: selectors.getStudyProgressSummary(
        studyData,
        history,
        favorites.filter((item) => item.type === 'study')
      )
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
  goHistory() {
    wx.navigateTo({
      url: '/pages/studyHistory/studyHistory'
    });
  },
  goOperations() {
    wx.navigateTo({
      url: '/pages/operations/operations'
    });
  },
  openNextLearningTask() {
    const summary = this.data.learningSummary;
    if (!summary || !summary.nextTask) {
      wx.showToast({
        title: '暂无下一项任务',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/studyDetail/studyDetail?id=' + summary.nextTask.id
    });
  },
  openQuickLink(event) {
    const type = event.currentTarget.dataset.type;
    if (type === 'favorite') {
      this.goFavorite();
      return;
    }
    if (type === 'history') {
      this.goHistory();
      return;
    }
    if (type === 'continue') {
      const history = studyHistoryHelper.getHistory();
      if (!history.length) {
        wx.showToast({ title: '暂无最近学习', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: '/pages/studyDetail/studyDetail?id=' + history[0].id
      });
      return;
    }
    if (type === 'notice') {
      wx.navigateTo({
        url: '/pages/notice/notice'
      });
    }
  }
});
