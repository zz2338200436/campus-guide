const aiService = require('../../utils/aiService');
const aiEngine = require('../../utils/aiEngine');
const themeManager = require('../../utils/themeManager');
const storage = require('../../utils/storage');

// ── 文本后处理 ──
function normalizeAssistantText(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\d+\.\s*/gm, '• ')
    .replace(/^[\s]*[•·]\s*/gm, '• ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// ── 消息历史持久化 key ──
const HISTORY_KEY = 'assistant-messages';
const MAX_STORED_MESSAGES = 20;

Page({
  data: {
    themeClass: '',
    messages: [],          // 当前会话消息列表
    inputText: '',
    quickQuestions: aiService.requestLocal('').answer
      ? require('../../utils/aiEngine').quickQuestions
      : ['图书馆在哪', '食堂有什么好吃的', '怎么报修网络'],
    pending: false,
    canCancel: false,      // 是否可取消（仅云端请求）
    scrollIntoView: '',
    statusText: '已就绪',
    connectionHint: ''     // 连接状态提示
  },

  onLoad() {
    themeManager.applyToPage(this);
    // 恢复上次会话的最后几条消息
    this.restoreHistory();
    // 消息为空时显示欢迎语
    if (this.data.messages.length === 0) {
      this.addMessage('assistant', '我是校园助手，可以帮你找地点、问服务、看校园动态。\n\n试试输入问题，或者点击下方的快捷提问。');
    }
    // 后台检查云端连接状态
    this.checkConnection();
  },

  // ── 恢复/持久化消息历史 ──
  restoreHistory() {
    try {
      var saved = storage.get(HISTORY_KEY, []);
      if (Array.isArray(saved) && saved.length > 0) {
        this.setData({ messages: saved.slice(-MAX_STORED_MESSAGES) });
      }
    } catch (e) {
      // ignore
    }
  },

  persistHistory() {
    try {
      var messages = this.data.messages.slice(-MAX_STORED_MESSAGES);
      storage.set(HISTORY_KEY, messages);
    } catch (e) {
      // ignore
    }
  },

  // ── 检查云端连接状态 ──
  checkConnection() {
    var self = this;
    var strategy = aiService.getStrategy();
    if (strategy !== aiService.STRATEGY.LOCAL_ONLY) {
      aiService.healthCheck().then(function (health) {
        if (health.available) {
          self.setData({ connectionHint: '已连接校园助手服务' });
        } else {
          self.setData({ connectionHint: '使用本地知识库回答' });
        }
      });
    } else {
      self.setData({ connectionHint: '使用本地知识库回答' });
    }
  },

  // ── 输入处理 ──
  handleInput(event) {
    this.setData({ inputText: event.detail.value });
  },

  // ── 发送消息（主入口）──
  sendMessage() {
    var text = (this.data.inputText || '').trim();
    if (!text || this.data.pending) return;
    this.addMessage('user', text);
    this.setData({ inputText: '', pending: true, canCancel: true, statusText: '正在思考...' });
    this.requestReply(text);
  },

  // ── 快捷问题 ──
  sendQuick(event) {
    var text = event.currentTarget.dataset.question;
    if (!text || this.data.pending) return;
    this.addMessage('user', text);
    this.setData({ pending: true, canCancel: true, statusText: '正在思考...' });
    this.requestReply(text);
  },

  // ── 取消请求 ──
  cancelRequest() {
    aiService.cancelActive();
    this.setData({
      pending: false,
      canCancel: false,
      statusText: '已取消'
    });
  },

  // ── 核心：发起 AI 回复请求 ──
  requestReply(text) {
    var self = this;
    var historyMessages = this.data.messages
      .slice(-10)
      .map(function (item) { return { role: item.role, content: item.content }; });

    // 显示策略信息
    var strategy = aiService.getStrategy();
    if (strategy !== aiService.STRATEGY.LOCAL_ONLY) {
      self.setData({ statusText: '正在连接云端...' });
    }

    aiService.chat(text, historyMessages).then(function (result) {
      var answer = normalizeAssistantText(result.answer);
      var providerInfo = result.provider === 'local' ? ' (本地回复)' : '';
      self.addMessage('assistant', answer);
      self.setData({
        pending: false,
        canCancel: false,
        statusText: '已就绪' + providerInfo
      });
    }).catch(function () {
      // aiService 内部已有回退逻辑，这里是最后的兜底
      self.setData({
        pending: false,
        canCancel: false,
        statusText: '已就绪'
      });
      wx.showToast({ title: '回复失败，请重试', icon: 'none' });
    });
  },

  // ── 添加消息到列表 ──
  addMessage(role, content) {
    var id = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    var messages = this.data.messages.concat({ id: id, role: role, content: content });
    this.setData({ messages: messages, scrollIntoView: id });
    // 延迟持久化，避免频繁写入
    this._persistTimer && clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(this.persistHistory.bind(this), 500);
  },

  // ── 清空聊天记录 ──
  clearHistory() {
    var self = this;
    wx.showModal({
      title: '清空聊天',
      content: '确定要清空所有聊天记录吗？',
      success: function (res) {
        if (res.confirm) {
          aiEngine.resetContext();  // 重置多轮对话上下文
          self.setData({ messages: [] });
          storage.set(HISTORY_KEY, []);
          self.addMessage('assistant', '聊天记录已清空。有什么想聊的？');
        }
      }
    });
  }
});
