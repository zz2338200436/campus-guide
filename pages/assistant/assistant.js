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

// ── 时间格式化 ──
function formatTime(date) {
  var now = new Date();
  var d = new Date(date);
  var hours = d.getHours();
  var minutes = d.getMinutes();
  var hh = hours < 10 ? '0' + hours : '' + hours;
  var mm = minutes < 10 ? '0' + minutes : '' + minutes;

  // 同一天 → 只显示时间
  if (d.toDateString() === now.toDateString()) {
    return hh + ':' + mm;
  }
  // 昨天
  var yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + hh + ':' + mm;
  }
  // 更早 → 显示日期+时间
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hh + ':' + mm;
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
    connectionHint: '',    // 连接状态提示
    // ── 思考与打字机 ──
    streamingContent: '',   // 打字机输出中的内容
    streamingDone: false    // 打字机是否完成
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
    this.setData({ inputText: '', pending: true, canCancel: true });
    this.requestReply(text);
  },

  // ── 快捷问题 ──
  sendQuick(event) {
    var text = event.currentTarget.dataset.question;
    if (!text || this.data.pending) return;
    this.addMessage('user', text);
    this.setData({ pending: true, canCancel: true });
    this.requestReply(text);
  },

  // ── 取消请求 ──
  cancelRequest() {
    aiService.cancelActive();
    this._clearAllTimers();
    this.setData({
      pending: false,
      canCancel: false,
      statusText: '已取消',
      streamingContent: '',
      streamingDone: false
    });
  },

  // ── 清理所有定时器 ──
  _clearAllTimers() {
    if (this._typewriterTimer) { clearInterval(this._typewriterTimer); this._typewriterTimer = null; }
    if (this._scrollTimer) { clearInterval(this._scrollTimer); this._scrollTimer = null; }
  },

  // ── 核心：发起 AI 回复请求（直接打字机效果）──
  requestReply(text) {
    var self = this;

    // 显示"思考中"状态
    self.setData({ streamingContent: '', streamingDone: false });

    // 准备历史消息
    var historyMessages = self.data.messages
      .filter(function (item) { return !item.pending; })
      .slice(-10)
      .map(function (item) { return { role: item.role, content: item.content }; });

    // 发起 AI 请求，完成后直接开始打字机
    aiService.chat(text, historyMessages).then(function (result) {
      var answer = normalizeAssistantText(result.answer);
      self._startTypewriter(answer, function () {
        var providerInfo = result.provider === 'local' ? ' (本地回复)' : '';
        self.addMessage('assistant', answer);
        self.setData({
          pending: false, canCancel: false,
          streamingContent: '', streamingDone: false,
          statusText: '已就绪' + providerInfo
        });
      });
    }).catch(function () {
      self._clearAllTimers();
      self.setData({
        pending: false, canCancel: false,
        streamingContent: '', streamingDone: false,
        statusText: '已就绪'
      });
      wx.showToast({ title: '回复失败，请重试', icon: 'none' });
    });
  },

  // ── 打字机效果 ──
  _startTypewriter(fullText, onComplete) {
    var self = this;
    var idx = 0;
    var len = fullText.length;

    // 打字速度：中文字约 40ms/字，英文约 15ms/字，这里统一 30ms
    self._typewriterTimer = setInterval(function () {
      if (idx < len) {
        idx++;
        self.setData({ streamingContent: fullText.slice(0, idx) });
      } else {
        clearInterval(self._typewriterTimer);
        self._typewriterTimer = null;
        // 清除滚动定时器
        if (self._scrollTimer) { clearInterval(self._scrollTimer); self._scrollTimer = null; }
        self.setData({ streamingDone: true });
        // 短暂停顿后回调
        setTimeout(onComplete, 200);
      }
    }, 30);

    // 每 250ms 触发一次滚动到底部
    self._scrollTimer = setInterval(function () {
      self.setData({ scrollIntoView: 'msg_bottom_anchor' });
    }, 250);
  },

  // ── 添加消息到列表 ──
  addMessage(role, content) {
    var id = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    var messages = this.data.messages.concat({
      id: id,
      role: role,
      content: content,
      time: formatTime(Date.now())
    });
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
