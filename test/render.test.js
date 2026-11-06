import { readFile } from 'node:fs/promises';
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRankingSnapshot } from '../src/domain/calculate-channels.js';
import { calculateWithReceptions } from '../src/domain/calculate-with-receptions.js';
import {
  CONJUNCTION_SYMBOL,
  HOUSE_LABELS,
  PLANET_LABELS,
  SIGN_LABELS,
} from '../src/domain/channels.js';
import { renderPositions, renderResults } from '../src/ui/render.js';

const fixtures = JSON.parse(
  await readFile(new URL('../astro_channels_fixtures_v1.json', import.meta.url), 'utf8'),
);
const iconSprite = await readFile(new URL('../public/astro-icons/astro-icons.svg', import.meta.url), 'utf8');
const iconManifest = JSON.parse(
  await readFile(new URL('../public/astro-icons/manifest.json', import.meta.url), 'utf8'),
);
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

function spriteViewBox(id) {
  const match = iconSprite.match(new RegExp(`<symbol id="${id}" viewBox="([^"]+)"`));
  assert.ok(match, `missing sprite symbol: ${id}`);
  return match[1];
}

it('maps every astrology label to an accessible symbol in the supplied sprite', () => {
  const labels = {
    ...PLANET_LABELS,
    ...SIGN_LABELS,
    ...HOUSE_LABELS,
    conjunction: CONJUNCTION_SYMBOL,
  };
  const ids = [
    'planet-sun', 'planet-moon', 'planet-mercury', 'planet-proserpina', 'planet-venus', 'planet-chiron',
    'planet-mars', 'planet-pluto', 'planet-jupiter', 'planet-neptune', 'planet-saturn', 'planet-uranus',
    'sign-aries', 'sign-taurus', 'sign-gemini', 'sign-cancer', 'sign-leo', 'sign-virgo', 'sign-libra',
    'sign-scorpio', 'sign-sagittarius', 'sign-capricorn', 'sign-aquarius', 'sign-pisces',
    ...Array.from({ length: 12 }, (_, index) => `house-roman-${String(index + 1).padStart(2, '0')}`),
    'aspect-conjunction',
  ];

  for (const id of ids) {
    assert.match(Object.values(labels).join(''), new RegExp(`href="\\./astro-icons/astro-icons\\.svg#${id}"`));
  }
  for (const label of Object.values(labels)) {
    const id = label.match(/#([^"]+)/)?.[1];
    assert.ok(id, 'icon label must reference a sprite symbol');
    assert.match(label, new RegExp(`viewBox="${spriteViewBox(id)}" preserveAspectRatio="xMidYMid meet"`));
    assert.match(label, /<svg class="astro-symbol(?: astro-symbol-(?:house|planet|sign))?" role="img" aria-label="[^"]+" title="[^"]+" viewBox="[^"]+" preserveAspectRatio="xMidYMid meet"><use href="\.\/astro-icons\/astro-icons\.svg#[^"]+"><\/use><\/svg>/);
  }
});

it('keeps Roman house symbols proportionate at 16, 20, and 24 pixels', () => {
  assert.match(styles, /\.astro-symbol-planet, \.astro-symbol-sign \{ --astro-symbol-height: 22px; \}/);
  assert.match(styles, /\.positions \.astro-symbol-planet, \.positions \.astro-symbol-sign \{ --astro-symbol-height: 22px; \}/);
  assert.match(styles, /\.astro-symbol-house \{ --astro-symbol-height: 16px; width: auto; \}/);
  assert.match(styles, /\.positions \.astro-symbol-house \{ --astro-symbol-height: 16px; width: auto; \}/);

  for (const height of [16, 20, 24]) {
    for (let house = 1; house <= 12; house += 1) {
      const id = `house-roman-${String(house).padStart(2, '0')}`;
      const [, , width, viewBoxHeight] = spriteViewBox(id).split(' ').map(Number);
      const renderedWidth = (width / viewBoxHeight) * height;
      assert.ok(renderedWidth > 0, `${id} has a positive width at ${height}px`);
      assert.match(HOUSE_LABELS[house], /class="astro-symbol astro-symbol-house"/);
      assert.match(HOUSE_LABELS[house], new RegExp(`viewBox="${spriteViewBox(id)}"`));
    }
  }
});

it('keeps optical stroke corrections synchronized between planet sources and the sprite', async () => {
  const adjustedPlanets = [
    ['planet-mercury', 18],
    ['planet-venus', 15],
    ['planet-jupiter', 18],
  ];

  for (const [id, strokeWidth] of adjustedPlanets) {
    const icon = iconManifest.icons.find((entry) => entry.id === id);
    const source = await readFile(new URL(`../public/astro-icons/${icon.file}`, import.meta.url), 'utf8');

    assert.equal(icon.opticalStyle.strokeWidth, strokeWidth);
    assert.match(source, new RegExp(`<style>g \\{ stroke-width: ${strokeWidth}; \\}</style>`));
    assert.match(source, /(?:fill|stroke)="currentColor"/);
    assert.match(iconSprite, new RegExp(`#${id} > g \\{ stroke-width: ${strokeWidth}; \\}`));
  }
});

it('renders all channels, expandable steps, and the Proserpina notice', () => {
  const positions = fixtures.cases[0].positions;
  const markup = renderResults({
    positions: Object.fromEntries(Object.entries(positions).map(([planet, value]) => [planet, {
      ...value,
      formattedLongitude: '00°00′00″',
      source: 'Swiss Ephemeris',
    }])),
    pairs: [],
    result: calculateWithReceptions(positions, []),
  });

  for (const channel of ['Светила', 'Меркурий', 'Венера', 'Марс', 'Юпитер', 'Сатурн']) {
    assert.match(markup, new RegExp(channel));
  }
  assert.match(markup, /<details class="channel-row"/);
  assert.match(markup, /Шаг 1/);
  assert.match(markup, /astro-icons\.svg#planet-sun/);
  assert.match(markup, /astro-icons\.svg#sign-capricorn/);
  assert.match(markup, /Планеты в соединении с <svg class="astro-symbol astro-symbol-planet" role="img" aria-label="Солнце" title="Солнце"[^>]+><use href="\.\/astro-icons\/astro-icons\.svg#planet-sun"><\/use><\/svg>/);
  assert.match(markup, /astro-icons\.svg#planet-sun"><\/use><\/svg> <svg class="astro-symbol" role="img" aria-label="Соединение" title="Соединение"[^>]+><use href="\.\/astro-icons\/astro-icons\.svg#aspect-conjunction/);
  assert.doesNotMatch(markup, /zodiacfonts|<img class="astro-symbol"/);
  assert.doesNotMatch(markup, /72 начислений|53\.2000, 29\.2000/);
  assert.match(markup, /Верхние значения по каналам|Глобальный максимум|Ранжирование по сумме/);
  assert.match(markup, /matrix-highest/);
  assert.match(markup, /matrix-runner-up/);
  assert.match(markup, /<strong>Светила<\/strong><span>Сатурн 4, Юпитер 3<\/span>/);
  assert.doesNotMatch(markup, /Лидеры строки|баллов/);
  const positionsMarkup = renderPositions({ positions: Object.fromEntries(Object.entries(positions).map(([planet, value]) => [planet, {
    ...value,
    formattedLongitude: '00°00′00″',
    source: 'Swiss Ephemeris',
  }])) }, {
    cityLabel: 'Буда-Кошелёво, Беларусь',
    date: '1997-01-11',
    time: '10:02',
    timeZone: 'Europe/Minsk',
    latitude: 53.2,
    longitude: 29.2,
  }, [
    { id: 'Venus:Mars', planets: ['Venus', 'Mars'] },
  ]);
  assert.match(positionsMarkup, /aria-label="Прозерпина"/);
  assert.match(positionsMarkup, /11\.01\.1997 10:02:00 \(Europe\/Minsk\), Буда-Кошелёво, Беларусь, 53\.2000, 29\.2000/);
  assert.doesNotMatch(positionsMarkup, /Источник|Swiss Ephemeris/);
  assert.match(positionsMarkup, /<th>Планета<\/th><th>Дом<\/th>/);
  assert.match(positionsMarkup, /astro-icons\.svg#house-roman-11/);
  assert.match(positionsMarkup, /Взаимные рецепции/);
  assert.match(positionsMarkup, /Венера в Козероге, 10 дом ↔ Марс в Весах, 7 дом/);
  assert.doesNotMatch(positionsMarkup, /<th>Знак<\/th>|<th>Координата<\/th>/);
  assert.ok(positionsMarkup.indexOf('planet-sun') < positionsMarkup.indexOf('planet-moon'));
  assert.ok(positionsMarkup.indexOf('planet-chiron') < positionsMarkup.indexOf('planet-proserpina'));
  assert.doesNotMatch(positionsMarkup, /Не совпадает с Sotis/);
});

it('renders the reception empty state', () => {
  const markup = renderPositions({ positions: {
    Sun: { sign: 'Aries', house: 1 }, Moon: { sign: 'Aries', house: 1 },
    Mercury: { sign: 'Aries', house: 1 }, Venus: { sign: 'Aries', house: 1 },
    Mars: { sign: 'Aries', house: 1 }, Jupiter: { sign: 'Aries', house: 1 },
    Saturn: { sign: 'Aries', house: 1 }, Uranus: { sign: 'Aries', house: 1 },
    Neptune: { sign: 'Aries', house: 1 }, Pluto: { sign: 'Aries', house: 1 },
    Chiron: { sign: 'Aries', house: 1 }, Proserpina: { sign: 'Aries', house: 1 },
  } }, undefined, []);

  assert.match(markup, /Взаимные рецепции не обнаружены/);
});

it('renders prepared boundary memberships and reception configurations without changing existing output or inputs', () => {
  const chart = { positions: structuredClone(fixtures.cases[0].positions) };
  const receptions = [{ id: 'Sun:Saturn', planets: ['Sun', 'Saturn'] }];
  const memberships = [
    { planetId: 'Sun', natalSign: 'Aries', natalHouse: 1, kind: 'sign', addedSign: 'Pisces', boundaryLongitude: 0, distanceDegrees: 0 },
    { planetId: 'Sun', natalSign: 'Aries', natalHouse: 1, kind: 'house', addedHouse: 12, cuspHouse: 1, cuspLongitude: 0, distanceDegrees: 0 },
    { planetId: 'Sun', natalSign: 'Aries', natalHouse: 1, kind: 'house', addedHouse: 2, cuspHouse: 2, cuspLongitude: 2, distanceDegrees: 1 },
    { planetId: 'Mercury', natalSign: 'Aries', natalHouse: 5, kind: 'sign', addedSign: 'Taurus', boundaryLongitude: 30, distanceDegrees: 1 },
  ];
  const boundaryReceptions = [
    { id: 'Mercury:Venus:Taurus:Gemini', pairId: 'Mercury:Venus', planets: ['Mercury', 'Venus'], signs: ['Taurus', 'Gemini'], triggerIds: ['Mercury:sign:Taurus'] },
    { id: 'Sun:Saturn:Aquarius:Leo', pairId: 'Sun:Saturn', planets: ['Sun', 'Saturn'], signs: ['Aquarius', 'Leo'], triggerIds: ['Sun:sign:Aquarius'] },
    { id: 'Sun:Saturn:Capricorn:Cancer', pairId: 'Sun:Saturn', planets: ['Sun', 'Saturn'], signs: ['Capricorn', 'Cancer'], triggerIds: ['Saturn:sign:Cancer'] },
  ];
  const before = structuredClone({ chart, receptions, memberships, boundaryReceptions });
  const baseline = renderPositions(chart, undefined, receptions);
  const empty = renderPositions(chart, undefined, receptions, { memberships: [], boundaryReceptions: [] });
  assert.match(empty, /Пограничные положения не обнаружены/);
  assert.match(empty, /Взаимные рецепции с пограничностью не обнаружены/);
  assert.doesNotMatch(baseline, /Пограничности|Взаимные рецепции с пограничностью/);

  const markup = renderPositions(chart, undefined, receptions, { memberships, boundaryReceptions });
  const table = baseline.match(/<div class="table-scroll">.*?<\/div>/)[0];
  const originalList = baseline.match(/<section class="receptions">.*?<\/section>/)[0];
  assert.ok(markup.includes(table));
  assert.ok(markup.includes(originalList));
  assert.ok(markup.indexOf(table) < markup.indexOf('Пограничности'));
  assert.ok(markup.indexOf(originalList) < markup.indexOf('Взаимные рецепции с пограничностью'));
  const boundaryList = markup.split('Пограничности')[1].split(originalList)[0];
  assert.ok(boundaryList.indexOf(PLANET_LABELS.Sun) < boundaryList.indexOf(SIGN_LABELS.Pisces));
  assert.ok(boundaryList.indexOf(HOUSE_LABELS[12]) < boundaryList.indexOf(HOUSE_LABELS[2]));
  assert.match(boundaryList, /Граница дома/g);
  assert.ok(boundaryList.includes(PLANET_LABELS.Mercury));
  assert.ok(boundaryList.includes(SIGN_LABELS.Taurus));
  const boundaryReceptionList = markup.split('Взаимные рецепции с пограничностью')[1];
  assert.match(boundaryReceptionList, /Меркурий в Тельце.*Венера в Близнецах/);
  assert.match(boundaryReceptionList, /Солнце в Водолее.*Сатурн в Льве/);
  assert.match(boundaryReceptionList, /Солнце в Козероге.*Сатурн в Раке/);
  assert.ok(boundaryReceptionList.includes(SIGN_LABELS.Aquarius));
  assert.ok(boundaryReceptionList.includes(SIGN_LABELS.Cancer));
  assert.deepEqual({ chart, receptions, memberships, boundaryReceptions }, before);
});

it('highlights one or two next-best matrix values, but not three', () => {
  const values = [
    [9, 8, 8, 1, 0, 0],
    [9, 8, 8, 8, 0, 0],
    [1, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0],
  ];
  const rowTotals = [26, 33, 1, 1, 1, 1];
  const markup = renderResults({
    positions: {},
    pairs: [],
    result: {
      base: {
        calculation: { matrix: values, rowTotals, events: [] },
        ranking: buildRankingSnapshot(values, rowTotals),
      },
      variants: {},
    },
  });

  const rows = markup.match(/<tr>.*?<\/tr>/g);
  assert.match(rows[1], /matrix-runner-up/g);
  assert.equal((rows[1].match(/matrix-runner-up/g) ?? []).length, 2);
  assert.doesNotMatch(rows[2], /matrix-runner-up/);
});

it('renders cached reception-inclusive scores and Step 9 only when enabled', () => {
  const positions = {
    Sun: { sign: 'Gemini', house: 3 }, Moon: { sign: 'Leo', house: 5 },
    Mercury: { sign: 'Virgo', house: 6 }, Proserpina: { sign: 'Sagittarius', house: 9 },
    Venus: { sign: 'Aries', house: 7 }, Chiron: { sign: 'Pisces', house: 12 },
    Mars: { sign: 'Taurus', house: 8 }, Pluto: { sign: 'Scorpio', house: 1 },
    Jupiter: { sign: 'Capricorn', house: 10 }, Neptune: { sign: 'Aquarius', house: 11 },
    Saturn: { sign: 'Cancer', house: 4 }, Uranus: { sign: 'Libra', house: 2 },
  };
  const pairs = [{ id: 'Venus:Mars', planets: ['Venus', 'Mars'] }];
  const state = { positions, pairs, result: calculateWithReceptions(positions, pairs) };
  const baseline = renderResults(state);
  const receptionInclusive = renderResults(state, true);

  assert.doesNotMatch(baseline, /Шаг 9|\(рец \+\d+\)/);
  assert.match(receptionInclusive, /Шаг 9: Взаимные рецепции/);
  assert.match(receptionInclusive, /Венера в Тельце, 8 дом ↔ Марс в Овне, 7 дом/);
  assert.match(receptionInclusive, /\(рец \+\d+\)/);
});

it('omits zero reception breakdowns from the reception-inclusive view', () => {
  const positions = fixtures.cases[0].positions;
  const state = { positions, pairs: [], result: calculateWithReceptions(positions, []) };
  const markup = renderResults(state, true);

  assert.doesNotMatch(markup, /рец\)/);
  assert.doesNotMatch(markup, /\d+ \/ \d+/);
});

it('selects cached Feature-03 results and displays their score provenance', () => {
  const values = Array.from({ length: 6 }, () => Array(6).fill(5));
  const totals = Array(6).fill(30);
  const ranking = buildRankingSnapshot(values, totals);
  const variant = (boundary, reception) => ({
    matrix: values.map((row) => row.map((base) => ({ base, boundary, reception, total: base + boundary + reception }))),
    rowTotals: totals.map((base) => ({ base, boundary, reception, total: base + boundary + reception })),
    ranking, boundaries: [], receptions: [],
  });
  const result = {
    base: { calculation: { matrix: values, rowTotals: totals, events: [] }, ranking },
    variants: { '1000': variant(0, 3) },
    boundaryVariants: { '0100': variant(2, 0) },
    combinedVariants: { '1000:0100': variant(2, 3) },
  };
  const state = { positions: {}, pairs: [], result };
  const before = structuredClone(state);
  const baseline = renderResults(state, false, '1000', { includeBoundaries: false, boundaryOptionKey: '0100' });
  const reception = renderResults(state, true, '1000', { includeBoundaries: false, boundaryOptionKey: '0100' });
  const boundary = renderResults(state, false, '1000', { includeBoundaries: true, boundaryOptionKey: '0100' });
  const combined = renderResults(state, true, '1000', { includeBoundaries: true, boundaryOptionKey: '0100' });
  const plain = (markup) => markup.replace(/<[^>]+>/g, '');
  assert.doesNotMatch(plain(baseline), /5 \/ 10|Шаг 9/);
  assert.match(plain(reception), /5 \/ 8 \(\+3 рец\.\)/);
  assert.match(plain(boundary), /5 \/ 7 \(\+2 погр\.\)/);
  assert.match(plain(combined), /5 \/ 10 \(\+2п, \+3р\)/);
  assert.match(combined, /class="boundary-count"/);
  assert.match(combined, /class="reception-count"/);
  assert.match(styles, /\.reception-count, \.boundary-count \{ font-size: inherit;/);
  assert.match(styles, /\.reception-count \{ color: #21623f; \}/);
  assert.match(styles, /\.boundary-count \{ color: #815000; \}/);
  assert.doesNotMatch(boundary, /Шаг 9/);
  assert.deepEqual(state, before);
});

it('renders natal and post-exchange boundary events in their own steps and reception instances', () => {
  const positions = { Sun: { sign: 'Capricorn', house: 1 }, Saturn: { sign: 'Leo', house: 5 } };
  const pairs = [{ id: 'Sun:Saturn', planets: ['Sun', 'Saturn'] }];
  const boundaryReceptions = [{ id: 'Sun:Saturn:Aquarius:Leo', pairId: 'Sun:Saturn', planets: ['Sun', 'Saturn'], signs: ['Aquarius', 'Leo'] }];
  const values = Array.from({ length: 6 }, () => Array(6).fill(0));
  const totals = Array(6).fill(0);
  const ranking = buildRankingSnapshot(values, totals);
  const event = (step, reason) => ({ sourceChannel: 'luminaries', targetIndex: 0, step, reason });
  const scores = values.map((row) => row.map(() => ({ base: 0, boundary: 0, reception: 0, total: 0 })));
  const selected = {
    matrix: scores, rowTotals: scores.map((row) => row[0]), ranking,
    boundaries: [{ events: [event(2, 'natal boundary')] }],
    receptions: [
      { pairId: 'Sun:Saturn', events: [event(3, 'ordinary exchange')], boundaryEvents: [event(5, 'stationary partner')] },
      { pairId: 'Sun:Saturn:Aquarius:Leo', events: [], boundaryEvents: [event(8, 'second configuration')] },
    ],
  };
  const result = {
    base: { calculation: { matrix: values, rowTotals: totals, events: [event(2, 'baseline event')] }, ranking },
    variants: { '0111': { ...selected, boundaries: [], receptions: [selected.receptions[0]] } },
    boundaryVariants: { '0111': selected }, combinedVariants: { '0111:0111': selected },
  };
  const state = { positions, pairs, boundaryReceptions, result };
  const markup = renderResults(state, true, '0111', { includeBoundaries: true, boundaryOptionKey: '0111' });
  const channel = markup.split('data-channel="luminaries"')[1].split('</details>')[0];
  const step2 = channel.split('Шаг 2:')[1].split('Шаг 3:')[0];
  assert.match(step2, /baseline event/);
  assert.match(step2, /natal boundary \(погр\)/);
  assert.equal((channel.match(/baseline event/g) ?? []).length, 1);
  assert.match(channel, /Шаг 5: stationary partner \(погр\)/);
  assert.match(channel, /Шаг 8: second configuration \(погр\)/);
  assert.equal((channel.match(/class="reception-group"/g) ?? []).length, 2);
  assert.match(channel, /Водолее.*Льве/);
  const receptionOnly = renderResults(state, true);
  assert.match(receptionOnly, /ordinary exchange/);
  assert.doesNotMatch(receptionOnly, /natal boundary|stationary partner|second configuration/);
});
