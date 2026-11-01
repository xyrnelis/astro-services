import { it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCityMatches } from '../src/astronomy/geo.js';

it('keeps coordinates and IANA time zone from the geocoding response', () => {
  assert.deepEqual(normalizeCityMatches({ results: [{
    name: 'Минск', country: 'Беларусь', latitude: 53.90019, longitude: 27.56653, timezone: 'Europe/Minsk',
  }] }), [{
    label: 'Минск, Беларусь', latitude: 53.90019, longitude: 27.56653, timeZone: 'Europe/Minsk',
  }]);
});
