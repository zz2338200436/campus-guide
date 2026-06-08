const prefix = 'campus-guide:';

function getKey(key) {
  return prefix + key;
}

function get(key, defaultValue) {
  try {
    const value = wx.getStorageSync(getKey(key));
    if (value === '' || typeof value === 'undefined') {
      return defaultValue;
    }
    if (Array.isArray(defaultValue) && !Array.isArray(value)) {
      return defaultValue;
    }
    if (isPlainObject(defaultValue) && !isPlainObject(value)) {
      return defaultValue;
    }
    return value;
  } catch (error) {
    return defaultValue;
  }
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function set(key, value) {
  try {
    wx.setStorageSync(getKey(key), value);
    return true;
  } catch (error) {
    return false;
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(getKey(key));
    return true;
  } catch (error) {
    return false;
  }
}

function clear() {
  try {
    const info = wx.getStorageInfoSync();
    info.keys.forEach((key) => {
      if (key.indexOf(prefix) === 0) {
        wx.removeStorageSync(key);
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  get,
  set,
  remove,
  clear
};
