const userData = require('../userData');
const userManager = require('../userManager');

function login(data) {
  if (!data || !data.studentId) {
    return {
      code: 1001,
      message: '参数错误',
      data: null
    };
  }
  const user = userData.find((item) => item.studentId === data.studentId);
  if (!user) {
    return {
      code: 2002,
      message: '登录信息无效',
      data: null
    };
  }
  userManager.login(user);
  return {
    code: 0,
    message: '登录成功',
    data: user
  };
}

module.exports = {
  login
};
