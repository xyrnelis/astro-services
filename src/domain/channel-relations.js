import { CHANNELS } from './channels.js';

export const channelIndexById = Object.fromEntries(CHANNELS.map((channel, index) => [channel.id, index]));
export const channelByPlanet = Object.fromEntries(
  CHANNELS.flatMap((channel) => channel.planets.map((planet) => [planet, channel.id])),
);
export const channelBySign = Object.fromEntries(
  CHANNELS.flatMap((channel) => channel.signs.map((sign) => [sign, channel.id])),
);
export const channelByHouse = Object.fromEntries(
  CHANNELS.flatMap((channel) => channel.houses.map((house) => [house, channel.id])),
);
export const rulersBySign = Object.fromEntries(
  CHANNELS.flatMap((channel) => channel.signs.map((sign) => [sign, channel.planets])),
);
