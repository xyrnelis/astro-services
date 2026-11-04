import { it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateChannels } from '../src/domain/calculate-channels.js';
import { calculateWithReceptions } from '../src/domain/calculate-with-receptions.js';

function positions(overrides = {}) {
  const base = {
    Sun: { sign: 'Gemini', house: 3 }, Moon: { sign: 'Leo', house: 5 },
    Mercury: { sign: 'Virgo', house: 6 }, Proserpina: { sign: 'Sagittarius', house: 9 },
    Venus: { sign: 'Taurus', house: 2 }, Chiron: { sign: 'Pisces', house: 12 },
    Mars: { sign: 'Aries', house: 1 }, Pluto: { sign: 'Gemini', house: 8 },
    Jupiter: { sign: 'Capricorn', house: 10 }, Neptune: { sign: 'Aquarius', house: 11 },
    Saturn: { sign: 'Cancer', house: 4 }, Uranus: { sign: 'Aquarius', house: 7 },
  };
  return Object.fromEntries(Object.entries(base).map(([planet, position]) => [
    planet,
    { ...position, ...overrides[planet] },
  ]));
}

function eventSummary(events) {
  return events.map((event) => ({
    sourceChannel: event.sourceChannel,
    targetChannel: event.targetChannel,
    step: event.step,
    sourcePlanet: event.sourcePlanet,
    matchedPlanet: event.matchedPlanet,
    receptionId: event.receptionId,
  }));
}

function eventMultiset(events) {
  return eventSummary(events)
    .map((event) => `${event.sourceChannel}:${event.step}:${event.targetChannel}:${event.sourcePlanet}:${event.matchedPlanet ?? ''}`)
    .sort();
}

function pairEvents(original, pair, optionKey) {
  return calculateWithReceptions(original, [pair]).variants[optionKey].receptions[0].events;
}

it('builds immutable baseline and every valid cached option variant', () => {
  const original = positions({ Mars: { sign: 'Libra', house: 7 }, Chiron: { sign: 'Scorpio', house: 7 } });
  const before = structuredClone(original);
  const result = calculateWithReceptions(original, [{ id: 'Mars:Chiron', planets: ['Mars', 'Chiron'] }]);

  assert.deepEqual(original, before);
  assert.deepEqual(result.base.calculation, calculateChannels(original));
  assert.deepEqual(Object.keys(result.variants).sort(), [
    '0000', '1000', '0100', '1100', '0010', '1010',
    '0110', '1110', '0011', '1011', '0111', '1111',
  ].sort());
  assert.deepEqual(eventSummary(result.variants['1000'].receptions[0].events), [
    { sourceChannel: 'mars', targetChannel: 'mars', step: 1, sourcePlanet: 'Mars', matchedPlanet: undefined, receptionId: 'Mars:Chiron' },
    { sourceChannel: 'mars', targetChannel: 'mars', step: 8, sourcePlanet: 'Mars', matchedPlanet: undefined, receptionId: 'Mars:Chiron' },
    { sourceChannel: 'venus', targetChannel: 'venus', step: 3, sourcePlanet: 'Chiron', matchedPlanet: undefined, receptionId: 'Mars:Chiron' },
    { sourceChannel: 'venus', targetChannel: 'venus', step: 8, sourcePlanet: 'Chiron', matchedPlanet: undefined, receptionId: 'Mars:Chiron' },
  ]);
  assert.equal(result.variants['1000'].overallScore.reception, 4);
  assert.deepEqual(result.variants['0000'].receptions[0].events.map((event) => event.step), [1, 3]);
});

it('counts both sides of a newly formed conjunction and includes the stationary source channel', () => {
  const original = positions({
    Mars: { sign: 'Libra', house: 7 }, Chiron: { sign: 'Scorpio', house: 7 },
    Jupiter: { sign: 'Scorpio', house: 7 },
  });
  const reception = calculateWithReceptions(original, [{ id: 'Mars:Chiron', planets: ['Mars', 'Chiron'] }])
    .variants['1000'].receptions[0];

  assert.deepEqual(reception.affectedSourceChannels, ['venus', 'mars', 'jupiter']);
  assert.deepEqual(eventSummary(reception.events), [
    { sourceChannel: 'mars', targetChannel: 'mars', step: 1, sourcePlanet: 'Mars', matchedPlanet: undefined, receptionId: 'Mars:Chiron' },
    { sourceChannel: 'mars', targetChannel: 'mars', step: 8, sourcePlanet: 'Mars', matchedPlanet: undefined, receptionId: 'Mars:Chiron' },
    { sourceChannel: 'venus', targetChannel: 'venus', step: 3, sourcePlanet: 'Chiron', matchedPlanet: undefined, receptionId: 'Mars:Chiron' },
    { sourceChannel: 'venus', targetChannel: 'venus', step: 8, sourcePlanet: 'Chiron', matchedPlanet: undefined, receptionId: 'Mars:Chiron' },
    { sourceChannel: 'mars', targetChannel: 'jupiter', step: 5, sourcePlanet: 'Mars', matchedPlanet: 'Jupiter', receptionId: 'Mars:Chiron' },
    { sourceChannel: 'jupiter', targetChannel: 'mars', step: 5, sourcePlanet: 'Jupiter', matchedPlanet: 'Mars', receptionId: 'Mars:Chiron' },
  ]);
});

it('keeps stationary conjunction channels as candidates when option 4 suppresses awards', () => {
  const original = positions({
    Mars: { sign: 'Scorpio', house: 7 }, Pluto: { sign: 'Aries', house: 7 },
    Jupiter: { sign: 'Aries', house: 7 }, Venus: { sign: 'Scorpio', house: 7 },
  });
  const reception = calculateWithReceptions(original, [{ id: 'Mars:Pluto', planets: ['Mars', 'Pluto'] }])
    .variants['1010'].receptions[0];

  assert.deepEqual(reception.affectedSourceChannels, ['venus', 'mars', 'jupiter']);
  assert.doesNotMatch(reception.events.map((event) => event.step).join(','), /5|6/);
});

it('covers TC-02: sign and house transitions create exactly eight events', () => {
  const events = pairEvents(positions({
    Mars: { sign: 'Libra', house: 6 }, Chiron: { sign: 'Scorpio', house: 7 },
  }), { id: 'Mars:Chiron', planets: ['Mars', 'Chiron'] }, '1000');

  assert.deepEqual(eventMultiset(events), [
    'mars:1:mars:Mars:', 'mars:2:venus:Mars:', 'mars:8:mars:Mars:',
    'mercury:7:venus:Chiron:', 'venus:3:venus:Chiron:',
    'venus:4:mercury:Chiron:', 'venus:7:mars:Mars:', 'venus:8:venus:Chiron:',
  ].sort());
});

it('covers TC-04: two newly formed conjunctions create four conjunction events', () => {
  const events = pairEvents(positions({
    Mars: { sign: 'Libra', house: 7 }, Chiron: { sign: 'Scorpio', house: 7 },
    Jupiter: { sign: 'Scorpio', house: 7 }, Saturn: { sign: 'Libra', house: 7 },
  }), { id: 'Mars:Chiron', planets: ['Mars', 'Chiron'] }, '1000');

  assert.equal(events.length, 8);
  assert.deepEqual(eventMultiset(events.filter((event) => event.step === 5 || event.step === 6)), [
    'jupiter:5:mars:Jupiter:Mars', 'mars:5:jupiter:Mars:Jupiter',
    'saturn:5:venus:Saturn:Chiron', 'venus:6:saturn:Chiron:Saturn',
  ]);
});

it('covers TC-05 and TC-06 house-option variants', () => {
  const identicalHouse = positions({ Mars: { sign: 'Aries', house: 7 }, Pluto: { sign: 'Scorpio', house: 7 } });
  const differentHouses = positions({ Mars: { sign: 'Aries', house: 4 }, Pluto: { sign: 'Scorpio', house: 5 } });
  const pair = { id: 'Mars:Pluto', planets: ['Mars', 'Pluto'] };

  assert.deepEqual(eventMultiset(pairEvents(identicalHouse, pair, '1100')), [
    'mars:2:venus:Mars:', 'mars:4:venus:Pluto:', 'venus:7:mars:Mars:', 'venus:7:mars:Pluto:',
  ].sort());
  assert.deepEqual(eventMultiset(pairEvents(identicalHouse, pair, '0100')), [
    'mars:2:venus:Mars:', 'mars:4:venus:Pluto:',
  ].sort());
  assert.deepEqual(pairEvents(identicalHouse, pair, '1000'), []);
  assert.deepEqual(eventMultiset(pairEvents(differentHouses, pair, '1100')), [
    'luminaries:7:mars:Mars:', 'luminaries:7:mars:Pluto:',
    'mars:2:luminaries:Mars:', 'mars:4:luminaries:Pluto:',
  ].sort());
});

it('covers TC-07 and TC-08 sign-option variants', () => {
  const signExchange = positions({ Mars: { sign: 'Aries', house: 7 }, Pluto: { sign: 'Scorpio', house: 7 } });
  const conjunctionExchange = positions({
    Mars: { sign: 'Scorpio', house: 7 }, Pluto: { sign: 'Aries', house: 7 },
    Jupiter: { sign: 'Aries', house: 7 }, Venus: { sign: 'Scorpio', house: 7 },
  });
  const pair = { id: 'Mars:Pluto', planets: ['Mars', 'Pluto'] };

  assert.deepEqual(eventMultiset(pairEvents(signExchange, pair, '1010')), [
    'mars:1:mars:Mars:', 'mars:3:mars:Pluto:', 'mars:8:mars:Mars:', 'mars:8:mars:Pluto:',
  ].sort());
  assert.deepEqual(pairEvents(signExchange, pair, '1000'), []);
  assert.equal(pairEvents(conjunctionExchange, pair, '1011').length, 8);
  assert.equal(pairEvents(conjunctionExchange, pair, '1010').length, 4);
});

it('keeps overlapping reception scores independent of supplied pair order', () => {
  const original = positions({
    Mars: { sign: 'Libra', house: 7 }, Chiron: { sign: 'Scorpio', house: 7 },
    Pluto: { sign: 'Gemini', house: 6 },
  });
  const pairs = [
    { id: 'Mars:Chiron', planets: ['Mars', 'Chiron'] },
    { id: 'Mars:Pluto', planets: ['Mars', 'Pluto'] },
  ];
  const forward = calculateWithReceptions(original, pairs).variants['1000'];
  const reversed = calculateWithReceptions(original, [...pairs].reverse()).variants['1000'];

  assert.deepEqual(forward.matrix, reversed.matrix);
  assert.deepEqual(forward.rowTotals, reversed.rowTotals);
  assert.deepEqual(forward.ranking, reversed.ranking);
  assert.deepEqual(
    eventMultiset(forward.receptions.flatMap((contribution) => contribution.events)),
    eventMultiset(reversed.receptions.flatMap((contribution) => contribution.events)),
  );
});

it('rejects malformed reception pairs before calculating scores', () => {
  assert.throws(
    () => calculateWithReceptions(positions(), [{ id: 'Chiron:Mars', planets: ['Chiron', 'Mars'] }]),
    /Некорректная взаимная рецепция/,
  );
});
