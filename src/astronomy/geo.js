const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

export function normalizeCityMatches(payload) {
  return (payload.results ?? []).flatMap((match) => (match.timezone ? [{
    label: [match.name, match.country].filter(Boolean).join(', '),
    latitude: match.latitude,
    longitude: match.longitude,
    timeZone: match.timezone,
  }] : []));
}

export async function searchCity(query) {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return [];
  }
  const url = new URL(GEOCODING_ENDPOINT);
  url.search = new URLSearchParams({ name: normalized, count: '5', language: 'ru', format: 'json' }).toString();
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Не удалось найти город. Повторите попытку позже.');
  }
  return normalizeCityMatches(await response.json());
}
