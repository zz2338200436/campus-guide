const aiEngine = require('../../utils/aiEngine');
const themeManager = require('../../utils/themeManager');

Page({
  data: {
    themeClass: '',
    messages: [],
    inputText: '',
    quickQuestions: aiEngine.quickQuestions
  },
  onLoad() {
    themeManager.applyToPage(this);
    this.addMessage('assistant', '我是校园助手，可以先帮你找地点、找服务，再把你带到校园圈。');
  },
  handleInput(event) {
    this.setData({
      inputText: event.detail.value
    });
  },
  sendMessage() {
    const text = (this.data.inputText || '').trim();
    if (!text) {
      return;
    }
    this.addMessage('user', text);
    this.setData({
      inputText: ''
    });
    this.addMessage('assistant', aiEngine.ask(text).answer);
  },
  sendQuick(event) {
    const text = event.currentTarget.dataset.question;
    this.addMessage('user', text);
    this.addMessage('assistant', aiEngine.ask(text).answer);
  },
  addMessage(role, content) {
    const messages = this.data.messages.concat({
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      role,
      content
    });
    this.setData({
      messages
    });
  }
});
