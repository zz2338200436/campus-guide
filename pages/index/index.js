const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');
const tabBarHelper = require('../../utils/tabBarHelper');

Page({
  data: {
    themeClass: '',
    loading: true,
    banners: [],
    notices: [],
    recommends: [],
    continueStudy: null,
    quickActions: [],
    featuredPlaces: [],
    studySummary: null,
    learningSummary: null,
    todayAction: null,
    nextStudyList: [],
    explorationSummary: null,
    routeTasks: [],
    nextRoutePlace: null,
    nextRouteCard: null,
    checkinHistory: [],
    helperEntry: null,
    coreActions: [],
    communitySpotlight: null
  },
  onLoad() {
    this.loadHomeData();
  },
  onShow() {
    themeManager.applyToPage(this);
    tabBarHelper.sync(this, 0);
    this.loadHomeData(false);
  },
  loadHomeData(showLoading) {
    this.setData({ loading: true });
    request.getHomeData({
      loading: !!showLoading
    }).then((res) => {
      if (res.code !== 0) {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }
      this.setData({
        banners: res.data.banners || [],
        notices: res.data.notices || [],
        recommends: res.data.recommends || [],
        continueStudy: res.data.continueStudy || null,
        quickActions: res.data.quickActions || [],
        featuredPlaces: res.data.featuredPlaces || [],
        studySummary: res.data.studySummary || null,
        learningSummary: res.data.learningSummary || null,
        todayAction: res.data.todayAction || null,
        nextStudyList: res.data.nextStudyList || [],
        explorationSummary: res.data.explorationSummary || null,
        routeTasks: res.data.routeTasks || [],
        nextRoutePlace: res.data.nextRoutePlace || null,
        nextRouteCard: res.data.nextRouteCard || null,
        checkinHistory: res.data.checkinHistory || [],
        helperEntry: res.data.helperEntry || null,
        coreActions: res.data.coreActions || [],
        communitySpotlight: res.data.communitySpotlight || null,
        loading: false
      });
    });
  },
  goTab(event) {
    const url = event.currentTarget.dataset.url;
    const isTab = event.currentTarget.dataset.tab;
    if (isTab) {
      wx.switchTab({ url });
      return;
    }
    wx.navigateTo({ url });
  },
  openNotice(event) {
    const id = getEventId(event);
    if (!id) {
      wx.showToast({ title: '内容不存在', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/noticeDetail/noticeDetail?id=' + id
    });
  },
  openStudy(event) {
    const id = getEventId(event);
    if (!id) {
      wx.showToast({ title: '内容不存在', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/studyDetail/studyDetail?id=' + id
    });
  },
  openContinueStudy() {
    const item = this.data.continueStudy;
    if (!item || !item.id) {
      wx.showToast({ title: '暂无最近学习', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/studyDetail/studyDetail?id=' + item.id
    });
  },
  openQuickAction(event) {
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    if (!dataset.url) {
      return;
    }
    if (dataset.tab) {
      wx.switchTab({ url: dataset.url });
      return;
    }
    wx.navigateTo({ url: dataset.url });
  },
  openTodayAction(event) {
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    if (!dataset.url) {
      wx.showToast({ title: '暂无可执行动作', icon: 'none' });
      return;
    }
    if (dataset.tab) {
      wx.switchTab({ url: dataset.url });
      return;
    }
    wx.navigateTo({ url: dataset.url });
  },
  openPlaceDetail(event) {
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    if (!dataset.id) {
      return;
    }
    wx.navigateTo({
      url: '/pages/placeDetail/placeDetail?id=' + dataset.id
    });
  },
  toggleTodayTask(event) {
    const index = event.currentTarget.dataset.index;
    const todayAction = this.data.todayAction;
    if (!todayAction || !todayAction.tasks || index === undefined) {
      return;
    }
    const task = todayAction.tasks[index];
    task.done = !task.done;
    const completedCount = todayAction.tasks.filter(function (t) { return t.done; }).length;
    this.setData({
      ['todayAction.tasks[' + index + '].done']: task.done,
      'todayAction.completedCount': completedCount
    });
  }
});

function getEventId(event) {
  const detail = event.detail || {};
  const dataset = event.currentTarget ? event.currentTarget.dataset : {};
  return detail.id || dataset.id;
}
