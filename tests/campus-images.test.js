const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
const placeData = require('../utils/placeData');

const expectedImages = [
  '/images/campus/admin-center.jpg',
  '/images/campus/mingde-building-wide.jpg',
  '/images/campus/mingde-building-flower.jpg',
  '/images/campus/stadium-aerial.jpg',
  '/images/campus/stadium-day.jpg',
  '/images/campus/stadium-night.jpg',
  '/images/campus/basketball-gym.jpg',
  '/images/campus/swimming-pool.jpg',
  '/images/campus/sports-complex.jpg',
  '/images/campus/climbing-wall.jpg',
  '/images/campus/lianhua-theater.jpg'
];

expectedImages.forEach((imagePath) => {
  const localPath = path.join(__dirname, '..', imagePath.replace(/^\//, ''));
  assert.ok(fs.existsSync(localPath), imagePath + ' should exist locally');
  assert.ok(fs.statSync(localPath).size > 1000, imagePath + ' should not be empty');
});

const homeData = homeService.buildHomeData();
assert.deepEqual(
  homeData.banners.map((item) => item.image),
  [
    '/images/campus/admin-center.jpg',
    '/images/campus/mingde-building-wide.jpg',
    '/images/campus/stadium-aerial.jpg',
    '/images/campus/basketball-gym.jpg',
    '/images/campus/swimming-pool.jpg',
    '/images/campus/lianhua-theater.jpg'
  ]
);

const imagesByPlace = new Map(placeData.map((item) => [item.name, item.image]));
assert.equal(imagesByPlace.get('行政中心'), '/images/campus/admin-center.jpg');
assert.equal(imagesByPlace.get('明德楼'), '/images/campus/mingde-building-wide.jpg');
assert.equal(imagesByPlace.get('田径场'), '/images/campus/stadium-aerial.jpg');
assert.equal(imagesByPlace.get('篮球场'), '/images/campus/basketball-gym.jpg');
assert.equal(imagesByPlace.get('综合体育馆'), '/images/campus/sports-complex.jpg');
assert.equal(imagesByPlace.get('莲花大剧院'), '/images/campus/lianhua-theater.jpg');
assert.equal(imagesByPlace.get('J3修齐楼'), '');
assert.equal(imagesByPlace.get('J4治平楼'), '');

console.log('PASS campus images use local Guangzhou ASC assets');
