const operationsCenter = require('../operationsCenter');
const placeData = require('../placeData');
const serviceData = require('../serviceData');
const noticeData = require('../noticeData');
const studyData = require('../studyData');
const checkinHelper = require('../explorationCheckinHelper');
const supplementPlaces = require('../campusSupplementPlaces');
const coordinateReviewStore = require('../coordinateReviewStore');

function getOperationsData() {
  return operationsCenter.buildOperationsData({
    places: placeData,
    services: serviceData,
    notices: noticeData,
    studies: studyData,
    supplementPlaces,
    coordinateReviews: coordinateReviewStore.getAllReviews(),
    checkins: checkinHelper.getCheckins()
  });
}

module.exports = {
  getOperationsData
};
