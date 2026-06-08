const request = require('../../utils/request');
const { filterPlaces, getMapPins } = require('../../utils/contentFilter');
const locationMapHelper = require('../../utils/locationMapHelper');
const checkinHelper = require('../../utils/explorationCheckinHelper');
const selectors = require('../../utils/flagshipSelectors');
const navigationHelper = require('../../utils/navigationHelper');
const coordinateReviewStore = require('../../utils/coordinateReviewStore');
const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
const isDeveloperTool = navigationHelper.isDeveloperTool(systemInfo);

Page({
  data: {
    loading: true,
    currentType: '全部',
    keyword: '',
    reviewOnly: false,
    reviewPlaceCount: 0,
    categories: ['全部', '教学', '学习', '住宿', '生活', '交通', '办事', '应急', '运动'],
    categoryMap: {
      '教学': '教学楼',
      '学习': '学习场所',
      '住宿': '宿舍楼',
      '生活': '生活场所',
      '交通': '交通入口',
      '办事': '办事服务',
      '应急': '应急服务',
      '运动': '运动场所'
    },
    campusProfile: {
      name: '广州应用科技学院肇庆校区',
      address: '广东省肇庆市鼎湖区莲花镇丰乐路20号',
      coverage: '覆盖校门、教学、自习、宿舍、食堂、交通、报修和应急支持'
    },
    currentMapMode: 'standard',
    enableSatellite: false,
    enableBuilding: !isDeveloperTool,
    mapModes: [
      { id: 'standard', title: '标准' },
      { id: 'follow', title: '跟随' }
    ],
    polygons: [],
    campusDetailLayer: null,
    selectedPlace: null,
    places: [],
    filteredPlaces: [],
    featuredPlaces: [],
    recommendedPlaces: [],
    routeSteps: [],
    mapZones: [],
    emergencyPlaces: [],
    explorationSummary: null,
    nextRoutePlace: null,
    mapPins: [],
    mapMarkers: [],
    polyline: [],
    circles: [],
    includePoints: [],
    selectedLocation: null,
    currentLocation: null,
    mapScale: '',
    mapRegionText: '',
    mapCenterText: '',
    latitude: 23.2720,
    longitude: 112.6801,
    scale: 18,
    navigating: false,
    navDestination: null,
    navDistance: '',
    navMarkers: [],
    navPolyline: [],
    navCurrentLocation: null,
    pendingNavigationTarget: null,
    coordinateReviewReturnTarget: null,
    coordinateReviewReturnText: '回运维复查',
    showCoordinateReviewReturn: false
  },
  onLoad() {
    this.loadPlaces();
  },
  onReady() {
    this.mapCtx = wx.createMapContext('campusMap');
    this.consumePendingNavigation();
  },
  onShow() {
    if (this.data.places.length) {
      this.applyFilter(this.data.currentType, this.data.keyword);
    }
    const app = getApp();
    if (app.globalData.navigateTarget) {
      const target = app.globalData.navigateTarget;
      app.globalData.navigateTarget = null;
      this.queueNavigation(target);
    }
    if (app.globalData.mapFocusTarget) {
      const target = app.globalData.mapFocusTarget;
      app.globalData.mapFocusTarget = null;
      this.focusCoordinateTarget(target);
    }
  },
  loadPlaces() {
    this.setData({ loading: true });
    request.getPlaceList({}, { loading: true, loadingText: '加载导览数据' }).then((res) => {
      if (res.code !== 0) {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }
      const list = res.data.list || [];
      const featuredPlaces = selectors.getFeaturedPlaces(list);
      this.setData({
        places: list,
        featuredPlaces,
        reviewPlaceCount: buildReviewPlaceCount(list),
        mapZones: buildMapZones(list),
        campusDetailLayer: locationMapHelper.buildCampusDetailLayer(list),
        polygons: [],
        emergencyPlaces: buildEmergencyPlaces(list),
        routeSteps: checkinHelper.getRouteTasks(list),
        explorationSummary: checkinHelper.getSummary(list),
        nextRoutePlace: checkinHelper.getNextRoutePlace(list),
        latitude: locationMapHelper.getMapCenter(list, this.data).latitude,
        longitude: locationMapHelper.getMapCenter(list, this.data).longitude
      });
      this.applyFilter(this.data.currentType, this.data.keyword);
      this.setData({ loading: false });
      this.consumePendingNavigation();
      const app = getApp();
      if (app.globalData.mapFocusTarget) {
        const target = app.globalData.mapFocusTarget;
        app.globalData.mapFocusTarget = null;
        this.focusCoordinateTarget(target);
      }
    });
  },
  applyFilter(type, keyword, coordinateLevel) {
    const nextKeyword = typeof keyword === 'string' ? keyword : this.data.keyword;
    const nextCoordinateLevel = coordinateLevel || (this.data.reviewOnly ? 'review' : '全部');
    const dataType = this.data.categoryMap[type] || type;
    const filtered = filterPlaces(this.data.places, {
      type: dataType,
      keyword: nextKeyword,
      coordinateLevel: nextCoordinateLevel
    });
    const checkedIds = new Set(checkinHelper.getCheckins().map((item) => Number(item.id)));
    const coordinateReviews = coordinateReviewStore.getAllReviews();
    const routeSteps = checkinHelper.getRouteTasks(this.data.places);
    const routeIds = routeSteps.map((item) => Number(item.id));
    const routePlaces = this.data.places.filter((item) => routeIds.includes(Number(item.id)));
    const includeSource = mergePlacesById((filtered.length ? filtered : this.data.places).concat(routePlaces));
    const isNavigating = this.data.navigating;
    const baseMarkers = isNavigating ? [] : locationMapHelper.buildMarkers(filtered);
    const basePolyline = [];
    const navLayers = this.getNavigationLayers();
    this.setData({
      currentType: type,
      keyword: nextKeyword,
      filteredPlaces: buildDirectoryPlaces(filtered, checkedIds, coordinateReviews),
      routeSteps,
      explorationSummary: checkinHelper.getSummary(this.data.places),
      nextRoutePlace: checkinHelper.getNextRoutePlace(this.data.places),
      recommendedPlaces: (filtered.length ? filtered : this.data.places)
        .filter((item) => item.featured)
        .slice(0, 3)
        .map((item) => Object.assign({}, item, { checkedIn: checkedIds.has(Number(item.id)) })),
      mapPins: getMapPins(filtered),
      mapMarkers: baseMarkers.concat(navLayers.markers),
      polyline: basePolyline.concat(navLayers.polyline),
      circles: [],
      includePoints: navLayers.includePoints.length ? navLayers.includePoints : locationMapHelper.buildIncludePoints(includeSource)
    });
  },
  selectType(event) {
    this.applyFilter(event.currentTarget.dataset.type, this.data.keyword);
  },
  filterEmergency() {
    this.applyFilter('应急', this.data.keyword);
  },
  toggleReviewFilter() {
    const nextReviewOnly = !this.data.reviewOnly;
    this.setData({
      reviewOnly: nextReviewOnly
    });
    this.applyFilter(this.data.currentType, this.data.keyword, nextReviewOnly ? 'review' : '全部');
  },
  switchMapMode(event) {
    const mode = event.currentTarget ? event.currentTarget.dataset.mode : 'standard';
    const modeSettings = {
      standard: { enableSatellite: false, scale: 16 },
      follow: { enableSatellite: false, scale: 18 }
    };
    const settings = modeSettings[mode] || modeSettings.standard;
    this.setData(Object.assign({ currentMapMode: mode }, settings));
    if (mode === 'follow') {
      this.getCurrentLocation();
      return;
    }
    this.includeAllPoints();
  },
  handleKeywordInput(event) {
    this.setData({
      keyword: event.detail.value || ''
    });
  },
  submitSearch(event) {
    const keyword = event && event.detail ? event.detail.value : this.data.keyword;
    this.applyFilter(this.data.currentType, keyword);
  },
  clearSearch() {
    this.applyFilter(this.data.currentType, '');
  },
  openFeatured(event) {
    this.openDetail(event);
  },
  openDetail(event) {
    const detail = event.detail || {};
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    const item = detail.id
      ? detail
      : this.data.filteredPlaces.find((place) => place.id === Number(dataset.id)) ||
        this.data.places.find((place) => place.id === Number(dataset.id));
    if (!item) {
      return;
    }
    wx.navigateTo({
      url: '/pages/placeDetail/placeDetail?id=' + item.id
    });
  },
  startPlaceNavigation(event) {
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    const place = this.data.places.find((item) => Number(item.id) === Number(dataset.id));
    if (!place) {
      wx.showToast({
        title: '目的地不存在',
        icon: 'none'
      });
      return;
    }
    this.startNavigation(place);
  },
  handleMarkerTap(event) {
    const markerId = event && event.detail ? event.detail.markerId : '';
    if (Number(markerId) === -1 || Number(markerId) === -2) {
      return;
    }
    const place = this.data.places.find((item) => Number(item.id) === Number(markerId));
    if (!place) {
      return;
    }
    const coordinateReviews = coordinateReviewStore.getAllReviews();
    const focusCopy = buildOperationsFocusCopy(target && target.source, place.name);
    this.setData({
      selectedPlace: decoratePlaceWithCoordinateReview(place, coordinateReviews),
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      scale: 18
    });
  },
  handlePoiTap(event) {
    const poi = event && event.detail ? event.detail : null;
    if (!poi || !poi.name) {
      return;
    }
    const latitude = Number(poi.latitude);
    const longitude = Number(poi.longitude);
    this.setData({
      selectedPlace: null,
      latitude: isFinite(latitude) ? latitude : this.data.latitude,
      longitude: isFinite(longitude) ? longitude : this.data.longitude,
      mapCenterText: '原生建筑：' + poi.name
    });
  },
  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const currentLocation = locationMapHelper.resolveCampusTestLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          speed: res.speed,
          accuracy: res.accuracy
        });
        this.setData({
          currentLocation,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          mapCenterText: currentLocation.name + '：' + formatCoordinate(currentLocation.latitude) + ', ' + formatCoordinate(currentLocation.longitude)
        });
        wx.showToast({
          title: currentLocation.isFallback ? '已使用模拟位置（学校门口）' : '已获取当前位置',
          icon: 'none'
        });
      },
      fail: () => {
        // 开发者工具定位失败时，使用学校门口作为模拟位置，便于测试校内导航。
        const mockLocation = locationMapHelper.CAMPUS_GATE_LOCATION;
        this.setData({
          currentLocation: mockLocation,
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          mapCenterText: '模拟位置：' + formatCoordinate(mockLocation.latitude) + ', ' + formatCoordinate(mockLocation.longitude)
        });
        wx.showToast({
          title: '已使用模拟位置（学校门口）',
          icon: 'none'
        });
      }
    });
  },
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const selectedLocation = locationMapHelper.formatSelectedLocation(res);
        this.setData({
          selectedLocation,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude
        });
        wx.showToast({
          title: '已选择位置',
          icon: 'none'
        });
      },
      fail: () => {
        wx.showToast({
          title: '选择位置失败',
          icon: 'none'
        });
      }
    });
  },
  openSelectedLocation() {
    const location = this.data.selectedLocation || this.data.currentLocation;
    if (!location) {
      wx.showToast({
        title: '请先定位或选择位置',
        icon: 'none'
      });
      return;
    }
    wx.openLocation({
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      name: location.name || '当前位置',
      address: location.address || '当前选择的位置',
      scale: 18,
      fail() {
        wx.showToast({
          title: '打开地图失败',
          icon: 'none'
        });
      }
    });
  },
  getCenterLocation() {
    if (!this.mapCtx) {
      return;
    }
    this.mapCtx.getCenterLocation({
      success: (res) => {
        this.setData({
          mapCenterText: '地图中心：' + formatCoordinate(res.latitude) + ', ' + formatCoordinate(res.longitude)
        });
      }
    });
  },
  getRegion() {
    if (!this.mapCtx) {
      return;
    }
    this.mapCtx.getRegion({
      success: (res) => {
        const southwest = res.southwest || {};
        const northeast = res.northeast || {};
        this.setData({
          mapRegionText: '西南 ' + formatCoordinate(southwest.latitude) + ', ' + formatCoordinate(southwest.longitude) +
            ' / 东北 ' + formatCoordinate(northeast.latitude) + ', ' + formatCoordinate(northeast.longitude)
        });
      }
    });
  },
  getScale() {
    if (!this.mapCtx) {
      return;
    }
    this.mapCtx.getScale({
      success: (res) => {
        this.setData({
          mapScale: res.scale
        });
      }
    });
  },
  openSelectedPlaceDetail() {
    const place = this.data.selectedPlace;
    if (!place) {
      return;
    }
    wx.navigateTo({
      url: '/pages/placeDetail/placeDetail?id=' + place.id
    });
  },
  openSelectedPlacePanorama() {
    const place = this.data.selectedPlace;
    if (!place) {
      wx.showToast({
        title: '请先选择地点',
        icon: 'none'
      });
      return;
    }
    wx.showToast({
      title: '实景参考请在详情页查看',
      icon: 'none'
    });
    wx.navigateTo({
      url: '/pages/placeDetail/placeDetail?id=' + place.id + '&view=panorama'
    });
  },
  openCoordinateReview(event) {
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    const place = this.data.places.find((item) => Number(item.id) === Number(dataset.id));
    if (!place) {
      wx.showToast({
        title: '点位不存在',
        icon: 'none'
      });
      return;
    }
    const review = coordinateReviewStore.getReview(place.id);
    wx.showModal({
      title: '校准备注',
      editable: true,
      placeholderText: '写清入口、楼栋、门牌、现场方向或坐标依据',
      content: review ? review.note : coordinateReviewStore.buildReviewNoteExample(place),
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        const noteIssues = coordinateReviewStore.validateReviewNote(res.content);
        if (noteIssues.length) {
          wx.showToast({
            title: noteIssues[0],
            icon: 'none'
          });
          return;
        }
        if (!coordinateReviewStore.saveReview(place.id, res.content)) {
          wx.showToast({
            title: '请输入校准备注',
            icon: 'none'
          });
          return;
        }
        wx.showToast({
          title: '已保存校准备注',
          icon: 'success'
        });
        this.refreshCoordinateReviewState(place.id);
        if (this.data.coordinateReviewReturnTarget && Number(this.data.coordinateReviewReturnTarget.placeId) === Number(place.id)) {
          this.setData({
            showCoordinateReviewReturn: true,
            mapCenterText: buildOperationsSavedCopy(this.data.coordinateReviewReturnTarget.source)
          });
        }
      }
    });
  },
  refreshCoordinateReviewState(placeId) {
    const coordinateReviews = coordinateReviewStore.getAllReviews();
    const selectedPlace = this.data.selectedPlace && Number(this.data.selectedPlace.id) === Number(placeId)
      ? decoratePlaceWithCoordinateReview(this.data.selectedPlace, coordinateReviews)
      : this.data.selectedPlace;
    this.setData({
      selectedPlace
    });
    this.applyFilter(this.data.currentType, this.data.keyword);
  },
  focusCoordinateTarget(target) {
    const placeId = Number(target && (target.placeId || target.id));
    const place = this.data.places.find((item) => Number(item.id) === placeId);
    if (!place) {
      wx.showToast({
        title: '校准点位不存在',
        icon: 'none'
      });
      return;
    }
    const coordinateReviews = coordinateReviewStore.getAllReviews();
    this.setData({
      reviewOnly: true,
      currentType: '全部',
      selectedPlace: decoratePlaceWithCoordinateReview(place, coordinateReviews),
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      scale: 18,
      navigating: false,
      navDestination: null,
      navMarkers: [],
      navPolyline: [],
      coordinateReviewReturnTarget: isOperationsCoordinateSource(target && target.source) ? { placeId, source: target.source } : null,
      coordinateReviewReturnText: buildOperationsReturnText(target && target.source),
      showCoordinateReviewReturn: false,
      mapCenterText: focusCopy.mapCenterText
    });
    this.applyFilter('全部', '', 'review');
    wx.showToast({
      title: focusCopy.toastTitle,
      icon: 'none'
    });
  },
  openOperationsReview() {
    getApp().globalData.operationsReturnHint = buildOperationsReturnHint(this.data.coordinateReviewReturnTarget && this.data.coordinateReviewReturnTarget.source);
    wx.switchTab({
      url: '/pages/operations/operations'
    });
  },
  startSelectedPlaceNavigation() {
    if (!this.data.selectedPlace) {
      wx.showToast({
        title: '请先选择地点',
        icon: 'none'
      });
      return;
    }
    this.startNavigation(this.data.selectedPlace);
  },
  includeAllPoints() {
    if (!this.mapCtx || !this.data.includePoints.length) {
      wx.showToast({
        title: '暂无可展示点位',
        icon: 'none'
      });
      return;
    }
    this.mapCtx.includePoints({
      padding: [70, 70, 70, 70],
      points: this.data.includePoints
    });
  },
  moveToCurrentLocation() {
    if (!this.mapCtx) {
      return;
    }
    this.mapCtx.moveToLocation();
  },
  animateFirstMarker() {
    if (!this.mapCtx || this.data.mapMarkers.length < 2) {
      wx.showToast({
        title: '至少需要两个地点',
        icon: 'none'
      });
      return;
    }
    const first = this.data.mapMarkers[0];
    const target = this.data.mapMarkers[1];
    this.mapCtx.translateMarker({
      markerId: first.id,
      autoRotate: false,
      duration: 1200,
      destination: {
        latitude: target.latitude,
        longitude: target.longitude
      },
      success() {
        wx.showToast({
          title: '标记点已演示移动',
          icon: 'none'
        });
      },
      fail() {
        wx.showToast({
          title: '标记动画失败',
          icon: 'none'
        });
      }
    });
  },
  startNavigation(destination) {
    const destLatitude = destination ? Number(destination.latitude) : NaN;
    const destLongitude = destination ? Number(destination.longitude) : NaN;
    if (!destination || !isFinite(destLatitude) || !isFinite(destLongitude)) {
      wx.showToast({ title: '目的地坐标无效', icon: 'none' });
      return;
    }
    if (!this.data.places.length || !this.mapCtx) {
      this.queueNavigation(destination);
      return;
    }
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const current = locationMapHelper.resolveCampusTestLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          speed: res.speed,
          accuracy: res.accuracy
        });
        this._applyNavigation(current, destination);
      },
      fail: () => {
        // 开发者工具定位失败时，使用学校门口作为模拟位置，便于测试校内导航。
        const mockCurrent = locationMapHelper.CAMPUS_GATE_LOCATION;
        this._applyNavigation(mockCurrent, destination);
        wx.showToast({ title: '已使用模拟位置导航', icon: 'none' });
      }
    });
  },
  _applyNavigation(current, destination) {
    const navState = locationMapHelper.buildNavigationViewportState(current, destination);
    if (!navState.includePoints.length) {
      wx.showToast({ title: '导航坐标无效', icon: 'none' });
      return;
    }
    this.setData({
      currentMapMode: 'standard',
      enableSatellite: navState.enableSatellite,
      scale: navState.scale,
      navigating: true,
      navDestination: destination,
      navCurrentLocation: current,
      navDistance: navState.distanceText,
      navMarkers: navState.markers,
      navPolyline: navState.polyline,
      includePoints: navState.includePoints,
      latitude: navState.latitude,
      longitude: navState.longitude,
      selectedPlace: null,
      polygons: []
    }, () => {
      this.applyFilter(this.data.currentType, this.data.keyword);
      if (this.mapCtx) {
        setTimeout(() => {
          this.mapCtx.includePoints({
            padding: [80, 80, 80, 80],
            points: navState.includePoints
          });
        }, 80);
      }
    });
  },
  cancelNavigation() {
    this.setData({
      navigating: false,
      navDestination: null,
      navDistance: '',
      navMarkers: [],
      navPolyline: [],
      navCurrentLocation: null,
      polygons: []
    });
    this.applyFilter(this.data.currentType, this.data.keyword);
  },
  openNativeNavigation() {
    const dest = this.data.navDestination;
    if (!dest) return;
    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
    if (navigationHelper.isDeveloperTool(systemInfo)) {
      wx.showToast({
        title: '开发者工具不支持微信地图导航，请用真机测试',
        icon: 'none'
      });
      return;
    }
    wx.openLocation({
      latitude: Number(dest.latitude),
      longitude: Number(dest.longitude),
      name: dest.name || '目的地',
      address: dest.address || dest.name || '',
      scale: 18,
      fail() {
        wx.showToast({ title: '原生地图打开失败', icon: 'none' });
      }
    });
  },
  refreshNavigation() {
    if (!this.data.navDestination) return;
    this.startNavigation(this.data.navDestination);
  },
  queueNavigation(destination) {
    this.setData({
      pendingNavigationTarget: destination
    });
    this.consumePendingNavigation();
  },
  consumePendingNavigation() {
    const target = this.data.pendingNavigationTarget;
    if (!target || !this.data.places.length || !this.mapCtx) {
      return;
    }
    this.setData({
      pendingNavigationTarget: null
    });
    this.startNavigation(target);
  },
  getNavigationLayers() {
    if (!this.data.navigating || !this.data.navCurrentLocation || !this.data.navDestination) {
      return {
        markers: [],
        polyline: [],
        includePoints: []
      };
    }
    const navState = locationMapHelper.buildNavigationState(this.data.navCurrentLocation, this.data.navDestination);
    return {
      markers: navState.markers,
      polyline: navState.polyline,
      includePoints: navState.includePoints
    };
  }
});

function formatCoordinate(value) {
  const number = Number(value);
  if (!isFinite(number)) {
    return '--';
  }
  return String(Math.round(number * 1000000) / 1000000);
}

function mergePlacesById(placeList) {
  const map = {};
  return (Array.isArray(placeList) ? placeList : []).filter((item) => {
    const key = String(item && item.id);
    if (!key || map[key]) {
      return false;
    }
    map[key] = true;
    return true;
  });
}

function buildMapZones(placeList) {
  const zones = [
    { type: '教学楼', title: '教学楼群', desc: '格致、博雅、明德、J3/J4、S5' },
    { type: '交通入口', title: '入校交通', desc: '校门、公交接驳、返校定位' },
    { type: '学习场所', title: '学习自习', desc: '图书馆、自习长廊、资料检索' },
    { type: '宿舍楼', title: '住宿片区', desc: '集贤苑、学思苑宿舍楼' },
    { type: '生活场所', title: '生活补给', desc: '食堂、宿舍、快递和便利服务' },
    { type: '办事服务', title: '办事报修', desc: '证明办理、网络后勤报修' },
    { type: '应急服务', title: '安全应急', desc: '身体不适和突发问题支持' }
  ];
  return zones.map((zone) => {
    const count = (placeList || []).filter((item) => item.type === zone.type).length;
    return Object.assign({}, zone, { count });
  }).filter((zone) => zone.count > 0);
}

function buildEmergencyPlaces(placeList) {
  const priorityTypes = ['应急服务', '交通入口', '办事服务'];
  return (Array.isArray(placeList) ? placeList : [])
    .filter((item) => priorityTypes.includes(item.type))
    .slice(0, 4);
}

function buildReviewPlaceCount(placeList) {
  return (Array.isArray(placeList) ? placeList : [])
    .filter((item) => item.coordinateTrust && item.coordinateTrust.level === 'review')
    .length;
}

function buildDirectoryPlaces(placeList, checkedIds, coordinateReviews) {
  return (Array.isArray(placeList) ? placeList : [])
    .map((item) => {
      const checkedIn = checkedIds.has(Number(item.id));
      return Object.assign(decoratePlaceWithCoordinateReview(item, coordinateReviews), {
        checkedIn,
        directoryStatus: getDirectoryStatus(item, checkedIn, coordinateReviews)
      });
    })
    .sort((a, b) => {
      const rankDiff = getCoordinateTrustRank(a) - getCoordinateTrustRank(b);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN');
    })
    .map((item, index) => {
      return Object.assign({}, item, {
        displayIndex: formatDirectoryIndex(index)
      });
    });
}

function formatDirectoryIndex(index) {
  return index < 9 ? '0' + (index + 1) : String(index + 1);
}

function decoratePlaceWithCoordinateReview(place, coordinateReviews) {
  const review = coordinateReviews && coordinateReviews[String(place && place.id)];
  return Object.assign({}, place, {
    coordinateReview: review || null,
    coordinateReviewStatus: review ? review.statusText : ''
  });
}

function getDirectoryStatus(place, checkedIn, coordinateReviews) {
  const review = coordinateReviews && coordinateReviews[String(place && place.id)];
  const trust = place.coordinateTrust || {};
  return review ? review.statusText : (checkedIn ? '已到访' : (trust.reviewText || '待查看'));
}

function isOperationsCoordinateSource(source) {
  return source === 'operations-blocked' || source === 'operations-ready';
}

function buildOperationsFocusCopy(source, placeName) {
  if (source === 'operations-ready') {
    return {
      mapCenterText: '回写复核：' + placeName,
      toastTitle: '已定位可回写点'
    };
  }
  return {
    mapCenterText: '校准目标：' + placeName,
    toastTitle: '已定位待校准点'
  };
}

function buildOperationsSavedCopy(source) {
  if (source === 'operations-ready') {
    return '回写复核已保存，可回运维页复查';
  }
  return '校准已保存，可回运维页复查';
}

function buildOperationsReturnText(source) {
  if (source === 'operations-ready') {
    return '回运维确认回写';
  }
  return '回运维复查';
}

function buildOperationsReturnHint(source) {
  if (source === 'operations-ready') {
    return {
      type: 'ready-writeback',
      message: '已复核可回写点位，可继续复制命令生成 patch'
    };
  }
  return {
    type: 'blocked-calibration',
    message: '已保存校准备注，可继续处理待处理原因'
  };
}

function getCoordinateTrustRank(place) {
  const coordinateTrust = place && place.coordinateTrust ? place.coordinateTrust : {};
  if (coordinateTrust.level === 'review') {
    return 0;
  }
  if (coordinateTrust.label === '高德POI') {
    return 1;
  }
  return 2;
}
