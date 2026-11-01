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

it('flags a body placed exactly on a house cusp', async () => {
  const ephemeris = {
    async calculate() {
      return {
        cusps: Array.from({ length: 12 }, (_, index) => index * 30),
        positions: Object.fromEntries(PLANETS.map((planet) => [planet, { longitude: planet === 'Sun' ? 30 : 10 }])),
      };
    },
  };

  await assert.rejects(
    () => calculateChart({ utc: new Date('1997-01-11T08:02:44Z'), latitude: 53.2, longitude: 29.2 }, ephemeris),
    (error) => error instanceof ChartCalculationError && error.code === 'cusp-boundary',
  );
});
