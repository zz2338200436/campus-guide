const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

global.wx = {
  getStorageSync() {
    return '';
  },
  setStorageSync() {},
  removeStorageSync() {},
  getStorageInfoSync() {
    return { keys: [] };
  }
};

const homeService = require('../utils/services/homeService');
const indexWxml = read('pages/index/index.wxml');
const indexWxss = read('pages/index/index.wxss');
const data = homeService.buildHomeData();

assert.ok(indexWxml.includes('home-hero-swiper'), 'home should use image-first hero');
assert.ok(indexWxml.includes('home-next__top'), 'next route card should expose a quick-entry top row');
assert.ok(indexWxml.includes('home-core-grid'), 'home should expose four core actions');
assert.ok(indexWxml.includes('home-core-action__top'), 'core actions should expose a quick-entry top row');
assert.ok(indexWxml.includes('community-spotlight'), 'home should expose community activity');
assert.ok(indexWxml.indexOf('今日行动') < indexWxml.indexOf('校园圈动态'), 'home should lead with today action before community');
assert.ok(indexWxml.indexOf('校园圈动态') < indexWxml.indexOf('最近通知'), 'community should appear before recent notice');
assert.ok(!indexWxml.includes('最近学习'), 'home should not lead with study history');
assert.ok(!indexWxml.includes('学习触达'), 'home should not show study metrics in the hero');
assert.ok(indexWxss.includes('.home-hero-swiper'), 'image-first hero should be styled');
assert.ok(indexWxss.includes('.community-spotlight'), 'community spotlight should be styled');
assert.ok(indexWxss.includes('height: 372rpx;'), 'hero should be shorter to expose more content');
assert.ok(indexWxss.includes('font-size: 38rpx;'), 'hero title should stay prominent but less oversized');
assert.ok(indexWxss.includes('.home-page .section'), 'home should tighten section spacing');
assert.ok(indexWxss.includes('.home-next__mark'), 'next route card should style the icon mark');
assert.ok(indexWxss.includes('.home-core-action__symbol'), 'core actions should style the icon symbol');

assert.deepEqual(data.coreActions.map((item) => item.id), ['map', 'community', 'service', 'survival']);
assert.deepEqual(data.coreActions.map((item) => item.symbol), ['图', '圈', '服', '路']);
assert.ok(data.nextRouteCard);
assert.equal(data.nextRouteCard.symbol, '站');
assert.ok(data.communitySpotlight);
assert.equal(data.communitySpotlight.url, '/pages/community/community');
assert.ok(data.communitySpotlight.title);
assert.ok(data.communitySpotlight.excerpt);

console.log('PASS home style refresh prioritizes campus guide and community');
