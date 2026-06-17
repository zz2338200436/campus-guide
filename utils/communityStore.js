const storage = require('./storage');
const userManager = require('./userManager');
const { seededPosts } = require('./communityData');

const MARKETPLACE_STATUSES = ['在售', '可议价', '已预订'];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getCurrentUser() {
  return userManager.getUser() || null;
}

function getUserKey(suffix) {
  const user = getCurrentUser();
  return 'community:' + (user && user.studentId ? user.studentId : 'guest') + ':' + suffix;
}

function getCustomPosts() {
  return storage.get(getUserKey('posts'), []);
}

function setCustomPosts(posts) {
  storage.set(getUserKey('posts'), posts);
}

function getStoredLikes(postId) {
  return storage.get(getUserKey('likes:' + postId), []);
}

function setStoredLikes(postId, likes) {
  storage.set(getUserKey('likes:' + postId), likes);
}

function getStoredComments(postId) {
  return storage.get(getUserKey('comments:' + postId), []);
}

function setStoredComments(postId, comments) {
  storage.set(getUserKey('comments:' + postId), comments);
}

function getStoredReplies(postId) {
  return storage.get(getUserKey('replies:' + postId), {});
}

function setStoredReplies(postId, replies) {
  storage.set(getUserKey('replies:' + postId), replies);
}

function getSeededPost(postId) {
  const match = seededPosts.find((item) => item.id === postId);
  return match ? clone(match) : null;
}

function getSeededPosts() {
  return clone(seededPosts);
}

function buildCustomPost(postData, user) {
  const type = postData.type === 'marketplace' ? 'marketplace' : 'feed';
  return {
    id: 'community_' + Date.now(),
    type,
    author: {
      studentId: user.studentId,
      name: user.name || user.studentId,
      avatar: user.name ? user.name.charAt(0) : '我'
    },
    title: postData.title || '',
    content: postData.content || '',
    images: Array.isArray(postData.images) ? postData.images : [],
    tags: Array.isArray(postData.tags) ? postData.tags : [],
    location: postData.location || '',
    price: type === 'marketplace' ? (postData.price || '') : '',
    status: type === 'marketplace' ? normalizeStatus(postData.status) : '',
    likes: [],
    comments: [],
    createdAt: formatTime(new Date()),
    viewCount: 0
  };
}

function getAllPosts() {
  const posts = getSeededPosts().concat(getCustomPosts());
  return posts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

function getPostsByType(type) {
  if (type === 'feed' || type === 'marketplace') {
    return getAllPosts().filter((item) => item.type === type);
  }
  return getAllPosts();
}

function getPostById(postId) {
  return getAllPosts().find((item) => item.id === postId) || null;
}

function isCustomPost(postId) {
  return getCustomPosts().some((item) => item.id === postId);
}

function getMergedLikes(post) {
  if (!post) {
    return [];
  }
  if (isCustomPost(post.id)) {
    const custom = getCustomPosts().find((item) => item.id === post.id);
    return custom ? custom.likes || [] : [];
  }
  const seeded = getSeededPost(post.id);
  return (seeded ? seeded.likes : []).concat(getStoredLikes(post.id)).filter(uniqueOnly);
}

function getMergedComments(postId) {
  if (isCustomPost(postId)) {
    const custom = getCustomPosts().find((item) => item.id === postId);
    return custom ? clone(custom.comments || []) : [];
  }

  const seeded = getSeededPost(postId);
  if (!seeded) {
    return [];
  }

  const extraComments = getStoredComments(postId);
  const replyBuckets = getStoredReplies(postId);
  const seededComments = (seeded.comments || []).map((comment) => ({
    ...comment,
    replies: (comment.replies || []).concat(replyBuckets[comment.id] || [])
  }));

  return seededComments.concat(extraComments).sort((a, b) => (b.time || '').localeCompare(a.time || ''));
}

function getEnrichedPost(postId) {
  const post = getPostById(postId);
  if (!post) {
    return null;
  }

  return {
    ...post,
    enrichedLikes: getMergedLikes(post),
    enrichedComments: getMergedComments(postId),
    isLikedByMe: getMergedLikes(post).includes(((getCurrentUser() || {}).studentId || ''))
  };
}

function normalizeStatus(status) {
  return MARKETPLACE_STATUSES.includes(status) ? status : '在售';
}

function buildDisplayPost(post) {
  const enriched = getEnrichedPost(post.id);
  const likeCount = enriched.enrichedLikes.length;
  const commentCount = enriched.enrichedComments.length;
  const typeLabel = post.type === 'marketplace' ? '集市' : '动态';

  return {
    ...enriched,
    likeCount,
    commentCount,
    typeLabel,
    priceText: post.type === 'marketplace' ? (post.price || '面议') : '',
    statusText: post.type === 'marketplace' ? normalizeStatus(post.status) : '',
    excerpt: (post.content || '').slice(0, 56)
  };
}

function getDisplayPostsByType(type) {
  return getPostsByType(type).map((post) => buildDisplayPost(post));
}

function getDisplayPost(postId) {
  const post = getPostById(postId);
  return post ? buildDisplayPost(post) : null;
}

function getHotPostSummaries(limit = 3) {
  return getHotPosts().slice(0, limit).map((post) => {
    const display = buildDisplayPost(post);
    return {
      id: display.id,
      type: display.type,
      typeLabel: display.typeLabel,
      title: display.title || display.content,
      excerpt: display.excerpt,
      meta: display.type === 'marketplace'
        ? display.priceText + ' · ' + display.statusText
        : '赞 ' + display.likeCount + ' · 评 ' + display.commentCount
    };
  });
}

function getFeedOverview(currentTab) {
  const allPosts = getAllPosts();
  const defs = [
    { label: '全部', value: 'all' },
    { label: '动态', value: 'feed' },
    { label: '集市', value: 'marketplace' }
  ];
  const tabCounts = defs.map((item) => ({
    ...item,
    count: getPostsByType(item.value).length
  }));

  return {
    currentTab,
    currentTabLabel: (tabCounts.find((item) => item.value === currentTab) || defs[0]).label,
    totalCount: allPosts.length,
    currentCount: getPostsByType(currentTab).length,
    hotCount: getHotPosts().length,
    tabCounts
  };
}

function createPost(postData) {
  const user = getCurrentUser();
  if (!user) {
    return { code: 1001, msg: '请先登录' };
  }

  const type = postData.type === 'marketplace' ? 'marketplace' : 'feed';
  const content = (postData.content || '').trim();
  const price = type === 'marketplace' ? (postData.price || '').trim() : '';

  if (!content) {
    return { code: 1003, msg: '内容不能为空' };
  }
  if (type === 'marketplace' && !price) {
    return { code: 1005, msg: '请填写价格' };
  }

  const customPosts = getCustomPosts();
  const newPost = buildCustomPost({
    ...postData,
    type,
    content,
    price,
    status: normalizeStatus(postData.status)
  }, user);
  customPosts.unshift(newPost);
  setCustomPosts(customPosts);
  return { code: 0, msg: '发布成功', data: newPost };
}

function toggleLike(postId) {
  const user = getCurrentUser();
  if (!user) {
    return { code: 1001, msg: '请先登录' };
  }

  const post = getPostById(postId);
  if (!post) {
    return { code: 1002, msg: '帖子不存在' };
  }

  if (isCustomPost(postId)) {
    const customPosts = getCustomPosts();
    const target = customPosts.find((item) => item.id === postId);
    target.likes = target.likes || [];
    toggleValue(target.likes, user.studentId);
    setCustomPosts(customPosts);
    return { code: 0, msg: '操作成功', data: { postId, likes: target.likes } };
  }

  const likes = getStoredLikes(postId);
  toggleValue(likes, user.studentId);
  setStoredLikes(postId, likes);
  return { code: 0, msg: '操作成功', data: { postId, likes } };
}

function addComment(postId, content) {
  const user = getCurrentUser();
  if (!user) {
    return { code: 1001, msg: '请先登录' };
  }
  if (!content || !content.trim()) {
    return { code: 1003, msg: '评论不能为空' };
  }

  const comment = buildComment(user, content.trim());
  if (isCustomPost(postId)) {
    const customPosts = getCustomPosts();
    const target = customPosts.find((item) => item.id === postId);
    target.comments = target.comments || [];
    target.comments.push(comment);
    setCustomPosts(customPosts);
    return { code: 0, msg: '评论成功', data: comment };
  }

  const comments = getStoredComments(postId);
  comments.push(comment);
  setStoredComments(postId, comments);
  return { code: 0, msg: '评论成功', data: comment };
}

function addReply(postId, commentId, content, replyTo) {
  const user = getCurrentUser();
  if (!user) {
    return { code: 1001, msg: '请先登录' };
  }
  if (!content || !content.trim()) {
    return { code: 1003, msg: '回复不能为空' };
  }

  const reply = buildReply(user, content.trim(), replyTo);
  if (isCustomPost(postId)) {
    const customPosts = getCustomPosts();
    const target = customPosts.find((item) => item.id === postId);
    const comment = (target.comments || []).find((item) => item.id === commentId);
    if (!comment) {
      return { code: 1004, msg: '评论不存在' };
    }
    comment.replies = comment.replies || [];
    comment.replies.push(reply);
    setCustomPosts(customPosts);
    return { code: 0, msg: '回复成功', data: reply };
  }

  const seeded = getSeededPost(postId);
  const storedComments = getStoredComments(postId);
  const extraComment = storedComments.find((item) => item.id === commentId);
  if (extraComment) {
    extraComment.replies = extraComment.replies || [];
    extraComment.replies.push(reply);
    setStoredComments(postId, storedComments);
    return { code: 0, msg: '回复成功', data: reply };
  }

  const seededCommentExists = seeded && (seeded.comments || []).some((item) => item.id === commentId);
  if (!seededCommentExists) {
    return { code: 1004, msg: '评论不存在' };
  }

  const buckets = getStoredReplies(postId);
  buckets[commentId] = (buckets[commentId] || []).concat(reply);
  setStoredReplies(postId, buckets);
  return { code: 0, msg: '回复成功', data: reply };
}

function getHotPosts() {
  return getAllPosts()
    .map((post) => ({
      ...post,
      enrichedLikes: getMergedLikes(post)
    }))
    .sort((a, b) => b.enrichedLikes.length - a.enrichedLikes.length)
    .slice(0, 5);
}

function buildComment(user, content) {
  return {
    id: 'comment_' + Date.now(),
    author: {
      studentId: user.studentId,
      name: user.name || user.studentId,
      avatar: user.name ? user.name.charAt(0) : '我'
    },
    content,
    time: formatTime(new Date()),
    replies: []
  };
}

function buildReply(user, content, replyTo) {
  return {
    author: {
      studentId: user.studentId,
      name: user.name || user.studentId,
      avatar: user.name ? user.name.charAt(0) : '我'
    },
    content,
    time: formatTime(new Date()),
    replyTo: replyTo || ''
  };
}

function toggleValue(list, value) {
  const index = list.indexOf(value);
  if (index >= 0) {
    list.splice(index, 1);
    return;
  }
  list.push(value);
}

function uniqueOnly(value, index, list) {
  return list.indexOf(value) === index;
}

function formatTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
}

module.exports = {
  MARKETPLACE_STATUSES,
  getAllPosts,
  getPostsByType,
  getPostById,
  getEnrichedPost,
  getMergedLikes,
  getMergedComments,
  getDisplayPostsByType,
  getDisplayPost,
  getFeedOverview,
  createPost,
  toggleLike,
  addComment,
  addReply,
  getHotPosts,
  getHotPostSummaries
};
