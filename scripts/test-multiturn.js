// 多轮对话上下文消解 + 智能追问验证脚本
// 用法: node scripts/test-multiturn.js

const aiEngine = require('../utils/aiEngine');

function log(turn, q, a, extra) {
  console.log('--- 第' + turn + '轮 ---');
  console.log('问: ' + q);
  console.log('答: ' + a);
  if (extra) console.log('[meta] ' + JSON.stringify(extra));
  console.log('');
}

function run(label, turns) {
  console.log('========== ' + label + ' ==========');
  aiEngine.resetContext();
  var r;
  for (var i = 0; i < turns.length; i++) {
    r = aiEngine.ask(turns[i]);
    log(i+1, turns[i], r.answer, { intent: r._intent, entity: r._entity });
  }
}

// 场景1: 代词指代
run('场景1: 代词指代', [
  '图书馆在哪',
  '怎么去那里',
  '几点关门'
]);

// 场景2: 纯意图补全
run('场景2: 纯意图补全', [
  '食堂有什么好吃的',
  '怎么走',
  '人多吗',
  '还有呢'
]);

// 场景3: 话题切换重置
run('场景3: 话题切换', [
  '图书馆在哪',
  '你好',
  '怎么去那里(应无上下文)'
]);

// 场景4: 追问延续
run('场景4: 追问延续', [
  '快递去哪里取',
  '还有呢',
  '对吗'
]);

// 场景5: 上下文窗口（超过3轮应失效）
run('场景5: 上下文窗口', []);
aiEngine.resetContext();
aiEngine.ask('图书馆在哪');
aiEngine.ask('怎么去那里');
aiEngine.ask('几点关门');
aiEngine.ask('电话');
var r5 = aiEngine.ask('还有呢');
log(4, '第4轮还有呢(应已重置)', r5.answer);

// 场景6: 距离/条件类追问
run('场景6: 条件追问', [
  '图书馆在哪',
  '远不远',
  '人多吗'
]);

// 场景7: 对比类
run('场景7: 对比类', [
  '图书馆在哪',
  '和食堂哪个近'
]);

console.log('\n========== 全部验证完成 ==========');
