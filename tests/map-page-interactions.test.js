const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

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

function loadMapPage(options) {
  const loadOptions = options || {};
  const pagePath = path.join(root, 'pages/map/map.js');
  const resolved = require.resolve(pagePath);
  delete require.cache[resolved];

  let pageConfig = null;
  const previousPage = global.Page;
  const previousWx = global.wx;
  const previousGetApp = global.getApp;

  global.Page = (config) => {
    pageConfig = config;
  };
  const wxMock = {
    getSystemInfoSync() {
      return { platform: loadOptions.platform || 'devtools' };
    },
    lastToast: null,
    showToast(options) {
      this.lastToast = options;
    },
    getLocation(options) {
      if (typeof loadOptions.getLocation === 'function') {
        loadOptions.getLocation(options);
        return;
      }
      if (options && typeof options.success === 'function') {
        options.success({
          latitude: 23.2647,
          longitude: 112.6802,
          speed: 0,
          accuracy: 18
        });
      }
    },
    createMapContext() {
      return {
        includePoints() {},
        moveToLocation() {},
        getCenterLocation() {},
        getRegion() {},
        getScale() {},
        translateMarker() {}
      };
    }
  };
  global.wx = wxMock;
  global.getApp = () => ({ globalData: {} });

  require(pagePath);

  global.Page = previousPage;
  global.wx = previousWx;
  global.getApp = previousGetApp;

  if (!pageConfig) {
    throw new Error('map page did not register Page config');
  }

  pageConfig.data = JSON.parse(JSON.stringify(pageConfig.data || {}));
  pageConfig.setData = function setData(nextData, callback) {
    Object.assign(this.data, nextData);
    if (typeof callback === 'function') {
      callback();
    }
  };
  pageConfig.wxMock = wxMock;
  return pageConfig;
}

function withPageWx(page, testFn) {
  const previousWx = global.wx;
  global.wx = page.wxMock;
  try {
    testFn();
  } finally {
    global.wx = previousWx;
  }
}

runTest('map marker tap selects the place and recenters without runtime errors', () => {
  const page = loadMapPage();
  page.data.places = [
    {
      id: 7,
      name: '博雅楼',
      type: '教学楼',
      latitude: 23.2693502,
      longitude: 112.6799501,
      coordinateTrust: {
        level: 'verified',
        label: '真实坐标',
        sourceText: 'OSM',
        reviewText: '已复核'
      }
    }
  ];

  page.handleMarkerTap({ detail: { markerId: 7 } });

  assert.equal(page.data.selectedPlace.name, '博雅楼');
  assert.equal(page.data.latitude, 23.2693502);
  assert.equal(page.data.longitude, 112.6799501);
  assert.equal(page.data.scale, 18);
  assert.equal(page.data.mapCenterText, '已定位：博雅楼');
});

runTest('map page exposes directory locate action in markup', () => {
  const wxml = fs.readFileSync(path.join(root, 'pages/map/map.wxml'), 'utf8');
  const wxss = fs.readFileSync(path.join(root, 'pages/map/map.wxss'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'pages/map/map.js'), 'utf8');

  assert.ok(js.includes('focusPlaceOnMap(event)'), 'map page should implement a directory locate handler');
  assert.ok(wxml.includes('catchtap="focusPlaceOnMap"'), 'directory should expose a locate action without opening detail');
  assert.ok(wxml.includes('directory-item__locate'), 'directory locate action should have a stable class');
  assert.ok(wxss.includes('.directory-item__locate'), 'directory locate action should be styled');
});

runTest('coordinate review focus uses operation source copy without runtime errors', () => {
  const page = loadMapPage();
  page.data.places = [
    {
      id: 7,
      name: '博雅楼',
      type: '教学楼',
      latitude: 23.2693502,
      longitude: 112.6799501,
      coordinateTrust: {
        level: 'review',
        label: '待复核',
        sourceText: '人工校准',
        reviewText: '待复核'
      }
    }
  ];
  let filterArgs = null;
  page.applyFilter = function applyFilter(type, keyword, coordinateLevel) {
    filterArgs = { type, keyword, coordinateLevel };
  };

  withPageWx(page, () => {
    page.focusCoordinateTarget({ placeId: 7, source: 'operations-ready' });
  });

  assert.equal(page.data.selectedPlace.name, '博雅楼');
  assert.equal(page.data.mapCenterText, '回写复核：博雅楼');
  assert.deepEqual(page.data.coordinateReviewReturnTarget, { placeId: 7, source: 'operations-ready' });
  assert.deepEqual(filterArgs, { type: '全部', keyword: '', coordinateLevel: 'review' });
  assert.equal(page.wxMock.lastToast.title, '已定位可回写点');
});

runTest('real device location failure asks for authorization instead of using mock location', () => {
  const page = loadMapPage({
    platform: 'ios',
    getLocation(options) {
      options.fail({ errMsg: 'getLocation:fail auth deny' });
    }
  });

  withPageWx(page, () => {
    page.getCurrentLocation();
  });

  assert.equal(page.data.currentLocation, null);
  assert.equal(page.data.mapCenterText, '定位失败，请检查位置授权后重试');
  assert.equal(page.wxMock.lastToast.title, '定位失败，请检查授权');
});

runTest('real device location keeps the actual off-campus coordinates', () => {
  const page = loadMapPage({
    platform: 'ios',
    getLocation(options) {
      options.success({
        latitude: 23.117,
        longitude: 113.264,
        speed: 0,
        accuracy: 65
      });
    }
  });

  withPageWx(page, () => {
    page.getCurrentLocation();
  });

  assert.equal(page.data.currentLocation.name, '当前位置');
  assert.equal(page.data.currentLocation.latitude, 23.117);
  assert.equal(page.data.currentLocation.longitude, 113.264);
  assert.equal(page.wxMock.lastToast.title, '已获取当前位置');
});

runTest('real device navigation failure does not start mock navigation', () => {
  const page = loadMapPage({
    platform: 'android',
    getLocation(options) {
      options.fail({ errMsg: 'getLocation:fail auth deny' });
    }
  });
  const destination = {
    id: 7,
    name: '博雅楼',
    latitude: 23.2693502,
    longitude: 112.6799501
  };
  page.data.places = [destination];
  page.mapCtx = {};
  let appliedNavigation = false;
  page._applyNavigation = function applyNavigation() {
    appliedNavigation = true;
  };

  withPageWx(page, () => {
    page.startNavigation(destination);
  });

  assert.equal(appliedNavigation, false);
  assert.equal(page.wxMock.lastToast.title, '定位失败，请检查授权');
});

runTest('real device navigation uses the actual off-campus origin', () => {
  const page = loadMapPage({
    platform: 'android',
    getLocation(options) {
      options.success({
        latitude: 23.117,
        longitude: 113.264,
        speed: 0,
        accuracy: 65
      });
    }
  });
  const destination = {
    id: 7,
    name: '博雅楼',
    latitude: 23.2693502,
    longitude: 112.6799501
  };
  page.data.places = [destination];
  page.mapCtx = {};
  let appliedOrigin = null;
  page._applyNavigation = function applyNavigation(origin) {
    appliedOrigin = origin;
  };

  withPageWx(page, () => {
    page.startNavigation(destination);
  });

  assert.equal(appliedOrigin.name, '当前位置');
  assert.equal(appliedOrigin.latitude, 23.117);
  assert.equal(appliedOrigin.longitude, 113.264);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
