const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const appStyles = read('app.wxss');
const emptyStyles = read('components/empty-state/empty-state.wxss');
const emptyMarkup = read('components/empty-state/empty-state.wxml');

assert.ok(appStyles.includes('background: #f8fafc;'), 'global page background should use enterprise slate surface');
assert.ok(appStyles.includes('color: #0f172a;'), 'global text should use high-contrast enterprise ink');
assert.ok(appStyles.includes('background: #0369a1;'), 'primary actions should use the enterprise blue CTA');
assert.ok(appStyles.includes('border-radius: 16rpx;'), 'cards should use restrained enterprise radius');

assert.ok(emptyMarkup.includes('empty__status-bar'), 'empty state should include a structured status bar');
assert.ok(emptyMarkup.includes('{{statusText}}'), 'empty state should expose status text');
assert.ok(emptyStyles.includes('border-radius: 16rpx;'), 'empty state should use enterprise card radius');
assert.ok(emptyStyles.includes('#0369a1'), 'empty state should align with enterprise blue CTA');
assert.ok(!emptyStyles.includes('#0891b2'), 'empty state should not keep old teal accent');
assert.ok(!emptyStyles.includes('#22c55e'), 'empty state should not keep old green gradient accent');

console.log('PASS enterprise visual system is consistent and stateful');
