import { it } from 'node:test';
import assert from 'node:assert/strict';
import { ChartCalculationError, calculateChart } from '../src/astronomy/chart-calculator.js';
import { PLANETS } from '../src/domain/channels.js';

it('stops when Placidus house cusps are unavailable', async () => {
  const ephemeris = {
    async calculate() {
      return { positions: {}, cusps: null };
    },
  };

  await assert.rejects(
    () => calculateChart({ utc: new Date('1997-01-11T08:02:44Z'), latitude: 53.2167, longitude: 29.2 }, ephemeris),
    (error) => error instanceof ChartCalculationError && error.code === 'placidus-unavailable',
  );
});

it('rejects a Porphyry substitution instead of presenting it as Placidus', async () => {
  const ephemeris = {
    async calculate() {
      return {
        substituted: true,
        cusps: Array.from({ length: 12 }, (_, index) => index * 30),
        positions: Object.fromEntries(PLANETS.map((planet) => [planet, { longitude: 10 }])),
      };
    },
  };

  await assert.rejects(
    () => calculateChart({ utc: new Date('1997-01-11T08:02:44Z'), latitude: 69.65, longitude: 18.96 }, ephemeris),
    (error) => error instanceof ChartCalculationError && error.code === 'placidus-unavailable',
  );
});

it('assigns each cusp and its neighboring longitudes to the correct houses', async () => {
  const cusps = Array.from({ length: 12 }, (_, index) => index * 30);
  cusps[1] = 3 + 4 / 60 + 11 / 3600;
  const input = { utc: new Date('1997-01-11T08:02:44Z'), latitude: 53.2, longitude: 29.2 };

  for (const [index, cusp] of cusps.entries()) {
    for (const [longitude, house] of [
      [cusp - 1 / 3600, index === 0 ? 12 : index],
      [cusp, index + 1],
      [cusp + 1 / 3600, index + 1],
      [cusp + 1e-10, index + 1],
    ]) {
      const ephemeris = {
        async calculate() {
          return {
            cusps,
            positions: Object.fromEntries(PLANETS.map((planet) => [planet, { longitude }])),
          };
        },
      };
      const chart = await calculateChart(input, ephemeris);
      assert.equal(chart.positions.Sun.house, house, `longitude ${longitude} near cusp ${index + 1}`);
    }
  }
});
