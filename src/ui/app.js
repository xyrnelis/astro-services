import { calculateWithReceptions } from '../domain/calculate-with-receptions.js';
import { findReceptions } from '../domain/find-receptions.js';
import { calculateChart, getBrowserEphemeris } from '../astronomy/chart-calculator.js';
import { searchCity } from '../astronomy/geo.js';
import { resolveBirthInstant } from '../astronomy/time.js';
import { renderCityMatches, renderPositions, renderResults } from './render.js';
import { clearSharedBirth, readSharedBirth, writeSharedBirth } from './share-url.js';

export function initializeApp(root = document) {
  const form = root.querySelector('#birth-form');
  const cityInput = form.elements.city;
  const citySearch = root.querySelector('#city-search');
  const cityResults = root.querySelector('#city-results');
  const useOffset = root.querySelector('#use-offset');
  const offsetField = root.querySelector('#offset-field');
  const locationOutput = root.querySelector('#location-output');
  const status = root.querySelector('#status');
  const results = root.querySelector('#results');
  const positions = root.querySelector('#positions-results');
  const clearButton = root.querySelector('#clear-form');
  const receptionToggle = root.querySelector('#reception-toggle');
  const receptionStepsToggle = root.querySelector('#reception-steps-toggle');
  const receptionHousesToggle = root.querySelector('#reception-houses-toggle');
  const receptionSignsToggle = root.querySelector('#reception-signs-toggle');
  const receptionConjunctionsToggle = root.querySelector('#reception-conjunctions-toggle');
  const pageWindow = root.defaultView ?? window;
  let matches = [];
  let selectedCity = null;
  let searchRequest = 0;
  let completedCalculation = null;

  const receptionOptionKey = () => [
    receptionStepsToggle.checked,
    receptionHousesToggle.checked,
    receptionSignsToggle.checked,
    receptionConjunctionsToggle.checked,
  ].map((enabled) => (enabled ? '1' : '0')).join('');
  const updateReceptionControls = () => {
    const enabled = !receptionToggle.disabled && receptionToggle.checked;
    receptionStepsToggle.disabled = !enabled;
    receptionHousesToggle.disabled = !enabled;
    receptionSignsToggle.disabled = !enabled;
    if (!receptionSignsToggle.checked) receptionConjunctionsToggle.checked = false;
    receptionConjunctionsToggle.disabled = !enabled || !receptionSignsToggle.checked;
  };
  const renderCompletedResults = () => {
    if (completedCalculation) {
      results.innerHTML = renderResults(
        completedCalculation,
        receptionToggle.checked,
        receptionOptionKey(),
      );
    }
  };

  const setStatus = (message, kind = '') => {
    status.textContent = message;
    status.className = `status ${kind}`;
  };
  const selectCity = (city) => {
    selectedCity = city;
    cityInput.value = city.label;
    locationOutput.textContent = `${city.timeZone} · ${city.latitude.toFixed(4)}, ${city.longitude.toFixed(4)}`;
    cityResults.replaceChildren();
    setStatus('');
  };

  citySearch.addEventListener('click', async () => {
    const request = ++searchRequest;
    setStatus('Ищем город...');
    try {
      matches = await searchCity(cityInput.value);
      if (request !== searchRequest) return;
      cityResults.innerHTML = renderCityMatches(matches);
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Не удалось найти город.', 'error');
    }
  });
  cityInput.addEventListener('input', () => {
    searchRequest += 1;
    selectedCity = null;
    matches = [];
    cityResults.replaceChildren();
    locationOutput.textContent = 'Город не выбран';
  });
  cityResults.addEventListener('click', (event) => {
    const button = event.target.closest('[data-city-index]');
    if (button) selectCity(matches[Number(button.dataset.cityIndex)]);
  });
  cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      citySearch.click();
    }
  });
  form.addEventListener('keydown', (event) => {
    if (
      event.key === 'Enter'
      && event.target !== cityInput
      && event.target.tagName !== 'BUTTON'
      && selectedCity
      && form.elements.date.value
      && form.elements.time.value
    ) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  useOffset.addEventListener('change', () => { offsetField.hidden = !useOffset.checked; });
  clearButton.addEventListener('click', () => {
    form.reset();
    selectedCity = null;
    matches = [];
    searchRequest += 1;
    cityResults.replaceChildren();
    results.replaceChildren();
    positions.replaceChildren();
    completedCalculation = null;
    receptionToggle.checked = false;
    receptionToggle.disabled = true;
    receptionStepsToggle.checked = true;
    receptionHousesToggle.checked = false;
    receptionSignsToggle.checked = false;
    receptionConjunctionsToggle.checked = false;
    updateReceptionControls();
    offsetField.hidden = true;
    locationOutput.textContent = 'Город не выбран';
    setStatus('');
    const clearedUrl = clearSharedBirth(pageWindow.location.href);
    pageWindow.history.replaceState(null, '', `${clearedUrl.pathname}${clearedUrl.search}${clearedUrl.hash}`);
  });

  receptionToggle.addEventListener('change', () => {
    updateReceptionControls();
    renderCompletedResults();
  });
  [receptionStepsToggle, receptionHousesToggle, receptionSignsToggle, receptionConjunctionsToggle]
    .forEach((toggle) => toggle.addEventListener('change', () => {
      updateReceptionControls();
      renderCompletedResults();
    }));

  const calculate = async ({ updateUrl = true } = {}) => {
    if (!selectedCity) {
      setStatus('Сначала выберите город из результатов поиска.', 'error');
      return false;
    }
    setStatus('Загружаем эфемериды и рассчитываем карту...');
    results.replaceChildren();
    positions.replaceChildren();
    completedCalculation = null;
    receptionToggle.checked = false;
    receptionToggle.disabled = true;
    updateReceptionControls();
    try {
      const birth = resolveBirthInstant({
        date: form.elements.date.value,
        time: form.elements.time.value,
        timeZone: selectedCity.timeZone,
        utcOffset: useOffset.checked ? form.elements.utcOffset.value : undefined,
      });
      const ephemeris = await getBrowserEphemeris();
      const chart = await calculateChart({ ...birth, latitude: selectedCity.latitude, longitude: selectedCity.longitude }, ephemeris);
      const receptions = findReceptions(chart.positions);
      const result = calculateWithReceptions(chart.positions, receptions);
      const birthDetails = {
        ...birth,
        cityLabel: selectedCity.label,
        date: form.elements.date.value,
        time: form.elements.time.value,
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
      };
      positions.innerHTML = renderPositions(chart, birthDetails, receptions);
      completedCalculation = { positions: chart.positions, pairs: receptions, result };
      receptionToggle.disabled = false;
      updateReceptionControls();
      renderCompletedResults();
      if (updateUrl) {
        const sharedUrl = writeSharedBirth(pageWindow.location.href, {
          date: birthDetails.date,
          time: birthDetails.time,
          city: selectedCity,
          utcOffset: useOffset.checked ? form.elements.utcOffset.value : undefined,
        });
        pageWindow.history.replaceState(null, '', `${sharedUrl.pathname}${sharedUrl.search}${sharedUrl.hash}`);
      }
      setStatus('Расчёт готов.', 'success');
      return true;
    } catch (error) {
      setStatus(error.message || 'Не удалось выполнить расчёт.', 'error');
      return false;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await calculate();
  });

  const restoreSharedCalculation = async () => {
    try {
      const sharedBirth = readSharedBirth(pageWindow.location.search);
      if (!sharedBirth) return;
      form.elements.date.value = sharedBirth.date;
      form.elements.time.value = sharedBirth.time;
      cityInput.value = sharedBirth.city.label;
      selectedCity = sharedBirth.city;
      useOffset.checked = sharedBirth.utcOffset !== null;
      offsetField.hidden = !useOffset.checked;
      form.elements.utcOffset.value = sharedBirth.utcOffset ?? '';
      locationOutput.textContent = `${selectedCity.timeZone} · ${selectedCity.latitude.toFixed(4)}, ${selectedCity.longitude.toFixed(4)}`;
      await calculate({ updateUrl: false });
    } catch (error) {
      setStatus(error.message || 'Не удалось прочитать данные из ссылки.', 'error');
    }
  };

  void restoreSharedCalculation();
}
