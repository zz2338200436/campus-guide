const userManager = require('./utils/userManager');

App({
  onLaunch() {
    userManager.init();
  },
  globalData: {
    appName: '校园通',
    navigateTarget: null,
    mapFocusTarget: null,
    operationsReturnHint: null
  }
});
