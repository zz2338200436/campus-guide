const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');
const userManager = require('../../utils/userManager');
const studyData = require('../../utils/studyData');
const selectors = require('../../utils/flagshipSelectors');

Page({
  data: {
    themeClass: '',
    loading: true,
    detail: null,
    relatedList: [],
    nextStudyList: [],
    completed: false
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
    request.getStudyDetail(this.id, { loading: true, loadingText: '加载学习详情' }).then((res) => {
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
        relatedList: this.getRelatedList(res.data),
        nextStudyList: selectors.getNextStudyRecommendations(studyData, res.data.id, []),
        completed: !!res.data.completed,
        loading: false
      });
      this.writeHistory(res.data);
    });
  },
  getRelatedList(detail) {
    const ids = Array.isArray(detail.relatedIds) ? detail.relatedIds.map(Number) : [];
    return studyData.filter((item) => ids.includes(Number(item.id))).slice(0, 3);
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
      url: '/pages/studyDetail/studyDetail?id=' + id
    });
  },
  writeHistory(detail) {
    if (!userManager.isLogin()) {
      return;
    }
    request.addStudyHistory({
      id: detail.id,
      title: detail.title,
      category: detail.category
    });
  },
  markCompleted() {
    const detail = this.data.detail;
    if (!detail) {
      return;
    }
    if (this.data.completed) {
      wx.showToast({
        title: '任务已经完成',
        icon: 'none'
      });
      return;
    }
    if (!userManager.isLogin()) {
      wx.showToast({
        title: '请先登录后记录进度',
        icon: 'none'
      });
      return;
    }
    request.completeStudyTask(detail, { loading: true, loadingText: '记录学习进度' }).then((res) => {
      if (res.code !== 0) {
        wx.showToast({
          title: res.message || '记录失败',
          icon: 'none'
        });
        return;
      }
      this.setData({
        completed: true,
        detail: Object.assign({}, detail, {
          completed: true,
          statusText: '已完成'
        })
      });
      wx.showToast({
        title: '已完成任务',
        icon: 'success'
      });
    });
  },
  copyCode() {
    const detail = this.data.detail;
    if (!detail) {
      return;
    }
    wx.setClipboardData({
      data: detail.code,
      success() {
        wx.showToast({
          title: '代码已复制',
          icon: 'none'
        });
      },
      fail() {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  }
});
