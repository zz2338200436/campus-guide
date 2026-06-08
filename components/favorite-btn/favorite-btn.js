const request = require('../../utils/request');
const favoriteSubject = require('../../utils/favoriteSubject');
const userManager = require('../../utils/userManager');

Component({
  properties: {
    type: {
      type: String,
      value: ''
    },
    targetId: {
      type: Number,
      value: 0
    },
    title: {
      type: String,
      value: ''
    },
    summary: {
      type: String,
      value: ''
    }
  },
  data: {
    active: false
  },
  lifetimes: {
    attached() {
      this.observerName = 'favorite-btn-' + this.properties.type + '-' + this.properties.targetId;
      favoriteSubject.subscribe(this.observerName, () => {
        this.syncStatus();
      });
      this.syncStatus();
    },
    detached() {
      favoriteSubject.unsubscribe(this.observerName);
    }
  },
  methods: {
    syncStatus() {
      this.setData({
        active: favoriteSubject.isFavorite(this.properties.type, this.properties.targetId)
      });
    },
    handleTap() {
      if (!userManager.isLogin()) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      const action = this.data.active ? request.removeFavorite(this.properties.type, this.properties.targetId) : request.addFavorite({
        type: this.properties.type,
        targetId: this.properties.targetId,
        title: this.properties.title,
        summary: this.properties.summary
      });
      action.then((res) => {
        wx.showToast({
          title: res.message,
          icon: 'none'
        });
        this.syncStatus();
        this.triggerEvent('change', {
          active: this.data.active
        });
      });
    }
  }
});
