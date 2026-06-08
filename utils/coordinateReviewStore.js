const storage = require('./storage');

const STORAGE_KEY = 'coordinate-review-notes';

function getAllReviews() {
  return storage.get(STORAGE_KEY, {});
}

function getReview(placeId) {
  const id = normalizeId(placeId);
  if (!id) {
    return null;
  }
  return getAllReviews()[id] || null;
}

function saveReview(placeId, note) {
  const id = normalizeId(placeId);
  const text = String(note || '').trim();
  if (!id || !text) {
    return false;
  }
  const reviews = getAllReviews();
  reviews[id] = {
    placeId: Number(id),
    note: text,
    statusText: '已备注',
    updatedAt: Date.now()
  };
  return storage.set(STORAGE_KEY, reviews);
}

function validateReviewNote(note) {
  const text = String(note || '').trim();
  const issues = [];
  if (text.length < 8) {
    issues.push('校准备注过短');
  }
  if (!/(入口|楼栋|门牌|坐标|现场|道路|东侧|西侧|南侧|北侧|附近)/.test(text)) {
    issues.push('校准备注缺少入口、楼栋或坐标依据');
  }
  return issues;
}

function buildReviewNoteExample(place) {
  const name = place && place.name ? String(place.name) : '该点位';
  return '现场确认' + name + '入口在道路东侧，靠近主通道';
}

function normalizeId(placeId) {
  const number = Number(placeId);
  if (!isFinite(number) || number <= 0) {
    return '';
  }
  return String(number);
}

module.exports = {
  getAllReviews,
  getReview,
  saveReview,
  validateReviewNote,
  buildReviewNoteExample
};
