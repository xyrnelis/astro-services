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

function validatePositions(positions) {
  for (const planet of PLANETS) {
    const position = positions[planet];
    if (!position || !channelBySign[position.sign] || !channelByHouse[position.house]) {
      throw new Error(`Некорректное положение объекта: ${planet}`);
    }
  }
}

export function calculateChannels(positions) {
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

  for (const source of CHANNELS) {
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

  const rowTotals = matrix.map((row) => row.reduce((total, points) => total + points, 0));
  const grandTotal = rowTotals.reduce((total, points) => total + points, 0);
  const rowLeaders = matrix.map((row) => {
    const highest = Math.max(...row);
    return CHANNELS.filter((channel, index) => row[index] === highest).map((channel) => channel.id);
  });
  const highestTotal = Math.max(...rowTotals);
  const globalTopByTotal = CHANNELS
    .filter((channel, index) => rowTotals[index] === highestTotal)
    .map((channel) => channel.id);
  const isSymmetric = matrix.every((row, source) => row.every((value, target) => value === matrix[target][source]));

  return { matrix, events, rowTotals, grandTotal, rowLeaders, globalTopByTotal, isSymmetric };
}
