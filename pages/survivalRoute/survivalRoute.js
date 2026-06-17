const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');

Page({
  data: {
    themeClass: '',
    loading: true,
    currentScene: 'checkin',
    scenarios: [],
    currentRoute: null,
    featuredRoutes: []
  },
  onLoad(options) {
    this.loadRoute(options && options.scene ? options.scene : 'checkin');
  },
  onShow() {
    themeManager.applyToPage(this);
    if (!this.data.loading && this.data.currentScene) {
      this.loadRoute(this.data.currentScene);
    }
  },
  loadRoute(scene, showFeedback) {
    this.setData({
      loading: true,
      currentScene: scene || 'checkin'
    });
    request.getSurvivalRouteData(
      { scene: scene || 'checkin' },
      { loading: true, loadingText: '生成路线' }
    ).then((res) => {
      if (res.code !== 0) {
        wx.showToast({
          title: res.message || '路线生成失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }
      const data = res.data || {};
      const route = data.currentRoute || null;
      this.setData({
        scenarios: data.scenarios || [],
        currentRoute: route,
        featuredRoutes: data.featuredRoutes || [],
        currentScene: route ? route.id : scene,
        loading: false
      });
      if (showFeedback && route && route.switchFeedback) {
        wx.showToast({
          title: route.switchFeedback,
          icon: 'none'
        });
      }
    });
  },
  selectScene(event) {
    const scene = event.currentTarget ? event.currentTarget.dataset.scene : '';
    if (!scene || scene === this.data.currentScene) {
      return;
    }
    this.loadRoute(scene, true);
  },
  openStep(event) {
    const url = event.currentTarget ? event.currentTarget.dataset.url : '';
    if (!url) {
      wx.showToast({
        title: '暂无地点入口',
        icon: 'none'
      });
      return;
    }
    showNavigateFeedback(event.currentTarget.dataset.feedback);
    navigateAfterFeedback(url);
  },
  openPrimaryAction() {
    const route = this.data.currentRoute;
    if (!route || !route.primaryAction || !route.primaryAction.url) {
      return;
    }
    showNavigateFeedback(route.primaryAction.feedback);
    navigateAfterFeedback(route.primaryAction.url);
  }
});

function showNavigateFeedback(title) {
  wx.showToast({
    title: title || '准备跳转',
    icon: 'none',
    duration: 650
  });
}

function navigateAfterFeedback(url) {
  setTimeout(() => {
    wx.navigateTo({ url });
  }, 260);
}
