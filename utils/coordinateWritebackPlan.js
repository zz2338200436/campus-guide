function parseRevisionTemplate(text) {
  const blocks = String(text || '').match(/\{[\s\S]*?\}/g) || [];
  return blocks.map(parseBlock).filter((item) => item.id);
}

function parseBlock(block) {
  return {
    id: Number(readNumber(block, 'id')),
    name: readString(block, 'name'),
    type: readString(block, 'type'),
    oldLatitude: Number(readNumber(block, 'oldLatitude')),
    oldLongitude: Number(readNumber(block, 'oldLongitude')),
    source: readString(block, 'source'),
    validation: readString(block, 'validation'),
    reviewQuality: readString(block, 'reviewQuality'),
    reviewNote: readString(block, 'reviewNote')
  };
}

function buildWritebackPlan(templateText) {
  const parsed = parseRevisionTemplate(templateText);
  const items = parsed.map((item) => {
    const ready = item.validation === '校验:ready';
    return {
      id: item.id,
      name: item.name,
      action: ready ? '人工确认后回写' : '先处理校验问题',
      targetFile: 'utils/placeData.js',
      ready,
      reviewQuality: item.reviewQuality || '未标注',
      reviewNote: item.reviewNote,
      suggestedPatch: buildSuggestedPatch(item, ready)
    };
  });
  const plan = {
    total: items.length,
    readyCount: items.filter((item) => item.ready).length,
    blockedCount: items.filter((item) => !item.ready).length,
    items
  };
  plan.markdown = buildPlanMarkdown(plan);
  return plan;
}

function buildSuggestedPatch(item, ready) {
  return [
    'id: ' + item.id,
    'name: "' + escapeText(item.name) + '"',
    'latitude: ' + item.oldLatitude,
    'longitude: ' + item.oldLongitude,
    'coordinateSystem: "GCJ-02"',
    'source: "' + escapeText(item.source) + '"',
    'reviewRequired: ' + (ready ? 'false' : 'true'),
    'reviewNote: "' + escapeText(item.reviewNote) + '"'
  ].join('\n');
}

function buildPlanMarkdown(plan) {
  const lines = [
    '# 坐标回写建议',
    '',
    '- 总数: ' + plan.total,
    '- 可回写: ' + plan.readyCount,
    '- 待处理: ' + plan.blockedCount,
    ''
  ];
  plan.items.forEach((item) => {
    lines.push('## ' + item.name + '（ID ' + item.id + '）');
    lines.push('');
    lines.push('- 操作: ' + item.action);
    lines.push('- 目标文件: ' + item.targetFile);
    lines.push('- 备注质量: ' + (item.reviewQuality || '未标注'));
    lines.push('- 备注: ' + item.reviewNote);
    lines.push('');
    lines.push('```js');
    lines.push(item.suggestedPatch);
    lines.push('```');
    lines.push('');
  });
  return lines.join('\n');
}

function buildReviewPatch(plan) {
  const readyItems = (plan.items || []).filter((item) => item.ready);
  if (!readyItems.length) {
    return '# 坐标回写人工确认 patch\n\n暂无可回写点位。\n';
  }
  const missingReviewQualityItems = readyItems.filter(hasMissingReviewQuality);
  const lines = [
    '# 坐标回写人工确认 patch',
    '# 只包含校验通过的 ready 点位，请人工确认后再修改 utils/placeData.js。',
    '',
    '## 回写前检查',
    '- 已确认 generated/place-coordinate-writeback-plan.json 来自最新运维页复制模板',
    '- 仅回写校验通过的 ready 点位：' + readyItems.length + ' 处',
    '- 已检查每个点位的备注质量和现场依据',
    '- 回写后运行 node scripts\\build-coordinate-writeback-patch.js --apply --output-dir generated 的内置校验',
    ''
  ];
  if (missingReviewQualityItems.length) {
    lines.push('## 风险提醒');
    lines.push('- 发现 ' + missingReviewQualityItems.length + ' 个 ready 点位缺少备注质量，可能来自旧版 generated/place-coordinate-writeback-plan.json');
    lines.push('- 缺少备注质量：' + missingReviewQualityItems.map((item) => item.name || ('ID ' + item.id)).join('、'));
    lines.push('- 建议从运维页重新复制坐标修订模板后再生成 plan');
    lines.push('');
  }
  readyItems.forEach((item) => {
    lines.push('## ' + item.name + '（ID ' + item.id + '）');
    lines.push('- 备注质量: ' + (item.reviewQuality || '未标注'));
    lines.push('```js');
    lines.push(item.suggestedPatch);
    lines.push('```');
    lines.push('');
  });
  return lines.join('\n');
}

function hasMissingReviewQuality(item) {
  return !item.reviewQuality || item.reviewQuality === '未标注';
}

function applyReadyUpdatesToSource(sourceText, plan) {
  const backupText = String(sourceText || '');
  let updatedSource = backupText;
  let appliedCount = 0;
  let skippedCount = 0;
  (plan.items || []).forEach((item) => {
    if (!item.ready) {
      skippedCount += 1;
      return;
    }
    const block = findPlaceBlock(updatedSource, item.id);
    if (!block) {
      skippedCount += 1;
      return;
    }
    const nextBlock = applySuggestedPatchToBlock(block, item.suggestedPatch);
    updatedSource = updatedSource.replace(block, nextBlock);
    appliedCount += 1;
  });
  return {
    appliedCount,
    skippedCount,
    backupText,
    updatedSource
  };
}

function findPlaceBlock(sourceText, id) {
  const pattern = new RegExp('\\{[\\s\\S]*?id:\\s*' + Number(id) + ',[\\s\\S]*?\\n\\s*\\}', 'm');
  const match = pattern.exec(sourceText);
  return match ? match[0] : '';
}

function applySuggestedPatchToBlock(block, patchText) {
  return ['latitude', 'longitude', 'coordinateSystem', 'source', 'reviewRequired', 'reviewNote']
    .reduce((result, key) => upsertField(result, key, readPatchValue(patchText, key)), block);
}

function upsertField(block, key, value) {
  if (!value) {
    return block;
  }
  const fieldPattern = new RegExp('(\\n\\s*' + key + ':\\s*)[^,\\n}]+(,?)');
  if (fieldPattern.test(block)) {
    return block.replace(fieldPattern, '$1' + value + '$2');
  }
  return block.replace(/\n\s*\}$/, ',\n    ' + key + ': ' + value + '\n  }');
}

function readPatchValue(patchText, key) {
  const match = new RegExp('^' + key + ':\\s*(.+)$', 'm').exec(String(patchText || ''));
  return match ? match[1].trim() : '';
}

function readNumber(block, key) {
  const match = new RegExp(key + '\\s*:\\s*([-\\d.]+)').exec(block);
  return match ? match[1] : '';
}

function readString(block, key) {
  const match = new RegExp(key + '\\s*:\\s*"((?:\\\\.|[^"])*)"').exec(block);
  return match ? unescapeText(match[1]) : '';
}

function escapeText(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function unescapeText(value) {
  return String(value || '').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

module.exports = {
  parseRevisionTemplate,
  buildWritebackPlan,
  buildReviewPatch,
  hasMissingReviewQuality,
  applyReadyUpdatesToSource
};
