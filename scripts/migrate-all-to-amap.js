/**
 * migrate-all-to-amap.js
 *
 * 批量将 placeData.js 中的场所与高德 POI 候选列表进行模糊匹配，
 * 把匹配成功的场所坐标更新为高德 POI 坐标，source 设为 "高德地图POI"，
 * coordinateStatus 设为 "amap"，并移除 reviewRequired 标记。
 *
 * 匹配策略：
 *   使用多级评分 + 最佳匹配，避免 "集贤苑B栋" 错配 "集贤苑A栋" 等问题。
 *
 * 运行: node scripts/migrate-all-to-amap.js
 */

const path = require('path');
const fs = require('fs');

// ── 路径 ────────────────────────────────────────────────
const PLACE_DATA_PATH = path.resolve(__dirname, '..', 'utils', 'placeData.js');
const AMAP_CANDIDATES_PATH = path.resolve(
  __dirname,
  '..',
  'generated',
  'amap-campus-poi-candidates.json'
);

// ── 读取数据 ────────────────────────────────────────────
let placeData;
try {
  delete require.cache[require.resolve(PLACE_DATA_PATH)];
  placeData = require(PLACE_DATA_PATH);
} catch (e) {
  console.error('ERROR: 无法读取 placeData.js:', e.message);
  process.exit(1);
}

let amapCandidates;
try {
  const raw = fs.readFileSync(AMAP_CANDIDATES_PATH, 'utf-8');
  amapCandidates = JSON.parse(raw);
} catch (e) {
  console.error('ERROR: 无法读取 Amap 候选文件:', e.message);
  process.exit(1);
}

console.log(`已加载 ${placeData.length} 个场所, ${amapCandidates.length} 个高德候选 POI\n`);

// ── 名称提取 ────────────────────────────────────────────

/**
 * 完整的校区前缀模式（按优先级排列）。
 * 模式 1-2: 标准格式 "广州应用科技学院(肇庆校区)" 或 "广州应用科技学院肇庆校区"
 * 模式 3: 畸形格式 "广州应用科技学院(肇庆校区XXX)" 缺少右括号
 * 模式 4: 无肇庆校区格式 "广州应用科技学院XXX"
 */
const CAMPUS_PREFIX_PATTERNS = [
  /^广州应用科技学院\s*\(肇庆校区\)\s*-?\s*/,   // "广州应用科技学院(肇庆校区)图书馆" → "图书馆"
  /^广州应用科技学院肇庆校区\s*-?\s*/,           // "广州应用科技学院肇庆校区学思苑" → "学思苑"
  /^广州应用科技学院\s*\(肇庆校区\s*/,            // "广州应用科技学院(肇庆校区集贤苑A栋)" → "集贤苑A栋)"
];

/**
 * 从名称中剥离校区前缀，返回核心名。
 */
function stripCampusPrefix(name) {
  for (const pattern of CAMPUS_PREFIX_PATTERNS) {
    if (pattern.test(name)) {
      return name.replace(pattern, '').trim();
    }
  }
  return name;
}

/**
 * 进一步清洗核心名：
 *  - 去除尾部括号内容 "(运营状态)"
 *  - 去除尾部孤立的 ")"
 *  - 去除连字符
 */
function cleanCore(name) {
  // 去除类似 (肇庆校区XXX店) 的后括号内容
  let cleaned = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
  // 去除孤立的尾部 )
  cleaned = cleaned.replace(/\s*\)\s*$/, '').trim();
  // 去除连字符
  cleaned = cleaned.replace(/-/g, '');
  return cleaned;
}

/**
 * 提取 Amap 候选名称的简短核心名。
 * 例: "广州应用科技学院(肇庆校区)-J2-明德楼" → "J2明德楼"
 *      "菜鸟驿站(肇庆校区广州应用科技学院店)" → "菜鸟驿站"
 */
function extractAmapCore(name) {
  return cleanCore(stripCampusPrefix(name));
}

/**
 * 提取场所名称的简短核心名。
 */
function extractPlaceCore(name) {
  return cleanCore(stripCampusPrefix(name));
}

/**
 * 从名称中提取「J/S 编号」。
 * 返回 "J1" / "S5" 或 null。
 */
function extractBuildingCode(name) {
  const m = name.match(/\b([JS]\d)\b/);
  return m ? m[1] : null;
}

/**
 * 从名称中提取「字母+栋/苑/楼」后缀。
 * 返回 "A栋" / "B栋" / "G栋" 或 null。
 */
function extractLetterSuffix(name) {
  // 优先匹配 "字母栋" 格式
  const m = name.match(/([A-Z][栋苑楼])/);
  return m ? m[1] : null;
}

/**
 * 提取纯粹的建筑物名称文字（不含编号、字母后缀）。
 * 例: "J2明德楼" → "明德楼", "集贤苑A栋" → "集贤苑", "学思苑G栋" → "学思苑"
 */
function extractBuildingText(name) {
  // 先去除 campus 前缀
  let core = stripCampusPrefix(name);
  // 去除 J/S 编号
  core = core.replace(/\b[JS]\d\b\s*-?\s*/, '');
  // 去除字母后缀（A栋, B栋 等）
  core = core.replace(/[A-Z][栋苑楼]/g, '');
  // 去除尾部括号
  core = core.replace(/\(.*\)$/, '').trim();
  // 去除连字符
  core = core.replace(/-/g, '');
  return core.trim();
}

// ── 匹配评分 ────────────────────────────────────────────

/**
 * 需要排除的 campus 级别入口（不含具体建筑/设施名）。
 */
const CAMPUS_ONLY_NAMES = [
  '广州应用科技学院(肇庆校区)',
  '广州应用科技学院肇庆校区',
];

/**
 * 对一个 candidate 进行评分。返回 { score, reason }。
 */
function scoreCandidate(place, placeName, placeCore, candidate) {
  const amapName = candidate.name;

  // ── 排除 campus 入口匹配到具体建筑 ──
  if (CAMPUS_ONLY_NAMES.includes(amapName)) {
    return { score: 0, reason: 'campus_entry_excluded' };
  }

  const amapCore = extractAmapCore(amapName);

  // ── 字母后缀冲突检查 ──
  const placeLetter = extractLetterSuffix(placeName);
  const amapLetter = extractLetterSuffix(amapName);
  const letterConflict = placeLetter && amapLetter && placeLetter !== amapLetter;

  // ── 建筑编号冲突检查 ──
  const placeCode = extractBuildingCode(placeName);
  const amapCode = extractBuildingCode(amapName);
  const codeConflict = placeCode && amapCode && placeCode !== amapCode;

  // ── 评分策略 ──
  let score = 0;
  let reason = '';

  // 策略 0: Amap 全名 === 场所全名（精确匹配，最高优先）
  if (amapName === placeName) {
    score = 100;
    reason = 'exact_full_name';
    return { score, reason };
  }

  // 策略 1: 核心名精确相等（去除校区前缀后一致）
  if (placeCore === amapCore && placeCore.length >= 2) {
    if (letterConflict) {
      // 字母后缀不同 → 拒绝
      return { score: 0, reason: `letter_conflict: ${placeLetter} vs ${amapLetter}` };
    }
    score = 95;
    reason = 'exact_core';
    return { score, reason };
  }

  // 策略 2: 场所全名是 Amap 名称的子串（长度 >= 3）
  if (amapName.includes(placeName) && placeName.length >= 3) {
    if (letterConflict) {
      return { score: 0, reason: `letter_conflict: ${placeLetter} vs ${amapLetter}` };
    }
    score = 85;
    reason = 'place_name_in_amap';
    return { score, reason };
  }

  // 策略 3: Amap 全名是场所名称的子串（长度 >= 3）
  if (placeName.includes(amapName) && amapName.length >= 4) {
    score = 80;
    reason = 'amap_name_in_place';
    return { score, reason };
  }

  // 策略 4: Amap 核心名包含场所核心名
  if (amapCore.includes(placeCore) && placeCore.length >= 3) {
    if (letterConflict) {
      return { score: 0, reason: `letter_conflict: ${placeLetter} vs ${amapLetter}` };
    }
    if (codeConflict) {
      return { score: 0, reason: `code_conflict: ${placeCode} vs ${amapCode}` };
    }
    score = 75;
    reason = 'amap_core_contains_place_core';
    return { score, reason };
  }

  // 策略 5: 场所核心名包含 Amap 核心名
  if (placeCore.includes(amapCore) && amapCore.length >= 3) {
    if (letterConflict) {
      return { score: 0, reason: `letter_conflict: ${placeLetter} vs ${amapLetter}` };
    }
    if (codeConflict) {
      return { score: 0, reason: `code_conflict: ${placeCode} vs ${amapCode}` };
    }
    score = 70;
    reason = 'place_core_contains_amap_core';
    return { score, reason };
  }

  // 策略 6: 建筑文字匹配（提取纯建筑名后比较）
  const placeBuilding = extractBuildingText(placeName);
  const amapBuilding = extractBuildingText(amapName);

  if (placeBuilding && amapBuilding && placeBuilding.length >= 2) {
    if (placeBuilding === amapBuilding) {
      if (letterConflict) {
        return { score: 0, reason: `letter_conflict: ${placeLetter} vs ${amapLetter}` };
      }
      if (codeConflict) {
        return { score: 0, reason: `code_conflict: ${placeCode} vs ${amapCode}` };
      }
      // 如果一方有编号另一方没有 → 中等得分
      if ((placeCode && !amapCode) || (!placeCode && amapCode)) {
        score = 65;
        reason = 'building_match_with_code_diff';
      } else {
        score = 70;
        reason = 'building_text_exact';
      }
      return { score, reason };
    }

    // 策略 7: 建筑文本互相包含
    if (placeBuilding.includes(amapBuilding) && amapBuilding.length >= 3) {
      if (letterConflict) {
        return { score: 0, reason: `letter_conflict: ${placeLetter} vs ${amapLetter}` };
      }
      score = 60;
      reason = 'building_text_contains';
      return { score, reason };
    }
    if (amapBuilding.includes(placeBuilding) && placeBuilding.length >= 3) {
      if (letterConflict) {
        return { score: 0, reason: `letter_conflict: ${placeLetter} vs ${amapLetter}` };
      }
      score = 55;
      reason = 'building_text_in_amap';
      return { score, reason };
    }
  }

  return { score: 0, reason: 'no_match' };
}

/**
 * 匹配一个 place 到最佳 Amap POI。
 */
function matchPlaceToAmap(place, candidates) {
  const placeName = place.name;
  const placeCore = extractPlaceCore(placeName);

  let bestCandidate = null;
  let bestScore = 0;
  let bestReason = '';

  for (const candidate of candidates) {
    const { score, reason } = scoreCandidate(place, placeName, placeCore, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
      bestReason = reason;
    }
  }

  // 最低分数阈值
  if (bestScore < 55) {
    return null;
  }

  return bestCandidate;
}

// ── 执行匹配与更新 ──────────────────────────────────────

const matched = [];
const unmatched = [];

for (const place of placeData) {
  if (place.coordinateStatus === 'amap') {
    continue;
  }

  const candidate = matchPlaceToAmap(place, amapCandidates);

  if (candidate) {
    const oldLat = place.latitude;
    const oldLng = place.longitude;
    const oldSource = place.source;

    place.latitude = candidate.latitude;
    place.longitude = candidate.longitude;
    place.source = '高德地图POI';
    place.coordinateStatus = 'amap';
    place.amapId = candidate.amapId;
    place.amapType = candidate.amapType || '';
    if (place.reviewRequired !== undefined) {
      place.reviewRequired = false;
    }

    delete place.estimateAverageErrorMeters;
    delete place.estimateMaxErrorMeters;
    delete place.wgs84Latitude;
    delete place.wgs84Longitude;
    delete place.osmId;

    matched.push({
      id: place.id,
      placeName: place.name,
      amapName: candidate.name,
      oldLat,
      oldLng,
      newLat: candidate.latitude,
      newLng: candidate.longitude,
      oldSource,
    });

    console.log(
      `  [+++] #${place.id} "${place.name}" → "${candidate.name}"`
    );
    console.log(
      `       坐标: (${oldLat.toFixed(6)}, ${oldLng.toFixed(6)}) → (${candidate.latitude.toFixed(6)}, ${candidate.longitude.toFixed(6)})`
    );
  } else {
    unmatched.push({
      id: place.id,
      name: place.name,
      source: place.source,
      type: place.type,
    });
    console.log(`  [---] #${place.id} "${place.name}" — 未匹配到高德 POI`);
  }
}

console.log('\n══════════════════════════════════════════════');
console.log('  匹配汇总');
console.log('══════════════════════════════════════════════');
console.log(`  总场所数:        ${placeData.length}`);
console.log(`  已是 amap:       ${placeData.length - matched.length - unmatched.length}`);
console.log(`  本次匹配成功:    ${matched.length}`);
console.log(`  本次未匹配:      ${unmatched.length}`);
console.log('══════════════════════════════════════════════');

if (unmatched.length > 0) {
  console.log('\n  未匹配场所详情:');
  for (const u of unmatched) {
    console.log(
      `    #${u.id} "${u.name}" (${u.type}, 来源: ${u.source})`
    );
  }
}

// ── 写回 placeData.js ────────────────────────────────────

function writePlaceData(data, filePath) {
  let originalContent;
  try {
    originalContent = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    originalContent = '';
  }

  const exportMatch = originalContent.match(
    /^([\s\S]*?)module\.exports\s*=\s*\[/
  );
  const preamble = exportMatch ? exportMatch[1] : '';

  const jsonStr = JSON.stringify(data, null, 2);
  const output = preamble + 'module.exports = ' + jsonStr + ';\n';

  fs.writeFileSync(filePath, output, 'utf-8');
  console.log(`\n  已成功写回更新数据到 ${filePath}`);
  console.log(`  写入后文件大小: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);
}

writePlaceData(placeData, PLACE_DATA_PATH);
console.log('\n迁移完成!');
