const fs = require('node:fs');
const path = require('node:path');
const placeData = require('../utils/placeData');

function normalizeName(name) {
  return String(name || '')
    .replace('广州应用科技学院(肇庆校区)', '')
    .replace('广州应用科技学院肇庆校区', '')
    .replace('广州应用科技学院', '')
    .replace(/[（）()·\s-]/g, '')
    .toLowerCase();
}

function findExistingPlace(candidate, existingPlaces) {
  const target = normalizeName(candidate.name);
  return existingPlaces.find((place) => {
    const current = normalizeName(place.name);
    return current === target || current.includes(target) || target.includes(current);
  });
}

function classifyAmapCandidate(candidate) {
  const name = String(candidate.name || '');
  const type = String(candidate.amapType || candidate.type || '');

  if (/酒店|民宿|农旅园|消防队|台球|棋牌|电竞|健身|美容|美发/.test(name + type)) {
    return 'skip';
  }
  if (/音乐厅|音乐学院|诊所|医务室|停车场|出入口|驿站|交流中心|大剧院|学思苑|饭堂|餐厅/.test(name)) {
    return 'recommended';
  }
  if (/餐饮|冷饮|快餐|中餐|麦当劳|汉堡|咖啡|茶|比萨|云饺|炸串|粉|饭/.test(name + type)) {
    return 'review';
  }
  if (/科教文化|学校|培训机构|交通设施|停车场|医疗保健/.test(type)) {
    return 'recommended';
  }
  return 'review';
}

function buildAmapAnalysisReport(candidates, existingPlaces) {
  const report = {
    total: candidates.length,
    matched: [],
    recommended: [],
    review: [],
    skipped: []
  };

  candidates.forEach((candidate) => {
    const existing = findExistingPlace(candidate, existingPlaces);
    const entry = {
      name: candidate.name,
      type: candidate.type,
      amapType: candidate.amapType,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      address: candidate.address,
      amapId: candidate.amapId
    };
    if (existing) {
      report.matched.push(Object.assign({}, entry, {
        existingId: existing.id,
        existingName: existing.name
      }));
      return;
    }

    const classification = classifyAmapCandidate(candidate);
    if (classification === 'recommended') {
      report.recommended.push(entry);
    } else if (classification === 'skip') {
      report.skipped.push(entry);
    } else {
      report.review.push(entry);
    }
  });

  return report;
}

function run() {
  const inputPath = path.join(__dirname, '..', 'generated', 'amap-campus-poi-candidates.json');
  if (!fs.existsSync(inputPath)) {
    throw new Error('Missing generated/amap-campus-poi-candidates.json. Run scripts/fetch-amap-campus-pois.js first.');
  }
  const candidates = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const report = buildAmapAnalysisReport(candidates, placeData);
  const outputPath = path.join(__dirname, '..', 'generated', 'amap-campus-poi-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Amap POI analysis: total ${report.total}, matched ${report.matched.length}, recommended ${report.recommended.length}, review ${report.review.length}, skipped ${report.skipped.length}.`);
  console.log(outputPath);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  classifyAmapCandidate,
  buildAmapAnalysisReport
};
