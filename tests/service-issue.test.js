const assert = require('node:assert/strict');
const serviceData = require('../utils/serviceData');
const placeData = require('../utils/placeData');
const serviceMatcher = require('../utils/serviceMatcher');
const serviceService = require('../utils/services/serviceService');

function runTest(name, testFn) {
  try {
    testFn();
    console.log('PASS', name);
  } catch (error) {
    console.error('FAIL', name);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

runTest('service matcher builds issue-based solution cards', () => {
  const list = serviceMatcher.attachPrimaryPlace(serviceData, placeData);
  const issues = serviceMatcher.getIssueSolutions(list);

  assert.ok(Array.isArray(issues));
  assert.ok(issues.length >= 5);
  assert.deepEqual(
    issues.slice(0, 4).map((item) => item.id),
    ['newcomer', 'campus-card', 'network', 'lost-found']
  );
  assert.ok(issues.every((item) => item.title && item.question && item.serviceCount >= 1));
  assert.ok(issues.every((item) => Array.isArray(item.services) && item.services.length >= 1));
  assert.ok(issues.every((item) => item.primaryService && item.primaryService.primaryPlaceId));
});

runTest('service matcher filters issue solutions by selected issue', () => {
  const list = serviceMatcher.attachPrimaryPlace(serviceData, placeData);
  const networkServices = serviceMatcher.getServicesByIssue('network', list);

  assert.equal(networkServices.length, 1);
  assert.equal(networkServices[0].title, '校园网与设备报修');
  assert.equal(networkServices[0].primaryPlaceName, '格致楼');
});

runTest('service center data exposes issue tabs and default issue services', () => {
  const data = serviceService.getServiceCenterData();

  assert.ok(data.issueTabs.some((item) => item.id === 'campus-card'));
  assert.equal(data.currentIssue.id, 'newcomer');
  assert.ok(data.issueServices.some((item) => item.title === '学生办事与证明咨询'));
  assert.ok(data.issueServices.every((item) => item.primaryPlaceId));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
