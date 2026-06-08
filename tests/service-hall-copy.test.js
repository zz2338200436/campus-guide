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

[
  '办事大厅',
  '校园服务工单',
  '我要咨询',
  '我要报修',
  '查看进度',
  '处理时限',
  '办理地点',
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
assert.ok(serviceWxml.includes('scroll-view class="issue-tabs"'), 'issue tabs should stay horizontally scrollable');
assert.ok(serviceWxml.includes('class="issue-service__meta">办理地点：{{item.location}} · 处理时限：{{item.time}}</view>'), 'issue service cards should compress location and deadline into one row');
assert.ok(!serviceWxml.includes('class="issue-service__meta">处理时限：{{item.time}}</view>'), 'issue service cards should not spend a second row on deadline copy');
assert.ok(serviceWxml.includes('class="service-row"'), 'service category list should use compact service rows');
assert.ok(serviceWxml.includes('class="service-row__meta">办理地点：{{item.location}} · 处理时限：{{item.time}}</view>'), 'service category rows should compress location and deadline into one row');
assert.ok(serviceWxml.includes('class="service-row__materials">所需材料：{{item.materials.join('), 'service category rows should keep required materials in compact copy');
assert.ok(!serviceWxml.includes('service-card__tagline'), 'service category rows should not repeat long service descriptions');
assert.ok(!serviceWxml.includes('class="service-card__meta">处理时限：{{item.time}}</view>'), 'service category rows should not spend a second row on deadline copy');
assert.ok(!serviceWxml.includes('class="service-card__phone"'), 'service category rows should not duplicate phone outside the call action');
assert.ok(serviceWxml.includes('class="service-row__call" data-phone="{{item.phone}}" catchtap="callServicePhone">拨打</text>'), 'service category rows should keep a compact call action');
assert.ok(!serviceWxml.includes('service-card__footer'), 'service category rows should not keep a tall card footer');
assert.ok(serviceWxml.includes('service-alert__count">{{urgentList.length}} 项</view>'), 'emergency service section should show a compact count badge');
assert.ok(serviceWxml.includes('class="service-alert-row"'), 'emergency service section should use compact action rows');
assert.ok(serviceWxml.includes('class="service-alert-row__meta">处理时限：{{item.time}}</view>'), 'emergency service rows should keep deadline as compact metadata');
assert.ok(serviceWxml.includes('class="service-alert-row__phone" data-phone="{{item.phone}}" catchtap="callServicePhone">拨打</view>'), 'emergency service rows should keep a compact call action');
assert.ok(!serviceWxml.includes('service-alert__phone" data-phone="{{item.phone}}" catchtap="callServicePhone">拨打 {{item.phone}}</view>'), 'emergency service rows should not use wide phone-number buttons');
assert.ok(!serviceWxml.includes('class="service-alert__meta">处理时限：{{item.time}} · {{item.phone}}</view>'), 'emergency service cards should not duplicate phone in metadata');
assert.ok(!serviceWxml.includes('一键拨打'), 'emergency service cards should avoid vague repeated call copy');
assert.ok(serviceWxml.includes('bindtap="openTicketProgress">查看进度</view>'), 'ticket progress action should provide feedback instead of looking like a dead button');
assert.ok(serviceJs.includes('openTicketProgress()'), 'service page should implement the ticket progress interaction');
assert.ok(serviceJs.includes("title: '暂无进行中工单'"), 'ticket progress action should explain the current empty state');
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
assert.ok(!serviceWxss.includes('.service-hero'), 'service styles should not keep large hero styling');
assert.ok(serviceWxss.includes('height: 148rpx'), 'issue tabs should keep a fixed compact height');
assert.ok(serviceWxss.includes('width: 220rpx'), 'issue tabs should keep fixed card width to prevent long columns');

console.log('PASS service hall copy presents an enterprise service center');
