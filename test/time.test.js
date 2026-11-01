import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BirthTimeError, resolveBirthInstant } from '../src/astronomy/time.js';

describe('resolveBirthInstant', () => {
  it('uses an explicit UTC offset instead of the city time zone', () => {
    const result = resolveBirthInstant({
      date: '1933-02-18',
      time: '20:30',
      timeZone: 'UTC',
      utcOffset: '+09:00',
    });

    assert.equal(result.utc.toISOString(), '1933-02-18T11:30:00.000Z');
    assert.equal(result.appliedOffset, '+09:00');
    assert.equal(result.timeZone, 'UTC+09:00');
  });

  it('rejects an ambiguous local time during the autumn DST transition', () => {
    assert.throws(
      () => resolveBirthInstant({ date: '2024-11-03', time: '01:30', timeZone: 'America/New_York' }),
      (error) => error instanceof BirthTimeError && error.code === 'ambiguous-local-time',
    );
  });

  it('rejects a nonexistent local time during the spring DST transition', () => {
    assert.throws(
      () => resolveBirthInstant({ date: '2024-03-10', time: '02:30', timeZone: 'America/New_York' }),
      (error) => error instanceof BirthTimeError && error.code === 'invalid-local-time',
    );
  });

  it('preserves a historical offset that includes seconds', () => {
    const result = resolveBirthInstant({ date: '1900-01-01', time: '12:00', timeZone: 'Europe/Paris' });

    assert.equal(result.utc.toISOString(), '1900-01-01T11:50:39.000Z');
    assert.equal(result.appliedOffset, '+00:09:21');
  });

  it('rejects an empty explicit UTC offset', () => {
    assert.throws(
      () => resolveBirthInstant({ date: '1997-01-11', time: '10:02', timeZone: 'Europe/Minsk', utcOffset: '' }),
      (error) => error instanceof BirthTimeError && error.code === 'invalid-offset',
    );
  });
});
