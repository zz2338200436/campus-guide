const request = require('../../utils/request');
const themeManager = require('../../utils/themeManager');
const userManager = require('../../utils/userManager');
const coordinateReviewStore = require('../../utils/coordinateReviewStore');

Page({
  data: {
    themeClass: '',
    loading: true,
    authorized: false,
    overviewCards: [],
    trafficCards: [],
    serviceQuality: null,
    placeQuality: null,
    coordinateReviewSummary: null,
    coordinateIssueFilterLevel: '',
    coordinateIssueFilterText: '当前查看：全部待处理',
    visibleCoordinateBlockedItems: [],
    hotPlaces: [],
    health: null,
    suggestions: []
  },
  onLoad() {
    this.loadOperationsData();
  },
  onShow() {
    themeManager.applyToPage(this);
    this.loadOperationsData(false).then(() => {
      this.consumeOperationsReturnHint();
    });
  },
  loadOperationsData(showLoading) {
    const user = userManager.getUser();
    if (!user || user.role !== 'admin') {
      this.setData({
        authorized: false,
        loading: false
      });
      wx.showToast({
        title: '仅管理员可访问',
        icon: 'none'
      });
      return Promise.resolve();
    }
    this.setData({
      authorized: true,
      loading: true
    });
    return request.getOperationsData({
      loading: !!showLoading,
      loadingText: '加载运营数据'
    }).then((res) => {
      if (res.code !== 0) {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }
      const data = res.data || {};
      const coordinateReviews = coordinateReviewStore.getAllReviews();
      const coordinateReviewSummary = Object.assign({}, data.coordinateReviewSummary || {});
      const validation = coordinateReviewSummary.validation || {};
      const blockedItems = validation.blockedItems || [];
      const filterState = buildCoordinateIssueFilterState(blockedItems, this.data.coordinateIssueFilterLevel || '');
      coordinateReviewSummary.total = Object.keys(coordinateReviews).length || coordinateReviewSummary.total || 0;
      this.setData({
        overviewCards: data.overviewCards || [],
        trafficCards: data.trafficCards || [],
        serviceQuality: data.serviceQuality || null,
        placeQuality: data.placeQuality || null,
        coordinateReviewSummary,
        coordinateIssueFilterLevel: filterState.level,
        coordinateIssueFilterText: buildCoordinateIssueFilterText(filterState.level, filterState.items.length),
        visibleCoordinateBlockedItems: filterState.items,
        hotPlaces: data.hotPlaces || [],
        health: data.health || null,
        suggestions: data.suggestions || [],
        loading: false
      });
    });
  },
  consumeOperationsReturnHint() {
    const app = getApp();
    const hint = app.globalData.operationsReturnHint;
    if (!hint) {
      return;
    }
    app.globalData.operationsReturnHint = null;
    showOperationsReturnHint(hint, this);
  },
  goUser() {
    wx.switchTab({
      url: '/pages/user/user'
    });
  },
  copyCoordinateReviewChecklist() {
    const summary = this.data.coordinateReviewSummary || {};
    if (!summary.exportText) {
      wx.showToast({
        title: '暂无校准备注',
        icon: 'none'
      });
      return;
    }
    copyTextToClipboard(summary.exportText, '已复制校准清单', () => {
      showCoordinateChecklistGuide(summary.validation || {});
    });
  },
  copyCoordinateRevisionTemplate() {
    const summary = this.data.coordinateReviewSummary || {};
    if (!summary.revisionText) {
      wx.showToast({
        title: '暂无修订模板',
        icon: 'none'
      });
      return;
    }
    if (!hasReadyCoordinateItems(summary.validation || {})) {
      showNoReadyCoordinateItemsToast();
      return;
    }
    copyTextToClipboard(summary.revisionText, '已复制修订模板', () => {
      showCoordinateTemplateSaveHint(summary.validation || {});
    });
  },
  copyCoordinatePlanCommand() {
    copyCoordinatePlanCommandForSummary(this.data.coordinateReviewSummary || {});
  },
  openCoordinateCalibration(event) {
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    const placeId = Number(dataset.id);
    if (!placeId) {
      wx.showToast({
        title: '点位不存在',
        icon: 'none'
      });
      return;
    }
    getApp().globalData.mapFocusTarget = {
      placeId,
      source: dataset.source || 'operations-blocked'
    };
    wx.switchTab({
      url: '/pages/map/map'
    });
  },
  filterCoordinateBlockedItems(event) {
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    const level = dataset.level || '';
    const summary = this.data.coordinateReviewSummary || {};
    const blockedItems = summary.validation && summary.validation.blockedItems ? summary.validation.blockedItems : [];
    const visibleCoordinateBlockedItems = filterCoordinateBlockedItemsByLevel(blockedItems, level);
    this.setData({
      coordinateIssueFilterLevel: level,
      coordinateIssueFilterText: buildCoordinateIssueFilterText(level, visibleCoordinateBlockedItems.length),
      visibleCoordinateBlockedItems
    });
  }
});

function buildCoordinateIssueFilterText(level, count) {
  const suffix = ' · ' + Number(count || 0) + ' 条';
  if (level === 'danger') return '当前查看：坐标问题' + suffix;
  if (level === 'warning') return '当前查看：状态问题' + suffix;
  if (level === 'info') return '当前查看：备注问题' + suffix;
  return '当前查看：全部待处理' + suffix;
}

function filterCoordinateBlockedItemsByLevel(blockedItems, level) {
  const items = blockedItems || [];
  if (!level) {
    return items;
  }
  return items.filter((item) => (item.issueTagItems || []).some((tag) => tag.level === level));
}

function buildCoordinateIssueFilterState(blockedItems, preferredLevel) {
  const items = blockedItems || [];
  const filteredItems = filterCoordinateBlockedItemsByLevel(items, preferredLevel);
  if (preferredLevel && !filteredItems.length && items.length) {
    return {
      level: '',
      items
    };
  }
  return {
    level: preferredLevel,
    items: filteredItems
  };
}

function showOperationsReturnHint(hint, page) {
  const hintText = typeof hint === 'string' ? hint : (hint && hint.message);
  if (hint && hint.type === 'ready-writeback') {
    wx.showModal({
      title: '回写复核完成',
      content: hintText,
      showCancel: true,
      cancelText: '稍后',
      confirmText: '复制命令',
      success(res) {
        if (res.confirm) {
          copyCoordinatePlanCommandForSummary(page.data.coordinateReviewSummary || {});
        }
      }
    });
    return;
  }
  wx.showToast({
    title: hintText,
    icon: 'none'
  });
}

function copyTextToClipboard(text, title, afterCopy) {
  wx.setClipboardData({
    data: text,
    success() {
      wx.showToast({
        title,
        icon: 'success'
      });
      if (typeof afterCopy === 'function') {
        afterCopy();
      }
    }
  });
}

function copyCoordinatePlanCommandForSummary(summary) {
  const validation = summary && summary.validation ? summary.validation : {};
  if (!hasReadyCoordinateItems(validation)) {
    showNoReadyCoordinateItemsToast();
    return;
  }
  copyTextToClipboard(
    buildCoordinatePlanCommandText(),
    '已复制生成命令',
    () => showCoordinatePlanCommandGuide(validation)
  );
}

function hasReadyCoordinateItems(validation) {
  return Number(validation && validation.readyCount || 0) > 0;
}

function showNoReadyCoordinateItemsToast() {
  wx.showToast({
    title: '暂无可回写点位',
    icon: 'none'
  });
}

function buildCoordinateValidationSummary(validation) {
  const readyCount = Number(validation && validation.readyCount || 0);
  const issueCount = Number(validation && validation.issueCount || 0);
  return '当前可回写 ' + readyCount + ' 条，待处理 ' + issueCount + ' 条。';
}

function showCoordinateChecklistGuide(validation) {
  wx.showModal({
    title: '校准清单已复制',
    content: buildCoordinateValidationSummary(validation) + buildCoordinateChecklistNextStep(validation),
    showCancel: false,
    confirmText: '知道了'
  });
}

function buildCoordinateChecklistNextStep(validation) {
  if (Number(validation && validation.issueCount || 0)) {
    return '请优先处理待处理点位，再继续复制模板生成回写内容。';
  }
  return '没有待处理点位，可以继续复制模板生成回写内容。';
}

function showCoordinateTemplateSaveHint(validation) {
  wx.showModal({
    title: '保存模板文件',
    content: buildCoordinateValidationSummary(validation) + buildCoordinateTemplateNextStep(validation),
    showCancel: false,
    confirmText: '知道了'
  });
}

function buildCoordinateTemplateNextStep(validation) {
  return buildPendingPatchScopeNotice(validation) + '请将剪贴板内容保存为 generated\\coordinate-revision-template.txt，然后点击“复制命令”生成回写计划。';
}

function buildPendingPatchScopeNotice(validation) {
  return Number(validation && validation.issueCount || 0) ? '待处理点位不会进入本次 patch，' : '';
}

function showCoordinatePlanCommandGuide(validation) {
  wx.showModal({
    title: '回写命令已复制',
    content: buildCoordinateValidationSummary(validation) + buildPendingPatchScopeNotice(validation) + '请确认模板已保存，再运行命令生成 plan 和 patch，最后查看 patch 里的风险提醒。',
    showCancel: false,
    confirmText: '知道了'
  });
}

function buildCoordinatePlanCommandText() {
  return [
    '# 先将“复制模板”的内容保存为 generated\\coordinate-revision-template.txt',
    'if (!(Test-Path generated\\coordinate-revision-template.txt)) { Write-Error "请先将“复制模板”的内容保存为 generated\\coordinate-revision-template.txt"; exit 1 }',
    'node scripts\\build-coordinate-writeback-plan.js generated\\coordinate-revision-template.txt --output-dir generated',
    'node scripts\\build-coordinate-writeback-patch.js --output-dir generated',
    'Get-Content generated\\place-coordinate-writeback.patch'
  ].join('\n');
}
