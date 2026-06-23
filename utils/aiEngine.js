const knowledgeBase = [
  {
    keywords: ['图书馆', '自习', '自习室', '看书', '学习的地方'],
    answer: '可以先打开导览页搜索"图书馆"，再直接导航过去。图书馆在校园地图上有标记，也可以用首页的"推荐下一站"功能找到。晚上想找安静位置，也可以看校园圈里的最近动态了解自习室情况。'
  },
  {
    keywords: ['报修', '网络', 'wifi', '断网', '网速', '上不了网'],
    answer: '去服务页（首页→常用入口→常用服务），找"网络报修"入口，里面有处理步骤和联系方式。也可以通过校园圈发帖求助，通常 IT 支持会在 24 小时内响应。'
  },
  {
    keywords: ['食堂', '吃饭', '餐厅', '午饭', '晚饭', '早餐', '外卖', '吃'],
    answer: '导览页里搜索"食堂"可直接导航。想看同学最近的用餐反馈和菜品推荐，去校园圈的"全部动态"或"集市"板块找找。首页的"今日行动"偶尔也会有食堂相关的信息。'
  },
  {
    keywords: ['二手', '闲置', '卖东西', '买东西', '转让', '出售', '求购'],
    answer: '校园圈里有"集市"板块，点击底部"校园圈"标签 → 顶部切换到"集市"，就能看到二手闲置信息。要发布的话需要先登录，然后点右下角的发帖按钮。'
  },
  {
    keywords: ['宿舍', '寝室', '住宿', '水电', '空调', '热水'],
    answer: '宿舍相关问题可以先去"服务页"查找对应入口（如水电报修、空调服务）。日常报修通过服务页提交，紧急情况可以直接联系宿管。'
  },
  {
    keywords: ['快递', '取快递', '快递点', '驿站', '包裹'],
    answer: '校园快递通常在驿站/快递柜领取。在导览页搜索"快递"或"驿站"可以查看具体位置和导航路线。具体取件码和位置以收到的短信通知为准。'
  },
  {
    keywords: ['教学楼', '教室', '上课', '课表', '考试'],
    answer: '教学楼位置可以通过导览页搜索并导航。课表和考试安排请查看学校教务系统，不在小程序范围内。'
  },
  {
    keywords: ['校车', '公交', '出行', '交通', '怎么去'],
    answer: '可以在"常用入口 → 校园地图"中查看校内外交通路线。导览页支持搜索公交站点和路线规划。'
  },
  {
    keywords: ['社团', '活动', '俱乐部', '招新'],
    answer: '关注校园圈动态和公告页的活动通知，社团招新和活动通常会在这些地方发布。也可以看首页"今日行动"里的推荐活动。'
  },
  {
    keywords: ['选课', '成绩', '学分', '学期'],
    answer: '选课、成绩查询等教务事宜需要在教务处网站或学校教务系统操作，小程序暂不涉及。建议通过学校官网获取准确信息。'
  },
  {
    keywords: ['服务', '办事', '证明', '盖章', '报到', '注册', '材料', '毕业'],
    answer: '日常办事可以在首页→常用入口→常用服务里找到对应流程。包括报到注册、证件办理、证明材料等，每个服务都标了地点和所需材料。'
  },
  {
    keywords: ['地图', '导览', '导航', '路线', '位置', '地点'],
    answer: '点击底部"导览"标签可以查看校园地图。支持搜索教学楼、食堂、宿舍等地点，还能一键导航过去。需要找某个具体地点时直接搜名字就行。'
  }
];

var quickQuestions = [
  '图书馆在哪',
  '食堂有什么好吃的',
  '怎么报修网络',
  '二手信息在哪看',
  '快递去哪里取',
  '今天有什么活动'
];

// ── 多轮对话：上下文消解 ──
// 模块级上下文状态，每次 ask 调用后自动更新
var currentContext = null;
var CONTEXT_MAX_TURNS = 3;  // 上下文窗口：3 轮内有效

// 代词：检测到这些词时尝试替换为上一轮实体
// ── 实体知识图谱（每个实体的详细属性 + 关联）──
var entityKnowledge = {
  '图书馆': {
    category: 'location',
    location: '校园中心区域，靠近教学楼A栋',
    hours: '通常 7:00-22:30，考试周可能延长到 23:00',
    tips: '晚上人较多，建议提前占座；一楼有自助借还机',
    related: ['自习室', '教学楼', '食堂'],
    nearby: ['食堂', '教学楼', '超市']
  },
  '食堂': {
    category: 'dining',
    location: '分南北两区，南区在宿舍楼旁，北区在教学楼附近',
    hours: '早餐 6:30-9:00，午餐 11:00-13:30，晚餐 17:00-19:30',
    tips: '支持校园卡和微信支付；南区二楼有清真窗口',
    related: ['外卖', '超市', '宿舍'],
    nearby: ['超市', '宿舍']
  },
  '快递': {
    category: 'service',
    location: '东门快递驿站 + 各宿舍楼下快递柜',
    hours: '驿站 8:30-21:00；快递柜 24小时可用',
    tips: '取件码会发短信；超过3天未取会退回',
    related: ['宿舍', '外卖'],
    nearby: []
  },
  '宿舍': {
    category: 'living',
    location: '校园西侧生活区',
    hours: '门禁时间 23:00-6:00',
    tips: '每层都有热水间和洗衣房；报修可在服务页提交',
    related: ['食堂', '快递', '水电'],
    nearby: ['食堂', '超市']
  },
  '报修': {
    category: 'service',
    location: '服务页 → 常用服务入口',
    hours: '线上随时可提交，工作日 48小时内响应',
    tips: '紧急情况可直接联系宿管或后勤值班电话',
    related: ['网络', '水电'],
    nearby: []
  },
  '网络': {
    category: 'service',
    location: '全校覆盖 WiFi，账号为学号',
    hours: '7×24 在线，故障联系 IT 支持',
    tips: '连接不上可以尝试重启设备或重新认证；IT 支持电话见服务页',
    related: ['报修', '宿舍'],
    nearby: []
  },
  '二手': {
    category: 'community',
    location: '校园圈 → 集市板块',
    hours: '随时发布/浏览',
    tips: '交易建议线下当面完成，注意验货；贵重物品走平台担保',
    related: ['社团', '活动'],
    nearby: []
  },
  '教学楼': {
    category: 'location',
    location: '校园东部教学区，分为 A/B/C 三栋',
    hours: '6:30-22:00 开放',
    tips: 'A栋有多媒体教室，B栋主要是阶梯教室；课表查询需用教务系统',
    related: ['图书馆', '教室', '选课'],
    nearby: ['图书馆', '食堂']
  },
  '社团': {
    category: 'activity',
    location: '活动中心 / 校园圈公告',
    hours: '招新季集中在 9月和 3月',
    tips: '关注校园圈动态和公众号通知，热门社团名额紧张要早报名',
    related: ['活动', '二手'],
    nearby: []
  }
};

// 默认实体属性兜底
function getEntityInfo(entity) {
  return entityKnowledge[entity] || null;
}

// 代词：检测到这些词时尝试替换为上一轮实体
var PRONOUNS = ['那里', '那儿', '它', '这个', '那个', '这儿', '那边', '这边', '该'];

// ── 追问智能回答（基于实体知识图谱，不再用死模板）──
var LOCATION_HINTS = [
  '{entity}在' + (entityKnowledge['图书馆'] ? entityKnowledge['图书馆'].location : '校园中心区域') + '。打开导览页搜索"{entity}"就能看到具体位置和导航路线。',
  '{entity}的位置可以在导览页里直接搜到，点击就能一键导航过去。',
  '你可以在导览页输入"{entity}"查看地图标记和步行路线。'
];
var TIME_HINTS = [
  '{entity}的开放时间通常是 {hours}。具体以当天公告为准哦。',
  '{entity}一般是 {hours}，考试/假期可能有调整。',
  '关于{entity}的时间：{hours}，建议去之前再确认一下最新通知。'
];
var CONTACT_HINTS = [
  '{entity}的联系方式可以在导览页详情或服务页找到，也可以拨打学校总机转接。',
  '建议在导览页搜索"{entity}"查看联系电话，或通过服务页提交咨询。',
];
var HOWTO_HINTS = [
  '关于{entity}{intent}，你可以这样操作：\n1. 打开对应页面\n2. 找到入口并按提示操作\n3. 遇到问题可以问我',
  '{entity}{intent}的步骤在服务页有详细说明，按流程走就行。需要的话我可以帮你一步步引导。'
];
var DISTANCE_HINTS = [
  '{entity}离教学楼大概走路 5-8 分钟，从宿舍走大约 10 分钟左右。',
  '{entity}位置挺中心的，从大部分地方走过去都不远，建议导航看看具体距离。'
];
var CONDITION_HINTS = [
  '{entity}' + (entityKnowledge['食堂'] ? '平时人还行，饭点（11:30-12:30 / 17:00-18:00）会比较拥挤，建议错峰去。' : '的具体情况你可以到校园圈看看同学们的最新反馈。'),
  '{entity}的情况随时可能变化，推荐看看校园圈里的最近动态了解实时信息。'
];

// ── 意图分类器 ──
function classifyIntent(text) {
  var t = text;
  if (/怎么去|怎么走|导航|路线|在哪/.test(t)) return 'location';
  if (/几点|什么时间|开门|关门|营业|开放|hours|time|什么时候/.test(t)) return 'time';
  if (/电话|联系|号码|contact|怎么联系/.test(t)) return 'contact';
  if (/怎么(做|办|弄|搞)|如何/.test(t) && !(/怎么去|怎么走/.test(t))) return 'howto';
  if (/多远|多近|走多久|距离|far|多长时间|远(不)?远/.test(t)) return 'distance';
  if (/人多吗|排队|拥挤|挤不挤|情况怎么样|怎么样|好不好/.test(t)) return 'condition';
  if (/对(吗|吧)?|是(吗|吗)?|真的(吗)?|确认/.test(t)) return 'confirm';
  if (/还有(呢|吗|没有)|(另外|其他)(呢|吗)/.test(t)) return 'more';
  if (/对比|比较|哪个(更|好|近)|区别/.test(t)) return 'compare';
  // 代词类追问 → 归为 location（最常见场景）
  for (var i = 0; i < PRONOUNS.length; i++) {
    if (t.indexOf(PRONOUNS[i]) >= 0) return 'location';
  }
  return null;
}

// 根据意图 + 实体知识生成自然回答
function generateSmartFollowup(entity, intent, rawText) {
  var info = getEntityInfo(entity);
  var e = entity || '这个';

  switch (intent) {
    case 'location':
      if (info && info.location) {
        return e + '在' + info.location + '。\n\u2192 导览页搜索"' + e + '"可查看详细地图和导航路线。';
      }
      var pool = LOCATION_HINTS[Math.floor(Math.random() * LOCATION_HINTS.length)];
      return pool.replace(/\{entity\}/g, e).replace(/\{hours\}/g, '');

    case 'time':
      if (info && info.hours) {
        var tp = TIME_HINTS[Math.floor(Math.random() * TIME_HINTS.length)];
        return tp.replace(/\{entity\}/g, e).replace(/\{hours\}/g, info.hours);
      }
      return e + '的具体开放时间建议查看学校通知或导览页详情。';

    case 'contact':
      if (info && info.category === 'service') {
        return e + '的相关联系方式可在服务页找到。也可以打学校总机咨询。';
      }
      var cp = CONTACT_HINTS[Math.floor(Math.random() * CONTACT_HINTS.length)];
      return cp.replace(/\{entity\}/g, e);

    case 'howto':
      var hp = HOWTO_HINTS[Math.floor(Math.random() * HOWTO_HINTS.length)];
      return hp.replace(/\{entity\}/g, e).replace(/\{intent\}/g, rawText);

    case 'distance':
      if (info && info.category === 'location') {
        var dp = DISTANCE_HINTS[Math.floor(Math.random() * DISTANCE_HINTS.length)];
        return dp.replace(/\{entity\}/g, e);
      }
      return e + '的距离可以在导览页查看，输入名字后能看到路线和预计时间。';

    case 'condition':
      if (info) {
        var condPool = CONDITION_HINTS.filter(function(h){return h.indexOf('{entity}') >= 0;});
        if (condPool.length > 0) {
          return condPool[0].replace(/\{entity\}/g, e);
        }
        return e + '的情况可以去校园圈看看同学们的最新反馈，那里有实时信息。'
      }
      return '建议去校园圈搜一下"' + e + '"看看大家的评价和经验分享。';

    case 'confirm':
      return '\u2713 是的呢！刚才说的就是关于' + e + '的信息。还有什么想了解的？\n\n你可以继续问：怎么去、开放时间、联系电话。';

    case 'more':
      var extras = [];
      if (info) {
        if (info.tips) extras.push('\uD83D\uDCA1 小贴士：' + info.tips);
        if (info.related && info.related.length > 0) {
          extras.push('\uD83D\uDCCD 相关：' + info.related.slice(0, 3).join('、'));
        }
      }
      if (extras.length > 0) {
        return '关于' + e + '，还有这些信息：\n\n' + extras.join('\n\n') + '\n\n还可以问：怎么去、开放时间、联系电话。';
      }
      return '关于' + e + '，你还可以问我：开放时间、怎么去、联系电话、附近有什么。';

    case 'compare':
      return '目前我暂时无法做详细对比，但你可以分别搜索这两个地点，在导览页查看它们的位置和详情来做决定。';

    default:
      // 代词兜底
      return '关于' + e + '，你还可以问我：怎么去、开放时间、联系电话、附近有什么。';
  }
}

// 检测是否是追问（代词或纯意图词）
function isFollowUp(text) {
  if (!text) return false;
  // 代词直接命中
  for (var i = 0; i < PRONOUNS.length; i++) {
    if (text.indexOf(PRONOUNS[i]) >= 0) return true;
  }
  // 意图分类器能识别的追问
  var intent = classifyIntent(text);
  return intent !== null;
}

// 上下文消解：把代词替换为实体，或补全缺实体的意图
function resolveContext(text, context) {
  if (!context || !context.lastEntity) return text;

  var resolved = text;
  // 代词替换
  for (var i = 0; i < PRONOUNS.length; i++) {
    if (resolved.indexOf(PRONOUNS[i]) >= 0) {
      resolved = resolved.split(PRONOUNS[i]).join(context.lastEntity);
      return resolved;
    }
  }
  return resolved;
}

// 从命中的知识库条目提取核心实体（取第一个关键词）
function extractEntity(matched) {
  if (matched && matched.keywords && matched.keywords.length > 0) {
    return matched.keywords[0];
  }
  return null;
}

// 重置上下文（清空聊天记录或切换话题时调用）
function resetContext() {
  currentContext = null;
}

// ── 基础对话模板 ──
var conversations = {
  greet: {
    patterns: ['你好', 'hi', 'hello', '嗨', '哈喽', '在吗', '在不在', '有人吗'],
    answers: [
      '你好！我是校园助手，可以帮你找地点、查服务、了解校园资讯。试试问我"图书馆在哪"或者"怎么报修网络"吧。',
      '嗨！有什么校园问题我可以帮你的？地点导航、办事指南、校园动态都可以问我。',
      'Hi！需要帮你找点什么吗？比如"食堂在哪里"、"快递怎么取"这种问题我都能回答。'
    ]
  },
  who: {
    patterns: ['你是谁', '你是什么', '你的名字', '介绍一下', '介绍自己'],
    answers: [
      '我是校园助手小程，专门帮你解决校园生活里的各种问题——查地点、找服务入口、看办事流程都能问我。',
      '我是这个小程序的智能助手，可以帮你找校园地点、查办事指南、推荐服务入口。有什么需要帮忙的？'
    ]
  },
  thanks: {
    patterns: ['谢谢', '感谢', '多谢', 'thanks', 'thank', '辛苦了'],
    answers: [
      '不客气！还有什么需要帮忙的吗？',
      '随时问我，不用客气！',
      '能帮上忙就好，有需要再找我。'
    ]
  },
  bye: {
    patterns: ['再见', '拜拜', 'bye', '回头见', '下次', '走了'],
    answers: [
      '再见！有问题随时回来找我。',
      '拜拜，校园助手随时在线等你。'
    ]
  },
  help: {
    patterns: ['帮助', 'help', '你能做什么', '你会什么', '功能', '知识点', '知识', '你知道什么', '你懂什么', '你了解什么'],
    answers: [
      '我可以帮你的有：\n\n\u278A 地点导航 — 查教学楼、食堂、图书馆等位置\n\u278B 办事指南 — 报修、办证、报到等服务流程\n\u278C 校园动态 — 了解活动、二手交易等信息\n\n直接问我问题就行，比如"图书馆在哪"、"怎么报修网络"。'
    ]
  },
  praise: {
    patterns: ['很棒', '厉害', '聪明', '不错', '好用', 'good', 'nice'],
    answers: [
      '谢谢夸奖！有校园问题随时问我。',
      '能帮到你我就开心，还有什么要问的吗？'
    ]
  }
};

// ── 匹配对话模板 ──
function matchConversation(text) {
  for (var key in conversations) {
    var item = conversations[key];
    for (var i = 0; i < item.patterns.length; i++) {
      if (text === item.patterns[i] || text.indexOf(item.patterns[i]) === 0) {
        var pool = item.answers;
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }
  }
  return null;
}

function ask(question) {
  var text = String(question || '').trim();
  if (!text) {
    return {
      answer: '我是校园助手，可以帮你找地点、找服务入口、了解校园资讯。直接问我吧 — 比如"图书馆在哪"、"食堂有什么"、"怎么发二手"。'
    };
  }

  // 上下文过期清理：超过窗口则重置
  if (currentContext && currentContext.turnCount > CONTEXT_MAX_TURNS) {
    currentContext = null;
  }

  // 1. 对话模板匹配（用原文，问候/感谢等独立于上下文）
  var convReply = matchConversation(text);
  if (convReply) {
    currentContext = null;  // 切换到闲聊，重置上下文
    return { answer: convReply };
  }

  // 2. 追问延续（优先于知识库，避免被泛答案拦截）
  // 仅当有上下文 + 检测到追问（代词或纯意图词）时触发
  if (currentContext && currentContext.lastEntity && isFollowUp(text)) {
    var intent = classifyIntent(text);
    // 延续上下文，不更新实体
    currentContext.turnCount = (currentContext.turnCount || 0) + 1;
    return {
      answer: generateSmartFollowup(currentContext.lastEntity, intent, text),
      _intent: intent,
      _entity: currentContext.lastEntity
    };
  }

  // 3. 知识库关键词匹配（用原文，命中则更新上下文）
  var matched = knowledgeBase.find(function (item) {
    return item.keywords.some(function (keyword) {
      return text.indexOf(keyword) >= 0;
    });
  });
  if (matched) {
    var entity = extractEntity(matched);
    currentContext = {
      lastEntity: entity,
      lastKeywords: matched.keywords,
      turnCount: (currentContext && currentContext.turnCount || 0) + 1
    };
    // 基础回答 + 实体知识增强（如果有图谱数据就追加提示）
    var baseAnswer = matched.answer;
    var info = getEntityInfo(entity);
    if (info && info.tips) {
      baseAnswer += '\n\n\uD83D\uDD39 ' + info.tips;
    }
    // 首次命中时追加引导
    if (currentContext.turnCount === 1) {
      baseAnswer += '\n\n还可以问我：怎么去、开放时间、联系电话、附近有什么。';
    }
    return { answer: baseAnswer, _intent: 'kb-match', _entity: entity };
  }

  // 4. 智能路由：根据问题内容推断入口
  var hints = [];
  if (text.indexOf('在哪') >= 0 || text.indexOf('怎么去') >= 0 || text.indexOf('位置') >= 0 || text.indexOf('导航') >= 0 || text.indexOf('找') >= 0) {
    hints.push('\u2192 导览页查看校园地图和导航');
  }
  if (text.indexOf('怎么') >= 0 || text.indexOf('如何') >= 0 || text.indexOf('帮助') >= 0 || text.indexOf('处理') >= 0) {
    hints.push('\u2192 服务页查找办事入口');
  }
  if (text.indexOf('二手') >= 0 || text.indexOf('买') >= 0 || text.indexOf('卖') >= 0 || text.indexOf('交流') >= 0 || text.indexOf('聊天') >= 0) {
    hints.push('\u2192 校园圈查看动态和集市');
  }
  if (text.indexOf('通知') >= 0 || text.indexOf('公告') >= 0 || text.indexOf('活动') >= 0 || text.indexOf('放假') >= 0) {
    hints.push('\u2192 公告页查看最新通知');
  }

  if (hints.length > 0) {
    currentContext = null;  // 切换到路由引导，重置上下文
    return {
      answer: '我建议你试试这些路径：\n' + hints.join('\n') + '\n\n如果还是找不到，去校园圈问问同学也是个好办法。'
    };
  }

  // 5. 模糊匹配兜底
  currentContext = null;  // 兜底也重置，避免错误延续
  return {
    answer: '抱歉，暂时没有直接的答案。换个问法试试？\n\n或者你可以：\n\u2192 去导览页搜索地点\n\u2192 去服务页查办事流程\n\u2192 去校园圈发帖问同学\n\n也可以试试下面的快捷提问：'
  };
}

function sanitizeAnswer(answer) {
  return String(answer || '')
    .replace(/\*\*/g, '')
    .replace(/^\s*\d+\.\s*/gm, '\u2022 ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

module.exports = {
  ask: ask,
  sanitizeAnswer: sanitizeAnswer,
  quickQuestions: quickQuestions,
  resetContext: resetContext
};
