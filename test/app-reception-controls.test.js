import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initializeApp } from '../src/ui/app.js';
import { renderResults } from '../src/ui/render.js';
import { calculateWithReceptions } from '../src/domain/calculate-with-receptions.js';

function appDocument() {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'https://example.test/' });
  initializeApp(dom.window.document);
  return dom.window;
}

function testPositions() {
  return {
    Sun: { sign: 'Gemini', house: 3 }, Moon: { sign: 'Leo', house: 5 },
    Mercury: { sign: 'Virgo', house: 6 }, Proserpina: { sign: 'Sagittarius', house: 9 },
    Venus: { sign: 'Taurus', house: 2 }, Chiron: { sign: 'Scorpio', house: 7 },
    Mars: { sign: 'Libra', house: 7 }, Pluto: { sign: 'Gemini', house: 8 },
    Jupiter: { sign: 'Capricorn', house: 10 }, Neptune: { sign: 'Aquarius', house: 11 },
    Saturn: { sign: 'Cancer', house: 4 }, Uranus: { sign: 'Aquarius', house: 7 },
  };
}

async function nextTask() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

it('opens reception help without changing disabled controls and dismisses it accessibly', () => {
  const window = appDocument();
  const { document } = window;
  assert.equal(document.querySelector('#result-settings').hidden, true);
  const toggle = document.querySelector('#reception-steps-toggle');
  const help = document.querySelector('[data-reception-help="steps"]');
  const popover = document.querySelector('#reception-help-steps');

  assert.equal(toggle.disabled, true);
  assert.equal(toggle.checked, false);
  assert.equal(document.querySelector('#reception-houses-toggle').checked, true);
  assert.equal(document.querySelector('#reception-signs-toggle').checked, true);
  assert.equal(document.querySelector('#reception-conjunctions-toggle').checked, true);
  toggle.closest('label').dispatchEvent(new window.MouseEvent('mouseenter'));
  assert.equal(popover.hidden, true);
  help.dispatchEvent(new window.MouseEvent('mouseenter'));
  assert.equal(popover.hidden, false);
  document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  help.click();
  assert.equal(toggle.checked, false);
  assert.equal(popover.hidden, false);
  assert.equal(help.getAttribute('aria-expanded'), 'true');
  document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.equal(popover.hidden, true);
  help.dispatchEvent(new window.FocusEvent('focus'));
  assert.equal(popover.hidden, false);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(popover.hidden, true);
});

it('resets and disables option 4 when option 3 is switched off', () => {
  const window = appDocument();
  const { document } = window;
  const main = document.querySelector('#reception-toggle');
  const signs = document.querySelector('#reception-signs-toggle');
  const conjunctions = document.querySelector('#reception-conjunctions-toggle');

  main.disabled = false;
  main.checked = true;
  main.dispatchEvent(new window.Event('change', { bubbles: true }));
  signs.checked = true;
  signs.dispatchEvent(new window.Event('change', { bubbles: true }));
  assert.equal(conjunctions.disabled, false);
  conjunctions.checked = true;
  signs.checked = false;
  signs.dispatchEvent(new window.Event('change', { bubbles: true }));
  assert.equal(conjunctions.checked, false);
  assert.equal(conjunctions.disabled, true);
});

it('uses minute precision for the birth-time control and calculation', async () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'https://example.test/' });
  const { document } = dom.window;
  let resolvedTime;
  initializeApp(document, {
    searchCity: async () => [{ label: 'Минск', timeZone: 'Europe/Minsk', latitude: 53.9, longitude: 27.56 }],
    resolveBirthInstant: ({ time }) => {
      resolvedTime = time;
      return { timeZone: 'Europe/Minsk' };
    },
    getBrowserEphemeris: async () => ({}),
    calculateChart: async () => ({ positions: testPositions(), cusps: Array(12).fill(0) }),
    findBoundaryMemberships: () => [],
    findReceptionLists: () => ({ receptions: [], boundaryReceptions: [] }),
    calculateCombined: () => calculateWithReceptions(testPositions(), []),
  });
  const form = document.querySelector('#birth-form');
  const time = form.elements.time;
  assert.equal(time.type, 'text');
  assert.equal(time.getAttribute('pattern'), '(?:[01][0-9]|2[0-3]):[0-5][0-9]');
  assert.equal(time.maxLength, 5);
  time.value = '1002';
  time.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(time.value, '10:02');
  time.value = '10:02:00';
  time.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(time.value, '10:02');
  time.value = '10:02:00';
  form.elements.date.value = '1997-01-11';
  form.elements.city.value = 'Минск';
  document.querySelector('#city-search').click();
  await nextTask();
  document.querySelector('[data-city-index="0"]').click();
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await nextTask();
  await nextTask();
  assert.equal(resolvedTime, '10:02');
});

it('exposes independent boundary controls and accessible help', () => {
  const window = appDocument();
  const { document } = window;
  const main = document.querySelector('#boundary-toggle');
  const signs = document.querySelector('#boundary-signs-toggle');
  const conjunctions = document.querySelector('#boundary-conjunctions-toggle');
  const help = document.querySelector('[data-boundary-help="steps"]');
  const popover = document.querySelector('#boundary-help-steps');
  assert.deepEqual([...document.querySelectorAll('[data-boundary-help]')].map((button) => document.getElementById(button.getAttribute('aria-controls')).textContent), [
    'Начислять баллы за планеты в домах каналов (шаг 7) и знаках каналов (шаг 8) при пограничном переходе.',
    'Начислять баллы за переход между домами одного канала: 4 → 5 (шаги 2, 4, 7). Шаг 7 зависит от настройки «Учитывать шаги 7–8».',
    'Начислять баллы при переходе между знаками одного канала: Луна в Раке → Луна во Льве (шаги 1, 3, 8). Шаг 8 зависит от настройки «Учитывать шаги 7–8».',
    'Начислять баллы за новые соединения при переходе между знаками одного канала (шаги 5–6). Например: Луна в Раке → Луна во Льве ☌ Солнце. Настройка зависит от переходов между знаками одного канала.',
  ]);
  assert.equal(main.checked, false);
  assert.equal(document.querySelector('#boundary-steps-toggle').checked, false);
  assert.equal(document.querySelector('#boundary-houses-toggle').checked, true);
  assert.equal(signs.checked, true);
  assert.equal(conjunctions.checked, true);
  main.disabled = false;
  main.click();
  assert.equal(document.querySelector('#reception-toggle').checked, false);
  signs.click();
  assert.equal(conjunctions.checked, false);
  assert.equal(conjunctions.disabled, true);
  signs.click();
  assert.equal(conjunctions.disabled, false);
  assert.equal(conjunctions.checked, false);
  help.focus();
  assert.equal(popover.hidden, false);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(popover.hidden, true);
  help.click();
  assert.equal(popover.hidden, false);
  assert.equal(help.getAttribute('aria-expanded'), 'true');
  help.click();
  help.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(popover.hidden, false);
  document.body.click();
  assert.equal(popover.hidden, true);
});

it('prepares chart data once, selects cached variants and replaces all data for a new chart', async () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'https://example.test/' });
  const { document } = dom.window;
  const charts = [1, 2].map((id) => ({ positions: testPositions(), cusps: [id] }));
  const prepared = charts.map((chart, index) => ({
    memberships: [{ id: `membership-${index}` }],
    receptions: [{ id: 'Mars:Chiron', planets: ['Mars', 'Chiron'] }],
    boundaryReceptions: [{ id: `boundary-${index}` }],
  }));
  const calls = { memberships: [], lists: [], calculations: [], positions: [], results: [] };
  let chartIndex = 0;
  initializeApp(document, {
    searchCity: async () => [{ label: 'Минск', timeZone: 'Europe/Minsk', latitude: 53.9, longitude: 27.56 }],
    resolveBirthInstant: () => ({ timeZone: 'Europe/Minsk' }),
    getBrowserEphemeris: async () => ({}),
    calculateChart: async () => charts[chartIndex++],
    findBoundaryMemberships: (...args) => {
      calls.memberships.push(args);
      return prepared[calls.memberships.length - 1].memberships;
    },
    findReceptionLists: (...args) => {
      calls.lists.push(args);
      return prepared[calls.lists.length - 1];
    },
    calculateCombined: (...args) => {
      calls.calculations.push(args);
      return calculateWithReceptions(args[0], args[3]);
    },
    renderPositions: (...args) => {
      calls.positions.push(args);
      return '';
    },
    renderResults: (...args) => {
      calls.results.push(args);
      return args[3].includeBoundaries ? '' : renderResults(...args);
    },
  });
  const form = document.querySelector('#birth-form');
  form.elements.date.value = '1997-01-11';
  form.elements.time.value = '10:02';
  form.elements.city.value = 'Минск';
  document.querySelector('#city-search').click();
  await nextTask();
  document.querySelector('[data-city-index="0"]').click();
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await nextTask();
  await nextTask();
  assert.deepEqual(calls.memberships, [[charts[0].positions, charts[0].cusps]]);
  assert.deepEqual(calls.lists, [[charts[0].positions, prepared[0].memberships]]);
  assert.deepEqual(calls.calculations, [[charts[0].positions, charts[0].cusps, prepared[0].memberships, prepared[0].receptions, prepared[0].boundaryReceptions]]);
  assert.equal(calls.positions[0][0], charts[0]);
  assert.equal(calls.positions[0][2], prepared[0].receptions);
  assert.deepEqual(calls.positions[0][3], { memberships: prepared[0].memberships, boundaryReceptions: prepared[0].boundaryReceptions });
  const firstCompleted = calls.results[0][0];
  assert.equal(firstCompleted.positions, charts[0].positions);
  assert.equal(firstCompleted.cusps, charts[0].cusps);
  assert.equal(firstCompleted.pairs, prepared[0].receptions);
  assert.equal(firstCompleted.memberships, prepared[0].memberships);
  assert.equal(firstCompleted.boundaryReceptions, prepared[0].boundaryReceptions);
  assert.equal(document.querySelector('#result-settings').hidden, false);
  assert.deepEqual(calls.results.at(-1).slice(1), [false, '0111', { includeBoundaries: false, boundaryOptionKey: '0111' }]);
  const sharedUrl = dom.window.location.href;
  document.querySelector('#boundary-toggle').click();
  assert.deepEqual(calls.results.at(-1).slice(1), [false, '0111', { includeBoundaries: true, boundaryOptionKey: '0111' }]);
  document.querySelector('#boundary-steps-toggle').click();
  document.querySelector('#boundary-houses-toggle').click();
  document.querySelector('#boundary-signs-toggle').click();
  assert.deepEqual(calls.results.at(-1)[3], { includeBoundaries: true, boundaryOptionKey: '1000' });
  document.querySelector('#boundary-signs-toggle').click();
  document.querySelector('#boundary-conjunctions-toggle').click();
  assert.deepEqual(calls.results.at(-1)[3], { includeBoundaries: true, boundaryOptionKey: '1011' });
  document.querySelector('#reception-toggle').click();
  assert.deepEqual(calls.results.at(-1).slice(1), [true, '0111', { includeBoundaries: true, boundaryOptionKey: '1011' }]);
  document.querySelector('#boundary-toggle').click();
  assert.deepEqual(calls.results.at(-1).slice(1), [true, '0111', { includeBoundaries: false, boundaryOptionKey: '1011' }]);
  document.querySelector('#boundary-toggle').click();
  assert.equal(dom.window.location.href, sharedUrl);
  document.querySelector('#reception-houses-toggle').click();
  assert.equal(calls.memberships.length, 1);
  assert.equal(calls.lists.length, 1);
  assert.equal(calls.calculations.length, 1);
  assert.equal(calls.results.at(-1)[0], firstCompleted);
  assert.equal(calls.results.at(-1)[1], true);
  assert.equal(calls.results.at(-1)[2], '0011');
  assert.ok(firstCompleted.result.variants[calls.results.at(-1)[2]]);
  assert.deepEqual(calls.results.at(-1)[3], { includeBoundaries: true, boundaryOptionKey: '1011' });
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await nextTask();
  await nextTask();
  assert.equal(calls.memberships.length, 2);
  assert.equal(calls.lists.length, 2);
  assert.equal(calls.calculations.length, 2);
  assert.equal(calls.positions.length, 2);
  assert.deepEqual(calls.memberships[1], [charts[1].positions, charts[1].cusps]);
  assert.deepEqual(calls.lists[1], [charts[1].positions, prepared[1].memberships]);
  assert.deepEqual(calls.calculations[1], [charts[1].positions, charts[1].cusps, prepared[1].memberships, prepared[1].receptions, prepared[1].boundaryReceptions]);
  assert.deepEqual(calls.positions[1][3], { memberships: prepared[1].memberships, boundaryReceptions: prepared[1].boundaryReceptions });
  const secondCompleted = calls.results.at(-1)[0];
  assert.notEqual(secondCompleted, firstCompleted);
  assert.equal(secondCompleted.positions, charts[1].positions);
  assert.equal(secondCompleted.cusps, charts[1].cusps);
  assert.equal(secondCompleted.pairs, prepared[1].receptions);
  assert.equal(secondCompleted.memberships, prepared[1].memberships);
  assert.equal(secondCompleted.boundaryReceptions, prepared[1].boundaryReceptions);
  assert.notEqual(secondCompleted.result, firstCompleted.result);
  assert.equal(document.querySelector('#reception-toggle').checked, false);
  assert.equal(document.querySelector('#boundary-toggle').checked, false);
  assert.deepEqual(['steps', 'houses', 'signs', 'conjunctions'].map((name) => document.querySelector(`#boundary-${name}-toggle`).checked), [true, false, true, true]);
  document.querySelector('#clear-form').click();
  assert.equal(document.querySelector('#results').textContent, '');
  assert.equal(document.querySelector('#positions-results').textContent, '');
  assert.deepEqual(['steps', 'houses', 'signs', 'conjunctions'].map((name) => document.querySelector(`#boundary-${name}-toggle`).checked), [false, true, true, true]);
  assert.equal(document.querySelector('#result-settings').hidden, true);
});
