import {
  CHANNELS,
  PLANETS,
  PLANET_LABELS,
  SIGN_LABELS,
  HOUSE_LABELS,
  CONJUNCTION_SYMBOL,
} from './channels.js';
import {
  channelByHouse,
  channelByPlanet,
  channelBySign,
  channelIndexById,
} from './channel-relations.js';

const stepReasons = {
  1: (planet, sign) => `${PLANET_LABELS[planet]} в знаке ${SIGN_LABELS[sign]}`,
  2: (planet, house) => `${PLANET_LABELS[planet]} в ${HOUSE_LABELS[house]} доме`,
  3: (planet, sign) => `${PLANET_LABELS[planet]} в знаке ${SIGN_LABELS[sign]}`,
  4: (planet, house) => `${PLANET_LABELS[planet]} в ${HOUSE_LABELS[house]} доме`,
  5: (planet, matched, sign) => `${PLANET_LABELS[planet]} ${CONJUNCTION_SYMBOL} ${PLANET_LABELS[matched]} в знаке ${SIGN_LABELS[sign]}`,
  6: (planet, matched, sign) => `${PLANET_LABELS[planet]} ${CONJUNCTION_SYMBOL} ${PLANET_LABELS[matched]} в знаке ${SIGN_LABELS[sign]}`,
  7: (planet, house) => `${PLANET_LABELS[planet]} в ${HOUSE_LABELS[house]} доме`,
  8: (planet, sign) => `${PLANET_LABELS[planet]} в знаке ${SIGN_LABELS[sign]}`,
};

export function createStepReason(step, fields) {
  const reason = stepReasons[step];
  if (step === 5 || step === 6) {
    return reason(fields.sourcePlanet, fields.matchedPlanet, fields.matchedSign);
  }
  return reason(fields.sourcePlanet, fields.matchedSign ?? fields.matchedHouse);
}

function validatePositions(positions) {
  for (const planet of PLANETS) {
    const position = positions[planet];
    if (!position || !channelBySign[position.sign] || !channelByHouse[position.house]) {
      throw new Error(`Некорректное положение объекта: ${planet}`);
    }
  }
}

export function calculateChannelRows(positions, sourceChannels = CHANNELS) {
  validatePositions(positions);

  const matrix = CHANNELS.map(() => CHANNELS.map(() => 0));
  const events = [];
  const award = (source, target, step, fields) => {
    const sourceIndex = channelIndexById[source.id];
    const targetIndex = channelIndexById[target];
    matrix[sourceIndex][targetIndex] += 1;
    events.push({
      sourceChannel: source.id,
      targetChannel: target,
      sourceIndex,
      targetIndex,
      step,
      points: 1,
      ...fields,
    });
  };

  for (const source of sourceChannels) {
    const [primary, secondary] = source.planets;
    const primaryPosition = positions[primary];
    const secondaryPosition = positions[secondary];

    award(source, channelBySign[primaryPosition.sign], 1, {
      sourcePlanet: primary,
      matchedSign: primaryPosition.sign,
      reason: stepReasons[1](primary, primaryPosition.sign),
    });
    award(source, channelByHouse[primaryPosition.house], 2, {
      sourcePlanet: primary,
      matchedHouse: primaryPosition.house,
      reason: stepReasons[2](primary, primaryPosition.house),
    });
    award(source, channelBySign[secondaryPosition.sign], 3, {
      sourcePlanet: secondary,
      matchedSign: secondaryPosition.sign,
      reason: stepReasons[3](secondary, secondaryPosition.sign),
    });
    award(source, channelByHouse[secondaryPosition.house], 4, {
      sourcePlanet: secondary,
      matchedHouse: secondaryPosition.house,
      reason: stepReasons[4](secondary, secondaryPosition.house),
    });

    for (const planet of PLANETS) {
      if (planet !== primary && positions[planet].sign === primaryPosition.sign) {
        award(source, channelByPlanet[planet], 5, {
          sourcePlanet: primary,
          matchedPlanet: planet,
          matchedSign: primaryPosition.sign,
          reason: stepReasons[5](primary, planet, primaryPosition.sign),
        });
      }
    }

    for (const planet of PLANETS) {
      if (planet !== secondary && positions[planet].sign === secondaryPosition.sign) {
        award(source, channelByPlanet[planet], 6, {
          sourcePlanet: secondary,
          matchedPlanet: planet,
          matchedSign: secondaryPosition.sign,
          reason: stepReasons[6](secondary, planet, secondaryPosition.sign),
        });
      }
    }

    for (const planet of PLANETS) {
      if (source.houses.includes(positions[planet].house)) {
        award(source, channelByPlanet[planet], 7, {
          sourcePlanet: planet,
          matchedHouse: positions[planet].house,
          reason: stepReasons[7](planet, positions[planet].house),
        });
      }
    }

    for (const planet of PLANETS) {
      if (source.signs.includes(positions[planet].sign)) {
        award(source, channelByPlanet[planet], 8, {
          sourcePlanet: planet,
          matchedSign: positions[planet].sign,
          reason: stepReasons[8](planet, positions[planet].sign),
        });
      }
    }
  }

  return { matrix, events };
}

export function buildRankingSnapshot(matrix, rowTotals) {
  const rowHighlights = matrix.map((row, sourceIndex) => {
    const highest = Math.max(...row);
    const runnerUp = Math.max(...row.filter((value) => value < highest));
    const runnerUpCount = row.filter((value) => value === runnerUp).length;
    const entries = row
      .map((points, targetIndex) => ({ points, targetIndex }))
      .filter(({ points }) => points === highest || (runnerUpCount <= 2 && points === runnerUp))
      .sort((left, right) => right.points - left.points || left.targetIndex - right.targetIndex)
      .map(({ points, targetIndex }) => ({
        targetChannel: CHANNELS[targetIndex].id,
        points,
        level: points === highest ? 'highest' : 'runnerUp',
      }));
    return { sourceChannel: CHANNELS[sourceIndex].id, entries };
  });
  const highestTotal = Math.max(...rowTotals);
  const globalLeaders = CHANNELS
    .filter((channel, index) => rowTotals[index] === highestTotal)
    .map((channel) => channel.id);
  const overallOrder = CHANNELS
    .map((channel, index) => ({ channelId: channel.id, points: rowTotals[index], index }))
    .sort((left, right) => right.points - left.points || left.index - right.index)
    .map(({ channelId, points }) => ({ channelId, points }));

  return { rowHighlights, globalLeaders, overallOrder };
}

export function calculateChannels(positions) {
  const { matrix, events } = calculateChannelRows(positions);
  const rowTotals = matrix.map((row) => row.reduce((total, points) => total + points, 0));
  const rankings = buildRankingSnapshot(matrix, rowTotals);
  const rowLeaders = rankings.rowHighlights.map(({ entries }) => entries
    .filter((entry) => entry.level === 'highest')
    .map((entry) => entry.targetChannel));
  const isSymmetric = matrix.every((row, source) => row.every((value, target) => value === matrix[target][source]));

  return {
    matrix,
    events,
    rowTotals,
    rowLeaders,
    globalTopByTotal: rankings.globalLeaders,
    isSymmetric,
  };
}
