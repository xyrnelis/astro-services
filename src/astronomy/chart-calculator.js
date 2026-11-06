import { PLANETS } from '../domain/channels.js';
import { SIGN_NAMES } from '../domain/zodiac-signs.js';

const BODIES = {
  Sun: 'Sun', Moon: 'Moon', Mercury: 'Mercury', Venus: 'Venus', Mars: 'Mars',
  Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
  Chiron: 'Chiron', Proserpina: 'Proserpina',
};

export class ChartCalculationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function signFromLongitude(longitude) {
  return SIGN_NAMES[Math.floor(normalizeDegrees(longitude) / 30)];
}

function formatLongitude(longitude) {
  const inSign = normalizeDegrees(longitude) % 30;
  const degrees = Math.floor(inSign);
  const minutesFloat = (inSign - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.min(59, Math.round((minutesFloat - minutes) * 60));
  return `${String(degrees).padStart(2, '0')}°${String(minutes).padStart(2, '0')}′${String(seconds).padStart(2, '0')}″`;
}

function getCusps(cusps) {
  const values = Array.isArray(cusps) ? cusps : [];
  const result = values.length === 13 ? values.slice(1) : values;
  if (result.length !== 12 || result.some((cusp) => !Number.isFinite(cusp))) {
    throw new ChartCalculationError('placidus-unavailable', 'Система домов Плацидуса не определена для этих координат и времени.');
  }
  return result.map(normalizeDegrees);
}

function houseForLongitude(longitude, cusps) {
  const normalized = normalizeDegrees(longitude);
  for (let index = 0; index < 12; index += 1) {
    const start = cusps[index];
    const end = cusps[(index + 1) % 12];
    const span = normalizeDegrees(end - start);
    const offset = normalizeDegrees(normalized - start);
    if (offset < span || (span === 0 && offset === 0)) {
      return index + 1;
    }
  }
  throw new ChartCalculationError('placidus-unavailable', 'Не удалось определить дом объекта по куспидам Плацидуса.');
}

export async function calculateChart(input, ephemeris) {
  const raw = await ephemeris.calculate(input);
  if (raw.substituted) {
    throw new ChartCalculationError('placidus-unavailable', 'Плацидус не определён для этих координат: эфемериды предлагают другую систему домов.');
  }
  const cusps = getCusps(raw.cusps);
  const positions = {};

  for (const planet of PLANETS) {
    const longitude = raw.positions[planet]?.longitude;
    if (!Number.isFinite(longitude)) {
      throw new ChartCalculationError('body-unavailable', `Эфемериды не вернули положение: ${planet}.`);
    }
    positions[planet] = {
      longitude: normalizeDegrees(longitude),
      formattedLongitude: formatLongitude(longitude),
      sign: signFromLongitude(longitude),
      house: houseForLongitude(longitude, cusps),
      source: 'Swiss Ephemeris',
    };
  }
  return { positions, cusps, source: 'Swiss Ephemeris' };
}

let browserEnginePromise;

export async function getBrowserEphemeris() {
  if (!browserEnginePromise) {
    browserEnginePromise = (async () => {
      const module = await import('https://esm.sh/@kuntay/swisseph@0.2.2?bundle');
      const dataBase = 'https://cdn.jsdelivr.net/npm/@kuntay/swisseph-data@0.2.2/ephe/';
      const files = Object.fromEntries(await Promise.all(
        ['seas_18.se1', 'seorbel.txt'].map(async (name) => {
          const response = await fetch(`${dataBase}${name}`);
          if (!response.ok) throw new Error(`Не удалось загрузить файл эфемерид: ${name}`);
          return [name, new Uint8Array(await response.arrayBuffer())];
        }),
      ));
      const swe = await module.createSwissEph({ files });
      const bodies = {
        Sun: module.Body.Sun,
        Moon: module.Body.Moon,
        Mercury: module.Body.Mercury,
        Venus: module.Body.Venus,
        Mars: module.Body.Mars,
        Jupiter: module.Body.Jupiter,
        Saturn: module.Body.Saturn,
        Uranus: module.Body.Uranus,
        Neptune: module.Body.Neptune,
        Pluto: module.Body.Pluto,
        Chiron: module.Body.Chiron,
        Proserpina: module.FictitiousOffset + 17,
      };
      return {
        async calculate({ utc, latitude, longitude }) {
          const julianDay = swe.julianDay(
            utc.getUTCFullYear(),
            utc.getUTCMonth() + 1,
            utc.getUTCDate(),
            utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600,
          );
          const houses = swe.houses(julianDay, latitude, longitude, 'P');
          const positions = Object.fromEntries(
            PLANETS.map((planet) => [planet, swe.calc(julianDay, bodies[planet])]),
          );
          return { positions, cusps: houses?.cusps, substituted: houses?.substituted };
        },
      };
    })().catch((error) => {
      browserEnginePromise = undefined;
      throw error;
    });
  }
  return browserEnginePromise;
}
