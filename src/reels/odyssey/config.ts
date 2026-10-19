import type { ReelConfig } from '../types';
import { tokens } from '../tokens';

/**
 * A screenplay slugline: INT. or EXT., the place, then the time when it
 * changes. The no-break space keeps each dash with the field after it, so a
 * wrapped slug never ends a line on a dash.
 */
const slug = (...fields: string[]) => fields.join('\u00a0- ');

/**
 * Reel 05 · 2001: A Space Odyssey. Seeded from the design canvas board
 * Odyssey.dc.html.
 *
 * Contrast, checked against each act's `bg` (WCAG):
 *   I     ink 17.3 · muted 6.4 · accentInk 6.6 · muted2 4.9
 *   II    ink 16.7 · muted 5.6 · accentInk 5.8 · muted2 4.5
 *   III   ink 15.4 · muted 5.6 · accentInk 5.6 · muted2 4.6
 *   III·M ink 13.7 · muted 6.6 · accentInk 10.9 · muted2 4.8  (the red act:
 *         text sits on #4A0B08 or on the modules' faint white wash, ~5.7 at worst)
 *   IV    ink 16.6 · muted 6.1 · accentInk 5.6 · muted2 4.7
 * The ship console (the rail) is one fixed palette in reel.css: ink 15.3, muted 5.6.
 */
const odyssey: ReelConfig = {
  id: 'odyssey',
  n: '05',
  title: '2001: A Space Odyssey',
  year: 1968,
  director: 'Stanley Kubrick',
  ratio: '2.20:1',
  meta: '1968 · Stanley Kubrick · 2.20:1',
  bands: [
    ['#050505', 3],
    ['#C9B79C', 1],
    ['#050505', 1],
    ['#F2F2F0', 3],
    ['#E1261C', 1],
    ['#F2F2F0', 2],
    ['#FFD24A', 1],
    ['#0B0B0B', 2],
    ['#2D6CDF', 1],
    ['#E43F8F', 1],
    ['#F07B1D', 1],
    ['#18C1C9', 1],
    ['#050505', 2],
    ['#DDEBD2', 2],
  ],
  acts: [
    {
      code: 'I',
      name: 'The Dawn of Man',
      native: 'THE DAWN OF MAN',
      slug: slug('EXT. SPACE', 'BEHIND THE MOON', 'SUNRISE'),
      sections: ['readme'],
      tokens: tokens({
        bg: '#050608',
        surface: '#0E1014',
        ink: '#EDEDEA',
        ink2: '#C4C6C2',
        muted: '#8E918C',
        muted2: '#7A7D78',
        line: 'rgba(237,237,234,.14)',
        line2: 'rgba(237,237,234,.3)',
        accent: '#E1261C',
        accentInk: '#FF5A4E',
        onAccent: '#FFFFFF',
      }),
    },
    {
      code: 'II',
      name: 'TMA-1',
      native: 'TMA-1',
      slug: slug('INT. SPACE STATION V', 'LOUNGE'),
      sections: ['playground', 'work'],
      tokens: tokens({
        bg: '#F2F2F0',
        surface: '#FFFFFF',
        ink: '#111214',
        ink2: '#34363A',
        muted: '#5E6166',
        muted2: '#6C6F74',
        line: 'rgba(17,18,20,.14)',
        line2: 'rgba(17,18,20,.3)',
        accent: '#D63C2F',
        accentInk: '#B3261C',
        onAccent: '#FFFFFF',
      }),
    },
    {
      code: 'III',
      name: 'Jupiter Mission',
      native: 'JUPITER MISSION · 18 MONTHS LATER',
      slug: slug('INT. DISCOVERY', 'POD BAY'),
      sections: ['oss', 'log'],
      tokens: tokens({
        bg: '#E6E8E4',
        surface: '#F6F7F4',
        ink: '#0F1012',
        ink2: '#2F3237',
        muted: '#565A60',
        muted2: '#62666C',
        line: 'rgba(15,16,18,.15)',
        line2: 'rgba(15,16,18,.32)',
        accent: '#2D6CDF',
        accentInk: '#1F55B8',
        onAccent: '#FFFFFF',
      }),
    },
    {
      code: 'III·M',
      name: 'Logic memory center',
      native: 'JUPITER MISSION · AFTER THE INTERMISSION',
      slug: slug('INT. DISCOVERY', 'LOGIC MEMORY CENTER'),
      sections: ['writing', 'principles'],
      tokens: tokens({
        bg: '#4A0B08',
        surface: '#5E100C',
        ink: '#FBEDEA',
        ink2: '#F0CFC9',
        muted: '#D49A92',
        muted2: '#B98078',
        line: 'rgba(255,200,190,.22)',
        line2: 'rgba(255,200,190,.36)',
        accent: '#FF3B2F',
        accentInk: '#FFD24A',
        onAccent: '#1A0302',
      }),
    },
    {
      code: 'IV',
      name: 'Jupiter and Beyond the Infinite',
      native: 'JUPITER AND BEYOND THE INFINITE',
      slug: slug('INT. THE ROOM'),
      sections: ['stack', 'now'],
      tokens: tokens({
        bg: '#EEF4E8',
        surface: '#FBFDF8',
        ink: '#10140F',
        ink2: '#2E352C',
        muted: '#555D4E',
        muted2: '#666E5F',
        line: 'rgba(16,20,15,.14)',
        line2: 'rgba(16,20,15,.3)',
        accent: '#0B0B0B',
        accentInk: '#3F6B2A',
        onAccent: '#FFFFFF',
      }),
    },
  ],
  type: {
    display: "'Michroma', 'Hanken Grotesk Variable', system-ui, sans-serif",
    body: "'Hanken Grotesk Variable', system-ui, sans-serif",
    mono: "'DM Mono', ui-monospace, Menlo, monospace",
    // the film's own titles and intertitles are Gill Sans; Michroma is the ship's
    title: "'Gill Sans', 'Gill Sans MT', 'Hanken Grotesk Variable', system-ui, sans-serif",
  },
  sections: {
    readme: { slug: slug('EXT. SPACE', 'BEHIND THE MOON', 'SUNRISE') },
    playground: { slug: slug('INT. SPACE STATION V', 'LOUNGE') },
    work: { slug: slug('EXT. TYCHO CRATER', 'TMA-1 EXCAVATION') },
    oss: { slug: slug('INT. DISCOVERY', 'POD BAY') },
    log: { slug: slug('INT. DISCOVERY', 'CENTRIFUGE') },
    writing: { slug: slug('INT. DISCOVERY', 'LOGIC MEMORY CENTER') },
    principles: { slug: slug('INT. DISCOVERY', 'LOGIC MEMORY CENTER', 'CONTINUOUS') },
    stack: { slug: slug('INT. THE ROOM') },
    now: { slug: slug('INT. THE ROOM', 'LATER') },
  },
  stages: [
    'backdrop',
    'rail',
    'title',
    'in:readme',
    'after:readme',
    'in:playground',
    'after:work',
    'in:log',
    'after:log',
    'after:principles',
    'in:now',
    'credits',
  ],
  layout: { nav: 'console', hero: 'alignment', flow: 'odyssey', grid: 'axial' },
  scroll: ['alignment parallax', 'match cut', 'centrifuge drum', 'star gate', 'Earth to Jupiter'],
  motifs: [
    'red lens agent',
    'act intertitles',
    'intermission',
    'match cut',
    'logic memory modules',
    'star gate',
    'luminous floor',
    'monolith 1:4:9',
    'Rosario clock',
    'quota lamps',
  ],
  sound: {
    hover: 'console tick, tuned to C',
    click: 'console clunk',
    section: 'two-tone console beep, a step up per act',
    surface: 'transmission beeps over a climbing harp',
    done: 'a Viennese waltz cadence on harp and strings, D7 to G',
    error: 'HAL winding down: a sung note that slows and sags',
    signature:
      'the sunrise: organ pedal on C, trumpets climbing C–G–C′, the minor third flipping major, timpani on C and G',
    waltz: 'the station waltz at the match cut: oom–pah–pah, beat two early, harp and strings',
    monolith: 'a Ligeti choir: neighbouring semitones entering one by one, drifting',
    centrifuge: 'a lonely string adagio, A minor, after Khachaturian',
    intermission: "the entr'acte, after Ligeti's Atmosphères: a soft cluster held in the strings",
    gate: 'rushing noise over a low string cluster',
  },
  credits: 'A fan homage, not affiliated with the film.',
  announce: 'Now showing: 2001: A Space Odyssey, 1968',
};

export default odyssey;
