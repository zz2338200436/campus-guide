const placeData = require('../placeData');
const serviceData = require('../serviceData');
const checkinHelper = require('../explorationCheckinHelper');
const survivalRouteBuilder = require('../survivalRouteBuilder');

function getSurvivalRouteData(selectedId) {
  return survivalRouteBuilder.buildRouteCenter(selectedId, placeData, serviceData, {
    checkedPlaceIds: checkinHelper.getCheckins().map((item) => item.id)
  });
}

module.exports = {
  getSurvivalRouteData
};
