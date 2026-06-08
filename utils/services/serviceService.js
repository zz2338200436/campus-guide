const serviceData = require('../serviceData');
const serviceMatcher = require('../serviceMatcher');
const placeData = require('../placeData');

function getServiceList(params) {
  const type = params && params.type;
  const category = params && params.category;
  const list = serviceData.filter((item) => {
    const typeMatched = !type || type === '全部' || item.type === type;
    const categoryMatched = !category || category === '全部' || item.category === category;
    return typeMatched && categoryMatched;
  });
  return serviceMatcher.attachPrimaryPlace(list, placeData);
}

function getServiceCenterData() {
  const list = serviceMatcher.attachPrimaryPlace(serviceData, placeData);
  const issueTabs = serviceMatcher.getIssueSolutions(list);
  const currentIssue = issueTabs[0] || null;
  return {
    list,
    quickList: serviceMatcher.getFreshmanQuickServices(list),
    categoryTabs: serviceMatcher.getCategoryTabs(list),
    groups: serviceMatcher.groupByCategory(list),
    issueTabs,
    currentIssue,
    issueServices: currentIssue ? serviceMatcher.getServicesByIssue(currentIssue.id, list) : []
  };
}

module.exports = {
  getServiceList,
  getServiceCenterData
};
