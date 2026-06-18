const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function createWxMock() {
  const store = new Map();
  return {
    getStorageSync(key) {
      return store.has(key) ? store.get(key) : '';
    },
    setStorageSync(key, value) {
      store.set(key, value);
    },
    removeStorageSync(key) {
      store.delete(key);
    },
    getStorageInfoSync() {
      return { keys: [...store.keys()] };
    }
  };
}

function clearModule(modulePath) {
  try {
    delete require.cache[require.resolve(modulePath)];
  } catch (error) {}
}

function runTest(name, testFn) {
  try {
    testFn();
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

runTest('theme manager persists light and dark mode safely', () => {
  global.wx = createWxMock();
  clearModule('../utils/storage');
  clearModule('../utils/themeManager');
  const themeManager = require('../utils/themeManager');

  assert.equal(themeManager.getTheme(), 'light');
  assert.equal(themeManager.getThemeClass(), '');

  assert.equal(themeManager.setTheme('dark'), 'dark');
  assert.equal(themeManager.getTheme(), 'dark');
  assert.equal(themeManager.getThemeClass(), 'theme-dark');

  assert.equal(themeManager.toggleTheme(), 'light');
  assert.equal(themeManager.getThemeClass(), '');

  assert.equal(themeManager.setTheme('unknown'), 'light');
});

runTest('theme manager exposes the next mode icon for the toggle action', () => {
  global.wx = createWxMock();
  clearModule('../utils/storage');
  clearModule('../utils/themeManager');
  const themeManager = require('../utils/themeManager');

  assert.equal(themeManager.getToggleIcon('light'), '/images/theme/night.svg');
  assert.equal(themeManager.getToggleIcon('dark'), '/images/theme/day.svg');
});

runTest('user page exposes a single icon theme toggle', () => {
  const userJs = read('pages/user/user.js');
  const userWxml = read('pages/user/user.wxml');
  const userWxss = read('pages/user/user.wxss');

  assert.ok(userJs.includes("require('../../utils/themeManager')"));
  assert.ok(userJs.includes('toggleTheme'));
  assert.ok(userJs.includes('themeIcon'));
  assert.ok(userJs.includes('getToggleIcon'));
  assert.ok(userWxml.includes('theme-toggle'));
  assert.ok(userWxml.includes('bindtap="toggleTheme"'));
  assert.ok(userWxml.includes('theme-toggle__image'));
  assert.ok(userWxml.includes('src="{{themeIcon}}"'));
  assert.ok(!userWxml.includes('当前是'));
  assert.ok(!userWxml.includes('显示模式'));
  assert.ok(!userWxml.includes('theme-switch card'));
  assert.ok(!userWxml.includes('theme-switch__item'));
  assert.ok(!userWxml.includes('theme-toggle__core'));
  assert.match(userWxml, /<view class="user-hero" wx:if="\{\{user\}\}">[\s\S]*theme-toggle/);
  assert.match(userWxml, /<view class="login-card" wx:if="\{\{!user\}\}">[\s\S]*theme-toggle/);
  assert.ok(userWxss.includes('.theme-toggle'));
  assert.ok(userWxss.includes('.theme-toggle__image'));
});

runTest('theme icons are stored as local svg assets', () => {
  const dayIcon = read('images/theme/day.svg');
  const nightIcon = read('images/theme/night.svg');

  assert.ok(dayIcon.includes('<svg'));
  assert.ok(nightIcon.includes('<svg'));
  assert.ok(dayIcon.includes('fill="#FACC15"'));
  assert.ok(nightIcon.includes('fill="#FACC15"'));
});

runTest('core pages bind the saved theme class at the page root', () => {
  [
    'pages/index/index.wxml',
    'pages/map/map.wxml',
    'pages/community/community.wxml',
    'pages/community-post/community-post.wxml',
    'pages/user/user.wxml'
  ].forEach((file) => {
    assert.match(read(file), /<view class="[^"]*page[^"]*\{\{themeClass\}\}/, file);
  });
});

runTest('global stylesheet defines dark theme surfaces', () => {
  const appWxss = read('app.wxss');

  assert.ok(appWxss.includes('.theme-dark'));
  assert.ok(appWxss.includes('.theme-dark .card'));
  assert.ok(appWxss.includes('.theme-dark input'));
  assert.ok(appWxss.includes('.theme-dark .btn-primary'));
});

runTest('theme manager skips native tab style when custom tab bar is enabled', () => {
  global.wx = {
    ...createWxMock(),
    setNavigationBarColor() {},
    setBackgroundColor() {},
    setTabBarStyle() {
      throw new Error('setTabBarStyle should not be called with custom tab bar enabled');
    }
  };
  clearModule('../utils/storage');
  clearModule('../utils/themeManager');
  const themeManager = require('../utils/themeManager');

  assert.equal(themeManager.setTheme('dark'), 'dark');
});

runTest('dark home page uses softer layered surfaces and avoids floating button overlap', () => {
  const indexWxss = read('pages/index/index.wxss');
  const fabWxss = read('components/ai-fab/ai-fab.wxss');

  assert.ok(indexWxss.includes('.theme-dark.home-page'));
  assert.ok(indexWxss.includes('padding-bottom: 210rpx;'));
  assert.ok(indexWxss.includes('.theme-dark .home-hero'));
  assert.ok(indexWxss.includes('background: linear-gradient(180deg, #111c31 0%, #0f172a 100%);'));
  assert.ok(indexWxss.includes('.theme-dark .home-metric'));
  assert.ok(indexWxss.includes('border-color: rgba(94, 234, 212, 0.16);'));
  assert.ok(fabWxss.includes('bottom: calc(148rpx + env(safe-area-inset-bottom));'));
  assert.ok(fabWxss.includes('height: 92rpx;'));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
