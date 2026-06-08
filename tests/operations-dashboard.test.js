const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const operationsCenter = require('../utils/operationsCenter');
const placeData = require('../utils/placeData');
const serviceData = require('../utils/serviceData');
const noticeData = require('../utils/noticeData');
const studyData = require('../utils/studyData');

const root = path.resolve(__dirname, '..');
const pendingTests = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function clearModule(relativePath) {
  delete require.cache[require.resolve(path.join(root, relativePath))];
}

function loadOperationsPage(mockData) {
  const pagePath = path.join(root, 'pages/operations/operations.js');
  delete require.cache[pagePath];
  ['utils/request', 'utils/userManager', 'utils/coordinateReviewStore'].forEach(clearModule);
  if (mockData) {
    require.cache[require.resolve(path.join(root, 'utils/userManager'))] = {
      exports: { getUser: () => ({ role: 'admin' }) }
    };
    require.cache[require.resolve(path.join(root, 'utils/coordinateReviewStore'))] = {
      exports: { getAllReviews: () => ({ 1: { placeId: 1 } }) }
    };
    require.cache[require.resolve(path.join(root, 'utils/request'))] = {
      exports: { getOperationsData: () => Promise.resolve({ code: 0, data: mockData }) }
    };
  }
  let config = null;
  global.wx = {
    showToast() {},
    setClipboardData(options) {
      if (options && typeof options.success === 'function') options.success();
    },
    showModal() {},
    switchTab() {}
  };
  global.getApp = () => ({ globalData: {} });
  global.Page = (pageConfig) => {
    config = pageConfig;
  };
  require(pagePath);
  delete global.Page;
  return config;
}

function runTest(name, testFn) {
  try {
    const result = testFn();
    if (result && typeof result.then === 'function') {
      pendingTests.push(result.then(() => {
        console.log('PASS', name);
      }).catch((error) => {
        console.error('FAIL', name);
        console.error(error.stack || error.message);
        process.exitCode = 1;
      }));
      return;
    }
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

runTest('operations data exposes enterprise dashboard sections', () => {
  const data = operationsCenter.buildOperationsData({
    places: placeData,
    services: serviceData,
    notices: noticeData,
    studies: studyData,
    checkins: [{ id: 1 }, { id: 2 }, { id: 3 }]
  }, new Date('2026-06-01T00:00:00+08:00'));

  assert.ok(data.trafficCards.some((item) => item.label === '今日访问'));
  assert.ok(data.trafficCards.some((item) => item.label === '服务点击'));
  assert.ok(data.trafficCards.some((item) => item.label === '热门地点'));
  assert.ok(data.trafficCards.some((item) => item.label === '公告阅读'));
  assert.equal(data.serviceQuality.pendingTickets.label, '待处理工单');
  assert.equal(data.serviceQuality.finishedTickets.label, '已完成工单');
  assert.equal(data.serviceQuality.averageResponse.label, '平均响应时间');
  assert.equal(data.serviceQuality.overdueTickets.label, '超时提醒');
  assert.ok(data.placeQuality.sourceCards.some((item) => item.label === '高德POI'));
  assert.ok(data.placeQuality.sourceCards.some((item) => item.label === '手绘待补'));
  assert.ok(data.placeQuality.sourceCards.some((item) => item.label === '待复核'));
  assert.ok(data.hotPlaces.length > 0);
});

runTest('operations page copy presents enterprise operations dashboard', () => {
  const wxml = read('pages/operations/operations.wxml');
  [
    '运营数据看板',
    '今日访问',
    '服务点击',
    '热门地点',
    '公告阅读',
    '服务质量',
    '点位质量',
    '内容健康'
  ].forEach((copy) => assert.ok(wxml.includes(copy), 'operations.wxml should include ' + copy));
});

runTest('operations page presents coordinate reviews as a clear workflow panel', () => {
  const wxml = read('pages/operations/operations.wxml');
  const wxss = read('pages/operations/operations.wxss');
  const js = read('pages/operations/operations.js');

  [
    'coordinate-review-summary',
    'coordinate-review-metrics',
    'coordinate-review-workflow',
    'coordinate-review-ready',
    'coordinate-review-blocked',
    'coordinate-review-blocked__summary',
    'coordinate-review-tags',
    '最近校准备注',
    '待处理原因',
    '可回写',
    '待处理',
    '1 校准',
    '2 模板',
    '3 生成',
    '复制清单',
    '复制模板',
    '复制命令'
  ].forEach((copy) => assert.ok(wxml.includes(copy), 'operations coordinate review panel should include ' + copy));

  assert.ok(wxml.includes('coordinateReviewSummary.validation.readyCount'), 'coordinate panel should show ready count');
  assert.ok(wxml.includes('coordinateReviewSummary.validation.readyItems'), 'coordinate panel should preview ready writeback items');
  assert.ok(wxml.includes('coordinateReviewSummary.validation.readyItemsPreview'), 'coordinate panel should keep ready preview compact');
  assert.ok(wxml.includes('coordinateReviewSummary.validation.readyMoreCount'), 'coordinate panel should show hidden ready item count');
  assert.ok(wxml.includes('coordinate-review-ready__item'), 'ready writeback preview should expose clickable item chips');
  assert.ok(wxml.includes('data-id="{{item.placeId}}"'), 'ready writeback chips should pass the place id');
  assert.ok(wxml.includes('data-source="operations-ready"'), 'ready writeback chips should identify their operations source');
  assert.ok(wxml.includes('coordinateReviewSummary.validation.issueCount'), 'coordinate panel should show blocked count');
  assert.ok(wxml.includes('bindtap="copyCoordinatePlanCommand"'), 'workflow should expose a plan generation command');
  assert.ok(wxml.includes('bindtap="filterCoordinateBlockedItems"'), 'summary tags should filter blocked coordinate rows');
  assert.ok(wxml.includes('data-level="{{item.level}}"'), 'summary tags should pass their issue level');
  assert.ok(wxml.includes('visibleCoordinateBlockedItems'), 'blocked coordinate rows should render the filtered list');
  assert.ok(wxml.includes('coordinateIssueFilterText'), 'blocked coordinate panel should show active filter copy');
  assert.ok(wxml.includes('coordinate-review-blocked__state'), 'active filter copy should use a compact state style');
  assert.ok(wxml.includes('全部 {{coordinateReviewSummary.validation.issueCount}}'), 'blocked coordinate panel should expose a reset filter');
  assert.ok(wxml.includes('bindtap="openCoordinateCalibration"'), 'blocked coordinate rows should jump to map calibration');
  assert.ok(wxml.includes('data-source="operations-blocked"'), 'blocked coordinate rows should identify their operations source');
  assert.ok(wxml.includes('data-id="{{item.placeId}}"'), 'blocked coordinate rows should pass the place id');
  assert.ok(wxml.includes('去校准'), 'blocked coordinate rows should use a short calibration action label');
  assert.ok(wxml.includes('item.issueTagItems'), 'blocked coordinate rows should render structured issue tags');
  assert.ok(wxml.includes('coordinate-review-tag--{{item.level}}'), 'blocked coordinate tags should render color levels');
  assert.ok(wxml.includes('coordinateReviewSummary.validation.issueSummary'), 'blocked coordinate panel should render category summary');
  assert.ok(wxss.includes('.coordinate-review-summary'), 'coordinate review summary should have a dedicated layout');
  assert.ok(wxss.includes('.coordinate-review-metrics'), 'coordinate review metrics should be styled as scan-friendly cells');
  assert.ok(wxss.includes('.coordinate-review-ready'), 'ready coordinate writeback preview should be styled compactly');
  assert.ok(wxss.includes('.coordinate-review-ready__item'), 'ready coordinate chips should have a click affordance');
  assert.ok(wxss.includes('.coordinate-review-workflow'), 'coordinate review workflow should be styled as compact steps');
  assert.ok(wxss.includes('.coordinate-review-blocked'), 'blocked coordinate reasons should have a dedicated compact list');
  assert.ok(wxss.includes('.coordinate-review-blocked__summary'), 'blocked coordinate summary should be styled compactly');
  assert.ok(wxss.includes('.coordinate-review-blocked__state'), 'active coordinate issue filter copy should be styled compactly');
  assert.ok(wxss.includes('.coordinate-review-tag'), 'blocked coordinate reason tags should be styled compactly');
  assert.ok(wxss.includes('.coordinate-review-tag--danger'), 'coordinate issue tags should have a danger color');
  assert.ok(wxss.includes('.coordinate-review-tag--warning'), 'state issue tags should have a warning color');
  assert.ok(wxss.includes('.coordinate-review-tag--info'), 'note issue tags should have an info color');
  assert.ok(wxss.includes('.coordinate-review-tag--active'), 'active coordinate issue filter should have a selected state');
  assert.ok(js.includes('copyCoordinatePlanCommand()'), 'operations page should implement command copy');
  assert.ok(js.includes('filterCoordinateBlockedItems(event)'), 'operations page should implement coordinate issue filtering');
  assert.ok(js.includes('visibleCoordinateBlockedItems'), 'operations page should store filtered blocked rows');
  assert.ok(js.includes('coordinateIssueFilterText'), 'operations page should store the active filter copy');
  assert.ok(js.includes('buildCoordinateIssueFilterText(level, count)'), 'active filter copy should include the filtered count');
  assert.ok(js.includes('coordinate-revision-template.txt'), 'command copy should name the template file to create');
  assert.ok(js.includes('Test-Path generated\\\\coordinate-revision-template.txt'), 'command copy should verify the template file before running scripts');
  assert.ok(js.includes('请先将“复制模板”的内容保存为 generated\\\\coordinate-revision-template.txt'), 'command copy should explain how to fix a missing template');
  assert.ok(js.includes('node scripts\\\\build-coordinate-writeback-plan.js'), 'command copy should include the plan generation command');
  assert.ok(js.includes('--output-dir generated'), 'command copy should explicitly target generated output');
  assert.ok(js.includes('node scripts\\\\build-coordinate-writeback-patch.js --output-dir generated'), 'command copy should include the patch generation output directory');
  assert.ok(js.includes('Get-Content generated\\\\place-coordinate-writeback.patch'), 'command copy should show how to inspect the generated patch');
  assert.ok(js.includes('showCoordinatePlanCommandGuide'), 'command copy should show an in-app guide after copying');
  assert.ok(js.includes('查看 patch 里的风险提醒'), 'command guide should mention reviewing patch risk warnings');
});

runTest('operations page can send blocked coordinate items to map calibration', () => {
  const js = read('pages/operations/operations.js');
  const appJs = read('app.js');

  assert.ok(appJs.includes('mapFocusTarget'), 'app global state should reserve a map focus target');
  assert.ok(appJs.includes('operationsReturnHint'), 'app global state should reserve an operations return hint');
  assert.ok(js.includes('openCoordinateCalibration(event)'), 'operations page should implement blocked-item calibration jump');
  assert.ok(js.includes('consumeOperationsReturnHint()'), 'operations page should consume map return hints on show');
  assert.ok(js.includes('operationsReturnHint = null'), 'operations page should clear consumed return hints');
  assert.ok(js.includes("source: dataset.source || 'operations-blocked'"), 'operations page should preserve ready/blocked navigation source');
  assert.ok(js.includes('getApp().globalData.mapFocusTarget'), 'operations page should store the target for the map tab');
  assert.ok(js.includes("wx.switchTab"), 'operations page should switch to the map tab');
  assert.ok(js.includes("url: '/pages/map/map'"), 'operations page should target the map tab');
});

runTest('operations page consumes map return hints once', () => {
  const page = loadOperationsPage();
  const toastTitles = [];
  const modalContents = [];
  const clipboardValues = [];
  const app = { globalData: { operationsReturnHint: { type: 'ready-writeback', message: '已复核可回写点位，可继续复制命令生成 patch' } } };
  global.getApp = () => app;
  global.wx.showToast = (options) => {
    toastTitles.push(options.title);
  };
  global.wx.showModal = (options) => {
    modalContents.push({ title: options.title, content: options.content, confirmText: options.confirmText, cancelText: options.cancelText, showCancel: options.showCancel });
    if (options.success) {
      options.success({ confirm: true });
    }
  };
  global.wx.setClipboardData = (options) => {
    clipboardValues.push(options.data);
    if (options.success) options.success();
  };
  page.data = {
    coordinateReviewSummary: {
      validation: {
        readyCount: 1,
        issueCount: 0
      }
    }
  };

  page.consumeOperationsReturnHint();
  assert.deepEqual(modalContents, [
    { title: '回写复核完成', content: '已复核可回写点位，可继续复制命令生成 patch', confirmText: '复制命令', cancelText: '稍后', showCancel: true },
    { title: '回写命令已复制', content: '当前可回写 1 条，待处理 0 条。请确认模板已保存，再运行命令生成 plan 和 patch，最后查看 patch 里的风险提醒。', confirmText: '知道了', cancelText: undefined, showCancel: false }
  ]);
  assert.ok(clipboardValues[0].includes('Test-Path generated\\coordinate-revision-template.txt'));
  assert.ok(clipboardValues[0].includes('node scripts\\build-coordinate-writeback-plan.js'));
  assert.ok(toastTitles.includes('已复制生成命令'));
  assert.equal(app.globalData.operationsReturnHint, null);

  page.consumeOperationsReturnHint();
  assert.equal(modalContents.length, 2);
});

runTest('operations return hint confirm reuses guarded command copy flow', () => {
  const page = loadOperationsPage();
  const toastTitles = [];
  const modalContents = [];
  const clipboardValues = [];
  const app = { globalData: { operationsReturnHint: { type: 'ready-writeback', message: '已复核可回写点位，可继续复制命令生成 patch' } } };
  global.getApp = () => app;
  global.wx.showToast = (options) => {
    toastTitles.push(options.title);
  };
  global.wx.showModal = (options) => {
    modalContents.push({ title: options.title, content: options.content, confirmText: options.confirmText });
    if (options.success) {
      options.success({ confirm: true });
    }
  };
  global.wx.setClipboardData = (options) => {
    clipboardValues.push(options.data);
    if (options.success) options.success();
  };

  page.consumeOperationsReturnHint.call({
    data: {
      coordinateReviewSummary: {
        validation: {
          readyCount: 2,
          issueCount: 1
        }
      }
    },
    copyCoordinatePlanCommand: page.copyCoordinatePlanCommand
  });

  assert.equal(clipboardValues.length, 1);
  assert.ok(clipboardValues[0].includes('node scripts\\build-coordinate-writeback-plan.js'));
  assert.ok(toastTitles.includes('已复制生成命令'));
  assert.deepEqual(modalContents, [
    { title: '回写复核完成', content: '已复核可回写点位，可继续复制命令生成 patch', confirmText: '复制命令' },
    { title: '回写命令已复制', content: '当前可回写 2 条，待处理 1 条。待处理点位不会进入本次 patch，请确认模板已保存，再运行命令生成 plan 和 patch，最后查看 patch 里的风险提醒。', confirmText: '知道了' }
  ]);
});

runTest('operations page does not copy command when return hint is dismissed', () => {
  const page = loadOperationsPage();
  const clipboardValues = [];
  const app = { globalData: { operationsReturnHint: { type: 'ready-writeback', message: '已复核可回写点位，可继续复制命令生成 patch' } } };
  global.getApp = () => app;
  global.wx.showModal = (options) => {
    if (options.success) {
      options.success({ confirm: false, cancel: true });
    }
  };
  global.wx.setClipboardData = (options) => {
    clipboardValues.push(options.data);
  };

  page.consumeOperationsReturnHint();
  assert.deepEqual(clipboardValues, []);
  assert.equal(app.globalData.operationsReturnHint, null);
});

runTest('operations page keeps calibration return hints lightweight', () => {
  const page = loadOperationsPage();
  const toastTitles = [];
  const modalContents = [];
  const app = { globalData: { operationsReturnHint: { type: 'blocked-calibration', message: '已保存校准备注，可继续处理待处理原因' } } };
  global.getApp = () => app;
  global.wx.showToast = (options) => {
    toastTitles.push(options.title);
  };
  global.wx.showModal = (options) => {
    modalContents.push(options.content);
  };

  page.consumeOperationsReturnHint();
  assert.deepEqual(toastTitles, ['已保存校准备注，可继续处理待处理原因']);
  assert.deepEqual(modalContents, []);
});

runTest('operations page blocks command copy when no ready coordinate items exist', () => {
  const page = loadOperationsPage();
  const toastTitles = [];
  const clipboardValues = [];
  const modalContents = [];
  global.wx.showToast = (options) => {
    toastTitles.push(options.title);
  };
  global.wx.setClipboardData = (options) => {
    clipboardValues.push(options.data);
  };
  global.wx.showModal = (options) => {
    modalContents.push(options.content);
  };

  page.copyCoordinatePlanCommand.call({
    data: {
      coordinateReviewSummary: {
        validation: {
          readyCount: 0,
          issueCount: 2
        }
      }
    }
  });

  assert.deepEqual(clipboardValues, []);
  assert.deepEqual(modalContents, []);
  assert.deepEqual(toastTitles, ['暂无可回写点位']);
});

runTest('operations page shows ready and blocked counts after copying review checklist', () => {
  const page = loadOperationsPage();
  const clipboardValues = [];
  const toastTitles = [];
  const modalContents = [];
  global.wx.setClipboardData = (options) => {
    clipboardValues.push(options.data);
    if (options.success) options.success();
  };
  global.wx.showToast = (options) => {
    toastTitles.push(options.title);
  };
  global.wx.showModal = (options) => {
    modalContents.push({ title: options.title, content: options.content });
  };

  page.copyCoordinateReviewChecklist.call({
    data: {
      coordinateReviewSummary: {
        exportText: '校准备注清单',
        validation: {
          readyCount: 1,
          issueCount: 3
        }
      }
    }
  });

  assert.deepEqual(clipboardValues, ['校准备注清单']);
  assert.ok(toastTitles.includes('已复制校准清单'));
  assert.deepEqual(modalContents, [{
    title: '校准清单已复制',
    content: '当前可回写 1 条，待处理 3 条。请优先处理待处理点位，再继续复制模板生成回写内容。'
  }]);
});

runTest('operations page guides direct template copy when review checklist has no blocked items', () => {
  const page = loadOperationsPage();
  const modalContents = [];
  global.wx.setClipboardData = (options) => {
    if (options.success) options.success();
  };
  global.wx.showModal = (options) => {
    modalContents.push({ title: options.title, content: options.content });
  };

  page.copyCoordinateReviewChecklist.call({
    data: {
      coordinateReviewSummary: {
        exportText: '校准备注清单',
        validation: {
          readyCount: 2,
          issueCount: 0
        }
      }
    }
  });

  assert.deepEqual(modalContents, [{
    title: '校准清单已复制',
    content: '当前可回写 2 条，待处理 0 条。没有待处理点位，可以继续复制模板生成回写内容。'
  }]);
});

runTest('operations page blocks revision template copy when no ready coordinate items exist', () => {
  const page = loadOperationsPage();
  const toastTitles = [];
  const clipboardValues = [];
  const modalContents = [];
  global.wx.showToast = (options) => {
    toastTitles.push(options.title);
  };
  global.wx.setClipboardData = (options) => {
    clipboardValues.push(options.data);
  };
  global.wx.showModal = (options) => {
    modalContents.push(options.content);
  };

  page.copyCoordinateRevisionTemplate.call({
    data: {
      coordinateReviewSummary: {
        revisionText: 'placeData 坐标修订模板',
        validation: {
          readyCount: 0,
          issueCount: 2
        }
      }
    }
  });

  assert.deepEqual(clipboardValues, []);
  assert.deepEqual(modalContents, []);
  assert.deepEqual(toastTitles, ['暂无可回写点位']);
});

runTest('operations page shows ready and blocked counts after copying revision template', () => {
  const page = loadOperationsPage();
  const clipboardValues = [];
  const toastTitles = [];
  const modalContents = [];
  global.wx.setClipboardData = (options) => {
    clipboardValues.push(options.data);
    if (options.success) options.success();
  };
  global.wx.showToast = (options) => {
    toastTitles.push(options.title);
  };
  global.wx.showModal = (options) => {
    modalContents.push({ title: options.title, content: options.content });
  };

  page.copyCoordinateRevisionTemplate.call({
    data: {
      coordinateReviewSummary: {
        revisionText: 'placeData 坐标修订模板',
        validation: {
          readyCount: 1,
          issueCount: 2
        }
      }
    }
  });

  assert.deepEqual(clipboardValues, ['placeData 坐标修订模板']);
  assert.ok(toastTitles.includes('已复制修订模板'));
  assert.deepEqual(modalContents, [{
    title: '保存模板文件',
    content: '当前可回写 1 条，待处理 2 条。待处理点位不会进入本次 patch，请将剪贴板内容保存为 generated\\coordinate-revision-template.txt，然后点击“复制命令”生成回写计划。'
  }]);
});

runTest('operations page shows ready and blocked counts after copying command', () => {
  const page = loadOperationsPage();
  const clipboardValues = [];
  const toastTitles = [];
  const modalContents = [];
  global.wx.setClipboardData = (options) => {
    clipboardValues.push(options.data);
    if (options.success) options.success();
  };
  global.wx.showToast = (options) => {
    toastTitles.push(options.title);
  };
  global.wx.showModal = (options) => {
    modalContents.push({ title: options.title, content: options.content });
  };

  page.copyCoordinatePlanCommand.call({
    data: {
      coordinateReviewSummary: {
        validation: {
          readyCount: 2,
          issueCount: 1
        }
      }
    }
  });

  assert.equal(clipboardValues.length, 1);
  assert.ok(clipboardValues[0].includes('node scripts\\build-coordinate-writeback-plan.js'));
  assert.ok(toastTitles.includes('已复制生成命令'));
  assert.deepEqual(modalContents, [{
    title: '回写命令已复制',
    content: '当前可回写 2 条，待处理 1 条。待处理点位不会进入本次 patch，请确认模板已保存，再运行命令生成 plan 和 patch，最后查看 patch 里的风险提醒。'
  }]);
});

runTest('operations page filters blocked coordinate items by summary level', () => {
  const page = loadOperationsPage();
  const context = {
    data: {
      coordinateReviewSummary: {
        validation: {
          blockedItems: [
            { placeId: 1, issueTagItems: [{ level: 'danger' }] },
            { placeId: 2, issueTagItems: [{ level: 'info' }] },
            { placeId: 3, issueTagItems: [{ level: 'warning' }, { level: 'info' }] }
          ]
        }
      }
    },
    setData(update) {
      this.data = Object.assign({}, this.data, update);
    }
  };

  page.filterCoordinateBlockedItems.call(context, { currentTarget: { dataset: { level: 'info' } } });
  assert.deepEqual(context.data.visibleCoordinateBlockedItems.map((item) => item.placeId), [2, 3]);
  assert.equal(context.data.coordinateIssueFilterLevel, 'info');
  assert.equal(context.data.coordinateIssueFilterText, '当前查看：备注问题 · 2 条');

  page.filterCoordinateBlockedItems.call(context, { currentTarget: { dataset: { level: '' } } });
  assert.deepEqual(context.data.visibleCoordinateBlockedItems.map((item) => item.placeId), [1, 2, 3]);
  assert.equal(context.data.coordinateIssueFilterLevel, '');
  assert.equal(context.data.coordinateIssueFilterText, '当前查看：全部待处理 · 3 条');
});

runTest('operations page keeps coordinate issue filter after data refresh', async () => {
  const page = loadOperationsPage({
    coordinateReviewSummary: {
      total: 3,
      validation: {
        blockedItems: [
          { placeId: 1, issueTagItems: [{ level: 'danger' }] },
          { placeId: 2, issueTagItems: [{ level: 'info' }] },
          { placeId: 3, issueTagItems: [{ level: 'warning' }, { level: 'info' }] }
        ]
      }
    }
  });
  const context = {
    data: { coordinateIssueFilterLevel: 'info' },
    setData(update) {
      this.data = Object.assign({}, this.data, update);
    }
  };

  await page.loadOperationsData.call(context, false);
  assert.equal(context.data.coordinateIssueFilterLevel, 'info');
  assert.deepEqual(context.data.visibleCoordinateBlockedItems.map((item) => item.placeId), [2, 3]);
  assert.equal(context.data.coordinateIssueFilterText, '当前查看：备注问题 · 2 条');
});

runTest('operations page resets empty coordinate issue filter after data refresh', async () => {
  const page = loadOperationsPage({
    coordinateReviewSummary: {
      total: 2,
      validation: {
        blockedItems: [
          { placeId: 1, issueTagItems: [{ level: 'danger' }] },
          { placeId: 3, issueTagItems: [{ level: 'warning' }] }
        ]
      }
    }
  });
  const context = {
    data: { coordinateIssueFilterLevel: 'info' },
    setData(update) {
      this.data = Object.assign({}, this.data, update);
    }
  };

  await page.loadOperationsData.call(context, false);
  assert.equal(context.data.coordinateIssueFilterLevel, '');
  assert.deepEqual(context.data.visibleCoordinateBlockedItems.map((item) => item.placeId), [1, 3]);
  assert.equal(context.data.coordinateIssueFilterText, '当前查看：全部待处理 · 2 条');
});

Promise.all(pendingTests).then(() => {
  if (process.exitCode) {
    process.exit(process.exitCode);
  }
});
