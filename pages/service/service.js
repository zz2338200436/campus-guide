const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');
const serviceMatcher = require('../../utils/serviceMatcher');
const phoneHelper = require('../../utils/phoneHelper');

Page({
  data: {
    themeClass: '',
    currentCategory: '全部',
    categoryTabs: ['全部'],
    list: [],
    loading: true,
    serviceGroups: [],
    quickList: [],
    urgentList: [],
    issueTabs: [],
    currentIssueId: 'newcomer',
    currentIssue: null,
    issueServices: []
  },
  onLoad() {
    themeManager.applyToPage(this);
    this.loadList();
  },
  loadList() {
    this.setData({ loading: true });
    request.getServiceCenterData({ loading: true, loadingText: '加载服务信息' }).then((res) => {
      if (res.code === 0) {
        const data = res.data || {};
        this.allList = data.list || [];
        this.setData({
          categoryTabs: data.categoryTabs || ['全部'],
          quickList: data.quickList || [],
          issueTabs: data.issueTabs || [],
          currentIssueId: data.currentIssue ? data.currentIssue.id : 'newcomer',
          currentIssue: data.currentIssue || null,
          issueServices: data.issueServices || [],
          urgentList: this.allList.filter((item) => item.category === '安全应急').slice(0, 2)
        });
        this.filterBy(this.data.currentCategory);
      }
      this.setData({ loading: false });
    });
  },
  filterBy(category) {
    const list = (this.allList || []).filter((item) => category === '全部' || item.category === category);
    this.setData({
      currentCategory: category,
      list,
      serviceGroups: serviceMatcher.groupByCategory(list)
    });
  },
  selectCategory(event) {
    this.filterBy(event.currentTarget.dataset.category);
  },
  openSurvivalRoute(event) {
    const scene = event.currentTarget ? event.currentTarget.dataset.scene : '';
    wx.navigateTo({
      url: '/pages/survivalRoute/survivalRoute' + (scene ? '?scene=' + scene : '')
    });
  },
  openConsultEntry() {
    const service = (this.data.issueServices || [])[0];
    const placeId = service && service.placeIds ? service.placeIds[0] : '';
    if (!placeId) {
      wx.showToast({
        title: '暂无可咨询服务',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/placeDetail/placeDetail?id=' + placeId
    });
  },
  openTicketProgress() {
    wx.showToast({
      title: '暂无办理进度',
      icon: 'none'
    });
  },
  selectIssue(event) {
    const id = event.currentTarget ? event.currentTarget.dataset.id : '';
    const issue = (this.data.issueTabs || []).find((item) => item.id === id);
    if (!issue) {
      return;
    }
    this.setData({
      currentIssueId: id,
      currentIssue: issue,
      issueServices: issue.services || []
    });
  },
  openServicePlace(event) {
    const id = event.currentTarget ? event.currentTarget.dataset.placeId : '';
    if (!id) {
      wx.showToast({
        title: '暂无关联地点',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/placeDetail/placeDetail?id=' + id
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
