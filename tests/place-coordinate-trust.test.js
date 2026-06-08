const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const placeService = require('../utils/services/placeService');
const coordinateReviewStore = require('../utils/coordinateReviewStore');

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

runTest('place detail data exposes coordinate trust for OSM places', () => {
  const detail = placeService.getPlaceDetail(1);

  assert.equal(detail.coordinateTrust.label, '已校准');
  assert.equal(detail.coordinateTrust.sourceText, 'OpenStreetMap');
  assert.equal(detail.coordinateTrust.level, 'stable');
  assert.equal(detail.coordinateTrust.reviewText, '已转换为微信地图坐标');
});

runTest('place list data exposes coordinate trust for map cards', () => {
  const list = placeService.getPlaceList({});
  const osmPlace = list.find((item) => Number(item.id) === 1);
  const estimatedPlace = list.find((item) => Number(item.id) === 21);
  const amapPlace = list.find((item) => Number(item.id) === 28);

  assert.equal(osmPlace.coordinateTrust.label, '已校准');
  assert.equal(estimatedPlace.coordinateTrust.label, '估算坐标');
  assert.equal(estimatedPlace.coordinateTrust.level, 'review');
  assert.equal(amapPlace.coordinateTrust.label, '高德POI');
  assert.equal(amapPlace.coordinateTrust.reviewText, '需现场复核');
});

runTest('place detail data exposes coordinate trust for estimated places', () => {
  const detail = placeService.getPlaceDetail(21);

  assert.equal(detail.coordinateTrust.label, '估算坐标');
  assert.equal(detail.coordinateTrust.sourceText, '手绘地图线性估算');
  assert.equal(detail.coordinateTrust.level, 'review');
  assert.equal(detail.coordinateTrust.reviewText, '需现场复核');
});

runTest('place detail data exposes coordinate trust for Amap POIs', () => {
  const detail = placeService.getPlaceDetail(28);

  assert.equal(detail.coordinateTrust.label, '高德POI');
  assert.equal(detail.coordinateTrust.sourceText, '高德地图POI');
  assert.equal(detail.coordinateTrust.level, 'review');
  assert.equal(detail.coordinateTrust.reviewText, '需现场复核');
});

runTest('place detail page renders compact coordinate trust copy', () => {
  const wxml = read('pages/placeDetail/placeDetail.wxml');
  const wxss = read('pages/placeDetail/placeDetail.wxss');

  assert.ok(wxml.includes('coordinate-trust'), 'detail page should render coordinate trust status');
  assert.ok(wxml.includes('detail.coordinateTrust.label'), 'detail page should show coordinate trust label');
  assert.ok(wxml.includes('detail.coordinateTrust.sourceText'), 'detail page should show coordinate source');
  assert.ok(wxml.includes('detail.coordinateTrust.reviewText'), 'detail page should show review status');
  assert.ok(wxss.includes('.coordinate-trust'), 'detail page should style coordinate trust as a compact status row');
});

runTest('map selected place card renders coordinate trust status', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('selected-place__trust'), 'map selected card should render coordinate trust status');
  assert.ok(wxml.includes('selectedPlace.coordinateTrust.label'), 'map selected card should show trust label');
  assert.ok(wxml.includes('selectedPlace.coordinateTrust.sourceText'), 'map selected card should show coordinate source');
  assert.ok(wxml.includes('selectedPlace.coordinateTrust.reviewText'), 'map selected card should show review status');
  assert.ok(wxss.includes('.selected-place__trust'), 'map selected card should style coordinate trust compactly');
});

runTest('map selected place card exposes calibration for review-required markers', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes("selectedPlace.coordinateTrust.level === 'review'"), 'selected card calibration should only show for review-required places');
  assert.ok(wxml.includes('selected-place__review'), 'selected card should expose a calibration action');
  assert.ok(wxml.includes('data-id="{{selectedPlace.id}}"'), 'selected card calibration should target the selected place id');
  assert.ok(wxml.includes('catchtap="openCoordinateReview"'), 'selected card calibration should reuse the note flow');
  assert.ok(wxss.includes('.selected-place__review'), 'selected card calibration action should be styled compactly');
});

runTest('map calibration flow refreshes selected marker card after saving notes', () => {
  const js = read('pages/map/map.js');

  assert.ok(js.includes('function decoratePlaceWithCoordinateReview'), 'map page should share local review decoration between directory and selected card');
  assert.ok(js.includes('refreshCoordinateReviewState(place.id)'), 'saving a calibration note should refresh visible map state');
  assert.ok(js.includes('selectedPlace: decoratePlaceWithCoordinateReview'), 'selected marker card should include local review note status');
});

runTest('map page can focus an operations coordinate target', () => {
  const js = read('pages/map/map.js');

  assert.ok(js.includes('mapFocusTarget'), 'map page should consume map focus targets from global state');
  assert.ok(js.includes('focusCoordinateTarget'), 'map page should expose a focused coordinate target flow');
  assert.ok(js.includes('selectedPlace: decoratePlaceWithCoordinateReview(place'), 'focused target should open the selected place card with review status');
  assert.ok(js.includes('buildOperationsFocusCopy(target && target.source, place.name)'), 'focused target should explain why the map moved by operations source');
  assert.ok(js.includes("mapCenterText: '回写复核：' + placeName"), 'ready writeback focus should use review copy');
  assert.ok(js.includes("toastTitle: '已定位可回写点'"), 'ready writeback focus should show a precise toast');
});

runTest('map page can return to operations after focused calibration', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');

  assert.ok(js.includes('coordinateReviewReturnTarget'), 'map page should remember when calibration came from operations');
  assert.ok(js.includes('coordinateReviewReturnText'), 'map page should store source-specific return action copy');
  assert.ok(js.includes('coordinateReviewReturnTarget: isOperationsCoordinateSource(target && target.source) ? { placeId, source: target.source } : null'), 'map return target should keep the operations source');
  assert.ok(js.includes("isOperationsCoordinateSource(target && target.source)"), 'map page should accept ready and blocked operations focus sources');
  assert.ok(js.includes("return source === 'operations-blocked' || source === 'operations-ready'"), 'map return source guard should include ready writeback previews');
  assert.ok(js.includes('showCoordinateReviewReturn'), 'map page should expose a post-save return hint');
  assert.ok(js.includes('buildOperationsSavedCopy(this.data.coordinateReviewReturnTarget.source)'), 'saving focused calibration should use source-specific review hints');
  assert.ok(js.includes("return '回写复核已保存，可回运维页复查'"), 'saving ready writeback review should show ready copy');
  assert.ok(js.includes("return '校准已保存，可回运维页复查'"), 'saving blocked calibration should keep calibration copy');
  assert.ok(js.includes("return '回运维确认回写'"), 'ready writeback return action should use confirmation copy');
  assert.ok(js.includes("return '回运维复查'"), 'blocked calibration return action should keep review copy');
  assert.ok(js.includes('openOperationsReview()'), 'map page should implement returning to operations');
  assert.ok(js.includes('getApp().globalData.operationsReturnHint'), 'map page should pass a return hint back to operations');
  assert.ok(js.includes("buildOperationsReturnHint(this.data.coordinateReviewReturnTarget && this.data.coordinateReviewReturnTarget.source)"), 'map return hint should respect ready/blocked source');
  assert.ok(js.includes("type: 'ready-writeback'"), 'ready writeback return hint should carry a ready type');
  assert.ok(js.includes("message: '已复核可回写点位，可继续复制命令生成 patch'"), 'ready writeback return hint should mention patch generation');
  assert.ok(js.includes("type: 'blocked-calibration'"), 'blocked return hint should carry a calibration type');
  assert.ok(js.includes("url: '/pages/operations/operations'"), 'return action should switch to operations page');
  assert.ok(wxml.includes('showCoordinateReviewReturn'), 'selected card should conditionally show the return action');
  assert.ok(wxml.includes('{{coordinateReviewReturnText}}'), 'return action should use source-specific copy');
});

runTest('map navigation panel keeps destination coordinate trust visible', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('nav-info-panel__trust'), 'navigation panel should render coordinate trust status');
  assert.ok(wxml.includes('navDestination.coordinateTrust.label'), 'navigation panel should show trust label');
  assert.ok(wxml.includes('navDestination.coordinateTrust.sourceText'), 'navigation panel should show coordinate source');
  assert.ok(wxml.includes('navDestination.coordinateTrust.reviewText'), 'navigation panel should show review status');
  assert.ok(wxss.includes('.nav-info-panel__trust'), 'navigation panel should style coordinate trust compactly');
});

runTest('map directory items expose coordinate trust before direct navigation', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('directory-item__trust'), 'directory items should render coordinate trust status');
  assert.ok(wxml.includes('item.coordinateTrust.label'), 'directory items should show trust label');
  assert.ok(wxml.includes('item.directoryStatus'), 'directory items should show prepared review status');
  assert.ok(wxss.includes('.directory-item__trust'), 'directory trust status should be styled compactly');
});

runTest('map directory prioritizes review-required coordinate records', () => {
  const js = read('pages/map/map.js');

  assert.ok(js.includes('buildDirectoryPlaces(filtered, checkedIds, coordinateReviews)'), 'map filtering should build a directory-ready list with local review notes');
  assert.ok(js.includes('function buildDirectoryPlaces'), 'map page should keep directory ordering in a small helper');
  assert.ok(js.includes('getCoordinateTrustRank'), 'directory ordering should rank coordinate trust status');
  assert.ok(js.includes("coordinateTrust.level === 'review'"), 'review-required places should be recognized for priority ordering');
});

runTest('map directory shows source and action metadata in a compact row', () => {
  const wxml = read('pages/map/map.wxml');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes('directory-item__source'), 'directory items should expose coordinate source metadata');
  assert.ok(wxml.includes('item.coordinateTrust.sourceText'), 'directory items should show coordinate source text');
  assert.ok(wxml.includes('directory-item__status'), 'directory items should expose review/check-in status metadata');
  assert.ok(wxml.includes('item.directoryStatus'), 'directory items should use prepared directory status copy');
  assert.ok(wxss.includes('.directory-item__source'), 'directory source metadata should be styled compactly');
  assert.ok(wxss.includes('.directory-item__status'), 'directory status metadata should be styled compactly');
});

runTest('coordinate review store saves local calibration notes', () => {
  const writes = {};
  global.wx = {
    getStorageSync(key) {
      return writes[key] || {};
    },
    setStorageSync(key, value) {
      writes[key] = value;
    }
  };

  assert.equal(coordinateReviewStore.saveReview(28, '现场入口在道路东侧'), true);

  const review = coordinateReviewStore.getReview(28);
  assert.equal(review.note, '现场入口在道路东侧');
  assert.equal(review.statusText, '已备注');
});

runTest('coordinate review store validates calibration note quality', () => {
  assert.deepEqual(coordinateReviewStore.validateReviewNote('现场确认入口在道路东侧'), []);
  assert.ok(coordinateReviewStore.validateReviewNote('通过').includes('校准备注过短'));
  assert.ok(coordinateReviewStore.validateReviewNote('已经确认位置正确').includes('校准备注缺少入口、楼栋或坐标依据'));
});

runTest('coordinate review store builds a valid example note for a place', () => {
  const note = coordinateReviewStore.buildReviewNoteExample({ name: '明德楼' });

  assert.ok(note.includes('明德楼'));
  assert.ok(note.includes('入口'));
  assert.deepEqual(coordinateReviewStore.validateReviewNote(note), []);
});

runTest('map directory exposes a calibration action for review-required places', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');
  const wxss = read('pages/map/map.wxss');

  assert.ok(wxml.includes("item.coordinateTrust.level === 'review'"), 'calibration action should only show for review-required places');
  assert.ok(wxml.includes('catchtap="openCoordinateReview"'), 'directory should expose a calibration action without opening detail');
  assert.ok(wxml.includes('校准'), 'calibration action should use short enterprise copy');
  assert.ok(js.includes('coordinateReviewStore'), 'map page should use local coordinate review storage');
  assert.ok(js.includes('openCoordinateReview(event)'), 'map page should implement calibration note flow');
  assert.ok(js.includes('wx.showModal'), 'calibration flow should collect a note without adding a new page');
  assert.ok(js.includes('coordinateReviewStore.saveReview'), 'calibration flow should persist the note locally');
  assert.ok(wxss.includes('.directory-item__review'), 'calibration action should be styled compactly');
});

runTest('map calibration modal explains and enforces note quality', () => {
  const js = read('pages/map/map.js');

  assert.ok(js.includes('入口、楼栋、门牌、现场方向或坐标依据'), 'calibration modal should explain required note evidence');
  assert.ok(js.includes('buildReviewNoteExample(place)'), 'calibration modal should prefill a valid example note when empty');
  assert.ok(js.includes('validateReviewNote'), 'map page should validate calibration notes before saving');
  assert.ok(js.includes("title: noteIssues[0]"), 'map page should show the first note issue to the user');
});

runTest('operations page renders coordinate review note summary', () => {
  const wxml = read('pages/operations/operations.wxml');
  const wxss = read('pages/operations/operations.wxss');
  const js = read('pages/operations/operations.js');

  assert.ok(js.includes('coordinateReviewStore'), 'operations page should read local coordinate review notes');
  assert.ok(js.includes('coordinateReviewSummary'), 'operations page should expose review note summary data');
  assert.ok(wxml.includes('校准备注'), 'operations page should label the coordinate review note panel');
  assert.ok(wxml.includes('coordinateReviewSummary.total'), 'operations page should show local review note count');
  assert.ok(wxml.includes('coordinate-review-list'), 'operations page should render review note rows');
  assert.ok(wxss.includes('.coordinate-review-list'), 'coordinate review rows should be styled compactly');
});

runTest('operations page can copy coordinate review notes as a checklist', () => {
  const wxml = read('pages/operations/operations.wxml');
  const js = read('pages/operations/operations.js');
  const wxss = read('pages/operations/operations.wxss');

  assert.ok(wxml.includes('复制清单'), 'operations page should expose a copy checklist action');
  assert.ok(wxml.includes('bindtap="copyCoordinateReviewChecklist"'), 'copy checklist action should be interactive');
  assert.ok(js.includes('copyCoordinateReviewChecklist()'), 'operations page should implement copy checklist flow');
  assert.ok(js.includes('wx.setClipboardData'), 'copy checklist should use WeChat clipboard API');
  assert.ok(js.includes('暂无校准备注'), 'copy checklist should handle an empty note list');
  assert.ok(wxss.includes('.coordinate-review-copy'), 'copy checklist action should be styled compactly');
});

runTest('operations page can copy a placeData coordinate revision template', () => {
  const wxml = read('pages/operations/operations.wxml');
  const js = read('pages/operations/operations.js');

  assert.ok(wxml.includes('复制模板'), 'operations page should expose a copy revision template action');
  assert.ok(wxml.includes('bindtap="copyCoordinateRevisionTemplate"'), 'revision template action should be interactive');
  assert.ok(wxml.includes('coordinateReviewSummary.validation.readyCount'), 'operations page should show ready-to-writeback count');
  assert.ok(wxml.includes('coordinateReviewSummary.validation.issueCount'), 'operations page should show blocked writeback count');
  assert.ok(js.includes('copyCoordinateRevisionTemplate()'), 'operations page should implement copy revision template flow');
  assert.ok(js.includes('revisionText'), 'revision template flow should copy prepared revision text');
  assert.ok(js.includes('暂无修订模板'), 'revision template flow should handle an empty template');
  assert.ok(js.includes('generated\\\\coordinate-revision-template.txt'), 'revision template flow should tell operators the save path');
  assert.ok(js.includes('wx.showModal'), 'revision template flow should show the save path after copying');
});

runTest('map page exposes a review-only coordinate trust filter', () => {
  const wxml = read('pages/map/map.wxml');
  const js = read('pages/map/map.js');

  assert.ok(wxml.includes('trust-filter'), 'map page should render a coordinate trust filter');
  assert.ok(wxml.includes('待复核 {{reviewPlaceCount}}'), 'map page should expose a review-only filter label with count');
  assert.ok(wxml.includes('bindtap="toggleReviewFilter"'), 'review filter should be interactive');
  assert.ok(js.includes('reviewOnly'), 'map state should keep review-only filter state');
  assert.ok(js.includes('reviewPlaceCount'), 'map state should keep review-place count');
  assert.ok(js.includes('buildReviewPlaceCount(list)'), 'map loading should calculate review-place count');
  assert.ok(js.includes('coordinateLevel: nextCoordinateLevel'), 'map filtering should pass coordinate trust level to data filter');
  assert.ok(js.includes("nextReviewOnly ? 'review' : '全部'"), 'review toggle should switch to review-only filtering');
});

runTest('map search copy teaches coordinate trust keywords', () => {
  const wxml = read('pages/map/map.wxml');

  assert.ok(wxml.includes('搜索地点、楼栋、坐标来源、待复核或高德'), 'search placeholder should mention coordinate trust keywords');
  assert.ok(!wxml.includes('支持按地点、服务、楼栋、坐标来源和复核状态检索'), 'coordinate trust copy should not require a second helper row');
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
