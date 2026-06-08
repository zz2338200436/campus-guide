# 校园坐标运维说明

这份说明用于维护广州应用科技学院肇庆校区的地图点位。当前流程是：高德候选点抓取、候选点分析、手绘地图估算补点、小程序内人工校准、生成回写计划、人工确认后回写 `utils\placeData.js`。

## 基本原则

- 不把高德 Key 写进代码、文档或提交记录，只通过环境变量传入。
- `utils\placeData.js` 是小程序最终使用的点位数据源。
- `generated\*.json`、`generated\*.md` 和 `generated\*.patch` 是中间产物，用来审查和回写。
- `reviewRequired: true` 表示该点位必须人工确认；确认前不要直接当成精确导航点。
- 坐标统一使用 GCJ-02，微信小程序地图和高德 Web 服务返回值都按这个坐标系处理。

## 1. 从高德抓取校园候选点

先在 PowerShell 当前窗口设置 Web 服务 Key：

```powershell
$env:AMAP_WEB_SERVICE_KEY="你的高德Web服务Key"
node scripts\fetch-amap-campus-pois.js
```

成功后会生成：

```text
generated\amap-campus-poi-candidates.json
```

常见错误：

- `USERKEY_PLAT_NOMATCH (10009)`：Key 的服务平台或 Web 服务权限不匹配，需要在高德控制台检查 Key 类型和服务开通状态。
- `CUQPS_HAS_EXCEEDED_THE_LIMIT (10021)`：请求频率超过限制，等待一段时间再运行。脚本内已有延迟和重试，但免费配额仍可能触发限制。
- 不要把真实 Key 写入脚本，例如不要改 `scripts\fetch-amap-campus-pois.js` 里的代码来硬编码 Key。

## 2. 分析高德候选点

运行：

```powershell
node scripts\analyze-amap-campus-pois.js
```

成功后会生成：

```text
generated\amap-campus-poi-analysis.json
```

分析结果会把候选点分成几类：

- `matched`：已经能和现有 `utils\placeData.js` 点位匹配。
- `recommended`：建议补入或重点核对。
- `review`：名称或类型有参考价值，但需要人工判断。
- `skipped`：和校园导航关系弱，通常不加入小程序。

## 3. 生成手绘地图估算候选点

如果要从手绘地图和现有锚点估算缺失点位，运行：

```powershell
node scripts\build-campus-coordinate-candidates.js
```

成功后会生成：

```text
generated\campus-supplement-coordinate-candidates.json
```

这类点位的 `source` 通常是 `手绘地图线性估算`，必须保留 `reviewRequired: true`，等现场或地图核对后再回写为可信点。

## 4. 在微信开发者工具里人工校准

打开微信开发者工具，进入小程序的地图页和运维页：

- 地图页：查看点位在腾讯地图底图上的位置，优先处理带 `reviewRequired` 的点位。
- 地图页点位列表：对需要修正的点位使用“校准”操作，记录修正后的经纬度和备注。
- 运维页：查看“校准备注”汇总，复制点位校准清单或 `placeData` 修订模板。

校准时至少确认：

- 点位名称是否对应真实建筑、入口、服务点或道路口。
- 经纬度是否落在校园范围内。
- 是否仍需要 `reviewRequired: true`。
- 来源是否清楚，例如 `高德地图POI`、`手绘地图线性估算` 或 `人工校准`。
- 校准备注不能只写“通过”或“已确认”，需要写清入口、楼栋、门牌、现场方向或坐标依据，例如“现场确认入口在道路东侧”。

## 5. 生成坐标回写计划

把运维页复制出来的 `placeData` 修订模板保存成一个本地文本文件，例如：

```text
generated\coordinate-revision-template.txt
```

然后运行：

```powershell
node scripts\build-coordinate-writeback-plan.js generated\coordinate-revision-template.txt --output-dir generated
```

成功后会生成：

```text
generated\place-coordinate-writeback-plan.json
generated\place-coordinate-writeback-plan.md
```

只处理校验为 `ready` 的项；坐标越界、坐标系不对、仍需复核的项会进入 blocked 状态。

## 6. 生成可审查 patch

先只生成 patch，不直接写入数据：

```powershell
node scripts\build-coordinate-writeback-patch.js --output-dir generated
```

成功后会生成：

```text
generated\place-coordinate-writeback.patch
```

人工检查 patch，重点看：

- 点位 `id` 和 `name` 是否对应。
- `latitude`、`longitude` 是否是确认后的 GCJ-02 坐标。
- `reviewRequired` 是否只在确认无误后改成 `false`。
- `reviewNote` 是否留下了足够的校准依据。

## 7. 确认后回写 placeData

确认 patch 没问题后，再显式加 `--apply`：

```powershell
node scripts\build-coordinate-writeback-patch.js --apply --output-dir generated
```

这个命令会：

- 写入 `utils\placeData.js`。
- 在 `generated` 下生成 `placeData.backup.<timestamp>.js` 备份。
- 自动运行坐标、地图、运维、点位可信度和服务门面相关测试。

如果后置测试失败，命令会输出恢复命令，格式类似：

```powershell
node scripts\restore-place-data-backup.js "generated\placeData.backup.<timestamp>.js"
```

也可以手动运行：

```powershell
node scripts\restore-place-data-backup.js generated\placeData.backup.<timestamp>.js
```

恢复脚本只接受 `generated\placeData.backup.*.js`，避免误把其他文件覆盖到 `utils\placeData.js`。

## 8. 回写后的验证

回写后至少运行：

```powershell
node tests\coordinate-helper.test.js
node tests\location-map.test.js
node tests\operations-center.test.js
node tests\place-coordinate-trust.test.js
node tests\request-services.test.js
```

如果要做全量验证：

```powershell
$failed = @(); Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName | Out-Null; if ($LASTEXITCODE -ne 0) { $failed += $_.Name } }; if ($failed.Count) { Write-Error ('Failed tests: ' + ($failed -join ', ')); exit 1 } else { 'ALL TESTS PASSED' }
```

微信开发者工具里还要检查：

- 地图页能显示校园点位和当前选中点位。
- 点位列表、搜索、筛选、导航按钮都能正常使用。
- 运维页的校准备注数量和状态与本次修改一致。
- 已确认点位不再以 `reviewRequired` 形式提醒；未确认点位仍能继续校准。

## 9. 不要做的事

- 不要为了解决腾讯底图瓦片偶发加载失败，新增“本地校园建筑层”兜底。
- 不要直接把高德候选点全量复制进 `utils\placeData.js`。
- 不要跳过 `generated\place-coordinate-writeback.patch` 的人工审查。
- 不要在测试失败后继续用未恢复的 `utils\placeData.js` 调试小程序。
