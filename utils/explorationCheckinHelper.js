const storage = require('./storage');
const userManager = require('./userManager');

const CHECKIN_KEY = 'exploration-checkins';
const ROUTE_IDS = [1, 2, 3];

function getCurrentUserId() {
  const user = userManager.getUser();
  return user && user.studentId ? user.studentId : '';
}

function getCheckinStore() {
  const checkins = storage.get(CHECKIN_KEY, null);
  if (Array.isArray(checkins)) {
    return checkins;
  }
  return Object.prototype.toString.call(checkins) === '[object Object]' ? checkins : {};
}

function getCheckins() {
  const userId = getCurrentUserId();
  const store = getCheckinStore();
  if (!userId) {
    return [];
  }
  if (Array.isArray(store)) {
    return store;
  }
  const userCheckins = store[userId];
  return Array.isArray(userCheckins) ? userCheckins : [];
}

function saveCheckins(list) {
  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }
  const store = getCheckinStore();
  const nextStore = Array.isArray(store) ? {} : Object.assign({}, store);
  if (Array.isArray(store) && store.length) {
    nextStore[userId] = store.slice();
  }
  nextStore[userId] = list;
  storage.set(CHECKIN_KEY, nextStore);
  return list;
}

function addCheckin(place) {
  if (!place || !place.id) {
    return getCheckins();
  }
  const list = getCheckins().filter((item) => Number(item.id) !== Number(place.id));
  list.unshift({
    id: Number(place.id),
    name: place.name,
    type: place.type,
    time: formatTime()
  });
  return saveCheckins(list);
}

function hasCheckedIn(placeId) {
  return getCheckins().some((item) => Number(item.id) === Number(placeId));
}

function getSummary(placeList) {
  const list = Array.isArray(placeList) ? placeList : [];
  const checkins = getCheckins();
  const checkedIds = new Set(checkins.map((item) => Number(item.id)));
  const routeCompletedCount = ROUTE_IDS.filter((id) => checkedIds.has(Number(id))).length;
  const nextRoutePlace = getNextRoutePlace(list);

  return {
    completedCount: checkins.length,
    totalCount: list.length,
    routeCompletedCount,
    routeTotalCount: ROUTE_IDS.length,
    routeProgressText: routeCompletedCount + '/' + ROUTE_IDS.length,
    nextRoutePlace,
    hasCampusBadge: routeCompletedCount >= ROUTE_IDS.length
  };
}

function getRouteTasks(placeList) {
  const list = Array.isArray(placeList) ? placeList : [];
  const checkedIds = new Set(getCheckins().map((item) => Number(item.id)));
  const nextId = ROUTE_IDS.find((id) => !checkedIds.has(Number(id)));

  return ROUTE_IDS.map((id, index) => {
    const place = findPlace(list, id);
    const checkedIn = checkedIds.has(Number(id));
    return {
      id: Number(id),
      step: fillZero(index + 1),
      title: place ? place.name : '路线地点',
      desc: place ? place.tagline : '完成这一站后继续下一站',
      bestTime: place ? place.bestTime : '',
      type: place ? place.type : '',
      checkedIn,
      statusText: checkedIn ? '已完成' : Number(id) === Number(nextId) ? '下一站' : '待到访'
    };
  });
}

function getNextRoutePlace(placeList) {
  const list = Array.isArray(placeList) ? placeList : [];
  const checkedIds = new Set(getCheckins().map((item) => Number(item.id)));
  const nextId = ROUTE_IDS.find((id) => !checkedIds.has(Number(id)));
  return nextId ? findPlace(list, nextId) : null;
}

function getCheckinHistory(placeList, limit) {
  const list = Array.isArray(placeList) ? placeList : [];
  const max = typeof limit === 'number' && limit > 0 ? limit : 5;
  return getCheckins().slice(0, max).map((item) => {
    const place = findPlace(list, item.id);
    return {
      id: Number(item.id),
      title: place ? place.name : item.name,
      subtitle: place ? place.tagline : item.type,
      badgeText: place ? place.type : item.type,
      time: item.time
    };
  });
}

function findPlace(placeList, placeId) {
  return placeList.find((item) => Number(item.id) === Number(placeId)) || null;
}

function formatTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = fillZero(date.getMonth() + 1);
  const day = fillZero(date.getDate());
  const hour = fillZero(date.getHours());
  const minute = fillZero(date.getMinutes());
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
}

function fillZero(value) {
  return value < 10 ? '0' + value : String(value);
}

module.exports = {
  ROUTE_IDS,
  getCheckins,
  addCheckin,
  hasCheckedIn,
  getSummary,
  getRouteTasks,
  getNextRoutePlace,
  getCheckinHistory
};
