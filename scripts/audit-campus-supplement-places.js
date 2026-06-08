const placeData = require('../utils/placeData');
const supplementPlaces = require('../utils/campusSupplementPlaces');

const VALID_TYPES = new Set(['教学楼', '学习场所', '宿舍楼', '生活场所', '交通入口', '办事服务', '应急服务', '运动场所']);

function normalizeName(name) {
  return String(name || '')
    .replace('广州应用科技学院(肇庆校区)', '')
    .replace('广州应用科技学院肇庆校区', '')
    .replace(/[（）()·\s]/g, '')
    .toLowerCase();
}

function findExistingPlace(existingPlaces, supplement) {
  const target = normalizeName(supplement.name);
  return existingPlaces.find((place) => {
    const current = normalizeName(place.name);
    return current === target || current.includes(target) || target.includes(current);
  });
}

function validateSupplementPlace(place) {
  const issues = [];
  if (!place.name) issues.push('missing name');
  if (!VALID_TYPES.has(place.type)) issues.push('invalid type');
  if (!Number.isFinite(place.mapX) || place.mapX < 0 || place.mapX > 100) issues.push('invalid mapX');
  if (!Number.isFinite(place.mapY) || place.mapY < 0 || place.mapY > 100) issues.push('invalid mapY');
  return issues;
}

function buildSupplementReport(existingPlaces, supplements) {
  const report = {
    existing: [],
    pending: [],
    invalid: []
  };

  supplements.forEach((supplement) => {
    const issues = validateSupplementPlace(supplement);
    if (issues.length) {
      report.invalid.push({
        name: supplement.name,
        issues
      });
      return;
    }

    const existing = findExistingPlace(existingPlaces, supplement);
    if (existing) {
      report.existing.push({
        name: supplement.name,
        existingId: existing.id,
        existingName: existing.name,
        type: supplement.type
      });
      return;
    }

    report.pending.push({
      name: supplement.name,
      type: supplement.type,
      zone: supplement.zone,
      mapX: supplement.mapX,
      mapY: supplement.mapY
    });
  });

  return report;
}

function printReport(report) {
  console.log('校园补点位校验报告');
  console.log('已存在:', report.existing.length);
  report.existing.forEach((item) => {
    console.log(`  - ${item.name} -> #${item.existingId} ${item.existingName}`);
  });
  console.log('待补坐标:', report.pending.length);
  report.pending.forEach((item) => {
    console.log(`  - ${item.name} | ${item.type} | ${item.zone} | map ${item.mapX},${item.mapY}`);
  });
  console.log('异常:', report.invalid.length);
  report.invalid.forEach((item) => {
    console.log(`  - ${item.name}: ${item.issues.join(', ')}`);
  });
}

if (require.main === module) {
  printReport(buildSupplementReport(placeData, supplementPlaces));
}

module.exports = {
  buildSupplementReport,
  normalizeName
};
