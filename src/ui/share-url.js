const requiredParameters = ['d', 't', 'c', 'la', 'lo', 'z'];

export class ShareUrlError extends Error {}

function numberParameter(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ShareUrlError(`В ссылке указано некорректное значение ${name}.`);
  }
  return parsed;
}

export function readSharedBirth(search) {
  const parameters = new URLSearchParams(search);
  const hasState = requiredParameters.some((name) => parameters.has(name)) || parameters.has('o');
  if (!hasState) return null;

  if (requiredParameters.some((name) => !parameters.get(name))) {
    throw new ShareUrlError('Ссылка содержит неполные данные рождения.');
  }

  const date = parameters.get('d');
  const time = parameters.get('t');
  const cityLabel = parameters.get('c').trim();
  const timeZone = parameters.get('z').trim();
  const utcOffset = parameters.get('o');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new ShareUrlError('В ссылке указаны некорректные дата или время.');
  }
  if (!cityLabel || cityLabel.length > 200 || !timeZone || timeZone.length > 100) {
    throw new ShareUrlError('В ссылке указаны некорректные данные города.');
  }
  if (utcOffset !== null && !/^[+-]\d{2}:\d{2}$/.test(utcOffset)) {
    throw new ShareUrlError('В ссылке указан некорректный UTC-offset.');
  }

  return {
    date,
    time,
    city: {
      label: cityLabel,
      latitude: numberParameter(parameters.get('la'), 'широты', -90, 90),
      longitude: numberParameter(parameters.get('lo'), 'долготы', -180, 180),
      timeZone,
    },
    utcOffset,
  };
}

export function writeSharedBirth(url, { date, time, city, utcOffset }) {
  const nextUrl = new URL(url);
  requiredParameters.concat('o').forEach((name) => nextUrl.searchParams.delete(name));
  nextUrl.searchParams.set('d', date);
  nextUrl.searchParams.set('t', time);
  nextUrl.searchParams.set('c', city.label);
  nextUrl.searchParams.set('la', city.latitude.toFixed(4));
  nextUrl.searchParams.set('lo', city.longitude.toFixed(4));
  nextUrl.searchParams.set('z', city.timeZone);
  if (utcOffset) nextUrl.searchParams.set('o', utcOffset);
  return nextUrl;
}

export function clearSharedBirth(url) {
  const nextUrl = new URL(url);
  requiredParameters.concat('o').forEach((name) => nextUrl.searchParams.delete(name));
  return nextUrl;
}
