const communityStore = require('../../utils/communityStore');
const userManager = require('../../utils/userManager');

Page({
  data: {
    postType: 'feed',
    title: '',
    content: '',
    tags: '',
    location: '',
    price: '',
    status: '在售',
    modeNote: '分享动态、求助或经验，内容会显示在校园圈里。',
    statusOptions: communityStore.MARKETPLACE_STATUSES
  },
  onLoad() {
    if (!userManager.isLogin()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }
  },
  switchType(event) {
    const nextType = event.currentTarget.dataset.type;
    this.setData({
      postType: nextType,
      modeNote: nextType === 'marketplace'
        ? '填写价格和状态，方便别人快速判断是否合适。'
        : '分享动态、求助或经验，内容会显示在校园圈里。'
    });
  },
  switchStatus(event) {
    this.setData({
      status: event.currentTarget.dataset.status
    });
  },
  handleField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [field]: event.detail.value
    });
  },
  submit() {
    const result = communityStore.createPost({
      type: this.data.postType,
      title: (this.data.title || '').trim(),
      content: (this.data.content || '').trim(),
      tags: (this.data.tags || '').split(/[,，\s]+/).filter(Boolean),
      location: (this.data.location || '').trim(),
      price: this.data.postType === 'marketplace' ? (this.data.price || '').trim() : '',
      status: this.data.status
    });

    if (result.code !== 0) {
      wx.showToast({ title: result.msg, icon: 'none' });
      return;
    }

    wx.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 600);
  }
});
