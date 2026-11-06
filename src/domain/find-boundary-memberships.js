import { DISPLAY_PLANETS } from './channels.js';
import { SIGN_NAMES } from './zodiac-signs.js';

function circularDistance(first, second) {
  const distance = Math.abs(first - second);
  return Math.min(distance, 360 - distance);
}

/**
 * Returns additional sign and house memberships for validated chart positions.
 * Results follow display planet order, with sign before cusps in house order.
 * Each entry retains the natal identity, added membership, trigger and distance in degrees.
 */
export function findBoundaryMemberships(positions, cusps) {
  const memberships = [];

  for (const planetId of DISPLAY_PLANETS) {
    const { longitude: rawLongitude, sign: natalSign, house: natalHouse } = positions[planetId];
    const longitude = rawLongitude === 360 ? 0 : rawLongitude;
    const natal = { planetId, natalSign, natalHouse };
    const signIndex = SIGN_NAMES.indexOf(natalSign);
    const start = signIndex * 30;
    const end = (start + 30) % 360;
    const startDistance = circularDistance(longitude, start);
    const endDistance = circularDistance(longitude, end);

    if (startDistance <= 3) {
      memberships.push({
        ...natal, kind: 'sign', addedSign: SIGN_NAMES[(signIndex + 11) % 12],
        boundaryLongitude: start, distanceDegrees: startDistance,
      });
    } else if (endDistance <= 3) {
      memberships.push({
        ...natal, kind: 'sign', addedSign: SIGN_NAMES[(signIndex + 1) % 12],
        boundaryLongitude: end, distanceDegrees: endDistance,
      });
    }

    for (const [index, cuspLongitude] of cusps.entries()) {
      const distanceDegrees = circularDistance(longitude, cuspLongitude);
      if (distanceDegrees > 1.5) continue;

      const cuspHouse = index + 1;
      const previousHouse = index === 0 ? 12 : index;
      const offset = (longitude - cuspLongitude + 360) % 360;
      const addedHouse = natalHouse === cuspHouse ? previousHouse
        : natalHouse === previousHouse ? cuspHouse
          : offset < 180 ? previousHouse : cuspHouse;
      memberships.push({
        ...natal, kind: 'house', addedHouse, cuspHouse, cuspLongitude, distanceDegrees,
      });
    }
  }

  return memberships;
}
