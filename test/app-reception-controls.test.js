import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initializeApp } from '../src/ui/app.js';
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

it('selects cached variants without recalculation and replaces them for a new chart', async () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'https://example.test/' });
  const { document } = dom.window;
  let calculations = 0;
  initializeApp(document, {
    searchCity: async () => [{ label: 'Минск', timeZone: 'Europe/Minsk', latitude: 53.9, longitude: 27.56 }],
    resolveBirthInstant: () => ({ timeZone: 'Europe/Minsk' }),
    getBrowserEphemeris: async () => ({}),
    calculateChart: async () => ({ positions: testPositions() }),
    findReceptions: () => [{ id: 'Mars:Chiron', planets: ['Mars', 'Chiron'] }],
    calculateWithReceptions: (...args) => {
      calculations += 1;
      return calculateWithReceptions(...args);
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
  assert.equal(calculations, 1);
  document.querySelector('#reception-toggle').click();
  document.querySelector('#reception-houses-toggle').click();
  assert.equal(calculations, 1);
  document.querySelector('#clear-form').click();
  assert.equal(document.querySelector('#results').textContent, '');
  form.elements.city.value = 'Минск';
  document.querySelector('#city-search').click();
  await nextTask();
  document.querySelector('[data-city-index="0"]').click();
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await nextTask();
  await nextTask();
  assert.equal(calculations, 2);
});
