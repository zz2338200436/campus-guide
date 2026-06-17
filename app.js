const userManager = require('./utils/userManager');
const themeManager = require('./utils/themeManager');

App({
  onLaunch() {
    userManager.init();
    themeManager.applyToPage();
  },
  globalData: {
    appName: '校园通',
    navigateTarget: null,
    mapFocusTarget: null,
    operationsReturnHint: null
  }
});
