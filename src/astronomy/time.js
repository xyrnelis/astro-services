export class BirthTimeError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function parseDateTime(date, time) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new BirthTimeError('invalid-format', 'Укажите дату и время в корректном формате.');
  }

  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hour, minute] = timeMatch.slice(1).map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    instant.getUTCFullYear() !== year
    || instant.getUTCMonth() !== month - 1
    || instant.getUTCDate() !== day
    || hour > 23
    || minute > 59
  ) {
    throw new BirthTimeError('invalid-format', 'Укажите существующие дату и время.');
  }
  return { year, month, day, hour, minute, localTimestamp: instant.getTime() };
}

function parseOffset(value) {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(value ?? '');
  if (!match || Number(match[2]) > 14 || Number(match[3]) > 59) {
    throw new BirthTimeError('invalid-offset', 'Укажите UTC-offset в формате +03:00.');
  }
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '+' ? minutes : -minutes;
}

function formatOffset(seconds) {
  const sign = seconds >= 0 ? '+' : '-';
  const absolute = Math.abs(seconds);
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor((absolute % 3600) / 60);
  const remainder = absolute % 60;
  const base = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return remainder ? `${base}:${String(remainder).padStart(2, '0')}` : base;
}

function createFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    throw new BirthTimeError('invalid-time-zone', 'Часовой пояс города не определён.');
  }
}

function partsInZone(formatter, timestamp) {
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(timestamp))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return parts;
}

function matchesLocalTime(parts, local) {
  return parts.year === local.year
    && parts.month === local.month
    && parts.day === local.day
    && parts.hour === local.hour
    && parts.minute === local.minute
    && parts.second === 0;
}

function offsetAt(formatter, timestamp) {
  const parts = partsInZone(formatter, timestamp);
  const displayedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return Math.round((displayedAsUtc - timestamp) / 1000);
}

export function resolveBirthInstant({ date, time, timeZone, utcOffset }) {
  const local = parseDateTime(date, time);
  if (utcOffset !== undefined) {
    const offsetMinutes = parseOffset(utcOffset);
    return {
      utc: new Date(local.localTimestamp - offsetMinutes * 60_000),
      appliedOffset: formatOffset(offsetMinutes * 60),
      timeZone: `UTC${formatOffset(offsetMinutes * 60)}`,
    };
  }

  if (!timeZone) {
    throw new BirthTimeError('missing-time-zone', 'Выберите город или укажите UTC-offset.');
  }

  const formatter = createFormatter(timeZone);
  const offsetCandidates = new Set([
    offsetAt(formatter, local.localTimestamp - 48 * 60 * 60_000),
    offsetAt(formatter, local.localTimestamp),
    offsetAt(formatter, local.localTimestamp + 48 * 60 * 60_000),
  ]);
  const candidates = [];
  for (const offsetSeconds of offsetCandidates) {
    const timestamp = local.localTimestamp - offsetSeconds * 1000;
    if (matchesLocalTime(partsInZone(formatter, timestamp), local)) {
      candidates.push(timestamp);
    }
  }

  if (candidates.length === 0) {
    throw new BirthTimeError('invalid-local-time', 'В это время в городе произошёл переход на летнее время; выберите другое время или задайте UTC-offset.');
  }
  if (candidates.length > 1) {
    throw new BirthTimeError('ambiguous-local-time', 'Это местное время повторяется при переходе на зимнее время; задайте UTC-offset.');
  }

  const utc = new Date(candidates[0]);
  return {
    utc,
    appliedOffset: formatOffset(offsetAt(formatter, candidates[0])),
    timeZone,
  };
}
