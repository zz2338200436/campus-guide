const storage = require('./storage');

const THEME_KEY = 'theme-mode';
const DARK = 'dark';
const LIGHT = 'light';

function normalizeTheme(theme) {
  return theme === DARK ? DARK : LIGHT;
}

function getTheme() {
  return normalizeTheme(storage.get(THEME_KEY, LIGHT));
}

function setTheme(theme) {
  const nextTheme = normalizeTheme(theme);
  storage.set(THEME_KEY, nextTheme);
  applyChrome(nextTheme);
  return nextTheme;
}

function toggleTheme() {
  return setTheme(getTheme() === DARK ? LIGHT : DARK);
}

function getThemeClass(theme) {
  return normalizeTheme(theme || getTheme()) === DARK ? 'theme-dark' : '';
}

function getThemeLabel(theme) {
  return normalizeTheme(theme || getTheme()) === DARK ? '黑夜' : '白天';
}

function getToggleIcon(theme) {
  return normalizeTheme(theme || getTheme()) === DARK
    ? '/images/theme/day.svg'
    : '/images/theme/night.svg';
}

function applyToPage(page) {
  if (!page || typeof page.setData !== 'function') {
    return getTheme();
  }
  const theme = getTheme();
  page.setData({
    theme,
    themeClass: getThemeClass(theme),
    themeLabel: getThemeLabel(theme),
    isDarkTheme: theme === DARK
  });
  applyChrome(theme);
  return theme;
}

function applyChrome(theme) {
  const nextTheme = normalizeTheme(theme);
  if (typeof wx === 'undefined') {
    return;
  }
  if (wx.setNavigationBarColor) {
    wx.setNavigationBarColor({
      frontColor: nextTheme === DARK ? '#ffffff' : '#000000',
      backgroundColor: nextTheme === DARK ? '#0f172a' : '#ecfeff',
      animation: {
        duration: 120,
        timingFunc: 'easeIn'
      }
    });
  }
  if (wx.setBackgroundColor) {
    wx.setBackgroundColor({
      backgroundColor: nextTheme === DARK ? '#0f172a' : '#ecfeff',
      backgroundColorTop: nextTheme === DARK ? '#0f172a' : '#ecfeff',
      backgroundColorBottom: nextTheme === DARK ? '#111827' : '#f7f9fb'
    });
  }
  if (wx.setTabBarStyle && !usesCustomTabBar()) {
    wx.setTabBarStyle({
      color: nextTheme === DARK ? '#94a3b8' : '#7d8596',
      selectedColor: '#14b8a6',
      backgroundColor: nextTheme === DARK ? '#0f172a' : '#f8ffff',
      borderStyle: nextTheme === DARK ? 'white' : 'black'
    });
  }
}

function usesCustomTabBar() {
  try {
    const appConfig = require('../app.json');
    return !!(appConfig && appConfig.tabBar && appConfig.tabBar.custom);
  } catch (error) {
    return false;
  }
}

module.exports = {
  LIGHT,
  DARK,
  getTheme,
  setTheme,
  toggleTheme,
  getThemeClass,
  getThemeLabel,
  getToggleIcon,
  applyToPage
};
