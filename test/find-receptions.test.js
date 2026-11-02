import { it } from 'node:test';
import assert from 'node:assert/strict';
import { rulersBySign } from '../src/domain/channel-relations.js';
import { findReceptions } from '../src/domain/find-receptions.js';

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
