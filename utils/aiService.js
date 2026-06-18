/**
 * aiService.js — 校园助手统一 AI 服务层
 * 
 * 职责：
 * 1. 管理请求策略（本地知识库 / 云端 API / Mock 代理）
 * 2. 提供统一的请求-响应接口
 * 3. 内置超时、取消、回退和错误处理
 * 4. 消息历史管理（上下文窗口控制）
 * 
 * 使用方式：
 *   const aiService = require('../../utils/aiService');
 *   const reply = await aiService.chat(question, historyMessages);
 */

const config = require('./apiConfig');
const aiEngine = require('./aiEngine');

// ── 策略枚举 ──
const STRATEGY = {
  LOCAL_ONLY: 'local_only',       // 仅本地知识库
  CLOUD_FIRST: 'cloud_first',     // 优先云端，失败回退本地
  CLOUD_ONLY: 'cloud_only'        // 仅云端
};

// 当前策略：根据环境自动选择
// 开发环境 + mode=mock → LOCAL_ONLY，开发环境 + mode=http → CLOUD_FIRST
function getStrategy() {
  if (config.mode !== 'http') {
    return STRATEGY.LOCAL_ONLY;
  }
  return STRATEGY.CLOUD_FIRST;
}

// ── 上下文窗口控制 ──
const MAX_HISTORY_COUNT = 8;   // 最多携带最近 8 条消息作为上下文
const MAX_MESSAGE_LENGTH = 200; // 单条消息最长 200 字符

function trimHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(function (item) { return item && item.role && item.content; })
    .slice(-MAX_HISTORY_COUNT)
    .map(function (item) {
      return {
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: String(item.content).slice(0, MAX_MESSAGE_LENGTH)
      };
    });
}

// ── 请求取消能力 ──
var activeRequest = null;  // 当前活跃的请求 task，用于取消

function cancelActive() {
  if (activeRequest) {
    try { activeRequest.abort(); } catch (e) { /* 忽略 */ }
    activeRequest = null;
  }
}

// ── 云端 API 请求 ──
function requestCloud(question, history) {
  return new Promise(function (resolve, reject) {
    var task = wx.request({
      url: config.assistantBaseUrl + config.assistantApiPrefix + '/assistant/chat',
      method: 'POST',
      data: {
        question: question,
        messages: trimHistory(history)
      },
      timeout: 15000, // 15 秒超时
      header: { 'Content-Type': 'application/json' },
      success: function (res) {
        activeRequest = null;
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          var data = res.data;
          if (data.code === 0 && data.data && data.data.answer) {
            resolve({
              answer: data.data.answer,
              provider: data.data.provider || 'cloud',
              model: data.data.model || ''
            });
            return;
          }
        }
        // 非 0 状态码，回退
        reject({ code: 'CLOUD_FAIL', message: '云端服务暂时不可用' });
      },
      fail: function (err) {
        activeRequest = null;
        reject({ code: 'NETWORK_ERROR', message: '网络连接失败', detail: err });
      }
    });
    activeRequest = task;
  });
}

// ── 本地知识库请求（同步，直接返回）──
function requestLocal(question) {
  return {
    answer: aiEngine.ask(question).answer,
    provider: 'local',
    model: 'knowledge-base'
  };
}

// ── 健康检查 ──
function healthCheck() {
  return new Promise(function (resolve) {
    wx.request({
      url: config.assistantBaseUrl + config.assistantApiPrefix + '/assistant/health',
      method: 'GET',
      timeout: 3000,
      success: function (res) {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve({ available: true, status: res.data.data });
        } else {
          resolve({ available: false, status: null });
        }
      },
      fail: function () {
        resolve({ available: false, status: null });
      }
    });
  });
}

// ── 主入口：统一聊天接口 ──
function chat(question, historyMessages) {
  var text = String(question || '').trim();
  if (!text) {
    return Promise.resolve({
      answer: '有什么可以帮你的？试试问我地点、服务或校园问题。',
      provider: 'local'
    });
  }

  var strategy = getStrategy();

  // 仅本地模式：直接返回
  if (strategy === STRATEGY.LOCAL_ONLY) {
    return Promise.resolve(requestLocal(text));
  }

  // 云端优先模式：先尝试验证云端是否可达，再决定策略
  return healthCheck().then(function (health) {
    if (health.available) {
      return requestCloud(text, historyMessages).catch(function () {
        return requestLocal(text);
      });
    }
    return requestLocal(text);
  });
}

// ── 扩展的本地知识库（计划集成更多校园数据）──
function enrichKnowledgeBase(question, context) {
  // 未来可扩展：接入更多本地数据源
  // 例如校园地点数据、服务列表、公告内容等
  return aiEngine.ask(question, context);
}

// ── 导出 ──
module.exports = {
  chat: chat,
  cancelActive: cancelActive,
  healthCheck: healthCheck,
  requestLocal: requestLocal,
  trimHistory: trimHistory,
  getStrategy: getStrategy,
  STRATEGY: STRATEGY
};
