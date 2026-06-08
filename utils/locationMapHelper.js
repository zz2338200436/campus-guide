const DEFAULT_CENTER = {
  latitude: 23.2720,
  longitude: 112.6801
};

const CAMPUS_GATE_LOCATION = {
  name: '模拟位置（学校门口）',
  latitude: 23.2645992,
  longitude: 112.6802932,
  speed: 0,
  accuracy: 10
};

const CAMPUS_BOUNDS = {
  minLatitude: 23.2635,
  maxLatitude: 23.2750,
  minLongitude: 112.6700,
  maxLongitude: 112.6845
};

function buildMarkers(placeList) {
  return getValidPlaces(placeList).map((item) => ({
    id: Number(item.id),
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    width: 30,
    height: 30,
    title: item.name,
    collision: 'poi,marker',
    collisionRelation: 'alone'
  }));
}

function buildIncludePoints(placeList) {
  return getValidPlaces(placeList).map((item) => ({
    latitude: Number(item.latitude),
    longitude: Number(item.longitude)
  }));
}

function buildRoutePolyline(placeList, routeIds) {
  const points = getRoutePlaces(placeList, routeIds).map((item) => ({
    latitude: Number(item.latitude),
    longitude: Number(item.longitude)
  }));
  if (points.length < 2) {
    return [];
  }
  return [{
    points,
    color: '#0891B2DD',
    width: 7,
    dottedLine: false,
    arrowLine: true,
    borderColor: '#ECFEFF',
    borderWidth: 2,
    level: 'abovelabels'
  }];
}

function buildRouteCircles(placeList, routeIds) {
  return getRoutePlaces(placeList, routeIds).map((item, index) => ({
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    radius: 95,
    color: index === 0 ? '#22C55ECC' : '#0891B2CC',
    fillColor: index === 0 ? '#22C55E24' : '#0891B224',
    strokeWidth: 2,
    level: 'abovelabels'
  }));
}

function getMapCenter(placeList, fallback) {
  const points = buildIncludePoints(placeList);
  if (!points.length) {
    return normalizeCoordinate(fallback) || DEFAULT_CENTER;
  }
  const total = points.reduce((result, item) => ({
    latitude: result.latitude + item.latitude,
    longitude: result.longitude + item.longitude
  }), {
    latitude: 0,
    longitude: 0
  });
  return {
    latitude: roundCoordinate(total.latitude / points.length),
    longitude: roundCoordinate(total.longitude / points.length)
  };
}

function buildNavigationPolyline(origin, destination) {
  const o = normalizeCoordinate(origin);
  const d = normalizeCoordinate(destination);
  if (!o || !d) {
    return [];
  }
  return [{
    points: [
      { latitude: o.latitude, longitude: o.longitude },
      { latitude: d.latitude, longitude: d.longitude }
    ],
    color: '#E53935DD',
    width: 6,
    dottedLine: false,
    arrowLine: true,
    borderColor: '#FFFFFF',
    borderWidth: 2,
    level: 'abovelabels'
  }];
}

function buildNavigationMarkers(origin, destination, destinationName) {
  const o = normalizeCoordinate(origin);
  const d = normalizeCoordinate(destination);
  const originName = origin && origin.name ? origin.name : '当前位置';
  const markers = [];
  if (o) {
    markers.push({
      id: -1,
      latitude: o.latitude,
      longitude: o.longitude,
      width: 28,
      height: 28,
      callout: {
        content: originName,
        color: '#ffffff',
        fontSize: 13,
        borderRadius: 10,
        bgColor: '#0891B2',
        padding: 8,
        display: 'ALWAYS'
      }
    });
  }
  if (d) {
    markers.push({
      id: -2,
      latitude: d.latitude,
      longitude: d.longitude,
      width: 36,
      height: 36,
      callout: {
        content: destinationName || '目的地',
        color: '#ffffff',
        fontSize: 13,
        borderRadius: 10,
        bgColor: '#E53935',
        padding: 8,
        display: 'ALWAYS'
      }
    });
  }
  return markers;
}

function buildNavigationState(origin, destination) {
  const o = normalizeCoordinate(origin);
  const d = normalizeCoordinate(destination);
  if (!o || !d) {
    return {
      markers: [],
      polyline: [],
      includePoints: [],
      distanceText: '',
      center: DEFAULT_CENTER
    };
  }
  return {
    markers: buildNavigationMarkers(origin, destination, destination && destination.name),
    polyline: buildNavigationPolyline(o, d),
    includePoints: [
      { latitude: o.latitude, longitude: o.longitude },
      { latitude: d.latitude, longitude: d.longitude }
    ],
    distanceText: calculateDistance(o, d),
    center: {
      latitude: roundCoordinate((o.latitude + d.latitude) / 2),
      longitude: roundCoordinate((o.longitude + d.longitude) / 2)
    }
  };
}

function buildNavigationViewportState(origin, destination) {
  const navState = buildNavigationState(origin, destination);
  return Object.assign({}, navState, {
    enableSatellite: false,
    scale: 17,
    latitude: navState.center.latitude,
    longitude: navState.center.longitude
  });
}

function buildCampusDetailLayer(placeList) {
  const places = Array.isArray(placeList) ? placeList : [];
  const validPlaces = getValidPlaces(places);
  const zoneDefinitions = [
    { name: '教学楼群', types: ['教学楼'] },
    { name: '生活服务', types: ['生活场所', '宿舍楼'] },
    { name: '交通办事', types: ['交通入口', '办事服务'] },
    { name: '学习运动', types: ['学习场所', '运动场所'] },
    { name: '安全应急', types: ['应急服务'] }
  ];
  return {
    campusName: '广州应用科技学院肇庆校区',
    coordinateSystem: 'GCJ-02',
    totalPlaces: places.length,
    realCoordinatePlaces: validPlaces.length,
    zones: zoneDefinitions.map((zone) => ({
      name: zone.name,
      count: validPlaces.filter((item) => zone.types.includes(item.type)).length
    })).filter((zone) => zone.count > 0)
  };
}

function buildCampusBlueprint(placeList) {
  const places = (Array.isArray(placeList) ? placeList : [])
    .filter((item) => isFinite(Number(item.mapX)) && isFinite(Number(item.mapY)));
  const buildings = places.map((item) => ({
    id: Number(item.id),
    name: shortPlaceName(item.name),
    type: item.type,
    left: clampPercent(Number(item.mapX)),
    top: clampPercent(Number(item.mapY)),
    width: getBlueprintSize(item.type).width,
    height: getBlueprintSize(item.type).height,
    tone: getBlueprintTone(item.type)
  }));
  return {
    roads: [
      { name: 'campus-main-road', left: 8, top: 62, width: 82, rotate: -6 },
      { name: 'teaching-loop', left: 38, top: 38, width: 44, rotate: 12 },
      { name: 'life-service-road', left: 12, top: 74, width: 32, rotate: -18 }
    ],
    buildings
  };
}

function buildCampusPolygons(placeList) {
  return getValidPlaces(placeList).map((item) => {
    const center = normalizeCoordinate(item);
    const size = getPolygonSize(item.type);
    return {
      id: Number(item.id),
      points: buildRectanglePoints(center, size.latitudeDelta, size.longitudeDelta),
      strokeColor: getPolygonStrokeColor(item.type),
      fillColor: getPolygonFillColor(item.type),
      strokeWidth: 2,
      zIndex: 1,
      level: 'abovelabels'
    };
  });
}

function calculateDistance(origin, destination) {
  const o = normalizeCoordinate(origin);
  const d = normalizeCoordinate(destination);
  if (!o || !d) {
    return '';
  }
  const R = 6371000;
  const toRad = function (deg) { return deg * Math.PI / 180; };
  const dLat = toRad(d.latitude - o.latitude);
  const dLon = toRad(d.longitude - o.longitude);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(o.latitude)) * Math.cos(toRad(d.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  if (dist >= 1000) {
    return (dist / 1000).toFixed(1) + 'km';
  }
  return Math.round(dist) + 'm';
}

function formatSelectedLocation(location) {
  const coordinate = normalizeCoordinate(location);
  const name = location && location.name ? location.name : '已选位置';
  const address = location && location.address ? location.address : '暂无地址';
  return {
    name,
    address,
    latitude: coordinate ? coordinate.latitude : DEFAULT_CENTER.latitude,
    longitude: coordinate ? coordinate.longitude : DEFAULT_CENTER.longitude,
    text: name + ' · ' + address
  };
}

function resolveCampusTestLocation(location) {
  return resolveCurrentLocation(location, {
    useCampusFallback: true
  });
}

function resolveCurrentLocation(location, options) {
  const coordinate = normalizeCoordinate(location);
  const useCampusFallback = !options || options.useCampusFallback !== false;
  if (!coordinate) {
    if (!useCampusFallback) {
      return null;
    }
    return Object.assign({ isFallback: true }, CAMPUS_GATE_LOCATION);
  }
  if (useCampusFallback && !isInsideCampusBounds(coordinate)) {
    return Object.assign({ isFallback: true }, CAMPUS_GATE_LOCATION);
  }
  return {
    name: location && location.name ? location.name : '当前位置',
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    speed: location && location.speed,
    accuracy: location && location.accuracy,
    isFallback: false
  };
}

function isInsideCampusBounds(location) {
  const coordinate = normalizeCoordinate(location);
  if (!coordinate) {
    return false;
  }
  return coordinate.latitude >= CAMPUS_BOUNDS.minLatitude &&
    coordinate.latitude <= CAMPUS_BOUNDS.maxLatitude &&
    coordinate.longitude >= CAMPUS_BOUNDS.minLongitude &&
    coordinate.longitude <= CAMPUS_BOUNDS.maxLongitude;
}

function getValidPlaces(placeList) {
  return (Array.isArray(placeList) ? placeList : []).filter((item) => normalizeCoordinate(item));
}

function getRoutePlaces(placeList, routeIds) {
  const validPlaces = getValidPlaces(placeList);
  if (!Array.isArray(routeIds) || !routeIds.length) {
    return validPlaces;
  }
  return routeIds
    .map((routeId) => validPlaces.find((item) => Number(item.id) === Number(routeId)))
    .filter(Boolean);
}

function normalizeCoordinate(item) {
  if (!item) {
    return null;
  }
  if (item.latitude === '' || item.longitude === '' || item.latitude == null || item.longitude == null) {
    return null;
  }
  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  return {
    latitude,
    longitude
  };
}

function roundCoordinate(value) {
  return Math.round(value * 10000) / 10000;
}

function shortPlaceName(name) {
  return String(name || '').replace('广州应用科技学院(肇庆校区)', '').replace('广州应用科技学院', '') || '地点';
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function getBlueprintSize(type) {
  const sizes = {
    教学楼: { width: 13, height: 7 },
    宿舍楼: { width: 12, height: 8 },
    学习场所: { width: 14, height: 8 },
    生活场所: { width: 10, height: 6 },
    交通入口: { width: 11, height: 5 },
    办事服务: { width: 12, height: 7 },
    运动场所: { width: 16, height: 9 },
    应急服务: { width: 10, height: 6 }
  };
  return sizes[type] || { width: 10, height: 6 };
}

function getBlueprintTone(type) {
  const tones = {
    教学楼: 'teaching',
    宿舍楼: 'dorm',
    学习场所: 'study',
    生活场所: 'life',
    交通入口: 'traffic',
    办事服务: 'office',
    运动场所: 'sport',
    应急服务: 'emergency'
  };
  return tones[type] || 'default';
}

function buildRectanglePoints(center, latitudeDelta, longitudeDelta) {
  return [
    { latitude: roundCoordinate(center.latitude - latitudeDelta), longitude: roundCoordinate(center.longitude - longitudeDelta) },
    { latitude: roundCoordinate(center.latitude - latitudeDelta), longitude: roundCoordinate(center.longitude + longitudeDelta) },
    { latitude: roundCoordinate(center.latitude + latitudeDelta), longitude: roundCoordinate(center.longitude + longitudeDelta) },
    { latitude: roundCoordinate(center.latitude + latitudeDelta), longitude: roundCoordinate(center.longitude - longitudeDelta) }
  ];
}

function getPolygonSize(type) {
  const sizes = {
    教学楼: { latitudeDelta: 0.00018, longitudeDelta: 0.00022 },
    宿舍楼: { latitudeDelta: 0.0002, longitudeDelta: 0.00024 },
    学习场所: { latitudeDelta: 0.00022, longitudeDelta: 0.00026 },
    生活场所: { latitudeDelta: 0.00016, longitudeDelta: 0.00018 },
    交通入口: { latitudeDelta: 0.00012, longitudeDelta: 0.0002 },
    办事服务: { latitudeDelta: 0.00018, longitudeDelta: 0.00022 },
    运动场所: { latitudeDelta: 0.00026, longitudeDelta: 0.00032 },
    应急服务: { latitudeDelta: 0.00014, longitudeDelta: 0.00016 }
  };
  return sizes[type] || { latitudeDelta: 0.00015, longitudeDelta: 0.00018 };
}

function getPolygonStrokeColor(type) {
  const colors = {
    教学楼: '#2563EBCC',
    宿舍楼: '#16A34ACC',
    学习场所: '#0891B2CC',
    生活场所: '#D97706CC',
    交通入口: '#64748BCC',
    办事服务: '#7C3AEDCC',
    运动场所: '#0D9488CC',
    应急服务: '#DC2626CC'
  };
  return colors[type] || '#334155CC';
}

function getPolygonFillColor(type) {
  const colors = {
    教学楼: '#DBEAFE66',
    宿舍楼: '#DCFCE766',
    学习场所: '#E0F2FE66',
    生活场所: '#FEF3C766',
    交通入口: '#E2E8F066',
    办事服务: '#EDE9FE66',
    运动场所: '#CCFBF166',
    应急服务: '#FEE2E266'
  };
  return colors[type] || '#F8FAFC66';
}

module.exports = {
  DEFAULT_CENTER,
  CAMPUS_GATE_LOCATION,
  CAMPUS_BOUNDS,
  buildMarkers,
  buildIncludePoints,
  buildRoutePolyline,
  buildRouteCircles,
  getMapCenter,
  formatSelectedLocation,
  buildNavigationPolyline,
  buildNavigationMarkers,
  buildNavigationState,
  buildNavigationViewportState,
  resolveCurrentLocation,
  resolveCampusTestLocation,
  isInsideCampusBounds,
  calculateDistance,
  buildCampusDetailLayer,
  buildCampusBlueprint,
  buildCampusPolygons
};
