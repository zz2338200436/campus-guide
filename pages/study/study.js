const request = require('../../utils/request');
const { filterStudyList } = require('../../utils/contentFilter');
const userManager = require('../../utils/userManager');
const selectors = require('../../utils/flagshipSelectors');
const learningProgressHelper = require('../../utils/learningProgressHelper');

Page({
  data: {
    loading: true,
    currentCategory: '全部',
    currentStage: '全部',
    keyword: '',
    categories: ['全部', '页面结构', '样式设计', '逻辑交互', '小程序API', '设计模式'],
    stageTabs: [
      { label: '全部路径', value: '全部' },
      { label: '入门', value: 'entry' },
      { label: '常用', value: 'common' },
      { label: '进阶', value: 'advanced' }
    ],
    list: [],
    continueStudy: null,
    recommendedList: [],
    nextStudyList: [],
    isLogin: false,
    studySummary: null,
    learningSummary: null,
    learningPaths: [],
    featuredTopics: [],
    stageProgress: []
  },
  onLoad() {
    this.loadList();
  },
  onShow() {
    this.setData({
      isLogin: userManager.isLogin()
    });
    this.syncContinueStudy();
    if (this.data.list.length) {
      this.filterBy(this.data.currentCategory, this.data.keyword);
    }
  },
  loadList() {
    this.setData({ loading: true });
    request.getStudyCenterData({}, { loading: true, loadingText: '加载学习内容' }).then((res) => {
      if (res.code !== 0) {
        wx.showToast({
          title: res.message || '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }
      const data = res.data || {};
      this.allList = data.list || [];
      this.setData({
        featuredTopics: (this.allList || []).filter((item) => item.featured).slice(0, 3),
        learningPaths: data.paths || [],
        learningSummary: data.learningSummary || null
      });
      this.filterBy(this.data.currentCategory, this.data.keyword);
      this.syncContinueStudy();
      this.setData({ loading: false });
    });
  },
  filterBy(category, keyword) {
    const nextKeyword = typeof keyword === 'string' ? keyword : this.data.keyword;
    const list = filterStudyList(this.allList || [], {
      category,
      stage: this.data.currentStage,
      keyword: nextKeyword
    });
    this.setData({
      currentCategory: category,
      keyword: nextKeyword,
      list: learningProgressHelper.annotateStudyList(list)
    });
    this.syncRecommendedList(list);
  },
  selectStage(event) {
    const nextStage = event.currentTarget.dataset.stage;
    this.setData({
      currentStage: nextStage
    });
    this.filterBy(this.data.currentCategory, this.data.keyword);
  },
  selectCategory(event) {
    this.filterBy(event.currentTarget.dataset.category, this.data.keyword);
  },
  handleKeywordInput(event) {
    this.setData({
      keyword: event.detail.value || ''
    });
  },
  submitSearch(event) {
    const keyword = event && event.detail ? event.detail.value : this.data.keyword;
    this.filterBy(this.data.currentCategory, keyword);
  },
  clearSearch() {
    this.filterBy(this.data.currentCategory, '');
  },
  openDetail(event) {
    const detail = event.detail || {};
    const dataset = event.currentTarget ? event.currentTarget.dataset : {};
    const id = detail.id || dataset.id;
    if (!id) {
      wx.showToast({ title: '内容不存在', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/studyDetail/studyDetail?id=' + id
    });
  },
  openHistory() {
    wx.navigateTo({
      url: userManager.isLogin() ? '/pages/studyHistory/studyHistory' : '/pages/user/user'
    });
  },
  openContinueStudy() {
    const continueStudy = this.data.continueStudy;
    if (!continueStudy) {
      return;
    }
    wx.navigateTo({
      url: '/pages/studyDetail/studyDetail?id=' + continueStudy.id
    });
  },
  syncContinueStudy() {
    const sourceList = this.allList || [];
    if (!userManager.isLogin() || !sourceList.length) {
      const studySummary = selectors.getStudyProgressSummary(this.allList || [], [], []);
      this.setData({
        continueStudy: null,
        recommendedList: sourceList.slice(0, 2),
        nextStudyList: (this.allList || []).filter((item) => item.featured).slice(0, 3),
        stageProgress: this.buildStageProgress([], []),
        learningPaths: learningProgressHelper.getLearningPaths(this.allList || []),
        learningSummary: learningProgressHelper.getSummary(this.allList || []),
        studySummary,
        isLogin: userManager.isLogin()
      });
      return;
    }
    request.getStudyHistory({ toastOnError: false }).then((res) => {
      if (res.code !== 0) {
        const studySummary = selectors.getStudyProgressSummary(this.allList || [], [], []);
        this.setData({
          continueStudy: null,
          recommendedList: sourceList.slice(0, 2),
          nextStudyList: (this.allList || []).filter((item) => item.featured).slice(0, 3),
          stageProgress: this.buildStageProgress([], []),
          learningPaths: learningProgressHelper.getLearningPaths(this.allList || []),
          learningSummary: learningProgressHelper.getSummary(this.allList || []),
          studySummary,
          isLogin: userManager.isLogin()
        });
        return;
      }
      const historyList = res.data.list || [];
      const continueStudy = historyList.length
        ? sourceList.find((item) => Number(item.id) === Number(historyList[0].id)) || null
        : null;
      request.getFavorites({ type: 'study' }, { toastOnError: false }).then((favoriteRes) => {
        const favoriteList = favoriteRes.code === 0 ? favoriteRes.data.list || [] : [];
        const studySummary = selectors.getStudyProgressSummary(this.allList || [], historyList, favoriteList);
        const nextStudyList = selectors.getNextStudyRecommendations(
          this.allList || [],
          continueStudy ? continueStudy.id : 0,
          historyList
        );
        this.setData({
          continueStudy,
          studySummary,
          nextStudyList,
          stageProgress: this.buildStageProgress(historyList, favoriteList),
          learningPaths: learningProgressHelper.getLearningPaths(this.allList || []),
          learningSummary: learningProgressHelper.getSummary(this.allList || [])
        });
        this.syncRecommendedList(this.data.list || []);
      });
    });
  },
  buildStageProgress(historyList, favoriteList) {
    const favoriteIds = new Set((favoriteList || []).map((item) => Number(item.targetId || item.id)));
    const viewedIds = new Set((historyList || []).map((item) => Number(item.id)));
    const defs = [
      { value: 'entry', label: '入门' },
      { value: 'common', label: '常用' },
      { value: 'advanced', label: '进阶' }
    ];
    return defs.map((stage) => {
      const items = (this.allList || []).filter((item) => item.stage === stage.value);
      const viewed = items.filter((item) => viewedIds.has(Number(item.id))).length;
      const saved = items.filter((item) => favoriteIds.has(Number(item.id))).length;
      const percent = items.length ? Math.min(100, Math.round((viewed / items.length) * 100)) : 0;
      return {
        value: stage.value,
        label: stage.label,
        total: items.length,
        viewed,
        saved,
        percent
      };
    });
  },
  syncRecommendedList(currentList) {
    const sourceList = currentList && currentList.length ? currentList : this.allList || [];
    const continueStudyId = this.data.continueStudy ? Number(this.data.continueStudy.id) : 0;
    const recommendedList = sourceList
      .filter((item) => Number(item.id) !== continueStudyId)
      .slice(0, 2);
    this.setData({
      recommendedList
    });
  },
  openFeatured(event) {
    this.openDetail(event);
  }
});
