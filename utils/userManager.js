const storage = require('./storage');

const USER_KEY = 'current-user';

function UserManager() {
  this.currentUser = null;
}

UserManager.prototype.init = function init() {
  const user = storage.get(USER_KEY, null);
  this.currentUser = user && user.studentId ? user : null;
};

UserManager.prototype.setUser = function setUser(user) {
  this.currentUser = user;
  storage.set(USER_KEY, user);
  return this.currentUser;
};

UserManager.prototype.login = function login(user) {
  return this.setUser(user);
};

UserManager.prototype.getUser = function getUser() {
  return this.currentUser;
};

UserManager.prototype.getUserInfo = function getUserInfo() {
  return this.getUser();
};

UserManager.prototype.isLogin = function isLogin() {
  return !!(this.currentUser && this.currentUser.studentId);
};

UserManager.prototype.isAdmin = function isAdmin() {
  return this.isLogin() && this.currentUser.role === 'admin';
};

UserManager.prototype.logout = function logout() {
  this.currentUser = null;
  storage.remove(USER_KEY);
};

module.exports = new UserManager();
