import { DISPLAY_PLANETS } from './channels.js';
import { rulersBySign } from './channel-relations.js';

function validatePositions(positions) {
  for (const planet of DISPLAY_PLANETS) {
    if (!positions[planet] || !rulersBySign[positions[planet].sign]) {
      throw new Error(`Некорректное положение объекта: ${planet}`);
    }
  }
}

/**
 * @typedef {{ id: string, planets: [string, string] }} ReceptionPair
 */

function isMutualReception(first, second, positions) {
  const firstSign = positions[first].sign;
  const secondSign = positions[second].sign;
  return firstSign !== secondSign
    && rulersBySign[firstSign].includes(second)
    && rulersBySign[secondSign].includes(first);
}

export function findReceptions(positions) {
  validatePositions(positions);

  const receptions = [];
  for (let firstIndex = 0; firstIndex < DISPLAY_PLANETS.length - 1; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < DISPLAY_PLANETS.length; secondIndex += 1) {
      const first = DISPLAY_PLANETS[firstIndex];
      const second = DISPLAY_PLANETS[secondIndex];
      if (isMutualReception(first, second, positions)) {
        receptions.push({ id: `${first}:${second}`, planets: [first, second] });
      }
    }
  }
  return receptions;
}
