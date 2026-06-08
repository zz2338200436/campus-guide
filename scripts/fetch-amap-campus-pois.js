const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');

const AMAP_POLYGON = '112.6700,23.2635|112.6845,23.2750';
const DEFAULT_KEYWORDS = [
  '广州应用科技学院肇庆校区',
  '广州应用科技学院',
  '肇庆校区'
];
const DEFAULT_OFFSET = 25;
const MAX_PAGES = 10;
const DEFAULT_REQUEST_DELAY_MS = 1200;
const MAX_QPS_RETRIES = 3;

function buildAmapPoiUrl(options) {
  const params = new URLSearchParams({
    key: options.key,
    polygon: options.polygon || AMAP_POLYGON,
    keywords: options.keywords || '',
    offset: String(options.offset || DEFAULT_OFFSET),
    page: String(options.page || 1),
    extensions: options.extensions || 'all',
    output: 'JSON'
  });
  if (options.types) {
    params.set('types', options.types);
  }
  return `https://restapi.amap.com/v3/place/polygon?${params.toString()}`;
}

function mapAmapPoiToCandidate(poi) {
  const [longitude, latitude] = String(poi.location || '').split(',').map(Number);
  return {
    name: poi.name || '',
    type: mapAmapType(poi.type || ''),
    amapType: poi.type || '',
    address: Array.isArray(poi.address) ? poi.address.join('') : (poi.address || ''),
    latitude,
    longitude,
    amapId: poi.id || '',
    coordinateSystem: 'GCJ-02',
    source: '高德地图POI',
    coordinateStatus: 'amap',
    reviewRequired: true,
    raw: poi
  };
}

function mapAmapType(type) {
  if (type.includes('学校') || type.includes('科教文化')) return '学习场所';
  if (type.includes('餐饮') || type.includes('购物') || type.includes('生活')) return '生活场所';
  if (type.includes('体育') || type.includes('运动')) return '运动场所';
  if (type.includes('医疗') || type.includes('急救')) return '应急服务';
  if (type.includes('交通') || type.includes('公交') || type.includes('道路')) return '交通入口';
  return '生活场所';
}

function dedupePois(pois) {
  const seen = new Set();
  return pois.filter((poi) => {
    const key = `${poi.name || ''}|${poi.location || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchAmapCampusPois(options) {
  const key = options.key;
  if (!key) {
    throw new Error('Missing AMAP_WEB_SERVICE_KEY. Set it in your environment before running this script.');
  }
  const allPois = [];
  const keywords = options.keywords && options.keywords.length ? options.keywords : DEFAULT_KEYWORDS;

  for (const keyword of keywords) {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const url = buildAmapPoiUrl({
        key,
        keywords: keyword,
        page,
        offset: options.offset || DEFAULT_OFFSET,
        types: options.types
      });
      const data = await requestJsonWithRetry(url, {
        requestDelayMs: options.requestDelayMs || DEFAULT_REQUEST_DELAY_MS,
        maxRetries: options.maxRetries || MAX_QPS_RETRIES
      });
      if (data.status !== '1') {
        throw new Error(`Amap request failed: ${data.info || 'unknown'} (${data.infocode || 'no infocode'})`);
      }
      const pois = Array.isArray(data.pois) ? data.pois : [];
      allPois.push(...pois);
      if (pois.length < (options.offset || DEFAULT_OFFSET)) {
        break;
      }
    }
  }

  return dedupePois(allPois).map(mapAmapPoiToCandidate);
}

async function requestJsonWithRetry(url, options) {
  const maxRetries = options.maxRetries || MAX_QPS_RETRIES;
  const requestDelayMs = options.requestDelayMs || DEFAULT_REQUEST_DELAY_MS;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (requestDelayMs) {
      await sleep(requestDelayMs);
    }
    const data = await requestJson(url);
    if (!isAmapQpsLimitError(data)) {
      return data;
    }
    if (attempt === maxRetries) {
      return data;
    }
    await sleep(requestDelayMs * (attempt + 2));
  }
  return requestJson(url);
}

function isAmapQpsLimitError(data) {
  return data && data.status === '0' && String(data.infocode) === '10021';
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const key = process.env.AMAP_WEB_SERVICE_KEY;
  const candidates = await fetchAmapCampusPois({ key });
  const outputDir = path.join(__dirname, '..', 'generated');
  const outputPath = path.join(outputDir, 'amap-campus-poi-candidates.json');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(candidates, null, 2), 'utf8');
  console.log(`Fetched ${candidates.length} Amap POI candidates.`);
  console.log(outputPath);
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  AMAP_POLYGON,
  buildAmapPoiUrl,
  mapAmapPoiToCandidate,
  dedupePois,
  isAmapQpsLimitError,
  fetchAmapCampusPois
};
