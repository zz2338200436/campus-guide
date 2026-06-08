const storage = require('./storage');
const userManager = require('./userManager');

const HISTORY_KEY = 'study-history';
const MAX_HISTORY = 20;

function getCurrentUserId() {
  const user = userManager.getUser();
  return user && user.studentId ? user.studentId : '';
}

function getHistoryStore() {
  const history = storage.get(HISTORY_KEY, null);
  if (Array.isArray(history)) {
    return history;
  }
  return Object.prototype.toString.call(history) === '[object Object]' ? history : {};
}

function getHistory() {
  const userId = getCurrentUserId();
  const history = getHistoryStore();
  if (!userId) {
    return [];
  }
  if (Array.isArray(history)) {
    return history;
  }
  const userHistory = history[userId];
  if (Array.isArray(userHistory)) {
    return userHistory;
  }
  return [];
}

function addHistory(item) {
  if (!item || !item.id) {
    return [];
  }
  const history = getHistory().filter((record) => Number(record.id) !== Number(item.id));
  history.unshift({
    id: item.id,
    title: item.title,
    category: item.category,
    time: item.time || formatTime()
  });
  const nextHistory = history.slice(0, MAX_HISTORY);
  saveHistory(nextHistory);
  return nextHistory;
}

function clearHistory() {
  saveHistory([]);
}

function saveHistory(history) {
  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }
  const store = getHistoryStore();
  const nextStore = Array.isArray(store) ? {} : Object.assign({}, store);
  if (Array.isArray(store) && store.length) {
    nextStore[userId] = store.slice();
  }
  nextStore[userId] = history;
  storage.set(HISTORY_KEY, nextStore);
  return history;
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
  getHistory,
  addHistory,
  clearHistory,
  formatTime
};
