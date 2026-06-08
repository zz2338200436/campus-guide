const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const locationMapHelper = require('../utils/locationMapHelper');
const placeData = require('../utils/placeData');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

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

runTest('map page uses stable 2D campus map capabilities', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');

  assert.ok(!wxml.includes('enable-3D'), 'map component should not enable unstable 3D rendering');
  assert.ok(!wxml.includes('enable-overlooking'), 'map component should not enable overlooking tilt');
  assert.ok(!wxml.includes('skew="{{mapSkew}}"'), 'map component should not bind a 3D tilt angle');
  assert.ok(!wxml.includes('rotate="{{mapRotate}}"'), 'map component should not bind map rotation');
  assert.ok(wxml.includes('enable-building="{{enableBuilding}}"'), 'map component should bind building layer so developer tools can disable unstable tiles');
  assert.ok(wxml.includes('enable-poi'), 'map component should explicitly enable POI layer');
  assert.ok(wxml.includes('show-compass'), 'map component should show compass');
  assert.ok(!wxml.includes('subkey="{{mapSubkey}}"'), 'map component should not bind an empty Tencent map subkey');
  assert.ok(!js.includes('mapSkew'), 'map page should not keep 3D skew state');
  assert.ok(!js.includes('mapRotate'), 'map page should not keep 3D rotate state');
  assert.ok(!js.includes('reset3DView'), 'map page should not expose reset 3D actions');
  assert.ok(js.includes('buildNavigationViewportState'), 'navigation should switch to a stable map viewport state');
});

runTest('map page avoids unstable satellite tiles in developer tools', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');

  assert.ok(wxml.includes('enable-satellite="{{enableSatellite}}"'), 'map component should bind WeChat official satellite switch');
  assert.ok(!wxml.includes('map-type="{{mapType}}"'), 'map component should not use unsupported map-type switching');
  assert.ok(js.includes('enableSatellite: false'), 'map page should keep satellite layer disabled by default');
  assert.ok(!js.includes("satellite: { enableSatellite: true"), 'map page should not expose satellite mode in developer tools');
  assert.ok(!wxml.includes('卫星感'), 'map page should not show a satellite mode that triggers hybrid tile requests');
  assert.ok(js.includes('enableBuilding: !isDeveloperTool'), 'map page should disable building tiles in developer tools');
});

runTest('map page exposes a complete location tool flow', () => {
  const wxml = read('pages/map/map.wxml');

  assert.ok(wxml.includes('bindtap="chooseLocation"'), 'map tools should allow users to choose a location');
  assert.ok(wxml.includes('bindtap="openSelectedLocation"'), 'map tools should allow users to open the chosen or current location');
});

runTest('map page uses campus gate as developer tool fallback location', () => {
  const js = read('pages/map/map.js');

  assert.ok(js.includes('locationMapHelper.CAMPUS_GATE_LOCATION'), 'map page should reuse the shared campus gate fallback');
  assert.ok(js.includes('已使用模拟位置（学校门口）'), 'map page should tell users when the gate fallback is used');
  assert.ok(!js.includes('模拟位置（图书馆附近）'), 'map page should not label the fallback as library location');
  assert.ok(!js.includes('校区图书馆坐标作为模拟位置'), 'map page should not keep the old library fallback comment');
});

runTest('map page hides selected place card while navigating', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('wx:if="{{selectedPlace && !navigating}}"'), 'selected place card should disappear during navigation');
  assert.ok(js.includes('selectedPlace: null'), 'starting navigation should clear the selected place card');
  assert.ok(!wxss.includes('bottom: 236rpx;'), 'selected place card should not use the old cramped overlay position');
});

runTest('map page declutters non-navigation layers while navigating', () => {
  const js = read('pages/map/map.js');
  const applyNavigationBlock = js.slice(js.indexOf('_applyNavigation'), js.indexOf('cancelNavigation'));

  assert.ok(js.includes('const isNavigating = this.data.navigating;'), 'map filtering should branch on navigation state');
  assert.ok(js.includes('const baseMarkers = isNavigating ? [] : locationMapHelper.buildMarkers(filtered);'), 'navigation should hide ordinary place markers');
  assert.ok(js.includes('const basePolyline = [];'), 'map page should not draw the recommended route polyline over the ordinary map');
  assert.ok(!js.includes('locationMapHelper.buildRoutePolyline(this.data.places, routeIds);'), 'ordinary map view should not render the thick blue recommended route line');
  assert.ok(js.includes('circles: []'), 'map page should not render focus circles over the campus map');
  assert.ok(!js.includes('circles: isNavigating ? [] : locationMapHelper.buildRouteCircles'), 'map page should remove route focus circle overlays');
  assert.ok(applyNavigationBlock.includes('polygons: []'), 'starting navigation should hide building polygons');
  assert.ok(!js.includes('locationMapHelper.buildCampusPolygons(this.data.places)'), 'map page should not restore building polygon boxes');
});

runTest('map page avoids native openLocation route scheme in developer tools', () => {
  const js = read('pages/map/map.js');

  assert.ok(js.includes('navigationHelper.isDeveloperTool'), 'map page should detect developer tools before native navigation');
  assert.ok(js.includes('开发者工具不支持微信地图导航'), 'map page should explain native navigation is unavailable in devtools');
  assert.ok(!js.includes('qqmap://'), 'map page should never manually open qqmap route schemes');
});

runTest('map navigation panel uses one smart start navigation action', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('bindtap="openNativeNavigation">开始导航</button>'), 'map navigation panel should expose one smart start action');
  assert.ok(!wxml.includes('打开微信地图导航'), 'map navigation panel should not show a separate WeChat map action label');
  assert.ok(!wxml.includes('nav-status-strip'), 'map page should not render a duplicate navigation status strip above the map header');
  assert.ok(!wxss.includes('.nav-status-strip'), 'map page should remove duplicate navigation status strip styling');
  assert.ok(wxml.includes("{{navigating ? '导航中' : filteredPlaces.length + ' 处'}}"), 'map page should keep one compact navigation status badge');
  assert.ok(wxml.includes('bindtap="cancelNavigation">退出导航</text>'), 'navigation panel should keep one visible exit action');
  assert.ok(wxml.includes('nav-info-panel__primary-actions'), 'navigation panel should group primary actions');
  assert.ok(wxml.includes('nav-info-panel__secondary-actions'), 'navigation panel should group secondary actions');
  assert.ok(wxml.includes('nav-info-panel__link'), 'navigation panel secondary actions should be compact links');
  assert.ok(!wxml.includes('nav-info-panel__btn nav-info-panel__btn--cancel'), 'navigation panel should not stack cancel as a full-width button');
  assert.ok(wxss.includes('.nav-info-panel__primary-actions'), 'navigation panel should style primary action grouping');
  assert.ok(wxss.includes('.nav-info-panel__secondary-actions'), 'navigation panel should style secondary action links');
  const actionBlock = /\.nav-info-panel__actions\s*\{[^}]*\}/.exec(wxss);
  assert.ok(actionBlock, 'navigation panel actions should have a style block');
  assert.ok(!actionBlock[0].includes('grid-template-columns: 1fr'), 'navigation panel should not use a single-column button stack');
});

runTest('map page renders detailed Guangzhou Applied Technology University campus layer', () => {
  const wxml = read('pages/map/map.wxml');

  assert.ok(!wxml.includes('detail-layer'), 'map page should not render a blocking campus layer overlay');
  assert.ok(wxml.includes('map-layer-summary'), 'map page should render campus layer summary outside the map viewport');
  assert.ok(wxml.includes('campusDetailLayer'), 'map page should keep campus layer summary data');
  assert.ok(wxml.includes('polygons="{{polygons}}"'), 'map page should keep polygon binding empty for a cleaner Tencent base map');
  assert.ok(!wxml.includes('campus-visual-layer'), 'map page should not render a local campus visual fallback layer');
  assert.ok(!wxml.includes('campus-building'), 'map page should not render local campus building blocks');
  assert.ok(wxml.includes('广州应用科技学院肇庆校区'), 'map page should explicitly identify the campus');
  assert.ok(wxml.includes('selectedPlace'), 'map page should expose selected place summary inside the map stage');
  assert.ok(!wxml.includes('location-panel__grid'), 'map page should avoid long debug-style tool grid');
});

runTest('map page uses native POI taps for building information', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');

  assert.ok(wxml.includes('bindpoitap="handlePoiTap"'), 'map component should listen to native POI taps');
  assert.ok(js.includes('handlePoiTap(event)'), 'map page should handle native POI taps');
  assert.ok(js.includes('poi.name'), 'native POI tap handler should read the POI name returned by WeChat map');
  assert.ok(js.includes('原生建筑'), 'native POI tap feedback should identify Tencent native building/POI information');
});

runTest('map page keeps location tools compact and non-duplicated', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');
  const includeAllPointsActions = wxml.match(/bindtap="includeAllPoints"/g) || [];

  assert.ok(!wxml.includes('地图工具'), 'map page should not render a separate tool section title under the map');
  assert.equal(includeAllPointsActions.length, 1, 'map page should expose only one fit-all-points action');
  assert.ok(!wxml.includes('重置视野'), 'map page should not duplicate the all-points action as reset view');
  assert.ok(!wxml.includes('获取当前位置'), 'map page should use compact location action labels');
  assert.ok(!wxml.includes('打开选中位置'), 'map page should use compact native-open action labels');
  assert.ok(wxml.includes('location-panel__status'), 'map page should show location result as compact status text');
  assert.ok(wxss.includes('.location-panel__status'), 'map page should style compact location status text');
  assert.ok(!/\.location-toolbar\s*\{[^}]*grid-template-columns:\s*repeat\(4/.test(wxss), 'location toolbar should not use a four-column button grid');
  assert.ok(/\.location-action\s*\{[\s\S]*height:\s*44rpx;/.test(wxss), 'location actions should use compact control height');
});

runTest('map selected place card uses compact primary and secondary actions', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('selected-place__primary-actions'), 'selected card should group primary actions');
  assert.ok(wxml.includes('selected-place__secondary-actions'), 'selected card should group secondary actions');
  assert.ok(wxml.includes('selected-place__link'), 'selected card should render secondary actions as compact text links');
  assert.ok(wxml.includes('bindtap="startSelectedPlaceNavigation">导航</button>'), 'selected card should keep navigation as the primary button');
  assert.ok(!wxml.includes('selected-place__btn selected-place__btn--ghost'), 'selected card should not render secondary actions as stacked ghost buttons');
  assert.ok(wxss.includes('.selected-place__primary-actions'), 'selected card should style primary action grouping');
  assert.ok(wxss.includes('.selected-place__secondary-actions'), 'selected card should style secondary action grouping');
  assert.ok(wxss.includes('.selected-place__link'), 'selected card should style secondary action links');
  assert.ok(!/\.selected-place__actions[\s\S]*display:\s*grid;/.test(wxss), 'selected card actions should not use a tall grid stack');
});

runTest('map page prioritizes map viewport before search and filters', () => {
  const wxml = read('pages/map/map.wxml');
  const overviewIndex = wxml.indexOf('class="map-overview"');
  const mapStageIndex = wxml.indexOf('class="map-stage"');
  const zoneStripIndex = wxml.indexOf('class="zone-strip"');
  const searchCardIndex = wxml.indexOf('class="search-card"');
  const filterIndex = wxml.indexOf('atlas-card__filters');
  const emergencyIndex = wxml.indexOf('class="emergency-strip"');

  assert.ok(overviewIndex > -1, 'map page should use a compact overview row above the map');
  assert.ok(mapStageIndex > -1, 'map stage should exist');
  assert.ok(zoneStripIndex > -1, 'campus zone summary should exist');
  assert.ok(searchCardIndex > -1, 'search card should exist');
  assert.ok(filterIndex > -1, 'filter row should exist');
  assert.ok(emergencyIndex > -1, 'emergency strip should exist');
  assert.ok(overviewIndex < mapStageIndex, 'compact overview should sit directly before the map viewport');
  assert.ok(mapStageIndex < zoneStripIndex, 'map viewport should appear before campus zone summary cards');
  assert.ok(mapStageIndex < searchCardIndex, 'map viewport should appear before search controls');
  assert.ok(mapStageIndex < filterIndex, 'map viewport should appear before filter controls');
  assert.ok(mapStageIndex < emergencyIndex, 'map viewport should appear before secondary emergency shortcuts');
  assert.ok(!wxml.includes('地图检索'), 'map page should not label the primary viewport as search first');
  assert.ok(!wxml.includes('page-head--map'), 'map page should not spend first screen space on a large page header');
  assert.ok(!wxml.includes('section-title__text">地图导航'), 'map page should not render a duplicate map section heading');
  assert.ok(wxml.includes('校园地图服务'), 'map page should keep a compact map service title');
  assert.ok(wxml.includes('广州应用科技学院肇庆校区'), 'map page should keep campus identity next to the viewport');
});

runTest('map component is the first substantial element inside the map stage', () => {
  const wxml = read('pages/map/map.wxml');
  const mapIndex = wxml.indexOf('<map id="campusMap"');
  const stageHeadIndex = wxml.indexOf('class="map-stage__head"');
  const modeBarIndex = wxml.indexOf('class="map-mode-bar"');

  assert.ok(mapIndex > -1, 'map component should exist');
  assert.ok(stageHeadIndex > -1, 'map stage header should exist');
  assert.ok(modeBarIndex > -1, 'map mode controls should exist');
  assert.ok(mapIndex < stageHeadIndex, 'map component should appear before explanatory map header');
  assert.ok(mapIndex < modeBarIndex, 'map component should appear before secondary map mode controls');
});

runTest('map stage summary stays compact after the map viewport', () => {
  const wxml = read('pages/map/map.wxml');

  assert.ok(wxml.includes('map-stage__summary'), 'map stage should use a compact summary row after the map');
  assert.ok(!wxml.includes('地图导航展示'), 'map stage should not repeat a large explanatory title below the map');
  assert.ok(!wxml.includes('叠加点位、筛选、推荐路线和导航状态'), 'map stage should not show long explanatory copy below the map');
  assert.ok(wxml.includes('map-layer-summary'), 'map stage should keep concise campus layer facts');
  assert.ok(wxml.includes("{{navigating ? '导航中' : filteredPlaces.length + ' 处'}}"), 'map stage should keep the compact status badge');
});

runTest('map mode controls are inline with the compact map summary', () => {
  const wxml = read('pages/map/map.wxml');
  const headStart = wxml.indexOf('class="map-stage__head"');
  const headEnd = wxml.indexOf('</view>\n\n      <view class="selected-place"', headStart);
  const headBlock = wxml.slice(headStart, headEnd);

  assert.ok(headBlock.includes('class="map-mode-bar"'), 'map mode controls should live inside the compact summary row');
  assert.ok(headBlock.includes('map-stage__count'), 'map status badge should share the compact summary row');
  assert.ok(!wxml.includes('</view>\n      <view class="map-mode-bar">'), 'map mode controls should not consume a standalone row under the summary');
});

runTest('map campus zone summary uses compact filter chips', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('class="zone-chip"'), 'campus zone summary should render compact chips');
  assert.ok(wxml.includes('zone-chip__count'), 'zone chips should keep count information');
  assert.ok(wxml.includes('zone-chip__title'), 'zone chips should keep zone type text');
  assert.ok(!wxml.includes('class="zone-card"'), 'campus zone summary should not render tall cards');
  assert.ok(!wxml.includes('zone-card__desc'), 'campus zone summary should not show descriptive copy');
  assert.ok(wxss.includes('.zone-chip'), 'map page should style compact zone chips');
  assert.ok(!wxss.includes('.zone-card__desc'), 'map page should remove tall zone card description styles');
  assert.ok(!/\.zone-chip\s*\{[\s\S]*min-height:\s*132rpx;/.test(wxss), 'zone chips should avoid the old tall card height');
});

runTest('map search controls stay in one compact row', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');
  const searchStart = wxml.indexOf('class="search-card"');
  const searchEnd = wxml.indexOf('<scroll-view class="type-scroll', searchStart);
  const searchBlock = wxml.slice(searchStart, searchEnd);

  assert.ok(searchBlock.includes('class="search-card__main"'), 'search should keep a compact main control row');
  assert.ok(searchBlock.includes('class="search-card__clear"'), 'search clear action should stay available');
  assert.ok(!searchBlock.includes('class="search-card__meta"'), 'search should not spend a second row on helper copy');
  assert.ok(!searchBlock.includes('search-card__hint'), 'search should not render long helper text under the input');
  assert.ok(!wxml.includes('支持按地点、服务、楼栋、坐标来源和复核状态检索'), 'search helper copy should not lengthen the map page');
  assert.ok(!wxss.includes('.search-card__meta'), 'map page should remove second-row search metadata styling');
  assert.ok(!wxss.includes('.search-card__hint'), 'map page should remove search hint styling');
});

runTest('map directory rows avoid duplicate detail actions', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('class="directory-item" data-id="{{item.id}}" bindtap="openDetail"'), 'directory row should remain tappable for detail');
  assert.ok(wxml.includes('catchtap="startPlaceNavigation"'), 'directory row should keep direct navigation action');
  assert.ok(!wxml.includes('class="directory-item__action"'), 'directory row should not repeat a separate detail action');
  assert.ok(!/\.directory-item__action\s*\{/.test(wxss), 'map page should remove redundant detail action styling');
});

runTest('map directory indexes use stable two-digit data formatting', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');

  assert.ok(wxml.includes('{{item.displayIndex}}'), 'directory rows should render a prepared display index');
  assert.ok(!wxml.includes('0{{index + 1}}'), 'directory rows should not prefix every index with zero');
  assert.ok(js.includes('function formatDirectoryIndex'), 'map page should keep directory index formatting in data logic');
  assert.ok(js.includes("index < 9 ? '0' + (index + 1) : String(index + 1)"), 'directory index formatter should stop adding zero from item 10');
});

runTest('map directory does not repeat checked-in status copy', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('item.directoryStatus'), 'directory should keep the prepared status chip text');
  assert.ok(!wxml.includes('directory-item__meta'), 'directory should not render a second status line');
  assert.ok(!wxml.includes('已完成到访'), 'directory should not repeat checked-in copy below the status chip');
  assert.ok(!wxss.includes('.directory-item__meta'), 'map page should remove unused directory meta styling');
});

runTest('map emergency shortcuts render as compact horizontal chips', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('class="emergency-chip-row"'), 'emergency shortcuts should use a horizontal chip row');
  assert.ok(wxml.includes('class="emergency-chip"'), 'emergency shortcut items should render as compact chips');
  assert.ok(wxml.includes('catchtap="startPlaceNavigation"'), 'emergency chips should still navigate directly');
  assert.ok(!wxml.includes('class="emergency-entry"'), 'emergency shortcuts should not render vertical list entries');
  assert.ok(wxss.includes('.emergency-chip-row'), 'map page should style emergency chip row');
  assert.ok(wxss.includes('.emergency-chip'), 'map page should style emergency chips');
  assert.ok(!wxss.includes('.emergency-entry'), 'map page should remove old emergency entry styles');
});

runTest('location helper builds detailed campus layer statistics', () => {
  const layer = locationMapHelper.buildCampusDetailLayer(placeData);

  assert.equal(layer.campusName, '广州应用科技学院肇庆校区');
  assert.ok(layer.totalPlaces >= 20);
  assert.ok(layer.realCoordinatePlaces >= 20);
  assert.ok(layer.zones.some((zone) => zone.name === '教学楼群' && zone.count >= 5));
  assert.ok(layer.zones.some((zone) => zone.name === '生活服务' && zone.count >= 4));
  assert.equal(layer.coordinateSystem, 'GCJ-02');
});

runTest('location helper builds geo-bound campus polygons from real coordinates', () => {
  const polygons = locationMapHelper.buildCampusPolygons(placeData);

  assert.ok(polygons.length >= 12);
  assert.ok(polygons.every((item) => item.points.length === 4));
  assert.ok(polygons.some((item) => item.id === 6));
  assert.ok(polygons.every((item) => item.level === 'abovelabels'));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
