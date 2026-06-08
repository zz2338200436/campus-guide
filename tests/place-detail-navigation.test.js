const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const navigationHelper = require('../utils/navigationHelper');

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

runTest('navigation helper rejects missing or invalid destination coordinates', () => {
  assert.equal(navigationHelper.buildMapTarget(null), null);
  assert.equal(navigationHelper.buildMapTarget({ latitude: '', longitude: 112.68 }), null);
  assert.equal(navigationHelper.buildMapTarget({ latitude: 91, longitude: 112.68 }), null);
  assert.equal(navigationHelper.buildMapTarget({ latitude: 23.27, longitude: 181 }), null);
});

runTest('navigation helper builds wx.openLocation options for valid places', () => {
  const fail = () => {};
  const options = navigationHelper.buildOpenLocationOptions({
    name: '格致楼',
    address: '肇庆学院格致楼',
    latitude: '23.2701416',
    longitude: '112.6806125'
  }, { fail });

  assert.equal(options.latitude, 23.2701416);
  assert.equal(options.longitude, 112.6806125);
  assert.equal(options.name, '格致楼');
  assert.equal(options.address, '肇庆学院格致楼');
  assert.equal(options.scale, 18);
  assert.equal(options.fail, fail);
});

runTest('navigation helper detects WeChat developer tools environment', () => {
  assert.equal(navigationHelper.isDeveloperTool({ platform: 'devtools' }), true);
  assert.equal(navigationHelper.isDeveloperTool({ platform: 'ios' }), false);
  assert.equal(navigationHelper.isDeveloperTool({ platform: 'android' }), false);
});

runTest('place detail page exposes a fixed navigation action bar', () => {
  const wxml = read('pages/placeDetail/placeDetail.wxml');
  const wxss = read('pages/placeDetail/placeDetail.wxss');
  const js = read('pages/placeDetail/placeDetail.js');

  assert.ok(wxml.includes('detail-actionbar'), 'detail page should render a fixed action bar');
  assert.ok(wxml.includes('bindtap="startNavigation"'), 'fixed action bar should expose one smart navigation action');
  assert.ok(!wxml.includes('bindtap="openNativeLocation"'), 'fixed action bar should not expose a separate native map action');
  assert.ok(wxml.includes('navigationError'), 'detail page should surface navigation failure text');
  assert.ok(wxss.includes('position: fixed;'), 'action bar should remain fixed at the bottom');
  assert.ok(js.includes('navigationHelper'), 'detail page should use shared navigation helper');
});

runTest('place detail exposes one smart navigation button', () => {
  const wxml = read('pages/placeDetail/placeDetail.wxml');
  const js = read('pages/placeDetail/placeDetail.js');

  assert.ok(
    wxml.includes('<button class="btn-primary nav-card__btn" bindtap="startNavigation">开始导航</button>'),
    'detail navigation card should expose one smart start button'
  );
  assert.ok(
    wxml.includes('<button class="detail-actionbar__primary" bindtap="startNavigation">开始导航</button>'),
    'fixed action bar should expose one smart start button'
  );
  assert.ok(!wxml.includes('打开微信地图'), 'detail page should not show a second native map button');
  assert.ok(!wxml.includes('微信地图</button>'), 'detail page should not show a separate WeChat map button');
  assert.ok(js.includes('startNavigation()'), 'detail page should implement the smart navigation action');
  assert.ok(js.includes('this.openLocation();'), 'developer tools or native failures should fall back to in-app map navigation');
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
