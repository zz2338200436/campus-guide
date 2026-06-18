const http = require('node:http');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.XIAOMI_PROXY_PORT || 4318);
const API_URL = 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions';
const MODEL = process.env.XIAOMI_MODEL || 'mimo-v2.5';
const API_KEY = process.env.XIAOMI_API_KEY;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function buildSystemPrompt() {
  return [
    '你是广州应用科技学院肇庆校区的小程序校园助手。',
    '回答要简洁、直接、自然，优先给出地点、服务、路线、公告、校园圈相关建议。',
    '如果问题不明确，先给最可能的路径，不要长篇解释。',
    '不要编造学校没有的信息；不确定时明确说明，并建议用户去地图、服务页或校园圈确认。'
  ].join('');
}

function normalizeMessages(messages, question) {
  const base = Array.isArray(messages) ? messages : [];
  const cleaned = base
    .filter((item) => item && item.role && item.content)
    .slice(-10)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content)
    }));

  if (question) {
    cleaned.push({
      role: 'user',
      content: String(question)
    });
  }

  return [
    {
      role: 'system',
      content: buildSystemPrompt()
    }
  ].concat(cleaned);
}

async function handleChat(body) {
  if (!API_KEY) {
    return {
      code: 5001,
      message: 'XIAOMI_API_KEY 未设置',
      data: null
    };
  }

  const requestBody = {
    model: MODEL,
    temperature: 0.4,
    max_tokens: 600,
    messages: normalizeMessages(body.messages, body.question)
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + API_KEY,
      'Content-Type': 'application/json',
      'X-Client-Request-Id': randomUUID()
    },
    body: JSON.stringify(requestBody)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      code: 5001,
      message: (payload && payload.error && payload.error.message) || '模型请求失败',
      data: null
    };
  }

  const answer = payload &&
    payload.choices &&
    payload.choices[0] &&
    payload.choices[0].message &&
    payload.choices[0].message.content;

  return {
    code: 0,
    message: 'success',
    data: {
      answer: answer || '暂时没有拿到模型回复',
      model: payload.model || MODEL,
      provider: 'xiaomi'
    }
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/api/assistant/health') {
    sendJson(res, 200, {
      code: 0,
      message: 'success',
      data: {
        status: API_KEY ? 'ready' : 'missing-key',
        model: MODEL
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/assistant/chat') {
    try {
      const body = await parseBody(req);
      const result = await handleChat(body || {});
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 200, {
        code: 5001,
        message: error.message || '代理服务异常',
        data: null
      });
    }
    return;
  }

  sendJson(res, 404, {
    code: 404,
    message: 'Not Found',
    data: null
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('[xiaomi-ai-proxy] listening on http://127.0.0.1:' + PORT);
  console.log('[xiaomi-ai-proxy] model = ' + MODEL);
});
