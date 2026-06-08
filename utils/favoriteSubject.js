const storage = require('./storage');
const userManager = require('./userManager');

const FAVORITE_KEY = 'favorites';

function getCurrentUserId() {
  const user = userManager.getUser();
  return user && user.studentId ? user.studentId : '';
}

function getFavoriteStore() {
  const favorites = storage.get(FAVORITE_KEY, null);
  if (Array.isArray(favorites)) {
    return favorites;
  }
  return Object.prototype.toString.call(favorites) === '[object Object]' ? favorites : {};
}

function FavoriteSubject() {
  this.observers = {};
}

FavoriteSubject.prototype.getFavorites = function getFavorites() {
  const userId = getCurrentUserId();
  const favorites = getFavoriteStore();
  if (!userId) {
    return [];
  }
  if (Array.isArray(favorites)) {
    return favorites;
  }
  const userFavorites = favorites[userId];
  if (Array.isArray(userFavorites)) {
    return userFavorites;
  }
  return [];
};

FavoriteSubject.prototype.saveFavorites = function saveFavorites(favorites) {
  const userId = getCurrentUserId();
  if (!userId) {
    return favorites;
  }
  const store = getFavoriteStore();
  const nextStore = Array.isArray(store) ? {} : Object.assign({}, store);
  if (Array.isArray(store) && store.length) {
    nextStore[userId] = store.slice();
  }
  nextStore[userId] = favorites;
  storage.set(FAVORITE_KEY, nextStore);
  this.notify(favorites);
  return favorites;
};

FavoriteSubject.prototype.subscribe = function subscribe(name, callback) {
  if (!name || typeof callback !== 'function') {
    return;
  }
  this.observers[name] = callback;
};

FavoriteSubject.prototype.unsubscribe = function unsubscribe(name) {
  delete this.observers[name];
};

FavoriteSubject.prototype.notify = function notify(favorites) {
  Object.keys(this.observers).forEach((name) => {
    this.observers[name](favorites || this.getFavorites());
  });
};

FavoriteSubject.prototype.isFavorite = function isFavorite(type, targetId) {
  return this.getFavorites().some((item) => item.type === type && item.targetId === Number(targetId));
};

FavoriteSubject.prototype.add = function add(payload) {
  const favorites = this.getFavorites();
  const targetId = Number(payload.targetId);
  const exists = favorites.some((item) => item.type === payload.type && item.targetId === targetId);
  if (exists) {
    return {
      code: 3001,
      message: '已收藏',
      data: favorites
    };
  }
  const nextFavorites = [{
    id: Date.now(),
    type: payload.type,
    targetId: targetId,
    title: payload.title,
    summary: payload.summary || '',
    createTime: payload.createTime || new Date().toLocaleString()
  }].concat(favorites);
  this.saveFavorites(nextFavorites);
  return {
    code: 0,
    message: '收藏成功',
    data: nextFavorites
  };
};

FavoriteSubject.prototype.addFavorite = function addFavorite(payload) {
  return this.add(payload);
};

FavoriteSubject.prototype.remove = function remove(type, targetId) {
  const nextFavorites = this.getFavorites().filter((item) => {
    return !(item.type === type && item.targetId === Number(targetId));
  });
  this.saveFavorites(nextFavorites);
  return {
    code: 0,
    message: '已取消收藏',
    data: nextFavorites
  };
};

FavoriteSubject.prototype.removeFavorite = function removeFavorite(type, targetId) {
  return this.remove(type, targetId);
};

FavoriteSubject.prototype.toggle = function toggle(payload) {
  if (this.isFavorite(payload.type, payload.targetId)) {
    return this.remove(payload.type, payload.targetId);
  }
  return this.add(payload);
};

FavoriteSubject.prototype.clear = function clear() {
  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }
  return this.saveFavorites([]);
};

module.exports = new FavoriteSubject();
