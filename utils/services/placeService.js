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
      label: '高德坐标',
      sourceText,
      level: 'stable',
      reviewText: '可直接导航',
      desc: '来自高德地图 POI，与微信地图同为 GCJ-02 坐标系，精度可靠。'
    };
  }
  // OpenStreetMap / 无 coordinateStatus → 诚实标注「未经校准」
  if (place.source === 'OpenStreetMap' || !place.coordinateStatus) {
    return {
      label: '未经校准',
      sourceText,
      level: 'review',
      reviewText: '需现场复核',
      desc: '该坐标来自 OpenStreetMap，尚未经过实地验证。导航时请预留偏差。'
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
