import {
  CHANNELS,
  DISPLAY_PLANETS,
  PLANET_LABELS,
  PLANET_NAMES,
  SIGN_LABELS,
  SIGN_NAMES_IN,
  HOUSE_LABELS,
} from '../domain/channels.js';
import { channelIndexById } from '../domain/channel-relations.js';

const STEP_LABELS = {
  7: 'Планеты в домах канала', 8: 'Планеты в знаках канала',
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function formatScore(score, composite) {
  const boundary = score.boundary ?? 0;
  const reception = score.reception ?? 0;
  if (!boundary && !reception) return String(score.base);
  if (composite) {
    const boundaryText = boundary ? `<span class="boundary-count">+${boundary}${reception ? 'п' : ' погр.'}</span>` : '';
    const receptionText = reception ? `<span class="reception-count">+${reception}${boundary ? 'р' : ' рец.'}</span>` : '';
    return `${score.base} / ${score.total} (${[boundaryText, receptionText].filter(Boolean).join(', ')})`;
  }
  return `${score.base} / ${score.total} <span class="reception-count">(рец +${score.reception})</span>`;
}

function renderMatrix(result, includeReceptions) {
  const selectedRankings = result.ranking;
  const headings = CHANNELS.map((channel) => `<th scope="col">${channel.label}</th>`).join('');
  const highlightedByChannel = [];
  const rows = CHANNELS.map((channel, rowIndex) => {
    const values = result.matrix[rowIndex];
    const highlights = selectedRankings.rowHighlights[rowIndex].entries;
    const highlightByChannel = Object.fromEntries(highlights.map((entry) => [entry.targetChannel, entry.level]));
    const highlighted = highlights
      .map(({ targetChannel }) => {
        const targetIndex = channelIndexById[targetChannel];
        return `${CHANNELS[targetIndex].label} ${formatScore(values[targetIndex], includeReceptions)}`;
      })
      .join(', ');
    highlightedByChannel.push(`<li><strong>${channel.label}</strong><span>${highlighted}</span></li>`);
    const cells = values.map((value, targetIndex) => {
      const level = highlightByChannel[CHANNELS[targetIndex].id];
      const className = level === 'highest' ? 'matrix-highest' : level === 'runnerUp' ? 'matrix-runner-up' : '';
      return `<td${className ? ` class="${className}"` : ''}>${formatScore(value, includeReceptions)}</td>`;
    }).join('');
    return `<tr><th scope="row">${channel.label}</th>${cells}<td class="total-cell">${formatScore(result.rowTotals[rowIndex], includeReceptions)}</td></tr>`;
  }).join('');
  const leaders = selectedRankings.globalLeaders.map((id) => CHANNELS[channelIndexById[id]].label).join(', ');
  const ranking = selectedRankings.overallOrder
    .map(({ channelId }) => {
      const index = channelIndexById[channelId];
      return `<li>${CHANNELS[index].label}: ${formatScore(result.rowTotals[index], includeReceptions)}</li>`;
    })
    .join('');
  return `<section class="result-section"><h2>Матрица каналов</h2><div class="table-scroll"><table class="matrix"><thead><tr><th scope="col">Исходный канал</th>${headings}<th scope="col">Сумма</th></tr></thead><tbody>${rows}</tbody></table></div><div class="matrix-summary"><section class="summary-block"><h3>Верхние значения по каналам</h3><ul class="matrix-highlights">${highlightedByChannel.join('')}</ul></section><section class="summary-block"><h3>Глобальный максимум</h3><p>${leaders}</p></section><section class="summary-block"><h3>Ранжирование по сумме</h3><ol class="ranking">${ranking}</ol></section></div></section>`;
}

function renderSteps(channel, events, boundaryEvents) {
  const [primary, secondary] = channel.planets.map((planet) => PLANET_LABELS[planet]);
  const labels = {
    1: `${primary} в знаке`,
    2: `${primary} в доме`,
    3: `${secondary} в знаке`,
    4: `${secondary} в доме`,
    5: `Планеты в соединении с ${primary} (полнознак)`,
    6: `Планеты в соединении с ${secondary} (полнознак)`,
    ...STEP_LABELS,
  };
  return Array.from({ length: 8 }, (_, index) => {
    const step = index + 1;
    const stepEvents = [...events.filter((event) => event.step === step), ...boundaryEvents.filter((event) => event.step === step).map((event) => ({ ...event, boundary: true }))];
    const items = stepEvents.length
      ? `<ul>${stepEvents.map((event) => `<li><strong>${CHANNELS[event.targetIndex].label} +1</strong><span>${event.reason}${event.boundary ? ' (погр)' : ''}</span></li>`).join('')}</ul>`
      : '<p class="empty-step">0 значений</p>';
    return `<section class="step"><h4>Шаг ${step}: ${labels[step]}</h4>${items}</section>`;
  }).join('');
}

function receptionAfterTitle(pair, positions) {
  const [first, second] = pair.planets;
  const firstVirtualPosition = positions[second];
  const secondVirtualPosition = positions[first];
  return `${PLANET_NAMES[first]} в ${SIGN_NAMES_IN[firstVirtualPosition.sign]}, ${firstVirtualPosition.house} дом ↔ ${PLANET_NAMES[second]} в ${SIGN_NAMES_IN[secondVirtualPosition.sign]}, ${secondVirtualPosition.house} дом`;
}

function receptionListTitle(pair, positions) {
  const [first, second] = pair.planets;
  return `${PLANET_NAMES[first]} в ${SIGN_NAMES_IN[positions[first].sign]}, ${positions[first].house} дом ↔ ${PLANET_NAMES[second]} в ${SIGN_NAMES_IN[positions[second].sign]}, ${positions[second].house} дом`;
}

function renderReceptionStep(channel, result, positions, pairs, includeBoundaries) {
  const pairById = Object.fromEntries(pairs.map((pair) => [pair.id, pair]));
  const groups = result.receptions
    .map((contribution) => ({
      contribution,
      events: contribution.events.filter((event) => event.sourceChannel === channel.id),
      boundaryEvents: includeBoundaries ? (contribution.boundaryEvents ?? []).filter((event) => event.sourceChannel === channel.id) : [],
    }))
    .filter(({ events, boundaryEvents }) => events.length || boundaryEvents.length)
    .map(({ contribution, events, boundaryEvents }) => {
      const pair = pairById[contribution.pairId];
      const configuration = pair.signs ? ` (${pair.planets.map((planet, index) => `${PLANET_NAMES[planet]} в ${SIGN_NAMES_IN[pair.signs[index]]}`).join(' ↔ ')})` : '';
      const title = receptionAfterTitle(pair, positions) + configuration;
      const items = (entries, boundary) => entries.map((event) => `<li><strong>${CHANNELS[event.targetIndex].label} +1</strong><span>Шаг ${event.step}: ${event.reason}${boundary ? ' (погр)' : ''}</span></li>`).join('');
      return `<section class="reception-group"><h5>${escapeHtml(title)}</h5><ul>${items(events, false)}${items(boundaryEvents, true)}</ul></section>`;
    });
  const content = groups.length ? groups.join('') : '<p class="empty-step">0 значений</p>';
  return `<section class="step reception-step"><h4>Шаг 9: Взаимные рецепции</h4>${content}</section>`;
}

function renderChannelDetails(result, positions, pairs, includeReceptions, includeBoundaries) {
  return `<section class="result-section"><h2>Подробный расчёт</h2><div class="channel-list">${CHANNELS.map((channel) => {
    const events = result.baseEvents.filter((event) => event.sourceChannel === channel.id);
    const boundaryEvents = includeBoundaries ? (result.boundaries ?? []).flatMap((group) => group.events.filter((event) => event.sourceChannel === channel.id)) : [];
    const receptionStep = includeReceptions ? renderReceptionStep(channel, result, positions, pairs, includeBoundaries) : '';
    return `<details class="channel-row" data-channel="${channel.id}"><summary>${channel.label}</summary><div class="channel-body">${renderSteps(channel, events, boundaryEvents)}${receptionStep}</div></details>`;
  }).join('')}</div></section>`;
}

function formatBirthDetails(birth) {
  if (!birth) return '';
  const [year, month, day] = birth.date.split('-');
  const time = birth.time.length === 5 ? `${birth.time}:00` : birth.time;
  return `<p class="birth-summary">${day}.${month}.${year} ${escapeHtml(time)} (${escapeHtml(birth.timeZone)}), ${escapeHtml(birth.cityLabel)}, ${birth.latitude.toFixed(4)}, ${birth.longitude.toFixed(4)}</p>`;
}

function renderReceptions(receptions, positions) {
  const items = receptions.map(({ planets: [first, second] }) => {
    return `<li>${escapeHtml(receptionListTitle({ planets: [first, second] }, positions))}</li>`;
  }).join('');
  const content = items || '<p class="empty-receptions">Взаимные рецепции не обнаружены</p>';
  return `<section class="receptions"><h3>Взаимные рецепции</h3>${items ? `<ul>${items}</ul>` : content}</section>`;
}

function renderBoundaryMemberships(memberships) {
  if (!memberships.length) return '<section class="receptions"><h3>Пограничности</h3><p class="empty-receptions">Пограничные положения не обнаружены</p></section>';
  const items = memberships.map((membership) => {
    const planet = PLANET_LABELS[membership.planetId] ?? escapeHtml(membership.planetId);
    if (membership.kind === 'sign') {
      const sign = SIGN_LABELS[membership.addedSign] ?? escapeHtml(membership.addedSign);
      return `<li>${planet} — знак ${sign}</li>`;
    }
    const house = HOUSE_LABELS[membership.addedHouse] ?? escapeHtml(membership.addedHouse);
    const cusp = HOUSE_LABELS[membership.cuspHouse] ?? escapeHtml(membership.cuspHouse);
    return `<li>${planet} — дом ${house} (Граница дома ${cusp})</li>`;
  }).join('');
  return `<section class="receptions"><h3>Пограничности</h3><ul>${items}</ul></section>`;
}

function renderBoundaryReceptions(receptions) {
  if (!receptions.length) return '<section class="receptions"><h3>Взаимные рецепции с пограничностью</h3><p class="empty-receptions">Взаимные рецепции с пограничностью не обнаружены</p></section>';
  const items = receptions.map(({ planets, signs, triggerIds }) => {
    const title = planets.map((planet, index) => `${PLANET_NAMES[planet]} в ${SIGN_NAMES_IN[signs[index]]}`).join(' ↔ ');
    const triggers = triggerIds.map((id) => {
      const [planet, , sign] = id.split(':');
      return `${PLANET_LABELS[planet] ?? escapeHtml(planet)} ${SIGN_LABELS[sign] ?? escapeHtml(sign)}`;
    }).join(', ');
    return `<li>${escapeHtml(title)} (пограничность: ${triggers})</li>`;
  }).join('');
  return `<section class="receptions"><h3>Взаимные рецепции с пограничностью</h3><ul>${items}</ul></section>`;
}

export function renderPositions(chart, birth, receptions = [], boundaryData) {
  const { memberships = [], boundaryReceptions = [] } = boundaryData ?? {};
  const rows = DISPLAY_PLANETS.map((planet) => {
    const position = chart.positions[planet];
    return `<tr><th scope="row">${PLANET_LABELS[planet]} ${SIGN_LABELS[position.sign]} ${escapeHtml(position.formattedLongitude ?? '—')}</th><td>${HOUSE_LABELS[position.house]}</td></tr>`;
  }).join('');
  return `<section class="result-section positions-section"><h2>Положения объектов</h2>${formatBirthDetails(birth)}<div class="table-scroll"><table class="positions"><thead><tr><th>Планета</th><th>Дом</th></tr></thead><tbody>${rows}</tbody></table></div>${boundaryData ? renderBoundaryMemberships(memberships) : ''}${renderReceptions(receptions, chart.positions)}${boundaryData ? renderBoundaryReceptions(boundaryReceptions) : ''}</section>`;
}

export function renderResults({ positions, pairs, boundaryReceptions = [], result }, includeReceptions = false, optionKey = '0111', { includeBoundaries = false, boundaryOptionKey = '0111' } = {}) {
  const calculation = result.base.calculation;
  const selected = includeReceptions && includeBoundaries
    ? result.combinedVariants[`${optionKey}:${boundaryOptionKey}`]
    : includeBoundaries ? result.boundaryVariants[boundaryOptionKey]
      : includeReceptions ? result.variants[optionKey]
    : {
      matrix: calculation.matrix.map((row) => row.map((points) => ({ base: points, reception: 0, total: points }))),
      rowTotals: calculation.rowTotals.map((points) => ({ base: points, reception: 0, total: points })),
      ranking: result.base.ranking,
      receptions: [],
    };
  return `${renderMatrix(selected, Boolean(result.boundaryVariants))}${renderChannelDetails({
    ...selected,
    baseEvents: calculation.events,
  }, positions, [...pairs, ...boundaryReceptions], includeReceptions, includeBoundaries)}`;
}

export function renderCityMatches(matches) {
  if (!matches.length) return '<p class="hint">Города не найдены.</p>';
  return matches.map((match, index) => `<button type="button" class="city-option" data-city-index="${index}">${escapeHtml(match.label)}</button>`).join('');
}
