import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateChannels } from '../src/domain/calculate-channels.js';

const fixtures = JSON.parse(
  await readFile(new URL('../astro_channels_fixtures_v1.json', import.meta.url), 'utf8'),
);

describe('calculateChannels', () => {
  for (const fixture of fixtures.cases) {
    it(`reproduces the ${fixture.id} reference matrix`, () => {
      const result = calculateChannels(fixture.positions);

      assert.deepEqual(result.matrix, fixture.expected_matrix);
      assert.deepEqual(result.rowTotals, fixture.expected_row_totals);
      assert.equal(result.grandTotal, fixture.expected_grand_total);
      assert.ok(result.globalTopByTotal.includes(fixture.expected_global_top));
      assert.equal(result.isSymmetric, true);

      for (let source = 0; source < result.matrix.length; source += 1) {
        for (let target = 0; target < result.matrix[source].length; target += 1) {
          const eventCount = result.events.filter(
            (event) => event.sourceIndex === source && event.targetIndex === target,
          ).length;
          assert.equal(eventCount, result.matrix[source][target]);
        }
      }
    });
  }

  it('counts each co-sign event independently without matching a planet to itself', () => {
    const result = calculateChannels({
      Sun: { sign: 'Aries', house: 1 },
      Moon: { sign: 'Aries', house: 2 },
      Mercury: { sign: 'Taurus', house: 3 },
      Proserpina: { sign: 'Gemini', house: 4 },
      Venus: { sign: 'Cancer', house: 5 },
      Chiron: { sign: 'Leo', house: 6 },
      Mars: { sign: 'Virgo', house: 7 },
      Pluto: { sign: 'Libra', house: 8 },
      Jupiter: { sign: 'Scorpio', house: 9 },
      Neptune: { sign: 'Sagittarius', house: 10 },
      Saturn: { sign: 'Capricorn', house: 11 },
      Uranus: { sign: 'Aquarius', house: 12 },
    });
    const luminariesEvents = result.events.filter((event) => event.sourceChannel === 'luminaries');

    assert.equal(
      luminariesEvents.filter((event) => event.step === 5 && event.matchedPlanet === 'Moon').length,
      1,
    );
    assert.equal(
      luminariesEvents.filter((event) => event.step === 6 && event.matchedPlanet === 'Sun').length,
      1,
    );
    assert.equal(luminariesEvents.filter((event) => event.sourcePlanet === event.matchedPlanet).length, 0);
  });
});
