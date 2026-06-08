const fs = require('node:fs');
const path = require('node:path');
const placeData = require('../utils/placeData');
const supplementPlaces = require('../utils/campusSupplementPlaces');
const locationMapHelper = require('../utils/locationMapHelper');
const { buildSupplementReport, normalizeName } = require('./audit-campus-supplement-places');

function buildLinearModel(existingPlaces) {
  const anchors = existingPlaces
    .filter((item) =>
      Number.isFinite(Number(item.mapX)) &&
      Number.isFinite(Number(item.mapY)) &&
      Number.isFinite(Number(item.latitude)) &&
      Number.isFinite(Number(item.longitude))
    )
    .map((item) => ({
      mapX: Number(item.mapX),
      mapY: Number(item.mapY),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude)
    }));

  if (anchors.length < 3) {
    throw new Error('At least three anchor places are required to estimate coordinates.');
  }

  const latCoefficients = solvePlane(anchors.map((item) => [item.mapX, item.mapY, item.latitude]));
  const lonCoefficients = solvePlane(anchors.map((item) => [item.mapX, item.mapY, item.longitude]));

  function estimate(mapX, mapY) {
    return {
      latitude: roundCoordinate(clamp(
        latCoefficients.a + latCoefficients.b * Number(mapX) + latCoefficients.c * Number(mapY),
        locationMapHelper.CAMPUS_BOUNDS.minLatitude,
        locationMapHelper.CAMPUS_BOUNDS.maxLatitude
      )),
      longitude: roundCoordinate(clamp(
        lonCoefficients.a + lonCoefficients.b * Number(mapX) + lonCoefficients.c * Number(mapY),
        locationMapHelper.CAMPUS_BOUNDS.minLongitude,
        locationMapHelper.CAMPUS_BOUNDS.maxLongitude
      ))
    };
  }

  const errors = anchors.map((anchor) => {
    const current = estimate(anchor.mapX, anchor.mapY);
    return distanceMeters(current.latitude, current.longitude, anchor.latitude, anchor.longitude);
  });

  return {
    anchorCount: anchors.length,
    averageErrorMeters: Math.round(errors.reduce((sum, item) => sum + item, 0) / errors.length),
    maxErrorMeters: Math.round(Math.max.apply(null, errors)),
    estimate
  };
}

function buildCoordinateCandidates(existingPlaces, supplements) {
  const model = buildLinearModel(existingPlaces);
  const report = buildSupplementReport(existingPlaces, supplements);
  const existingNames = new Set(existingPlaces.map((item) => normalizeName(item.name)));

  return report.pending
    .filter((item) => !existingNames.has(normalizeName(item.name)))
    .map((item) => {
      const coordinate = model.estimate(item.mapX, item.mapY);
      return {
        name: item.name,
        type: item.type,
        zone: item.zone,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        mapX: item.mapX,
        mapY: item.mapY,
        coordinateStatus: 'estimated',
        source: '手绘地图线性估算',
        estimateAverageErrorMeters: model.averageErrorMeters,
        estimateMaxErrorMeters: model.maxErrorMeters,
        reviewRequired: true
      };
    });
}

function solvePlane(samples) {
  let n = samples.length;
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;
  let sumXZ = 0;
  let sumYZ = 0;

  samples.forEach(([x, y, z]) => {
    sumX += x;
    sumY += y;
    sumZ += z;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;
    sumXZ += x * z;
    sumYZ += y * z;
  });

  const matrix = [
    [n, sumX, sumY, sumZ],
    [sumX, sumXX, sumXY, sumXZ],
    [sumY, sumXY, sumYY, sumYZ]
  ];
  const solved = gaussianElimination(matrix);
  return {
    a: solved[0],
    b: solved[1],
    c: solved[2]
  };
}

function gaussianElimination(matrix) {
  const rows = matrix.map((row) => row.slice());
  const size = 3;

  for (let pivot = 0; pivot < size; pivot += 1) {
    let maxRow = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(rows[row][pivot]) > Math.abs(rows[maxRow][pivot])) {
        maxRow = row;
      }
    }
    if (maxRow !== pivot) {
      const temp = rows[pivot];
      rows[pivot] = rows[maxRow];
      rows[maxRow] = temp;
    }
    const divisor = rows[pivot][pivot];
    if (!divisor) {
      throw new Error('Coordinate model matrix is singular.');
    }
    for (let col = pivot; col <= size; col += 1) {
      rows[pivot][col] /= divisor;
    }
    for (let row = 0; row < size; row += 1) {
      if (row === pivot) continue;
      const factor = rows[row][pivot];
      for (let col = pivot; col <= size; col += 1) {
        rows[row][col] -= factor * rows[pivot][col];
      }
    }
  }

  return rows.map((row) => row[size]);
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const radius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return value * Math.PI / 180;
}

function roundCoordinate(value) {
  return Math.round(value * 10000000) / 10000000;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function writeCandidates() {
  const candidates = buildCoordinateCandidates(placeData, supplementPlaces);
  const outputDir = path.join(__dirname, '..', 'generated');
  const outputPath = path.join(outputDir, 'campus-supplement-coordinate-candidates.json');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(candidates, null, 2), 'utf8');
  const model = buildLinearModel(placeData);
  console.log(`Generated ${candidates.length} coordinate candidates.`);
  console.log(`Model anchors: ${model.anchorCount}, avg error: ${model.averageErrorMeters}m, max error: ${model.maxErrorMeters}m.`);
  console.log(outputPath);
}

if (require.main === module) {
  writeCandidates();
}

module.exports = {
  buildLinearModel,
  buildCoordinateCandidates
};
