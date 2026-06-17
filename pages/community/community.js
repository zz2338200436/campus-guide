const communityStore = require('../../utils/communityStore');
const userManager = require('../../utils/userManager');

const BASE_TABS = [
  { label: '全部', value: 'all' },
  { label: '动态', value: 'feed' },
  { label: '集市', value: 'marketplace' }
];

Page({
  data: {
    tabs: BASE_TABS,
    currentTab: 'all',
    overview: null,
    list: [],
    hotPosts: [],
    isLogin: false
  },
  onShow() {
    this.setData({
      isLogin: userManager.isLogin()
    });
    this.loadData();
  },
  loadData() {
    const currentTab = this.data.currentTab;
    const overview = communityStore.getFeedOverview(currentTab);
    const tabCountMap = overview.tabCounts.reduce((acc, item) => {
      acc[item.value] = item.count;
      return acc;
    }, {});
    this.setData({
      tabs: BASE_TABS.map((item) => ({
        ...item,
        count: tabCountMap[item.value] || 0
      })),
      overview,
      list: communityStore.getDisplayPostsByType(currentTab),
      hotPosts: communityStore.getHotPostSummaries(3)
    });
  },
  switchTab(event) {
    this.setData({
      currentTab: event.currentTarget.dataset.value
    });
    this.loadData();
  },
  openDetail(event) {
    wx.navigateTo({
      url: '/pages/community-detail/community-detail?id=' + event.currentTarget.dataset.id
    });
  },
  openCreate() {
    if (!userManager.isLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/community-post/community-post'
    });
  },
  toggleLike(event) {
    if (!userManager.isLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    communityStore.toggleLike(event.currentTarget.dataset.id);
    this.loadData();
  }
});
