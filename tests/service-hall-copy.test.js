const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function includes(content, copy, file) {
  assert.ok(content.includes(copy), file + ' should include "' + copy + '"');
}

function excludes(content, copy, file) {
  assert.ok(!content.includes(copy), file + ' should not include "' + copy + '"');
}

const serviceWxml = read('pages/service/service.wxml');
const serviceJs = read('pages/service/service.js');
const serviceWxss = read('pages/service/service.wxss');
const serviceData = read('utils/serviceData.js');
const serviceWxssLineCount = serviceWxss.trim().split(/\r?\n/).length;

[
  '校园服务',
  '咨询与报修',
  '我要咨询',
  '我要报修',
  '办理进度',
  '开放时间',
  '地点',
  '所需材料'
].forEach((copy) => includes(serviceWxml, copy, 'pages/service/service.wxml'));

[
  '学籍事务',
  '宿舍后勤',
  '网络报修',
  '安全应急'
].forEach((copy) => includes(serviceData, copy, 'utils/serviceData.js'));

[
  '新生服务台',
  '新生最常用的服务',
  '新生生存路线生成器'
].forEach((copy) => excludes(serviceWxml, copy, 'pages/service/service.wxml'));

assert.ok(serviceWxml.includes('service-summary'), 'service page should use a compact workbench summary');
assert.ok(!serviceWxml.includes('service-hero'), 'service page should not keep a large promotional hero');
assert.ok(serviceWxml.includes('service-summary__metrics'), 'service summary should use a light horizontal metrics strip');
assert.ok(serviceWxml.includes('service-summary__metric'), 'service summary should render compact metric items');
assert.ok(!serviceWxml.includes('service-summary__stat'), 'service summary should not keep heavy stat cards');
assert.ok(serviceWxml.includes('class="ticket-bar card"'), 'ticket actions should use a compact one-line task bar');
assert.ok(serviceWxml.includes('class="ticket-bar__actions"'), 'ticket bar should keep actions inline with the ticket state');
assert.ok(!serviceWxml.includes('class="ticket-board card"'), 'ticket actions should not keep a tall ticket board card');
assert.ok(!serviceWxml.includes('class="ticket-actions"'), 'ticket actions should not keep a separate action grid');
assert.ok(serviceWxml.includes('scroll-view class="issue-tabs"'), 'issue tabs should stay horizontally scrollable');
assert.ok(serviceWxml.includes('class="issue-service__meta">地点：{{item.location}} · 开放时间：{{item.time}}</view>'), 'issue service cards should use student-facing location and time copy');
assert.ok(!serviceWxml.includes('处理时限'), 'service page should avoid workflow-heavy deadline wording');
assert.ok(serviceWxml.includes('class="service-row"'), 'service category list should use compact service rows');
assert.ok(serviceWxml.includes('class="service-row__meta">地点：{{item.location}} · 开放时间：{{item.time}}</view>'), 'service category rows should use student-facing location and time copy');
assert.ok(serviceWxml.includes('class="service-row__materials">所需材料：{{item.materials.join('), 'service category rows should keep required materials in compact copy');
assert.ok(!serviceWxml.includes('service-card__tagline'), 'service category rows should not repeat long service descriptions');
assert.ok(!serviceWxml.includes('class="service-card__meta">处理时限：{{item.time}}</view>'), 'service category rows should not spend a second row on deadline copy');
assert.ok(!serviceWxml.includes('class="service-card__phone"'), 'service category rows should not duplicate phone outside the call action');
assert.ok(serviceWxml.includes('class="service-row__call" data-phone="{{item.phone}}" catchtap="callServicePhone">拨打</text>'), 'service category rows should keep a compact call action');
assert.ok(!serviceWxml.includes('service-card__footer'), 'service category rows should not keep a tall card footer');
assert.ok(serviceWxml.includes('service-alert__count">{{urgentList.length}} 项</view>'), 'emergency service section should show a compact count badge');
assert.ok(serviceWxml.includes('class="service-alert-row"'), 'emergency service section should use compact action rows');
assert.ok(serviceWxml.includes('class="service-alert-row__meta">开放时间：{{item.time}}</view>'), 'emergency service rows should keep time as compact metadata');
assert.ok(serviceWxml.includes('class="service-alert-row__phone" data-phone="{{item.phone}}" catchtap="callServicePhone">拨打</view>'), 'emergency service rows should keep a compact call action');
assert.ok(!serviceWxml.includes('service-alert__phone" data-phone="{{item.phone}}" catchtap="callServicePhone">拨打 {{item.phone}}</view>'), 'emergency service rows should not use wide phone-number buttons');
assert.ok(!serviceWxml.includes('class="service-alert__meta">处理时限：{{item.time}} · {{item.phone}}</view>'), 'emergency service cards should not duplicate phone in metadata');
assert.ok(!serviceWxml.includes('一键拨打'), 'emergency service cards should avoid vague repeated call copy');
assert.ok(serviceWxml.includes('bindtap="openTicketProgress">办理进度</view>'), 'ticket progress action should provide feedback instead of looking like a dead button');
assert.ok(serviceJs.includes('openTicketProgress()'), 'service page should implement the ticket progress interaction');
assert.ok(serviceJs.includes("title: '暂无办理进度'"), 'ticket progress action should explain the current empty state');
assert.ok(serviceWxml.includes('bindtap="openConsultEntry">我要咨询</view>'), 'consult action should open a real service entry instead of navigating back to the same page');
assert.ok(!serviceWxml.includes('data-url="/pages/service/service"'), 'consult action should not self-navigate to the current service page');
assert.ok(serviceJs.includes('openConsultEntry()'), 'service page should implement the consult entry interaction');
assert.ok(serviceJs.includes("title: '暂无可咨询服务'"), 'consult entry should explain when no current service is available');
assert.ok(!serviceJs.includes('openQuickAction(event)'), 'service page should remove the legacy self-navigation helper after replacing consult action');
assert.ok(!serviceWxss.includes('.service-card__phone'), 'service styles should remove unused phone text styling');
assert.ok(!serviceWxss.includes('.service-card__tagline'), 'service styles should remove long card description styling');
assert.ok(!serviceWxss.includes('.service-card__footer'), 'service styles should remove tall card footer styling');
assert.ok(serviceWxss.includes('.service-row'), 'service styles should define compact service rows');
assert.ok(serviceWxss.includes('.service-alert-row'), 'service styles should define compact emergency action rows');
assert.ok(serviceWxss.includes('.service-summary'), 'service page should style the compact summary');
assert.ok(serviceWxss.includes('.service-summary__metrics'), 'service styles should define a light metrics strip');
assert.ok(serviceWxss.includes('.ticket-bar'), 'service styles should define a compact ticket task bar');
assert.ok(!serviceWxss.includes('.ticket-actions'), 'service styles should remove the old ticket action grid');
assert.ok(!serviceWxss.includes('min-height: 70rpx'), 'ticket actions should not keep tall button blocks');
assert.ok(!serviceWxss.includes('min-height: 96rpx'), 'service summary should not keep tall stat cards');
assert.ok(!serviceWxss.includes('service-priority'), 'service styles should remove unused priority module styles');
assert.ok(!serviceWxss.includes('service-quick-card'), 'service styles should remove unused quick-card styles');
assert.ok(serviceWxssLineCount <= 420, 'service styles should stay compact after repeated page slimming');
assert.ok(!serviceWxss.includes('.service-hero'), 'service styles should not keep large hero styling');
assert.ok(serviceWxss.includes('height: 148rpx'), 'issue tabs should keep a fixed compact height');
assert.ok(serviceWxss.includes('width: 220rpx'), 'issue tabs should keep fixed card width to prevent long columns');

console.log('PASS service page copy feels like a student-facing help desk');
