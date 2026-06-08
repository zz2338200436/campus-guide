const assert = require('node:assert/strict');
const phoneHelper = require('../utils/phoneHelper');

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

runTest('phone helper normalizes service phone numbers for wx.makePhoneCall', () => {
  assert.equal(phoneHelper.normalizePhoneNumber('0758-000005'), '0758000005');
  assert.equal(phoneHelper.normalizePhoneNumber(' 后勤 400-800-1234 '), '4008001234');
  assert.equal(phoneHelper.normalizePhoneNumber('+86 138 0013 8000'), '+8613800138000');
});

runTest('phone helper rejects empty or placeholder phone numbers', () => {
  assert.equal(phoneHelper.canCallPhone('暂无电话'), false);
  assert.equal(phoneHelper.canCallPhone(''), false);
  assert.equal(phoneHelper.canCallPhone('123'), false);
  assert.equal(phoneHelper.canCallPhone('0758-000005'), true);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
