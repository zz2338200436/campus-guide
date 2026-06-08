const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function lineCount(content) {
  return content.trim().split(/\r?\n/).length;
}

const targets = [
  { file: 'pages/index/index.wxml', max: 105 },
  { file: 'pages/map/map.wxml', max: 210 },
  { file: 'pages/service/service.wxml', max: 155 },
  { file: 'pages/operations/operations.wxml', max: 115 }
];

targets.forEach((target) => {
  const content = read(target.file);
  assert.ok(lineCount(content) <= target.max, target.file + ' should be <= ' + target.max + ' lines');
});

const indexWxml = read('pages/index/index.wxml');
assert.ok(!indexWxml.includes('推荐地点'), 'home should not duplicate map recommendations');
assert.ok(!indexWxml.includes('平台能力'), 'home should not include platform capability marketing section');

const mapWxml = read('pages/map/map.wxml');
assert.ok(!mapWxml.includes('重点地点'), 'map page should not include duplicated featured notes');
assert.ok(!mapWxml.includes('推荐路线</text>'), 'map page should not keep a separate route marketing section');

const serviceWxml = read('pages/service/service.wxml');
assert.ok(!serviceWxml.includes('高频事项</view>'), 'service page should avoid duplicated quick-service strip');

const serviceWxss = read('pages/service/service.wxss');
assert.ok(serviceWxss.includes('.issue-tabs'), 'service page should style issue tabs');
assert.ok(/\.issue-tabs\s*\{[\s\S]*height:\s*148rpx;/.test(serviceWxss), 'issue tabs should have a fixed compact scroll height');
assert.ok(/\.issue-tabs\s*\{[\s\S]*align-items:\s*flex-start;/.test(serviceWxss), 'issue tabs should not stretch cards to the viewport height');
assert.ok(/\.issue-tab\s*\{[\s\S]*width:\s*220rpx;/.test(serviceWxss), 'issue tabs should use compact card widths');
assert.ok(/\.issue-tab\s*\{[\s\S]*height:\s*126rpx;/.test(serviceWxss), 'issue tab cards should have a fixed compact height');
assert.ok(!/\.issue-tab\s*\{[\s\S]*min-height:\s*126rpx;/.test(serviceWxss), 'issue tab cards should not rely on stretchable min-height');

console.log('PASS core pages are slimmed to task-focused enterprise surfaces');
