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

it('rejects malformed reception pairs before calculating scores', () => {
  assert.throws(
    () => calculateWithReceptions(positions(), [{ id: 'Chiron:Mars', planets: ['Chiron', 'Mars'] }]),
    /Некорректная взаимная рецепция/,
  );
});
