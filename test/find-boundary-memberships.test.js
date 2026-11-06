import { it } from 'node:test';
import assert from 'node:assert/strict';
import { DISPLAY_PLANETS } from '../src/domain/channels.js';
import { findBoundaryMemberships } from '../src/domain/find-boundary-memberships.js';

const second = 1 / 3600;
const ordinaryCusps = Array.from({ length: 12 }, (_, index) => 10 + index * 30);

function positions(sun) {
  return Object.fromEntries(DISPLAY_PLANETS.map((planet) => [
    planet, planet === 'Sun' ? sun : { longitude: 15, sign: 'Aries', house: 1 },
  ]));
}

function sunMemberships(longitude, sign, house, cusps = ordinaryCusps) {
  return findBoundaryMemberships(positions({ longitude, sign, house }), cusps)
    .filter((membership) => membership.planetId === 'Sun');
}

it('detects inclusive sign thresholds without rounding and wraps Pisces and Aries', () => {
  for (const [longitude, sign, addedSign, boundaryLongitude, distanceDegrees] of [
    [3 + second, 'Aries', null], [3, 'Aries', 'Pisces', 0, 3],
    [3 - second, 'Aries', 'Pisces', 0, 3 - second],
    [0, 'Aries', 'Pisces', 0, 0], [27 - second, 'Aries', null],
    [27, 'Aries', 'Taurus', 30, 3], [27 + second, 'Aries', 'Taurus', 30, 3 - second],
    [30 - second, 'Aries', 'Taurus', 30, second],
    [360 - second, 'Pisces', 'Aries', 0, second], [360, 'Aries', 'Pisces', 0, 0],
  ]) {
    const memberships = sunMemberships(longitude, sign, 1).filter((entry) => entry.kind === 'sign');
    assert.equal(memberships.length, addedSign ? 1 : 0, `longitude ${longitude}`);
    if (addedSign) {
      const [entry] = memberships;
      assert.deepEqual({ ...entry, distanceDegrees: 0 }, {
        planetId: 'Sun', natalSign: sign, natalHouse: 1, kind: 'sign', addedSign,
        boundaryLongitude, distanceDegrees: 0,
      });
      assert.ok(Math.abs(entry.distanceDegrees - distanceDegrees) < 1e-12);
    }
  }
});

it('detects both sides of a cusp, including the exact cusp and inclusive orb', () => {
  const cusps = [220, 250, 280, 310, 340, 10, 40, 100, 130, 160, 180, 200];
  for (const [longitude, house, addedHouse] of [
    [98.5 - second, 7, null], [98.5, 7, 8], [98.5 + second, 7, 8], [100, 8, 7],
    [101.5 - second, 8, 7], [101.5, 8, 7], [101.5 + second, 8, null],
  ]) {
    const entries = sunMemberships(longitude, 'Cancer', house, cusps).filter((entry) => entry.kind === 'house');
    assert.equal(entries.length, addedHouse ? 1 : 0, `longitude ${longitude}`);
    if (addedHouse) assert.deepEqual(entries[0], {
      planetId: 'Sun', natalSign: 'Cancer', natalHouse: house, kind: 'house', addedHouse,
      cuspHouse: 8, cuspLongitude: 100, distanceDegrees: Math.abs(longitude - 100),
    });
  }
});

it('orders results by planet and then sign and cusp triggers', () => {
  const cusps = [220, 250, 280, 310, 90, 92, 130, 160, 180, 190, 200, 210];
  const chartPositions = positions({ longitude: 91, sign: 'Cancer', house: 5 });
  chartPositions.Moon = { longitude: 91, sign: 'Cancer', house: 5 };
  const entries = findBoundaryMemberships(chartPositions, cusps);
  assert.deepEqual(entries.map(({ planetId, kind, cuspHouse }) => [planetId, kind, cuspHouse]), [
    ['Sun', 'sign', undefined], ['Sun', 'house', 5], ['Sun', 'house', 6],
    ['Moon', 'sign', undefined], ['Moon', 'house', 5], ['Moon', 'house', 6],
  ]);
});

it('retains multiple cusp triggers, wraps houses 12 and 1, and does not mutate inputs', () => {
  const cusps = [220, 250, 280, 310, 100, 102, 130, 160, 180, 190, 200, 210];
  const chartPositions = positions({ longitude: 101, sign: 'Cancer', house: 5 });
  const original = structuredClone({ chartPositions, cusps });
  const entries = findBoundaryMemberships(chartPositions, cusps).filter((entry) => entry.planetId === 'Sun');
  assert.deepEqual(entries.map((entry) => [entry.kind, entry.addedHouse, entry.cuspHouse]), [
    ['house', 4, 5], ['house', 6, 6],
  ]);
  assert.deepEqual({ chartPositions, cusps }, original);

  const wrapCusps = Array.from({ length: 12 }, (_, index) => index * 30);
  for (const [longitude, sign, house, addedHouse] of [[359.5, 'Pisces', 12, 1], [0, 'Aries', 1, 12]]) {
    const entry = sunMemberships(longitude, sign, house, wrapCusps).find((item) => item.kind === 'house');
    assert.deepEqual([entry.addedHouse, entry.cuspHouse, entry.cuspLongitude, entry.distanceDegrees],
      [addedHouse, 1, 0, longitude === 0 ? 0 : 0.5]);
  }
});
