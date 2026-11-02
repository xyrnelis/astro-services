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

function renderMatrix(calculation) {
  const headings = CHANNELS.map((channel) => `<th scope="col">${channel.label}</th>`).join('');
  const highlightedByChannel = [];
  const rows = CHANNELS.map((channel, rowIndex) => {
    const values = calculation.matrix[rowIndex];
    const highest = Math.max(...values);
    const runnerUp = Math.max(...values.filter((value) => value < highest));
    const runnerUpCount = values.filter((value) => value === runnerUp).length;
    const highlighted = values
      .map((value, index) => ({ value, index }))
      .filter(({ value }) => value === highest || (runnerUpCount <= 2 && value === runnerUp))
      .sort((left, right) => right.value - left.value || left.index - right.index)
      .map(({ value, index }) => `${CHANNELS[index].label} ${value}`)
      .join(', ');
    highlightedByChannel.push(`<li><strong>${channel.label}</strong><span>${highlighted}</span></li>`);
    const cells = values.map((value) => {
      const className = value === highest
        ? 'matrix-highest'
        : runnerUpCount <= 2 && value === runnerUp ? 'matrix-runner-up' : '';
      return `<td${className ? ` class="${className}"` : ''}>${value}</td>`;
    }).join('');
    return `<tr><th scope="row">${channel.label}</th>${cells}<td class="total-cell">${calculation.rowTotals[rowIndex]}</td></tr>`;
  }).join('');
  const leaders = calculation.globalTopByTotal.map((id) => CHANNELS[channelIndexById[id]].label).join(', ');
  const ranking = CHANNELS
    .map((channel, index) => ({ channel, total: calculation.rowTotals[index], index }))
    .sort((left, right) => right.total - left.total || left.index - right.index)
    .map(({ channel, total }) => `<li>${channel.label}: ${total}</li>`)
    .join('');
  return `<section class="result-section"><h2>Матрица каналов</h2><div class="table-scroll"><table class="matrix"><thead><tr><th scope="col">Исходный канал</th>${headings}<th scope="col">Сумма</th></tr></thead><tbody>${rows}</tbody></table></div><div class="matrix-summary"><section class="summary-block"><h3>Верхние значения по каналам</h3><ul class="matrix-highlights">${highlightedByChannel.join('')}</ul></section><section class="summary-block"><h3>Глобальный максимум</h3><p>${leaders}</p></section><section class="summary-block"><h3>Ранжирование по сумме</h3><ol class="ranking">${ranking}</ol></section></div></section>`;
}

function renderSteps(channel, events) {
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
    const stepEvents = events.filter((event) => event.step === step);
    const items = stepEvents.length
      ? `<ul>${stepEvents.map((event) => `<li><strong>${CHANNELS[event.targetIndex].label} +1</strong><span>${event.reason}</span></li>`).join('')}</ul>`
      : '<p class="empty-step">0 значений</p>';
    return `<section class="step"><h4>Шаг ${step}: ${labels[step]}</h4>${items}</section>`;
  }).join('');
}

function renderChannelDetails(calculation) {
  return `<section class="result-section"><h2>Подробный расчёт</h2><div class="channel-list">${CHANNELS.map((channel) => {
    const events = calculation.events.filter((event) => event.sourceChannel === channel.id);
    return `<details class="channel-row" data-channel="${channel.id}"><summary>${channel.label}</summary><div class="channel-body">${renderSteps(channel, events)}</div></details>`;
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
    const firstText = `${PLANET_NAMES[first]} в ${SIGN_NAMES_IN[positions[first].sign]}`;
    const secondText = `${PLANET_NAMES[second]} в ${SIGN_NAMES_IN[positions[second].sign]}`;
    return `<li>${escapeHtml(firstText)} ↔ ${escapeHtml(secondText)}</li>`;
  }).join('');
  const content = items || '<p class="empty-receptions">Взаимные рецепции не обнаружены</p>';
  return `<section class="receptions"><h3>Взаимные рецепции</h3>${items ? `<ul>${items}</ul>` : content}</section>`;
}

export function renderPositions(chart, birth, receptions = []) {
  const rows = DISPLAY_PLANETS.map((planet) => {
    const position = chart.positions[planet];
    return `<tr><th scope="row">${PLANET_LABELS[planet]} ${SIGN_LABELS[position.sign]} ${escapeHtml(position.formattedLongitude ?? '—')}</th><td>${HOUSE_LABELS[position.house]}</td></tr>`;
  }).join('');
  return `<section class="result-section positions-section"><h2>Положения объектов</h2>${formatBirthDetails(birth)}<div class="table-scroll"><table class="positions"><thead><tr><th>Планета</th><th>Дом</th></tr></thead><tbody>${rows}</tbody></table></div>${renderReceptions(receptions, chart.positions)}</section>`;
}

export function renderResults({ calculation, chart, birth }) {
  return `${renderMatrix(calculation)}${renderChannelDetails(calculation)}`;
}

export function renderCityMatches(matches) {
  if (!matches.length) return '<p class="hint">Города не найдены.</p>';
  return matches.map((match, index) => `<button type="button" class="city-option" data-city-index="${index}">${escapeHtml(match.label)}</button>`).join('');
}
