const communityStore = require('../../utils/communityStore');
const userManager = require('../../utils/userManager');
const themeManager = require('../../utils/themeManager');

const AVAILABLE_TAGS = [
  '教材书籍', '电子产品', '生活用品', '运动器材',
  '服饰鞋包', '数码配件', '家具日用', '美妆护肤',
  '食品零食', '学习资料', '代步工具', '其他'
];

const CONDITION_OPTIONS = ['全新', '几乎全新', '有使用痕迹', '有明显磨损'];

Page({
  data: {
    themeClass: '',
    postType: 'feed',
    title: '',
    content: '',
    images: [],
    selectedTags: [],
    availableTags: AVAILABLE_TAGS,
    location: '',
    locationInfo: null,
    price: '',
    condition: '',
    contact: '',
    status: '在售',
    modeNote: '分享动态、求助或经验，内容会显示在校园圈里。',
    statusOptions: communityStore.MARKETPLACE_STATUSES,
    conditionOptions: CONDITION_OPTIONS
  },
  onLoad() {
    themeManager.applyToPage(this);
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
  onShow() {
    themeManager.applyToPage(this);
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
  switchCondition(event) {
    this.setData({
      condition: event.currentTarget.dataset.condition
    });
  },
  handleField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [field]: event.detail.value
    });
  },
  chooseImage() {
    const remaining = 9 - this.data.images.length;
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          images: this.data.images.concat(res.tempFilePaths)
        });
      }
    });
  },
  removeImage(event) {
    const index = event.currentTarget.dataset.index;
    const images = this.data.images.slice();
    images.splice(index, 1);
    this.setData({ images });
  },
  toggleTag(event) {
    const tag = event.currentTarget.dataset.tag;
    let selected = this.data.selectedTags.slice();
    const idx = selected.indexOf(tag);
    if (idx !== -1) {
      selected.splice(idx, 1);
    } else {
      selected.push(tag);
    }
    this.setData({ selectedTags: selected });
  },
  pickLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          location: res.name || res.address || '已选择位置',
          locationInfo: {
            latitude: res.latitude,
            longitude: res.longitude,
            name: res.name || '',
            address: res.address || ''
          }
        });
      }
    });
  },
  submit() {
    const result = communityStore.createPost({
      type: this.data.postType,
      title: (this.data.title || '').trim(),
      content: (this.data.content || '').trim(),
      images: this.data.images,
      tags: this.data.selectedTags,
      location: this.data.location,
      locationInfo: this.data.locationInfo,
      price: this.data.postType === 'marketplace' ? (this.data.price || '').trim() : '',
      condition: this.data.postType === 'marketplace' ? (this.data.condition || '').trim() : '',
      contact: this.data.postType === 'marketplace' ? (this.data.contact || '').trim() : '',
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
