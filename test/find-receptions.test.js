import { it } from 'node:test';
import assert from 'node:assert/strict';
import { rulersBySign } from '../src/domain/channel-relations.js';
import { findReceptionLists, findReceptions } from '../src/domain/find-receptions.js';

function positions(overrides = {}) {
  const defaults = {
    Sun: 'Gemini', Moon: 'Gemini', Mercury: 'Gemini', Venus: 'Gemini',
    Mars: 'Gemini', Jupiter: 'Gemini', Saturn: 'Gemini', Uranus: 'Gemini',
    Neptune: 'Gemini', Pluto: 'Gemini', Chiron: 'Gemini', Proserpina: 'Gemini',
  };
  return Object.fromEntries(Object.entries({ ...defaults, ...overrides }).map(([planet, sign]) => [planet, { sign }]));
}

it('derives both sign rulers from the channel catalog', () => {
  assert.deepEqual(rulersBySign.Aries, ['Mars', 'Pluto']);
  assert.deepEqual(rulersBySign.Cancer, ['Sun', 'Moon']);
  assert.equal(Object.keys(rulersBySign).length, 12);
});

it('detects canonical, minor-ruler, same-channel, and intersecting receptions', () => {
  const intersecting = findReceptions(positions({
    Venus: 'Aries', Mars: 'Taurus', Pluto: 'Taurus',
  }));
  const minorRuler = findReceptions(positions({ Mars: 'Cancer', Sun: 'Scorpio' }));
  const sameChannel = findReceptions(positions({ Mars: 'Aries', Pluto: 'Scorpio' }));

  assert.deepEqual(intersecting, [
    { id: 'Venus:Mars', planets: ['Venus', 'Mars'] },
    { id: 'Venus:Pluto', planets: ['Venus', 'Pluto'] },
  ]);
  assert.deepEqual(minorRuler, [{ id: 'Sun:Mars', planets: ['Sun', 'Mars'] }]);
  assert.deepEqual(sameChannel, [{ id: 'Mars:Pluto', planets: ['Mars', 'Pluto'] }]);
});

it('excludes same-sign and one-sided pairs', () => {
  const result = findReceptions(positions({
    Venus: 'Aries', Mars: 'Taurus', Pluto: 'Taurus',
  }));

  assert.ok(result.some((pair) => pair.id === 'Venus:Mars'));
  assert.ok(result.some((pair) => pair.id === 'Venus:Pluto'));
  assert.ok(!result.some((pair) => pair.id === 'Mars:Pluto'));
  assert.ok(!result.some((pair) => pair.id === 'Sun:Moon'));
});

it('rejects incomplete or invalid chart positions', () => {
  assert.throws(() => findReceptions({}), /Некорректное положение объекта: Sun/);
  assert.throws(
    () => findReceptions(positions({ Sun: 'NotASign' })),
    /Некорректное положение объекта: Sun/,
  );
});

it('detects a new reception from an added sign without changing the original list', () => {
  const chart = positions({ Mercury: 'Aries', Venus: 'Gemini', Chiron: 'Aries' });
  const memberships = [{ planetId: 'Mercury', kind: 'sign', addedSign: 'Taurus' }];
  const before = structuredClone({ chart, memberships });
  const result = findReceptionLists(chart, memberships);
  assert.deepEqual(result.receptions, findReceptions(chart));
  assert.deepEqual(result.boundaryReceptions, [{
    id: 'Mercury:Venus:Taurus:Gemini', pairId: 'Mercury:Venus',
    planets: ['Mercury', 'Venus'], signs: ['Taurus', 'Gemini'],
    triggerIds: ['Mercury:sign:Taurus'],
  }]);
  assert.deepEqual({ chart, memberships }, before);
});

it('keeps natal and distinct boundary configurations, in option order, without duplicates', () => {
  const chart = positions({ Sun: 'Capricorn', Saturn: 'Leo' });
  const memberships = [
    { planetId: 'Saturn', kind: 'sign', addedSign: 'Cancer' },
    { planetId: 'Sun', kind: 'sign', addedSign: 'Aquarius' },
    { planetId: 'Sun', kind: 'sign', addedSign: 'Aquarius' },
    { planetId: 'Sun', kind: 'sign', addedSign: 'Capricorn' },
    { planetId: 'Sun', kind: 'house', addedHouse: 2 },
  ];
  const { receptions, boundaryReceptions } = findReceptionLists(chart, memberships);
  assert.deepEqual(receptions, findReceptions(chart));
  assert.ok(receptions.some(({ id }) => id === 'Sun:Saturn'));
  assert.deepEqual(boundaryReceptions.filter(({ pairId }) => pairId === 'Sun:Saturn'), [
    { id: 'Sun:Saturn:Capricorn:Cancer', pairId: 'Sun:Saturn', planets: ['Sun', 'Saturn'],
      signs: ['Capricorn', 'Cancer'], triggerIds: ['Saturn:sign:Cancer'] },
    { id: 'Sun:Saturn:Aquarius:Leo', pairId: 'Sun:Saturn', planets: ['Sun', 'Saturn'],
      signs: ['Aquarius', 'Leo'], triggerIds: ['Sun:sign:Aquarius'] },
    { id: 'Sun:Saturn:Aquarius:Cancer', pairId: 'Sun:Saturn', planets: ['Sun', 'Saturn'],
      signs: ['Aquarius', 'Cancer'], triggerIds: ['Sun:sign:Aquarius', 'Saturn:sign:Cancer'] },
  ]);
  assert.deepEqual(findReceptionLists(chart, memberships), { receptions, boundaryReceptions });
});

it('excludes same-sign configurations and retains canonical pair and membership order', () => {
  const chart = positions({ Venus: 'Aries', Mars: 'Taurus', Pluto: 'Taurus' });
  const memberships = [
    { planetId: 'Venus', kind: 'sign', addedSign: 'Scorpio' },
    { planetId: 'Venus', kind: 'sign', addedSign: 'Taurus' },
    { planetId: 'Venus', kind: 'sign', addedSign: 'Aries' },
    { planetId: 'Mars', kind: 'sign', addedSign: 'Libra' },
  ];
  const { boundaryReceptions } = findReceptionLists(chart, memberships);
  assert.deepEqual(boundaryReceptions.map(({ id }) => id), [
    'Venus:Mars:Aries:Libra', 'Venus:Mars:Scorpio:Taurus',
    'Venus:Mars:Scorpio:Libra', 'Venus:Pluto:Scorpio:Taurus',
  ]);
  assert.throws(() => findReceptionLists({}, []), /Некорректное положение объекта: Sun/);
});
