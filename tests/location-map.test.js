const assert = require('node:assert/strict');
const locationMapHelper = require('../utils/locationMapHelper');

const samplePlaces = [
  {
    id: 1,
    name: '图书馆',
    type: '学习场所',
    latitude: 23.2759,
    longitude: 112.6741,
    address: '图书馆地址'
  },
  {
    id: 2,
    name: '学生食堂',
    type: '生活场所',
    latitude: 23.2772,
    longitude: 112.6755,
    address: '食堂地址'
  },
  {
    id: 3,
    name: '坐标缺失点',
    type: '其他',
    latitude: '',
    longitude: ''
  }
];

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

runTest('location map helper builds mini program map markers', () => {
  const markers = locationMapHelper.buildMarkers(samplePlaces);

  assert.equal(markers.length, 2);
  assert.deepEqual(markers.map((item) => item.id), [1, 2]);
  assert.equal(markers[0].latitude, 23.2759);
  assert.equal(markers[0].longitude, 112.6741);
  assert.equal(markers[0].width, 30);
  assert.equal(markers[0].height, 30);
  assert.equal(markers[0].title, '图书馆');
});

runTest('location map helper lets native POI labels own ordinary map text', () => {
  const markers = locationMapHelper.buildMarkers(samplePlaces);

  assert.ok(markers.every((item) => !item.label), 'ordinary place markers should not draw custom labels');
  assert.ok(markers.every((item) => !item.callout), 'ordinary place markers should not draw custom callout bubbles');
  assert.ok(markers.every((item) => item.collision === 'poi,marker'), 'ordinary markers should participate in native POI collision handling');
});

runTest('location map helper builds includePoints viewport data', () => {
  const points = locationMapHelper.buildIncludePoints(samplePlaces);

  assert.deepEqual(points, [
    { latitude: 23.2759, longitude: 112.6741 },
    { latitude: 23.2772, longitude: 112.6755 }
  ]);
});

runTest('location map helper builds survival route polyline in route order', () => {
  const polyline = locationMapHelper.buildRoutePolyline(samplePlaces, [2, 1, 3]);

  assert.equal(polyline.length, 1);
  assert.deepEqual(polyline[0].points, [
    { latitude: 23.2772, longitude: 112.6755 },
    { latitude: 23.2759, longitude: 112.6741 }
  ]);
  assert.equal(polyline[0].color, '#0891B2DD');
  assert.equal(polyline[0].width, 7);
  assert.equal(polyline[0].arrowLine, true);
  assert.equal(polyline[0].dottedLine, false);
});

runTest('location map helper builds focus circles for valid route points', () => {
  const circles = locationMapHelper.buildRouteCircles(samplePlaces, [1, 3, 2]);

  assert.equal(circles.length, 2);
  assert.deepEqual(circles.map((item) => item.radius), [95, 95]);
  assert.deepEqual(circles.map((item) => item.latitude), [23.2759, 23.2772]);
  assert.equal(circles[0].fillColor, '#22C55E24');
  assert.equal(circles[1].color, '#0891B2CC');
});

runTest('location map helper calculates center from valid coordinates', () => {
  const center = locationMapHelper.getMapCenter(samplePlaces, {
    latitude: 1,
    longitude: 2
  });

  assert.equal(center.latitude, 23.2766);
  assert.equal(center.longitude, 112.6748);
});

runTest('location map helper formats selected location state', () => {
  const selected = locationMapHelper.formatSelectedLocation({
    name: '校门',
    address: '校门地址',
    latitude: 23.27,
    longitude: 112.68
  });

  assert.equal(selected.name, '校门');
  assert.equal(selected.address, '校门地址');
  assert.equal(selected.latitude, 23.27);
  assert.equal(selected.longitude, 112.68);
  assert.equal(selected.text, '校门 · 校门地址');
});

runTest('location map helper builds complete navigation layer state', () => {
  const state = locationMapHelper.buildNavigationState(
    { latitude: 23.2720399, longitude: 112.6800859 },
    {
      name: '格致楼',
      address: '格致楼地址',
      latitude: 23.2701416,
      longitude: 112.6806125
    }
  );

  assert.equal(state.markers.length, 2);
  assert.deepEqual(state.markers.map((item) => item.id), [-1, -2]);
  assert.equal(state.polyline.length, 1);
  assert.deepEqual(state.includePoints, [
    { latitude: 23.2720399, longitude: 112.6800859 },
    { latitude: 23.2701416, longitude: 112.6806125 }
  ]);
  assert.equal(state.center.latitude, 23.2711);
  assert.equal(state.center.longitude, 112.6803);
  assert.match(state.distanceText, /m$/);
});

runTest('location map helper labels simulated current location clearly', () => {
  const state = locationMapHelper.buildNavigationState(
    {
      latitude: 23.2720399,
      longitude: 112.6800859,
      name: '模拟位置（图书馆附近）'
    },
    {
      name: '行政中心',
      latitude: 23.2698269,
      longitude: 112.6814309
    }
  );

  assert.equal(state.markers[0].callout.content, '模拟位置（图书馆附近）');
  assert.equal(state.markers[1].callout.content, '行政中心');
});

runTest('location map helper exposes campus gate fallback location', () => {
  assert.equal(locationMapHelper.CAMPUS_GATE_LOCATION.name, '模拟位置（学校门口）');
  assert.equal(locationMapHelper.CAMPUS_GATE_LOCATION.latitude, 23.2645992);
  assert.equal(locationMapHelper.CAMPUS_GATE_LOCATION.longitude, 112.6802932);
});

runTest('location map helper uses gate fallback for off-campus developer locations', () => {
  const location = locationMapHelper.resolveCampusTestLocation({
    latitude: 23.117,
    longitude: 113.264,
    accuracy: 65
  });

  assert.equal(location.name, '模拟位置（学校门口）');
  assert.equal(location.latitude, 23.2645992);
  assert.equal(location.longitude, 112.6802932);
  assert.equal(location.isFallback, true);
});

runTest('location map helper keeps off-campus real device locations when fallback is disabled', () => {
  const location = locationMapHelper.resolveCurrentLocation({
    latitude: 23.117,
    longitude: 113.264,
    accuracy: 65
  }, {
    useCampusFallback: false
  });

  assert.equal(location.name, '当前位置');
  assert.equal(location.latitude, 23.117);
  assert.equal(location.longitude, 113.264);
  assert.equal(location.isFallback, false);
});

runTest('location map helper keeps real campus locations', () => {
  const location = locationMapHelper.resolveCampusTestLocation({
    latitude: 23.2647,
    longitude: 112.6802,
    accuracy: 18
  });

  assert.equal(location.name, '当前位置');
  assert.equal(location.latitude, 23.2647);
  assert.equal(location.longitude, 112.6802);
  assert.equal(location.isFallback, false);
});

runTest('location map helper builds a stable navigation viewport', () => {
  const state = locationMapHelper.buildNavigationViewportState(
    { latitude: 23.2720399, longitude: 112.6800859 },
    {
      name: '格致楼',
      address: '格致楼地址',
      latitude: 23.2701416,
      longitude: 112.6806125
    }
  );

  assert.equal(state.enableSatellite, false);
  assert.equal(state.scale, 17);
  assert.equal(state.latitude, 23.2711);
  assert.equal(state.longitude, 112.6803);
  assert.deepEqual(state.includePoints, [
    { latitude: 23.2720399, longitude: 112.6800859 },
    { latitude: 23.2701416, longitude: 112.6806125 }
  ]);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
