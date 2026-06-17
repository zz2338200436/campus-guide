const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');
const checkinHelper = require('../../utils/explorationCheckinHelper');
const placeData = require('../../utils/placeData');
const serviceData = require('../../utils/serviceData');
const serviceMatcher = require('../../utils/serviceMatcher');
const userManager = require('../../utils/userManager');
const phoneHelper = require('../../utils/phoneHelper');
const navigationHelper = require('../../utils/navigationHelper');

Page({
  data: {
    themeClass: '',
    loading: true,
    detail: null,
    relatedPlaces: [],
    relatedServices: [],
    checkedIn: false,
    isLogin: false,
    navigationError: ''
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
    this.syncCheckinStatus();
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
    request.getPlaceDetail(this.id, { loading: true, loadingText: '加载地点详情' }).then((res) => {
      if (res.code !== 0) {
        wx.showToast({
          title: res.message || '内容不存在',
          icon: 'none'
        });
        this.setData({
          loading: false,
          detail: null
        });
        return;
      }
      this.setData({
        detail: res.data,
        relatedPlaces: this.getRelatedPlaces(res.data),
        relatedServices: serviceMatcher.getServicesForPlace(res.data, serviceData).slice(0, 3),
        checkedIn: checkinHelper.hasCheckedIn(res.data.id),
        isLogin: userManager.isLogin(),
        loading: false
      });
    });
  },
  syncCheckinStatus() {
    const detail = this.data.detail;
    this.setData({
      isLogin: userManager.isLogin(),
      checkedIn: detail ? checkinHelper.hasCheckedIn(detail.id) : false
    });
  },
  getRelatedPlaces(detail) {
    const nextStops = Array.isArray(detail.nextStops) ? detail.nextStops.map(Number) : [];
    return placeData.filter((item) => nextStops.includes(Number(item.id))).slice(0, 3);
  },
  openRelated(event) {
    const id = event.currentTarget ? event.currentTarget.dataset.id : '';
    if (!id) {
      return;
    }
    if (Number(id) === Number(this.id)) {
      return;
    }
    wx.navigateTo({
      url: '/pages/placeDetail/placeDetail?id=' + id
    });
  },
  openLocation() {
    const detail = this.data.detail;
    const target = navigationHelper.buildMapTarget(detail);
    if (!target) {
      this.setData({ navigationError: '当前地点缺少可用坐标，请返回地图页重新选择地点。' });
      wx.showToast({
        title: '导航坐标无效',
        icon: 'none'
      });
      return;
    }
    const app = getApp();
    app.globalData.navigateTarget = target;
    this.setData({ navigationError: '' });
    wx.switchTab({
      url: '/pages/map/map',
      fail: () => {
        this.setData({ navigationError: '暂时无法打开小程序地图，请稍后重试或使用微信地图导航。' });
        wx.showToast({
          title: '打开地图页失败',
          icon: 'none'
        });
      }
    });
  },
  startNavigation() {
    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    if (navigationHelper.isDeveloperTool(systemInfo)) {
      this.openLocation();
      return;
    }
    const options = navigationHelper.buildOpenLocationOptions(this.data.detail, {
      fail: () => {
        this.setData({ navigationError: '微信地图暂时无法打开，已切换到小程序内地图路线。' });
        wx.showToast({
          title: '已切换到小程序内导航',
          icon: 'none'
        });
        this.openLocation();
      }
    });
    if (!options) {
      this.openLocation();
      return;
    }
    this.setData({ navigationError: '' });
    wx.openLocation(options);
  },
  openNativeLocation() {
    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    if (navigationHelper.isDeveloperTool(systemInfo)) {
      this.setData({ navigationError: '开发者工具不支持微信地图导航，请用真机测试；当前可先使用小程序内地图路线。' });
      wx.showToast({
        title: '开发者工具不支持微信地图导航',
        icon: 'none'
      });
      return;
    }
    const options = navigationHelper.buildOpenLocationOptions(this.data.detail, {
      fail: () => {
        this.setData({ navigationError: '微信地图暂时无法打开，可返回地图页查看地点位置。' });
        wx.showToast({
          title: '微信地图打开失败',
          icon: 'none'
        });
      }
    });
    if (!options) {
      this.setData({ navigationError: '当前地点缺少可用坐标，请返回地图页重新选择地点。' });
      wx.showToast({
        title: '导航坐标无效',
        icon: 'none'
      });
      return;
    }
    this.setData({ navigationError: '' });
    wx.openLocation(options);
  },
  checkInPlace() {
    const detail = this.data.detail;
    if (!detail) {
      return;
    }
    if (!userManager.isLogin()) {
      wx.showToast({
        title: '请先登录后记录',
        icon: 'none'
      });
      return;
    }
    if (checkinHelper.hasCheckedIn(detail.id)) {
      wx.showToast({
        title: '已经记录过了',
        icon: 'none'
      });
      return;
    }
    checkinHelper.addCheckin(detail);
    this.setData({
      checkedIn: true
    });
    wx.showToast({
      title: '已同步路线进度',
      icon: 'success'
    });
  },
  callServicePhone(event) {
    const phone = event.currentTarget ? event.currentTarget.dataset.phone : '';
    if (!phoneHelper.canCallPhone(phone)) {
      wx.showToast({
        title: '暂无可拨打电话',
        icon: 'none'
      });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: phoneHelper.normalizePhoneNumber(phone),
      fail() {
        wx.showToast({
          title: '拨号失败，请稍后重试',
          icon: 'none'
        });
      }
    });
  }
});
