export const CHANNELS = [
  { id: 'luminaries', label: 'Светила', planets: ['Sun', 'Moon'], signs: ['Cancer', 'Leo'], houses: [4, 5] },
  { id: 'mercury', label: 'Меркурий', planets: ['Mercury', 'Proserpina'], signs: ['Gemini', 'Virgo'], houses: [3, 6] },
  { id: 'venus', label: 'Венера', planets: ['Venus', 'Chiron'], signs: ['Taurus', 'Libra'], houses: [2, 7] },
  { id: 'mars', label: 'Марс', planets: ['Mars', 'Pluto'], signs: ['Aries', 'Scorpio'], houses: [1, 8] },
  { id: 'jupiter', label: 'Юпитер', planets: ['Jupiter', 'Neptune'], signs: ['Sagittarius', 'Pisces'], houses: [9, 12] },
  { id: 'saturn', label: 'Сатурн', planets: ['Saturn', 'Uranus'], signs: ['Capricorn', 'Aquarius'], houses: [10, 11] },
];

export const PLANETS = CHANNELS.flatMap((channel) => channel.planets);
export const DISPLAY_PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'Proserpina',
];

const ROMAN_HOUSE_VIEW_BOXES = {
  1: '0 0 282 512', 2: '0 0 493 512', 3: '0 0 706 512', 4: '0 0 649 512',
  5: '0 0 456 512', 6: '0 0 649 512', 7: '0 0 861 512', 8: '0 0 1073 512',
  9: '0 0 654 512', 10: '0 0 459 512', 11: '0 0 653 512', 12: '0 0 866 512',
};

function astroIcon(id, label, viewBox = '0 0 512 512', className = '') {
  return `<svg class="astro-symbol${className}" role="img" aria-label="${label}" title="${label}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet"><use href="./astro-icons/astro-icons.svg#${id}"></use></svg>`;
}

function romanHouseIcon(house) {
  return astroIcon(
    `house-roman-${String(house).padStart(2, '0')}`,
    `${house} дом`,
    ROMAN_HOUSE_VIEW_BOXES[house],
    ' astro-symbol-house',
  );
}

function planetIcon(id, label, viewBox) {
  return astroIcon(id, label, viewBox, ' astro-symbol-planet');
}

function signIcon(id, label) {
  return astroIcon(id, label, undefined, ' astro-symbol-sign');
}

export const PLANET_LABELS = {
  Sun: planetIcon('planet-sun', 'Солнце'), Moon: planetIcon('planet-moon', 'Луна'), Mercury: planetIcon('planet-mercury', 'Меркурий'), Proserpina: planetIcon('planet-proserpina', 'Прозерпина', '0 0 1024 1024'),
  Venus: planetIcon('planet-venus', 'Венера'), Chiron: planetIcon('planet-chiron', 'Хирон'), Mars: planetIcon('planet-mars', 'Марс'), Pluto: planetIcon('planet-pluto', 'Плутон'),
  Jupiter: planetIcon('planet-jupiter', 'Юпитер'), Neptune: planetIcon('planet-neptune', 'Нептун'), Saturn: planetIcon('planet-saturn', 'Сатурн'), Uranus: planetIcon('planet-uranus', 'Уран'),
};

export const PLANET_NAMES = {
  Sun: 'Солнце', Moon: 'Луна', Mercury: 'Меркурий', Proserpina: 'Прозерпина',
  Venus: 'Венера', Chiron: 'Хирон', Mars: 'Марс', Pluto: 'Плутон',
  Jupiter: 'Юпитер', Neptune: 'Нептун', Saturn: 'Сатурн', Uranus: 'Уран',
};

export const SIGN_LABELS = {
  Aries: signIcon('sign-aries', 'Овен'), Taurus: signIcon('sign-taurus', 'Телец'), Gemini: signIcon('sign-gemini', 'Близнецы'), Cancer: signIcon('sign-cancer', 'Рак'), Leo: signIcon('sign-leo', 'Лев'), Virgo: signIcon('sign-virgo', 'Дева'),
  Libra: signIcon('sign-libra', 'Весы'), Scorpio: signIcon('sign-scorpio', 'Скорпион'), Sagittarius: signIcon('sign-sagittarius', 'Стрелец'), Capricorn: signIcon('sign-capricorn', 'Козерог'),
  Aquarius: signIcon('sign-aquarius', 'Водолей'), Pisces: signIcon('sign-pisces', 'Рыбы'),
};

export const SIGN_NAMES_IN = {
  Aries: 'Овне', Taurus: 'Тельце', Gemini: 'Близнецах', Cancer: 'Раке', Leo: 'Льве', Virgo: 'Деве',
  Libra: 'Весах', Scorpio: 'Скорпионе', Sagittarius: 'Стрельце', Capricorn: 'Козероге',
  Aquarius: 'Водолее', Pisces: 'Рыбах',
};

export const HOUSE_LABELS = {
  1: romanHouseIcon(1), 2: romanHouseIcon(2), 3: romanHouseIcon(3), 4: romanHouseIcon(4),
  5: romanHouseIcon(5), 6: romanHouseIcon(6), 7: romanHouseIcon(7), 8: romanHouseIcon(8),
  9: romanHouseIcon(9), 10: romanHouseIcon(10), 11: romanHouseIcon(11), 12: romanHouseIcon(12),
};

export const CONJUNCTION_SYMBOL = astroIcon('aspect-conjunction', 'Соединение');

