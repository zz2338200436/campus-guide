const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const json = read('pages/survivalRoute/survivalRoute.json');
const wxss = read('pages/survivalRoute/survivalRoute.wxss');
const wxml = read('pages/survivalRoute/survivalRoute.wxml');

assert.ok(json.includes('场景路线'), 'route page title should use enterprise route wording');
assert.ok(!json.includes('生存路线'), 'route page title should not use survival wording');
assert.ok(wxml.includes('事项路线服务'), 'route page hero should use service-oriented wording');
assert.ok(wxss.includes('background: #ffffff;'), 'route page should use white enterprise surfaces');
assert.ok(wxss.includes('color: #0369a1;'), 'route page should use enterprise blue accent');
assert.ok(!wxss.includes('linear-gradient'), 'route page should not keep layered legacy gradients');
assert.ok(!wxss.includes('radial-gradient'), 'route page should not keep decorative gradient layers');
assert.ok(!wxss.includes('999rpx'), 'route page should avoid oversized pill styling');
assert.ok(!wxss.includes('/* Enterprise route service final */'), 'route page should be a single clean style pass, not override layers');
assert.ok(wxss.includes('-webkit-line-clamp'), 'route page should clamp long scenario and route text');

console.log('PASS route page uses enterprise route service styling');
