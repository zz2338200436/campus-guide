const placeData = require('../placeData');

function getPlaceList(params) {
  const type = params && params.type;
  return placeData
    .filter((item) => !type || type === '全部' || item.type === type)
    .map(withCoordinateTrust);
}

function getPlaceDetail(id) {
  const place = placeData.find((item) => item.id === Number(id));
  if (!place) {
    return null;
  }
  return withCoordinateTrust(place);
}

function withCoordinateTrust(place) {
  return Object.assign({}, place, {
    coordinateTrust: buildCoordinateTrust(place)
  });
}

function buildCoordinateTrust(place) {
  const sourceText = place.source || '本地维护';
  if (place.coordinateStatus === 'estimated') {
    return {
      label: '估算坐标',
      sourceText,
      level: 'review',
      reviewText: '需现场复核',
      desc: '该点位由手绘地图换算，入口位置可能存在误差。'
    };
  }
  if (place.coordinateStatus === 'amap') {
    return {
      label: '高德POI',
      sourceText,
      level: place.reviewRequired ? 'review' : 'stable',
      reviewText: place.reviewRequired ? '需现场复核' : '已校准',
      desc: '该点位来自高德 POI，建议结合现场标识确认入口。'
    };
  }
  return {
    label: '已校准',
    sourceText,
    level: place.reviewRequired ? 'review' : 'stable',
    reviewText: place.reviewRequired ? '需现场复核' : '已转换为微信地图坐标',
    desc: '该点位使用正式坐标来源，并已转换为微信地图坐标。'
  };
}

module.exports = {
  getPlaceList,
  getPlaceDetail,
  buildCoordinateTrust
};
