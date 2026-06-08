const storage = require('./storage');
const userManager = require('./userManager');

const COMPLETED_KEY = 'learning-completed';
const PATH_DEFS = [
  {
    id: 'entry',
    title: '小程序入门路径',
    desc: '先把页面结构、样式和列表渲染打牢。',
    stage: 'entry',
    badgeName: '入门路线徽章'
  },
  {
    id: 'common',
    title: '校园工具开发路径',
    desc: '掌握页面跳转、缓存、API 和状态同步。',
    stage: 'common',
    badgeName: '工具开发徽章'
  },
  {
    id: 'advanced',
    title: '项目能力提升路径',
    desc: '理解模块拆分、推荐逻辑和可维护结构。',
    stage: 'advanced',
    badgeName: '项目进阶徽章'
  }
];

function getCurrentUserId() {
  const user = userManager.getUser();
  return user && user.studentId ? user.studentId : '';
}

function getCompletedStore() {
  const completed = storage.get(COMPLETED_KEY, null);
  if (Array.isArray(completed)) {
    return completed;
  }
  return Object.prototype.toString.call(completed) === '[object Object]' ? completed : {};
}

function getCompleted() {
  const userId = getCurrentUserId();
  const store = getCompletedStore();
  if (!userId) {
    return [];
  }
  if (Array.isArray(store)) {
    return store;
  }
  const userCompleted = store[userId];
  return Array.isArray(userCompleted) ? userCompleted : [];
}

function saveCompleted(list) {
  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }
  const store = getCompletedStore();
  const nextStore = Array.isArray(store) ? {} : Object.assign({}, store);
  if (Array.isArray(store) && store.length) {
    nextStore[userId] = store.slice();
  }
  nextStore[userId] = list;
  storage.set(COMPLETED_KEY, nextStore);
  return list;
}

function markCompleted(item) {
  if (!item || !item.id) {
    return getCompleted();
  }
  const list = getCompleted().filter((record) => Number(record.id) !== Number(item.id));
  list.unshift({
    id: Number(item.id),
    title: item.title,
    category: item.category,
    stage: item.stage,
    stageLabel: item.stageLabel,
    time: formatTime()
  });
  return saveCompleted(list);
}

function isCompleted(id) {
  return getCompleted().some((item) => Number(item.id) === Number(id));
}

function annotateStudyList(list) {
  const completedIds = new Set(getCompleted().map((item) => Number(item.id)));
  return (list || []).map((item) => {
    const completed = completedIds.has(Number(item.id));
    return Object.assign({}, item, {
      completed,
      statusText: completed ? '已完成' : '未完成'
    });
  });
}

function getLearningPaths(studyList) {
  const completedIds = new Set(getCompleted().map((item) => Number(item.id)));
  return PATH_DEFS.map((path) => {
    const tasks = (studyList || [])
      .filter((item) => item.stage === path.stage)
      .map((item) => Object.assign({}, item, { completed: completedIds.has(Number(item.id)) }));
    const nextIndex = tasks.findIndex((item) => !item.completed);
    const nextTask = nextIndex >= 0 ? tasks[nextIndex] : null;
    const completedCount = tasks.filter((item) => item.completed).length;
    return Object.assign({}, path, {
      totalCount: tasks.length,
      completedCount,
      percent: tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0,
      nextTask,
      completed: tasks.length > 0 && completedCount >= tasks.length,
      tasks: tasks.map((item) => Object.assign({}, item, {
        statusText: item.completed ? '已完成' : nextTask && Number(nextTask.id) === Number(item.id) ? '下一步' : '未完成'
      }))
    });
  });
}

function getSummary(studyList) {
  const completed = getCompleted();
  const completedIds = new Set(completed.map((item) => Number(item.id)));
  const paths = getLearningPaths(studyList);
  const nextTask = findNextTask(paths);
  const entryPath = paths.find((path) => path.id === 'entry');

  return {
    completedCount: completed.length,
    totalCount: Array.isArray(studyList) ? studyList.length : 0,
    percent: studyList && studyList.length ? Math.round((completedIds.size / studyList.length) * 100) : 0,
    hasEntryBadge: !!entryPath && entryPath.completed,
    paths,
    nextTask,
    recentCompleted: completed.slice(0, 4)
  };
}

function findNextTask(paths) {
  const path = (paths || []).find((item) => item.nextTask);
  return path ? path.nextTask : null;
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
  PATH_DEFS,
  getCompleted,
  markCompleted,
  isCompleted,
  annotateStudyList,
  getLearningPaths,
  getSummary
};
