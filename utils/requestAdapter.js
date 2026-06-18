const config = require('./apiConfig');
const { simulate, response } = require('./requestHelpers');

function mock(handler, options) {
  return simulate(handler, options);
}

function http(endpoint, payload, options) {
  const settings = options || {};
  const useAssistantGateway = settings.gateway === 'assistant';
  const baseUrl = useAssistantGateway ? config.assistantBaseUrl : config.baseUrl;
  const apiPrefix = useAssistantGateway ? config.assistantApiPrefix : config.apiPrefix;

  // 统一检查：无论是否为助手网关，非 http 模式都走 mock
  if (config.mode !== 'http') {
    return mock(() => response(5002, 'HTTP mode is not enabled', null), settings);
  }
  return new Promise((resolve) => {
    wx.request({
      url: baseUrl + apiPrefix + endpoint,
      method: settings.method || 'GET',
      data: payload || {},
      timeout: settings.timeout || config.timeout,
      header: settings.header || {},
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
