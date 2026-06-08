const DEFAULT_DELAY = 220;

function response(code, message, data) {
  return {
    code,
    message,
    data
  };
}

function listResponse(list) {
  return response(0, 'success', {
    list: list,
    total: list.length
  });
}

function simulate(handler, options) {
  const settings = options || {};
  if (settings.loading) {
    wx.showLoading({
      title: settings.loadingText || '加载中',
      mask: true
    });
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      let result;
      try {
        result = handler();
      } catch (error) {
        result = response(5001, '网络异常', null);
      }
      if (settings.loading) {
        wx.hideLoading();
      }
      if (result.code >= 5000 && settings.toastOnError !== false) {
        wx.showToast({
          title: result.message || '请求失败',
          icon: 'none'
        });
      }
      resolve(result);
    }, settings.delay || DEFAULT_DELAY);
  });
}

module.exports = {
  DEFAULT_DELAY,
  response,
  listResponse,
  simulate
};
