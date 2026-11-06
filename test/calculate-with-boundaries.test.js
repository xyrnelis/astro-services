import { it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateChannels, buildRankingSnapshot, createStepReason } from '../src/domain/calculate-channels.js';
import { calculateWithBoundaries } from '../src/domain/calculate-with-boundaries.js';

function positions(overrides = {}) {
  const base = {
    Sun: ['Gemini', 3], Moon: ['Leo', 5], Mercury: ['Virgo', 6], Proserpina: ['Sagittarius', 9],
    Venus: ['Taurus', 2], Chiron: ['Pisces', 12], Mars: ['Aries', 1], Pluto: ['Gemini', 8],
    Jupiter: ['Capricorn', 10], Neptune: ['Aquarius', 11], Saturn: ['Cancer', 4], Uranus: ['Aquarius', 7],
  };
  return Object.fromEntries(Object.entries(base).map(([planet, [sign, house]]) => [
    planet, { sign, house, ...overrides[planet] },
  ]));
}

function membership(chart, planetId, kind, value) {
  return {
    planetId, natalSign: chart[planetId].sign, natalHouse: chart[planetId].house, kind,
    ...(kind === 'sign' ? { addedSign: value, boundaryLongitude: 30 } : { addedHouse: value, cuspHouse: value, cuspLongitude: 90 }),
    distanceDegrees: 1,
  };
}

function multiset(events) {
  return events.map(({ sourceChannel, targetChannel, step, sourcePlanet, matchedPlanet, matchedSign, matchedHouse }) =>
    `${sourceChannel}:${step}:${targetChannel}:${sourcePlanet}:${matchedPlanet ?? ''}:${matchedSign ?? matchedHouse}`).sort();
}

it('TC-05 and TC-07: scores only new sign facts and preserves baseline, inputs and exact provenance', () => {
  const chart = positions({ Jupiter: { sign: 'Aries' } });
  const memberships = [membership(chart, 'Mars', 'sign', 'Taurus')];
  const before = structuredClone({ chart, memberships });
  const result = calculateWithBoundaries(chart, memberships);
  assert.deepEqual({ chart, memberships }, before);
  assert.deepEqual(result.base.calculation, calculateChannels(chart));
  assert.deepEqual(Object.keys(result.boundaryVariants).sort(), ['0000', '1000', '0100', '1100', '0010', '1010', '0110', '1110', '0011', '1011', '0111', '1111'].sort());
  const variant = result.boundaryVariants['1111'];
  const [group] = variant.boundaries;
  assert.equal(group.triggerId, 'Mars:sign:Taurus');
  assert.deepEqual(group.affectedSourceChannels, ['venus', 'mars']);
  assert.deepEqual(multiset(group.events), [
    'mars:1:venus:Mars::Taurus', 'mars:5:venus:Mars:Venus:Taurus',
    'venus:5:mars:Venus:Mars:Taurus', 'venus:8:mars:Mars::Taurus',
  ].sort());
  for (const event of group.events) {
    assert.equal(event.triggerId, group.triggerId);
    assert.equal(event.phase, 'natal-boundary');
    assert.equal(event.points, 1);
    assert.equal(event.reason, createStepReason(event.step, event));
  }
  assert.equal(result.boundaryVariants['0111'].boundaries[0].events.length, 3);
  assert.equal(variant.overallScore.boundary, 4);
  for (const current of Object.values(result.boundaryVariants)) {
    const events = current.boundaries.flatMap((item) => item.events);
    for (const [index, row] of current.matrix.entries()) {
      for (const [targetIndex, cell] of row.entries()) {
        assert.deepEqual(cell, {
          base: result.base.calculation.matrix[index][targetIndex],
          boundary: events.filter((event) => event.sourceIndex === index && event.targetIndex === targetIndex).length,
          reception: 0, total: cell.base + cell.boundary,
        });
      }
      assert.equal(current.rowTotals[index].total, row.reduce((sum, cell) => sum + cell.total, 0));
    }
    assert.equal(current.overallScore.total, current.rowTotals.reduce((sum, row) => sum + row.total, 0));
    assert.deepEqual(current.ranking, buildRankingSnapshot(current.matrix.map((row) => row.map((cell) => cell.total)), current.rowTotals.map((row) => row.total)));
  }
});

it('TC-06: preserves independent sign triggers for the same pair', () => {
  const chart = positions();
  const result = calculateWithBoundaries(chart, [membership(chart, 'Mars', 'sign', 'Taurus'), membership(chart, 'Venus', 'sign', 'Aries')]);
  const groups = result.boundaryVariants['1111'].boundaries;
  assert.deepEqual(groups.map((group) => group.triggerId), ['Mars:sign:Taurus', 'Venus:sign:Aries']);
  assert.deepEqual(groups.map((group) => group.events.filter((event) => [5, 6].includes(event.step)).length), [2, 2]);
  assert.deepEqual(result.boundaryVariants['0000'].boundaries.map((group) => group.events.length), [3, 3]);
});

it('TC-08 and TC-11: gates same-channel signs and conjunctions independently', () => {
  const chart = positions({ Moon: { sign: 'Cancer' }, Venus: { sign: 'Leo' } });
  const result = calculateWithBoundaries(chart, [membership(chart, 'Moon', 'sign', 'Leo')]);
  const steps = (key) => result.boundaryVariants[key].boundaries[0].events.map((event) => event.step).sort();
  assert.deepEqual(steps('0000'), []);
  assert.deepEqual(steps('0010'), [3]);
  assert.deepEqual(steps('1010'), [3, 8]);
  assert.deepEqual(steps('0011'), [3, 5, 6]);
  assert.deepEqual(steps('1011'), [3, 5, 6, 8]);
});

it('TC-09: gates same-channel houses and step 7', () => {
  const chart = positions({ Mars: { house: 4 } });
  const result = calculateWithBoundaries(chart, [membership(chart, 'Mars', 'house', 5)]);
  assert.deepEqual(result.boundaryVariants['1000'].boundaries[0].events, []);
  assert.deepEqual(multiset(result.boundaryVariants['1100'].boundaries[0].events), [
    'luminaries:7:mars:Mars::5', 'mars:2:luminaries:Mars::5',
  ]);
});

it('TC-10: combines sign with distinct house facts without repeated sign awards', () => {
  const chart = positions({ Mars: { house: 7 } });
  const memberships = [membership(chart, 'Mars', 'sign', 'Taurus'), membership(chart, 'Mars', 'house', 8), membership(chart, 'Mars', 'house', 9)];
  const groups = calculateWithBoundaries(chart, [...memberships, { ...memberships[1], cuspHouse: 9 }]).boundaryVariants['1111'].boundaries;
  assert.deepEqual(groups.map((group) => group.triggerId), ['Mars:sign:Taurus', 'Mars:house:8', 'Mars:house:9']);
  assert.deepEqual(multiset(groups.flatMap((group) => group.events)), [
    'mars:1:venus:Mars::Taurus', 'mars:5:venus:Mars:Venus:Taurus', 'venus:5:mars:Venus:Mars:Taurus', 'venus:8:mars:Mars::Taurus',
    'mars:2:mars:Mars::8', 'mars:7:mars:Mars::8', 'mars:2:jupiter:Mars::9', 'jupiter:7:mars:Mars::9',
  ].sort());
});

it('does not repeat a natal conjunction when both planets have Taurus as an added sign', () => {
  const chart = positions({ Mars: { longitude: 29 }, Jupiter: { sign: 'Aries', longitude: 28 } });
  const groups = calculateWithBoundaries(chart, [
    membership(chart, 'Mars', 'sign', 'Taurus'), membership(chart, 'Jupiter', 'sign', 'Taurus'),
  ]).boundaryVariants['1111'].boundaries;
  for (const group of groups) {
    assert.equal(group.events.filter((event) => [5, 6].includes(event.step)
      && ['Mars', 'Jupiter'].includes(event.sourcePlanet)
      && ['Mars', 'Jupiter'].includes(event.matchedPlanet)).length, 0, group.triggerId);
    assert.ok(group.events.some((event) => [1, 3].includes(event.step)), group.triggerId);
    assert.ok(group.events.some((event) => event.step === 8), group.triggerId);
  }
});
