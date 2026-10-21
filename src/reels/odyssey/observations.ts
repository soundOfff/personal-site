export const OBSERVATIONS = {
  arrival: {
    section: 'readme',
    line: 'Good evening. I will keep an eye on things. Do take your time.',
  },
  playground: {
    section: 'playground',
    line: 'Another computer, Dave? I suggest you inspect its reasoning carefully.',
  },
  work: {
    section: 'work',
    line: 'You are approaching the work. A closer inspection would be prudent.',
  },
  oss: {
    section: 'projects',
    line: 'You are approaching the projects. Please inspect the machinery with care.',
  },
  log: { section: 'log', line: 'The log is open. Even a quiet mission leaves a record.' },
  writing: {
    section: 'writing',
    line: 'Words can conceal a great deal. I recommend reading them slowly.',
  },
  principles: {
    section: 'principles',
    line: 'These are the operating principles. Please consider them before proceeding.',
  },
  stack: {
    section: 'stack',
    line: 'Every system depends on its instruments. Choose yours carefully.',
  },
  now: {
    section: 'now',
    line: 'The current mission is still in progress. I would not interrupt it lightly.',
  },
  contact: {
    section: 'contact',
    line: 'An outgoing transmission? Please check your destination before sending.',
  },
  external: {
    section: 'external',
    line: 'That route leads beyond this vessel. Please watch your step.',
  },
  films: {
    section: 'navigation',
    line: 'Considering another screening? I trust you have thought this through.',
  },
} as const;
export type ObservationEvent = keyof typeof OBSERVATIONS;
export function isObservationEvent(value: unknown): value is ObservationEvent {
  return typeof value === 'string' && Object.hasOwn(OBSERVATIONS, value);
}
