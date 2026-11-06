import { CHANNELS } from './channels.js';
import { buildRankingSnapshot, calculateChannels } from './calculate-channels.js';
import { contribution, createBoundaryVariant } from './calculate-with-boundaries.js';
import { createPairContribution, createReceptionVariant, validatePairs } from './calculate-with-receptions.js';
import { findBoundaryMemberships } from './find-boundary-memberships.js';
import { OPTION_KEYS, optionsFromKey } from './score-options.js';

function postExchangeEvents(positions, cusps, pair, options) {
  const [first, second] = pair.planets;
  const virtual = { ...positions, [first]: positions[second], [second]: positions[first] };
  const moved = new Set(pair.planets);
  const seen = new Set();
  const events = [];
  for (const membership of findBoundaryMemberships(virtual, cusps)) {
    const group = contribution(virtual, membership, options);
    if (seen.has(group.triggerId)) continue;
    seen.add(group.triggerId);
    for (const event of group.events) {
      const conjunction = event.step === 5 || event.step === 6;
      if (!moved.has(membership.planetId) && (!conjunction || !moved.has(event.matchedPlanet) && !moved.has(event.sourcePlanet))) continue;
      if (conjunction && positions[event.sourcePlanet].sign === positions[event.matchedPlanet].sign) continue;
      events.push({ ...event, phase: 'post-exchange-boundary', receptionId: pair.id });
    }
  }
  return events;
}

function score(base = 0, boundary = 0, reception = 0) {
  return { base, boundary, reception, total: base + boundary + reception };
}

function combinedVariant(boundaryVariant, positions, cusps, instances, receptionOptions, boundaryOptions) {
  const receptions = instances.map((pair) => {
    const ordinary = createPairContribution(positions, pair, receptionOptions);
    const events = ordinary.events.map((event) => ({ ...event, phase: 'reception' }));
    const boundaryEvents = postExchangeEvents(positions, cusps, pair, boundaryOptions);
    const affected = new Set([...ordinary.affectedSourceChannels, ...boundaryEvents.map((event) => event.sourceChannel)]);
    return { pairId: pair.id, affectedSourceChannels: CHANNELS.filter((channel) => affected.has(channel.id)).map((channel) => channel.id), events, boundaryEvents };
  });
  const matrix = boundaryVariant.matrix.map((row) => row.map((cell) => score(cell.base, cell.boundary)));
  for (const group of receptions) {
    for (const event of [...group.events, ...group.boundaryEvents]) {
      const cell = matrix[event.sourceIndex][event.targetIndex];
      matrix[event.sourceIndex][event.targetIndex] = score(cell.base, cell.boundary + (event.phase === 'post-exchange-boundary' ? event.points : 0), cell.reception + (event.phase === 'reception' ? event.points : 0));
    }
  }
  const sum = (entries) => entries.reduce((total, entry) => score(total.base + entry.base, total.boundary + entry.boundary, total.reception + entry.reception), score());
  const rowTotals = matrix.map(sum);
  return { boundaries: boundaryVariant.boundaries, receptions, matrix, rowTotals, overallScore: sum(rowTotals), ranking: buildRankingSnapshot(matrix.map((row) => row.map((cell) => cell.total)), rowTotals.map((row) => row.total)) };
}

export function calculateCombinedFromBaseline(calculation, positions, cusps, memberships, receptions, boundaryReceptions) {
  validatePairs(receptions);
  const base = { calculation, ranking: buildRankingSnapshot(calculation.matrix, calculation.rowTotals) };
  const variants = Object.fromEntries(OPTION_KEYS.map((key) => [key, createReceptionVariant(calculation, positions, receptions, optionsFromKey(key))]));
  const boundaryVariants = Object.fromEntries(OPTION_KEYS.map((key) => [key, createBoundaryVariant(calculation, positions, memberships, optionsFromKey(key))]));
  const instances = [...receptions, ...boundaryReceptions];
  const combinedVariants = {};
  for (const receptionKey of OPTION_KEYS) for (const boundaryKey of OPTION_KEYS) {
    combinedVariants[`${receptionKey}:${boundaryKey}`] = combinedVariant(boundaryVariants[boundaryKey], positions, cusps, instances, optionsFromKey(receptionKey), optionsFromKey(boundaryKey));
  }
  return { base, variants, boundaryVariants, combinedVariants };
}

export function calculateCombined(positions, cusps, memberships, receptions, boundaryReceptions) {
  return calculateCombinedFromBaseline(calculateChannels(positions), positions, cusps, memberships, receptions, boundaryReceptions);
}
