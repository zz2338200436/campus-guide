Component({
  properties: {
    title: {
      type: String,
      value: '暂无内容'
    },
    description: {
      type: String,
      value: '稍后再来看看吧'
    },
    buttonText: {
      type: String,
      value: ''
    },
    statusText: {
      type: String,
      value: '暂无数据'
    },
    url: {
      type: String,
      value: ''
    }
  },
  methods: {
    handleTap() {
      const url = this.properties.url;
      if (!url) {
        return;
      }
      const tabPages = [
        '/pages/index/index',
        '/pages/map/map',
        '/pages/study/study',
        '/pages/user/user'
      ];
      if (tabPages.indexOf(url) > -1) {
        wx.switchTab({ url });
        return;
      }
      wx.navigateTo({ url });
    }
  }
});
