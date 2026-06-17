const knowledgeBase = [
  {
    keywords: ['图书馆', '自习'],
    answer: '可以先打开导览页搜索图书馆，再直接导航过去。晚上想找安静位置，也可以先看校园圈里的最近动态。'
  },
  {
    keywords: ['报修', '网络'],
    answer: '去服务页的网络报修入口，里面有处理步骤和联系方式。'
  },
  {
    keywords: ['食堂', '吃饭'],
    answer: '导览页里能直接搜索食堂，想看同学最近的用餐反馈，也可以去校园圈看看。'
  },
  {
    keywords: ['二手', '闲置'],
    answer: '校园圈里已经有本地集市入口，适合查看闲置和发布求购。'
  }
];

const quickQuestions = [
  '图书馆在哪',
  '怎么报修网络',
  '食堂怎么找',
  '二手信息在哪看'
];

function ask(question) {
  const text = String(question || '').trim();
  if (!text) {
    return {
      answer: '我是校园助手，可以帮你找地点、找服务入口，也可以把你引到校园圈。'
    };
  }

  const matched = knowledgeBase.find((item) => item.keywords.some((keyword) => text.includes(keyword)));
  if (matched) {
    return {
      answer: matched.answer
    };
  }

  return {
    answer: '这个问题我先帮你走最稳的路径：地点去导览页，办事去服务页，交流和二手去校园圈。'
  };
}

module.exports = {
  ask,
  quickQuestions
};
