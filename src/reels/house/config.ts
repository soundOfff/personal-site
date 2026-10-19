import type { ReelConfig } from '../types';

/** No film: the default site, editorial-ui as it ships (light and dark). */
const house: ReelConfig = {
  id: 'house',
  n: '00',
  title: 'House lights',
  meta: 'no film · the default site',
  bands: [
    ['#FBFAF6', 4],
    ['#F2EEE4', 2],
    ['#D8891C', 1],
    ['#FBFAF6', 2],
    ['#1B1814', 1],
    ['#F7E7C8', 2],
  ],
  acts: [],
  stages: [],
  announce: 'House lights: the default site',
};

export default house;
