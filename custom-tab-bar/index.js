const themeManager = require('../utils/themeManager');

Component({
  data: {
    selected: 0,
    themeClass: '',
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        iconPath: '/images/tab/home.png',
        selectedIconPath: '/images/tab/home-active.png'
      },
      {
        pagePath: '/pages/map/map',
        text: '地图',
        iconPath: '/images/tab/map.png',
        selectedIconPath: '/images/tab/map-active.png'
      },
      {
        pagePath: '/pages/community/community',
        text: '校园圈',
        iconPath: '/images/tab/community.png',
        selectedIconPath: '/images/tab/community-active.png'
      },
      {
        pagePath: '/pages/user/user',
        text: '我的',
        iconPath: '/images/tab/user.png',
        selectedIconPath: '/images/tab/user-active.png'
      }
    ]
  },
  methods: {
    update(selected) {
      const theme = themeManager.getTheme();
      this.setData({
        selected,
        themeClass: themeManager.getThemeClass(theme)
      });
    },
    switchTab(event) {
      const dataset = event.currentTarget ? event.currentTarget.dataset : {};
      const index = Number(dataset.index);
      const path = dataset.path;
      if (!path || index === this.data.selected) {
        return;
      }
      wx.switchTab({ url: path });
    }
  }
});
