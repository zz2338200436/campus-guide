const assert = require('node:assert/strict');

const storageState = {};
global.wx = {
  getStorageSync(key) {
    return storageState[key];
  },
  setStorageSync(key, value) {
    storageState[key] = value;
  },
  removeStorageSync(key) {
    delete storageState[key];
  },
  getStorageInfoSync() {
    return {
      keys: Object.keys(storageState)
    };
  }
};

const userManager = require('../utils/userManager');
const studyData = require('../utils/studyData');
const learningProgressHelper = require('../utils/learningProgressHelper');

function resetState() {
  Object.keys(storageState).forEach((key) => {
    delete storageState[key];
  });
  userManager.logout();
}

function runTest(name, testFn) {
  try {
    testFn();
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

runTest('learning progress keeps completed tasks isolated per user', () => {
  resetState();
  userManager.login({ studentId: '20260001', name: '同学甲' });
  learningProgressHelper.markCompleted(studyData[0]);
  assert.equal(learningProgressHelper.isCompleted(studyData[0].id), true);

  userManager.logout();
  userManager.login({ studentId: '20260002', name: '同学乙' });
  assert.equal(learningProgressHelper.isCompleted(studyData[0].id), false);
  assert.equal(learningProgressHelper.getCompleted().length, 0);
});

runTest('learning progress builds path cards and next task', () => {
  resetState();
  userManager.login({ studentId: '20260001', name: '同学甲' });
  learningProgressHelper.markCompleted(studyData[0]);

  const paths = learningProgressHelper.getLearningPaths(studyData);
  const entryPath = paths.find((item) => item.id === 'entry');

  assert.ok(paths.length >= 3);
  assert.equal(entryPath.title, '小程序入门路径');
  assert.equal(entryPath.completedCount, 1);
  assert.ok(entryPath.nextTask);
  assert.equal(entryPath.tasks[0].statusText, '已完成');
  assert.equal(entryPath.tasks[1].statusText, '下一步');
});

runTest('learning progress annotates study list with task state', () => {
  resetState();
  userManager.login({ studentId: '20260001', name: '同学甲' });
  learningProgressHelper.markCompleted(studyData[0]);

  const annotated = learningProgressHelper.annotateStudyList(studyData.slice(0, 3));

  assert.equal(annotated[0].completed, true);
  assert.equal(annotated[0].statusText, '已完成');
  assert.equal(annotated[1].completed, false);
  assert.equal(annotated[1].statusText, '未完成');
});

runTest('learning progress summary exposes badge and recent completions', () => {
  resetState();
  userManager.login({ studentId: '20260001', name: '同学甲' });
  studyData.filter((item) => item.stage === 'entry').forEach((item) => {
    learningProgressHelper.markCompleted(item);
  });

  const summary = learningProgressHelper.getSummary(studyData);

  assert.equal(summary.completedCount >= 3, true);
  assert.equal(summary.hasEntryBadge, true);
  assert.equal(summary.recentCompleted.length > 0, true);
  assert.equal(summary.nextTask.stage !== 'entry', true);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
