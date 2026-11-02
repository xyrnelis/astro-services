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

function zodiacIcon(file, label) {
  return `<img class="astro-symbol" src="./zodiacfonts/${file}.svg" alt="${label}" title="${label}" />`;
}

function zodiacFallback(symbol, label) {
  return `<span class="astro-symbol astro-symbol-fallback" role="img" aria-label="${label}" title="${label}">${symbol}</span>`;
}

export const PLANET_LABELS = {
  Sun: zodiacIcon('sun', 'Солнце'), Moon: zodiacIcon('moon', 'Луна'), Mercury: zodiacIcon('mercury', 'Меркурий'), Proserpina: zodiacFallback('⚳', 'Прозерпина'),
  Venus: zodiacIcon('venus', 'Венера'), Chiron: zodiacIcon('chiron', 'Хирон'), Mars: zodiacIcon('mars', 'Марс'), Pluto: zodiacIcon('pluto-1', 'Плутон'),
  Jupiter: zodiacIcon('jupiter', 'Юпитер'), Neptune: zodiacIcon('neptune', 'Нептун'), Saturn: zodiacIcon('saturn', 'Сатурн'), Uranus: zodiacIcon('uranus-1', 'Уран'),
};

export const PLANET_NAMES = {
  Sun: 'Солнце', Moon: 'Луна', Mercury: 'Меркурий', Proserpina: 'Прозерпина',
  Venus: 'Венера', Chiron: 'Хирон', Mars: 'Марс', Pluto: 'Плутон',
  Jupiter: 'Юпитер', Neptune: 'Нептун', Saturn: 'Сатурн', Uranus: 'Уран',
};

export const SIGN_LABELS = {
  Aries: zodiacIcon('aries', 'Овен'), Taurus: zodiacIcon('taurus', 'Телец'), Gemini: zodiacIcon('gemini', 'Близнецы'), Cancer: zodiacIcon('cancer', 'Рак'), Leo: zodiacIcon('leo', 'Лев'), Virgo: zodiacIcon('virgo', 'Дева'),
  Libra: zodiacIcon('libra', 'Весы'), Scorpio: zodiacIcon('scorpio', 'Скорпион'), Sagittarius: zodiacIcon('sagittarius', 'Стрелец'), Capricorn: zodiacIcon('capricorn-2', 'Козерог'),
  Aquarius: zodiacIcon('aquarius', 'Водолей'), Pisces: zodiacIcon('pisces', 'Рыбы'),
};

export const SIGN_NAMES_IN = {
  Aries: 'Овне', Taurus: 'Тельце', Gemini: 'Близнецах', Cancer: 'Раке', Leo: 'Льве', Virgo: 'Деве',
  Libra: 'Весах', Scorpio: 'Скорпионе', Sagittarius: 'Стрельце', Capricorn: 'Козероге',
  Aquarius: 'Водолее', Pisces: 'Рыбах',
};

export const HOUSE_LABELS = {
  1: zodiacIcon('house-one', '1 дом'), 2: zodiacIcon('house-two', '2 дом'), 3: zodiacIcon('house-three', '3 дом'), 4: zodiacIcon('house-four', '4 дом'),
  5: zodiacIcon('house-five', '5 дом'), 6: zodiacIcon('house-six', '6 дом'), 7: zodiacIcon('house-seven', '7 дом'), 8: zodiacIcon('house-eight', '8 дом'),
  9: zodiacIcon('house-nine', '9 дом'), 10: zodiacIcon('house-ten', '10 дом'), 11: zodiacIcon('house-eleven', '11 дом'), 12: zodiacIcon('house-twelve', '12 дом'),
};

export const CONJUNCTION_SYMBOL = zodiacIcon('conjunction', 'Соединение');

