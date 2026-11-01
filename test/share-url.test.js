import { it } from 'node:test';
import assert from 'node:assert/strict';
import { ShareUrlError, clearSharedBirth, readSharedBirth, writeSharedBirth } from '../src/ui/share-url.js';

it('serializes and reads only birth data needed for a shared calculation', () => {
  const url = writeSharedBirth('https://example.test/channels', {
    date: '1997-01-11',
    time: '10:02',
    city: { label: 'Минск, Беларусь', latitude: 53.9002, longitude: 27.5665, timeZone: 'Europe/Minsk' },
    utcOffset: '+02:00',
  });

  assert.deepEqual(readSharedBirth(url.search), {
    date: '1997-01-11',
    time: '10:02',
    city: { label: 'Минск, Беларусь', latitude: 53.9002, longitude: 27.5665, timeZone: 'Europe/Minsk' },
    utcOffset: '+02:00',
  });
});

it('rejects incomplete or invalid shared data', () => {
  assert.throws(() => readSharedBirth('?d=1997-01-11'), ShareUrlError);
  assert.throws(() => readSharedBirth('?d=1997-01-11&t=10:02&c=Минск&la=91&lo=27&z=Europe/Minsk'), ShareUrlError);
});

it('removes only calculation data from a shared URL', () => {
  const clearedUrl = clearSharedBirth('https://example.test/channels?d=1997-01-11&t=10:02&c=Минск&la=53.9&lo=27.5&z=Europe%2FMinsk&keep=yes');
  assert.equal(clearedUrl.search, '?keep=yes');
});
