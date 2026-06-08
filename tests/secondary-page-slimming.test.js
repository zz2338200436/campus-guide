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

const studyWxml = read('pages/study/study.wxml');
const userWxml = read('pages/user/user.wxml');

assert.ok(lineCount(studyWxml) <= 155, 'study page should be <= 155 lines');
assert.ok(lineCount(userWxml) <= 105, 'user page should be <= 105 lines');
assert.ok(!studyWxml.includes('学习建议'), 'study page should avoid standalone guidance panel');
assert.ok(!studyWxml.includes('推荐阅读'), 'study page should avoid duplicated recommendation shelf');
assert.ok(!studyWxml.includes('成长动线'), 'study page should avoid duplicated learning flow section');
assert.ok(!userWxml.includes('最近状态'), 'user page should avoid explanatory status panel');
assert.ok(!userWxml.includes('footprint-list'), 'user page should not expand history details inline');

console.log('PASS secondary pages are slimmed to focused utility views');
