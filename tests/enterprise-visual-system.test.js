const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const appStyles = read('app.wxss');
const emptyStyles = read('components/empty-state/empty-state.wxss');
const emptyMarkup = read('components/empty-state/empty-state.wxml');

assert.ok(appStyles.includes('background: #f7f9fb;'), 'global page background should use a calm student-helper surface');
assert.ok(appStyles.includes('color: #1f2937;'), 'global text should use readable neutral ink');
assert.ok(appStyles.includes('background: #0f766e;'), 'primary actions should use a restrained campus accent');
assert.ok(appStyles.includes('border-radius: 18rpx;'), 'cards should use friendly but restrained radius');
assert.ok(!appStyles.includes('Enterprise service portal system'), 'global styles should not carry enterprise positioning comments');
assert.ok(!appStyles.includes('#0369a1'), 'global styles should not keep the old enterprise blue accent');

assert.ok(emptyMarkup.includes('empty__status-bar'), 'empty state should include a structured status bar');
assert.ok(emptyMarkup.includes('{{statusText}}'), 'empty state should expose status text');
assert.ok(emptyStyles.includes('border-radius: 18rpx;'), 'empty state should use the shared friendly radius');
assert.ok(emptyStyles.includes('#0f766e'), 'empty state should align with the campus accent');
assert.ok(!emptyStyles.includes('#0891b2'), 'empty state should not keep old teal accent');
assert.ok(!emptyStyles.includes('#22c55e'), 'empty state should not keep old green gradient accent');

console.log('PASS visual system is calm and student-facing');
