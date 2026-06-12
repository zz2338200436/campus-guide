const config = require('./apiConfig');
const { simulate, response } = require('./requestHelpers');

function mock(handler, options) {
  return simulate(handler, options);
}

function http(endpoint, payload, options) {
  const settings = options || {};
  if (config.mode !== 'http') {
    return mock(() => response(5002, 'HTTP mode is not enabled', null), settings);
  }
  return new Promise((resolve) => {
    wx.request({
      url: config.baseUrl + config.apiPrefix + endpoint,
      method: settings.method || 'GET',
      data: payload || {},
      timeout: settings.timeout || config.timeout,
      success(res) {
        resolve(res.data);
      },
      fail() {
        resolve(response(5001, '网络异常', null));
      }
    });
  });
}

module.exports = {
  mock,
  http
};
