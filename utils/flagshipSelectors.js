function getFeaturedPlaces(list) {
  return (list || []).filter((item) => item.featured).slice(0, 5);
}

function getStudyProgressSummary(studyList, historyList, favoriteList) {
  return {
    viewedCount: (historyList || []).length,
    totalCount: (studyList || []).length,
    savedCount: (favoriteList || []).length
  };
}

function getNextStudyRecommendations(studyList, currentId, historyList) {
  const current = (studyList || []).find((item) => Number(item.id) === Number(currentId));
  const relatedIds = current && Array.isArray(current.relatedIds) ? current.relatedIds.map(Number) : [];
  const historyIds = new Set((historyList || []).map((item) => Number(item.id)));
  const result = [];

  relatedIds.forEach((id) => {
    const match = (studyList || []).find((item) => Number(item.id) === id);
    if (match && Number(match.id) !== Number(currentId)) {
      result.push(match);
    }
  });

  (studyList || []).forEach((item) => {
    if (result.length >= 3) {
      return;
    }
    if (Number(item.id) === Number(currentId)) {
      return;
    }
    const exists = result.some((entry) => Number(entry.id) === Number(item.id));
    if (exists) {
      return;
    }
    if (!historyIds.has(Number(item.id)) || item.featured) {
      result.push(item);
    }
  });

  return result.slice(0, 3);
}

function groupServices(list) {
  const groupMap = {};
  (list || []).forEach((item) => {
    const key = item.group || '其他';
    if (!groupMap[key]) {
      groupMap[key] = [];
    }
    groupMap[key].push(item);
  });

  return Object.keys(groupMap).map((key) => ({
    title: key,
    items: groupMap[key]
  }));
}

module.exports = {
  getFeaturedPlaces,
  getStudyProgressSummary,
  getNextStudyRecommendations,
  groupServices
};
