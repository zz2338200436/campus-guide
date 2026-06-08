function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isValidLatitude(latitude) {
  return typeof latitude === 'number' && latitude >= -90 && latitude <= 90;
}

function isValidLongitude(longitude) {
  return typeof longitude === 'number' && longitude >= -180 && longitude <= 180;
}

function buildMapTarget(place) {
  if (!place) {
    return null;
  }
  const latitude = toNumber(place.latitude);
  const longitude = toNumber(place.longitude);
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null;
  }
  return {
    latitude,
    longitude,
    name: place.name || '目的地',
    address: place.address || place.name || ''
  };
}

function buildOpenLocationOptions(place, handlers) {
  const target = buildMapTarget(place);
  if (!target) {
    return null;
  }
  return Object.assign({
    latitude: target.latitude,
    longitude: target.longitude,
    name: target.name,
    address: target.address,
    scale: 18
  }, handlers || {});
}

function isDeveloperTool(systemInfo) {
  return !!systemInfo && systemInfo.platform === 'devtools';
}

module.exports = {
  buildMapTarget,
  buildOpenLocationOptions,
  isDeveloperTool
};
