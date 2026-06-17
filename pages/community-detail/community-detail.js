const communityStore = require('../../utils/communityStore');
const userManager = require('../../utils/userManager');

Page({
  data: {
    post: null,
    comments: [],
    inputValue: '',
    mode: 'comment',
    replyCommentId: '',
    replyToName: '',
    missingState: false
  },
  onLoad(options) {
    this.postId = options.id;
  },
  onShow() {
    this.loadPost();
  },
  loadPost() {
    const post = communityStore.getDisplayPost(this.postId);
    this.setData({
      post,
      comments: post ? post.enrichedComments : [],
      missingState: !post
    });
  },
  handleCommentInput(event) {
    this.setData({
      inputValue: event.detail.value
    });
  },
  handleSubmit() {
    if (this.data.mode === 'reply') {
      this.submitReply();
      return;
    }
    this.submitComment();
  },
  submitComment() {
    if (!userManager.isLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const result = communityStore.addComment(this.postId, (this.data.inputValue || '').trim());
    if (result.code === 0) {
      this.setData({
        inputValue: '',
        mode: 'comment',
        replyCommentId: '',
        replyToName: ''
      });
      this.loadPost();
      return;
    }
    wx.showToast({ title: result.msg, icon: 'none' });
  },
  prepareReply(event) {
    if (!userManager.isLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.setData({
      mode: 'reply',
      replyCommentId: event.currentTarget.dataset.commentId,
      replyToName: event.currentTarget.dataset.replyTo,
      inputValue: ''
    });
  },
  submitReply() {
    const result = communityStore.addReply(
      this.postId,
      this.data.replyCommentId,
      (this.data.inputValue || '').trim(),
      this.data.replyToName
    );
    if (result.code === 0) {
      this.setData({
        inputValue: '',
        mode: 'comment',
        replyCommentId: '',
        replyToName: ''
      });
      this.loadPost();
      return;
    }
    wx.showToast({ title: result.msg, icon: 'none' });
  },
  cancelReply() {
    this.setData({
      mode: 'comment',
      replyCommentId: '',
      replyToName: '',
      inputValue: ''
    });
  }
});
