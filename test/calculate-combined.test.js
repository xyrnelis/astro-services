import { it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCombined, calculateCombinedFromBaseline } from '../src/domain/calculate-combined.js';
import { calculateChannels } from '../src/domain/calculate-channels.js';
import { calculateWithReceptions } from '../src/domain/calculate-with-receptions.js';
import { calculateWithBoundaries } from '../src/domain/calculate-with-boundaries.js';
import { findBoundaryMemberships } from '../src/domain/find-boundary-memberships.js';
import { findReceptionLists } from '../src/domain/find-receptions.js';
import { SIGN_NAMES } from '../src/domain/zodiac-signs.js';

const cusps = Array.from({ length: 12 }, (_, i) => (i * 30 + 15) % 360);
function chart(overrides) {
  const signs = { Sun: 'Gemini', Moon: 'Leo', Mercury: 'Virgo', Proserpina: 'Sagittarius', Venus: 'Taurus', Chiron: 'Pisces', Mars: 'Aries', Pluto: 'Gemini', Jupiter: 'Capricorn', Neptune: 'Aquarius', Saturn: 'Cancer', Uranus: 'Aquarius' };
  return Object.fromEntries(Object.entries(signs).map(([id, sign], i) => {
    const position = { sign, house: i + 1, longitude: SIGN_NAMES.indexOf(sign) * 30 + 10, ...overrides[id] };
    return [id, position];
  }));
}
function calculate(positions) {
  const memberships = findBoundaryMemberships(positions, cusps);
  const { receptions, boundaryReceptions } = findReceptionLists(positions, memberships);
  const inputs = structuredClone({ positions, cusps, memberships, receptions, boundaryReceptions });
  const result = calculateCombined(positions, cusps, memberships, receptions, boundaryReceptions);
  assert.deepEqual({ positions, cusps, memberships, receptions, boundaryReceptions }, inputs);
  return { result, memberships, receptions, boundaryReceptions };
}

it('derives every cache from the single supplied baseline', () => {
  const positions = chart({ Venus: { sign: 'Aries', longitude: 29 }, Mars: { sign: 'Taurus', longitude: 35 } });
  const memberships = findBoundaryMemberships(positions, cusps);
  const { receptions, boundaryReceptions } = findReceptionLists(positions, memberships);
  const baseline = calculateChannels(positions);
  baseline.matrix[0][0] += 17;
  baseline.rowTotals[0] += 17;
  const result = calculateCombinedFromBaseline(baseline, positions, cusps, memberships, receptions, boundaryReceptions);
  assert.strictEqual(result.base.calculation, baseline);
  for (const variants of [result.variants, result.boundaryVariants, result.combinedVariants]) {
    for (const variant of Object.values(variants)) {
      assert.equal(variant.matrix[0][0].base, baseline.matrix[0][0]);
      assert.equal(variant.rowTotals[0].base, baseline.rowTotals[0]);
    }
  }
});

it('prepares all caches and preserves existing variants and score provenance', () => {
  const positions = chart({ Venus: { sign: 'Aries', longitude: 29 }, Mars: { sign: 'Taurus', longitude: 35 } });
  const { result, memberships, receptions } = calculate(positions);
  assert.deepEqual(result.variants, calculateWithReceptions(positions, receptions).variants);
  assert.deepEqual(result.boundaryVariants, calculateWithBoundaries(positions, memberships).boundaryVariants);
  assert.equal(Object.keys(result.variants).length, 12);
  assert.equal(Object.keys(result.boundaryVariants).length, 12);
  assert.equal(Object.keys(result.combinedVariants).length, 144);
  for (const r of Object.keys(result.variants)) for (const b of Object.keys(result.boundaryVariants)) {
    const variant = result.combinedVariants[`${r}:${b}`];
    assert.ok(variant);
    const events = [...variant.boundaries.flatMap((group) => group.events), ...variant.receptions.flatMap((group) => [...group.events, ...group.boundaryEvents])];
    for (const [i, row] of variant.matrix.entries()) for (const [j, cell] of row.entries()) {
      assert.equal(cell.boundary, events.filter((e) => e.sourceIndex === i && e.targetIndex === j && e.phase !== 'reception').length);
      assert.equal(cell.reception, events.filter((e) => e.sourceIndex === i && e.targetIndex === j && e.phase === 'reception').length);
      assert.equal(cell.total, cell.base + cell.boundary + cell.reception);
    }
  }
  const group = result.combinedVariants['1111:1111'].receptions.find((g) => g.pairId === 'Venus:Mars');
  assert.ok(group.boundaryEvents.some((e) => e.sourcePlanet === 'Mars' && e.matchedSign === 'Taurus' && e.phase === 'post-exchange-boundary' && e.receptionId === group.pairId && e.triggerId === 'Mars:sign:Taurus'));
});

it('counts distinct configurations independently and preserves shared-pair exchanges', () => {
  const positions = chart({ Sun: { sign: 'Capricorn', longitude: 299 }, Saturn: { sign: 'Leo', longitude: 130 } });
  const { result } = calculate(positions);
  const groups = result.combinedVariants['1111:1111'].receptions.filter((g) => g.pairId.startsWith('Sun:Saturn'));
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].events.map(({ receptionId, ...event }) => event), groups[1].events.map(({ receptionId, ...event }) => event));
  assert.ok(groups.every((g) => g.boundaryEvents.length > 0));
  const shared = calculate(chart({ Mercury: { sign: 'Aries', longitude: 29, house: 2 }, Mars: { sign: 'Gemini', longitude: 70, house: 5 }, Pluto: { sign: 'Virgo', longitude: 160, house: 7 } })).result;
  for (const [id, planet] of [['Mercury:Mars', 'Mars'], ['Mercury:Pluto', 'Pluto']]) {
    assert.ok(shared.combinedVariants['1111:1111'].receptions.find((g) => g.pairId === id).boundaryEvents.some((e) => e.sourcePlanet === planet && e.matchedSign === 'Taurus'));
  }
});

it('keeps each exchange independent of reception pair order', () => {
  const positions = chart({ Mercury: { sign: 'Aries', longitude: 29, house: 2 }, Mars: { sign: 'Gemini', longitude: 70, house: 5 }, Pluto: { sign: 'Virgo', longitude: 160, house: 7 } });
  const memberships = findBoundaryMemberships(positions, cusps);
  const { receptions, boundaryReceptions } = findReceptionLists(positions, memberships);
  const normal = calculateCombined(positions, cusps, memberships, receptions, boundaryReceptions).combinedVariants['1111:1111'];
  const reversed = calculateCombined(positions, cusps, memberships, [...receptions].reverse(), boundaryReceptions).combinedVariants['1111:1111'];
  assert.deepEqual(normal.matrix, reversed.matrix);
  const byId = (groups) => Object.fromEntries(groups.map((group) => [group.pairId, group]));
  assert.deepEqual(byId(normal.receptions), byId(reversed.receptions));
});

it('preserves ordinary conjunctions and adds stationary boundary conjunctions', () => {
  for (const [sign, longitude, phase] of [['Taurus', 59, 'events'], ['Aries', 29, 'boundaryEvents']]) {
    const { result } = calculate(chart({ Mercury: { sign: 'Taurus', longitude: 35 }, Venus: { sign: 'Gemini', longitude: 65 }, Mars: { sign, longitude } }));
    const group = result.combinedVariants['1111:1111'].receptions.find((g) => g.pairId === 'Mercury:Venus');
    const events = group[phase].filter((e) => [5, 6].includes(e.step) && [e.sourcePlanet, e.matchedPlanet].includes('Mars') && [e.sourcePlanet, e.matchedPlanet].includes('Venus'));
    assert.equal(events.length, 2);
    if (phase === 'boundaryEvents') assert.ok(events.every((e) => e.triggerId === 'Mars:sign:Taurus'));
  }
});
