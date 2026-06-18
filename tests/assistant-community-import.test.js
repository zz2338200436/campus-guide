const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
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

runTest('assistant/community pages are registered and community replaces study in the tab bar', () => {
  const appConfig = JSON.parse(read('app.json'));

  assert.ok(appConfig.pages.includes('pages/assistant/assistant'));
  assert.ok(appConfig.pages.includes('pages/community/community'));
  assert.ok(appConfig.pages.includes('pages/community-detail/community-detail'));
  assert.ok(appConfig.pages.includes('pages/community-post/community-post'));
  assert.ok(appConfig.pages.includes('pages/study/study'));
  assert.equal(appConfig.tabBar.custom, true);
  assert.equal(appConfig.tabBar.list.length, 4);
  assert.equal(appConfig.tabBar.list[2].pagePath, 'pages/community/community');
  assert.equal(appConfig.tabBar.list[2].text, '校园圈');
  assert.equal(appConfig.tabBar.list[2].iconPath, 'images/tab/community.png');
  assert.equal(appConfig.tabBar.list[2].selectedIconPath, 'images/tab/community-active.png');
  assert.ok(!appConfig.tabBar.list.some((item) => item.pagePath === 'pages/study/study'));
});

runTest('custom tab bar uses four readable student-facing entries', () => {
  const tabBarJs = read('custom-tab-bar/index.js');
  const tabBarWxss = read('custom-tab-bar/index.wxss');

  assert.ok(tabBarJs.includes("text: '首页'"));
  assert.ok(tabBarJs.includes("text: '地图'"));
  assert.ok(tabBarJs.includes("text: '校园圈'"));
  assert.ok(tabBarJs.includes("text: '我的'"));
  assert.ok(tabBarJs.includes('font-size: 26rpx;') === false);
  assert.ok(tabBarWxss.includes('font-size: 26rpx;'));
  assert.ok(tabBarWxss.includes('.custom-tab__item--active'));
});

runTest('homepage and user page expose community-first entry points while keeping study reachable', () => {
  const homeService = require('../utils/services/homeService');
  const indexWxml = read('pages/index/index.wxml');
  const userJs = read('pages/user/user.js');
  const data = homeService.buildHomeData();

  assert.ok(indexWxml.includes('community-spotlight'));
  assert.ok(indexWxml.includes('home-core-grid'));
  assert.ok(userJs.includes("title: '校园圈'"));
  assert.ok(userJs.includes("url: '/pages/community/community'"));
  assert.ok(userJs.includes("title: '学习资源'"));
  assert.ok(userJs.includes("url: '/pages/study/study'"));
  assert.deepEqual(data.coreActions.map((item) => item.id), ['map', 'community', 'service', 'survival']);
  assert.equal(data.coreActions.find((item) => item.id === 'community').tab, true);
  assert.equal(data.quickActions.find((item) => item.id === 'study').tab, false);
});

runTest('assistant page is student-facing and keeps local fallback available', () => {
  const assistantWxml = read('pages/assistant/assistant.wxml');
  const aiEngine = require('../utils/aiEngine');
  const requestJs = read('utils/request.js');
  const proxyScript = read('scripts/xiaomi-ai-proxy.js');

  assert.ok(assistantWxml.includes('校园助手'));
  assert.ok(!assistantWxml.includes('providerLabel'));
  assert.ok(!assistantWxml.includes('真实模型'));
  assert.ok(aiEngine.quickQuestions.length >= 4);
  assert.ok(requestJs.includes('getAssistantReply'));
  assert.ok(requestJs.includes("provider: 'fallback'"));
  assert.ok(proxyScript.includes('XIAOMI_API_KEY'));
  assert.equal(proxyScript.includes('Bearer sk-'), false);
  assert.equal(aiEngine.ask('图书馆在哪').answer.includes('API'), false);
});

runTest('homepage floating assistant entry stays compact and component-driven', () => {
  const indexJson = JSON.parse(read('pages/index/index.json'));
  const indexWxml = read('pages/index/index.wxml');

  assert.equal(indexJson.usingComponents['ai-fab'], '/components/ai-fab/ai-fab');
  assert.ok(indexWxml.includes('<ai-fab'));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
