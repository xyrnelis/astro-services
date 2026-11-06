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

function isMutualReception(first, second, firstSign, secondSign) {
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
      if (isMutualReception(first, second, positions[first].sign, positions[second].sign)) {
        receptions.push({ id: `${first}:${second}`, planets: [first, second] });
      }
    }
  }
  return receptions;
}

/** Returns original reception pairs and separate sign-configuration boundary instances. */
export function findReceptionLists(positions, memberships) {
  const receptions = findReceptions(positions);
  const options = Object.fromEntries(DISPLAY_PLANETS.map((planet) => [planet, [positions[planet].sign]]));
  for (const membership of memberships) {
    if (membership.kind !== 'sign' || !Object.hasOwn(options, membership.planetId)) continue;
    const signs = options[membership.planetId];
    if (!signs.includes(membership.addedSign)) signs.push(membership.addedSign);
  }

  const boundaryReceptions = [];
  for (let firstIndex = 0; firstIndex < DISPLAY_PLANETS.length - 1; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < DISPLAY_PLANETS.length; secondIndex += 1) {
      const first = DISPLAY_PLANETS[firstIndex];
      const second = DISPLAY_PLANETS[secondIndex];
      const pairId = `${first}:${second}`;
      for (const [firstOption, firstSign] of options[first].entries()) {
        for (const [secondOption, secondSign] of options[second].entries()) {
          if ((!firstOption && !secondOption) || !isMutualReception(first, second, firstSign, secondSign)) continue;
          const triggerIds = [];
          if (firstOption) triggerIds.push(`${first}:sign:${firstSign}`);
          if (secondOption) triggerIds.push(`${second}:sign:${secondSign}`);
          boundaryReceptions.push({
            id: `${pairId}:${firstSign}:${secondSign}`, pairId,
            planets: [first, second], signs: [firstSign, secondSign], triggerIds,
          });
        }
      }
    }
  }
  return { receptions, boundaryReceptions };
}
