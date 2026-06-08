const userManager = require('./utils/userManager');

App({
  onLaunch() {
    userManager.init();
  },
  globalData: {
    appName: '校园通——智慧校园与前端学习服务小程序',
    navigateTarget: null,
    mapFocusTarget: null,
    operationsReturnHint: null
  }
});
