import { readFile } from 'node:fs/promises';
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRankingSnapshot } from '../src/domain/calculate-channels.js';
import { calculateWithReceptions } from '../src/domain/calculate-with-receptions.js';
import { renderPositions, renderResults } from '../src/ui/render.js';

const fixtures = JSON.parse(
  await readFile(new URL('../astro_channels_fixtures_v1.json', import.meta.url), 'utf8'),
);

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
  assert.match(markup, /sun\.svg/);
  assert.match(markup, /capricorn-2\.svg/);
  assert.match(markup, /Планеты в соединении с <img class="astro-symbol" src="\.\/zodiacfonts\/sun\.svg/);
  assert.match(markup, /sun\.svg" alt="Солнце" title="Солнце" \/> <img class="astro-symbol" src="\.\/zodiacfonts\/conjunction\.svg/);
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
  assert.match(positionsMarkup, /astro-symbol-fallback/);
  assert.match(positionsMarkup, /11\.01\.1997 10:02:00 \(Europe\/Minsk\), Буда-Кошелёво, Беларусь, 53\.2000, 29\.2000/);
  assert.doesNotMatch(positionsMarkup, /Источник|Swiss Ephemeris/);
  assert.match(positionsMarkup, /<th>Планета<\/th><th>Дом<\/th>/);
  assert.match(positionsMarkup, /house-eleven\.svg/);
  assert.match(positionsMarkup, /Взаимные рецепции/);
  assert.match(positionsMarkup, /Венера в Козероге, 10 дом ↔ Марс в Весах, 7 дом/);
  assert.doesNotMatch(positionsMarkup, /<th>Знак<\/th>|<th>Координата<\/th>/);
  assert.ok(positionsMarkup.indexOf('sun.svg') < positionsMarkup.indexOf('moon.svg'));
  assert.ok(positionsMarkup.indexOf('chiron.svg') < positionsMarkup.indexOf('astro-symbol-fallback'));
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
