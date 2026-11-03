import { CHANNELS, DISPLAY_PLANETS, PLANETS } from './channels.js';
import {
  channelByHouse,
  channelByPlanet,
  channelBySign,
  channelIndexById,
} from './channel-relations.js';
import { buildRankingSnapshot, calculateChannels, createStepReason } from './calculate-channels.js';

const OPTION_KEYS = [
  '0000', '1000', '0100', '1100', '0010', '1010',
  '0110', '1110', '0011', '1011', '0111', '1111',
];

function validatePairs(pairs) {
  const seenIds = new Set();
  for (const pair of pairs) {
    const [first, second] = pair?.planets ?? [];
    const firstIndex = DISPLAY_PLANETS.indexOf(first);
    const secondIndex = DISPLAY_PLANETS.indexOf(second);
    if (
      firstIndex < 0
      || secondIndex <= firstIndex
      || pair.id !== `${first}:${second}`
      || seenIds.has(pair.id)
    ) {
      throw new Error('Некорректная взаимная рецепция.');
    }
    seenIds.add(pair.id);
  }
}

function optionsFromKey(key) {
  return {
    includeStepsSevenAndEight: key[0] === '1',
    includeSameChannelHouses: key[1] === '1',
    includeSameChannelSigns: key[2] === '1',
    includeSameChannelConjunctions: key[3] === '1',
  };
}

function score(base = 0, reception = 0) {
  return { base, reception, total: base + reception };
}

function numberMatrix(scores, field) {
  return scores.map((row) => row.map((entry) => entry[field]));
}

function createReceptionEvent(pairId, sourceChannel, targetChannel, step, fields) {
  return {
    sourceChannel,
    targetChannel,
    sourceIndex: channelIndexById[sourceChannel],
    targetIndex: channelIndexById[targetChannel],
    step,
    points: 1,
    ...fields,
    reason: createStepReason(step, fields),
    receptionId: pairId,
  };
}

function channelForPlanetRole(planet) {
  return CHANNELS.find((channel) => channel.id === channelByPlanet[planet]);
}

function roleSteps(planet) {
  const source = channelForPlanetRole(planet);
  return {
    source,
    sign: source.planets[0] === planet ? 1 : 3,
    house: source.planets[0] === planet ? 2 : 4,
    conjunction: source.planets[0] === planet ? 5 : 6,
  };
}

function independentlyExchangePositions(positions, pair) {
  const [first, second] = pair.planets;
  return { ...positions, [first]: positions[second], [second]: positions[first] };
}

function isSameChannelTransition(beforeValue, afterValue, ownerByValue) {
  return ownerByValue[beforeValue] === ownerByValue[afterValue];
}

function addCandidate(candidateIds, channelId) {
  candidateIds.add(channelId);
}

function sortedCandidateIds(candidateIds) {
  return CHANNELS.filter((channel) => candidateIds.has(channel.id)).map((channel) => channel.id);
}

function createPairContribution(positions, pair, options) {
  const virtualPositions = independentlyExchangePositions(positions, pair);
  const exchangedPlanets = new Set(pair.planets);
  const candidateIds = new Set();
  const events = [];
  const award = (sourceChannel, targetChannel, step, fields) => {
    addCandidate(candidateIds, sourceChannel);
    events.push(createReceptionEvent(pair.id, sourceChannel, targetChannel, step, fields));
  };

  for (const planet of pair.planets) {
    const original = positions[planet];
    const virtual = virtualPositions[planet];
    const { source, sign: signStep, house: houseStep } = roleSteps(planet);
    const originalSignChannel = channelBySign[original.sign];
    const virtualSignChannel = channelBySign[virtual.sign];
    const originalHouseChannel = channelByHouse[original.house];
    const virtualHouseChannel = channelByHouse[virtual.house];

    addCandidate(candidateIds, source.id);
    addCandidate(candidateIds, originalSignChannel);
    addCandidate(candidateIds, virtualSignChannel);
    addCandidate(candidateIds, originalHouseChannel);
    addCandidate(candidateIds, virtualHouseChannel);

    if (
      original.sign !== virtual.sign
      && (originalSignChannel !== virtualSignChannel || options.includeSameChannelSigns)
    ) {
      award(source.id, virtualSignChannel, signStep, {
        sourcePlanet: planet,
        matchedSign: virtual.sign,
      });
    }
    if (originalHouseChannel !== virtualHouseChannel || options.includeSameChannelHouses) {
      award(source.id, virtualHouseChannel, houseStep, {
        sourcePlanet: planet,
        matchedHouse: virtual.house,
      });
    }

    if (options.includeStepsSevenAndEight) {
      if (
        originalHouseChannel !== virtualHouseChannel
        || options.includeSameChannelHouses
      ) {
        award(virtualHouseChannel, channelByPlanet[planet], 7, {
          sourcePlanet: planet,
          matchedHouse: virtual.house,
        });
      }
      if (
        original.sign !== virtual.sign
        && (originalSignChannel !== virtualSignChannel || options.includeSameChannelSigns)
      ) {
        award(virtualSignChannel, channelByPlanet[planet], 8, {
          sourcePlanet: planet,
          matchedSign: virtual.sign,
        });
      }
    }
  }

  for (let leftIndex = 0; leftIndex < PLANETS.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < PLANETS.length; rightIndex += 1) {
      const left = PLANETS[leftIndex];
      const right = PLANETS[rightIndex];
      const movedPlanets = [left, right].filter((planet) => exchangedPlanets.has(planet));
      if (
        movedPlanets.length === 0
        || virtualPositions[left].sign !== virtualPositions[right].sign
        || positions[left].sign === positions[right].sign
      ) {
        continue;
      }
      const requiresSameChannelOption = movedPlanets.every((planet) => (
        positions[planet].sign !== virtualPositions[planet].sign
        && isSameChannelTransition(positions[planet].sign, virtualPositions[planet].sign, channelBySign)
      ));
      if (requiresSameChannelOption && !options.includeSameChannelConjunctions) {
        continue;
      }

      for (const [planet, partner] of [[left, right], [right, left]]) {
        const { source, conjunction } = roleSteps(planet);
        addCandidate(candidateIds, source.id);
        award(source.id, channelByPlanet[partner], conjunction, {
          sourcePlanet: planet,
          matchedPlanet: partner,
          matchedSign: virtualPositions[planet].sign,
        });
      }
    }
  }

  return {
    pairId: pair.id,
    affectedSourceChannels: sortedCandidateIds(candidateIds),
    events,
  };
}

function createVariant(baseline, positions, pairs, options) {
  const receptions = pairs.map((pair) => createPairContribution(positions, pair, options));
  const matrix = baseline.matrix.map((row) => row.map((points) => score(points)));
  for (const reception of receptions) {
    for (const event of reception.events) {
      const current = matrix[event.sourceIndex][event.targetIndex];
      matrix[event.sourceIndex][event.targetIndex] = score(current.base, current.reception + 1);
    }
  }
  const rowTotals = matrix.map((row) => row.reduce(
    (total, entry) => score(total.base + entry.base, total.reception + entry.reception),
    score(),
  ));
  const overallScore = rowTotals.reduce(
    (total, entry) => score(total.base + entry.base, total.reception + entry.reception),
    score(),
  );
  return {
    receptions,
    matrix,
    rowTotals,
    overallScore,
    ranking: buildRankingSnapshot(numberMatrix(matrix, 'total'), rowTotals.map((entry) => entry.total)),
  };
}

export function calculateWithReceptions(positions, pairs) {
  validatePairs(pairs);
  const calculation = calculateChannels(positions);
  const base = {
    calculation,
    ranking: buildRankingSnapshot(calculation.matrix, calculation.rowTotals),
  };
  const variants = Object.fromEntries(OPTION_KEYS.map((key) => [
    key,
    createVariant(calculation, positions, pairs, optionsFromKey(key)),
  ]));

  return { base, variants };
}
