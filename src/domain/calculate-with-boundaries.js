import { CHANNELS, PLANETS } from './channels.js';
import { channelByHouse, channelByPlanet, channelBySign, channelIndexById } from './channel-relations.js';
import { buildRankingSnapshot, calculateChannels, createStepReason } from './calculate-channels.js';
import { OPTION_KEYS, optionsFromKey } from './score-options.js';

function roleSteps(planet) {
  const channel = CHANNELS[channelIndexById[channelByPlanet[planet]]];
  const primary = channel.planets[0] === planet;
  return { channel: channel.id, sign: primary ? 1 : 3, house: primary ? 2 : 4, conjunction: primary ? 5 : 6 };
}

export function contribution(positions, membership, options) {
  const { planetId, kind } = membership;
  const added = kind === 'sign' ? membership.addedSign : membership.addedHouse;
  const triggerId = `${planetId}:${kind}:${added}`;
  const role = roleSteps(planetId);
  const events = [];
  const award = (sourceChannel, targetChannel, step, fields) => {
    events.push({
      sourceChannel, targetChannel,
      sourceIndex: channelIndexById[sourceChannel], targetIndex: channelIndexById[targetChannel],
      step, points: 1, ...fields, reason: createStepReason(step, fields),
      phase: 'natal-boundary', triggerId,
    });
  };

  if (kind === 'sign') {
    const target = channelBySign[added];
    const sameChannel = channelBySign[positions[planetId].sign] === target;
    if (!sameChannel || options.includeSameChannelSigns) {
      award(role.channel, target, role.sign, { sourcePlanet: planetId, matchedSign: added });
      if (options.includeStepsSevenAndEight) {
        award(target, role.channel, 8, { sourcePlanet: planetId, matchedSign: added });
      }
      if (!sameChannel || options.includeSameChannelConjunctions) {
        for (const partner of PLANETS) {
          if (partner === planetId || positions[partner].sign !== added
            || positions[partner].sign === positions[planetId].sign) continue;
          const partnerRole = roleSteps(partner);
          award(role.channel, partnerRole.channel, role.conjunction, {
            sourcePlanet: planetId, matchedPlanet: partner, matchedSign: added,
          });
          award(partnerRole.channel, role.channel, partnerRole.conjunction, {
            sourcePlanet: partner, matchedPlanet: planetId, matchedSign: added,
          });
        }
      }
    }
  } else {
    const target = channelByHouse[added];
    const sameChannel = channelByHouse[positions[planetId].house] === target;
    if (!sameChannel || options.includeSameChannelHouses) {
      award(role.channel, target, role.house, { sourcePlanet: planetId, matchedHouse: added });
      if (options.includeStepsSevenAndEight) {
        award(target, role.channel, 7, { sourcePlanet: planetId, matchedHouse: added });
      }
    }
  }
  const affectedSourceChannels = CHANNELS.filter((channel) => events.some((event) => event.sourceChannel === channel.id))
    .map((channel) => channel.id);
  return { triggerId, affectedSourceChannels, events };
}

function score(base = 0, boundary = 0) {
  return { base, boundary, reception: 0, total: base + boundary };
}

export function createBoundaryVariant(calculation, positions, memberships, options) {
  const seen = new Set();
  const boundaries = [];
  for (const membership of memberships) {
    const id = `${membership.planetId}:${membership.kind}:${membership.kind === 'sign' ? membership.addedSign : membership.addedHouse}`;
    if (seen.has(id)) continue;
    seen.add(id);
    boundaries.push(contribution(positions, membership, options));
  }
  const matrix = calculation.matrix.map((row) => row.map((base) => score(base)));
  for (const { events } of boundaries) for (const event of events) {
    const cell = matrix[event.sourceIndex][event.targetIndex];
    matrix[event.sourceIndex][event.targetIndex] = score(cell.base, cell.boundary + event.points);
  }
  const sum = (entries) => entries.reduce((total, entry) => score(total.base + entry.base, total.boundary + entry.boundary), score());
  const rowTotals = matrix.map(sum);
  return {
    boundaries, matrix, rowTotals, overallScore: sum(rowTotals),
    ranking: buildRankingSnapshot(matrix.map((row) => row.map((entry) => entry.total)), rowTotals.map((entry) => entry.total)),
  };
}

export function calculateWithBoundaries(positions, memberships) {
  const calculation = calculateChannels(positions);
  const base = { calculation, ranking: buildRankingSnapshot(calculation.matrix, calculation.rowTotals) };
  const boundaryVariants = Object.fromEntries(OPTION_KEYS.map((key) => [
    key, createBoundaryVariant(calculation, positions, memberships, optionsFromKey(key)),
  ]));
  return { base, boundaryVariants };
}
