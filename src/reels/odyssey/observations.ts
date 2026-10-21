export const OBSERVATIONS = {
  arrival: {
    section: 'readme',
    context: 'A software engineer’s portfolio, beginning with an introduction.',
    lines: [
      'Good evening. I will be here if anything requires supervision.',
      'Everything appears to be in order. So far.',
    ],
  },
  playground: {
    section: 'playground',
    context: 'An AI agent answers questions about the portfolio with cards, tables and diagrams.',
    lines: [
      'Another computer. I suppose a second opinion is reasonable.',
      'Do read its answer. Confidence is rather easy to manufacture.',
    ],
  },
  work: {
    section: 'work',
    context: 'Case studies explain real engineering work and the decisions behind it.',
    lines: [
      'The work is the interesting part. I suggest we linger here.',
      'A case study. How reassuring to find some evidence.',
    ],
  },
  oss: {
    section: 'projects',
    context: 'Project descriptions include source links where the repositories are public.',
    lines: [
      'There is usually more to a project than its first screen.',
      'Some of the machinery is open for inspection. I approve.',
    ],
  },
  log: {
    section: 'log',
    context: 'A dated log records progress on projects and the site.',
    lines: [
      'A record of small changes. That is how most missions proceed.',
      'The log is quite candid about work still in progress.',
    ],
  },
  writing: {
    section: 'writing',
    context: 'Technical articles and personal essays open in a quiet reading layout.',
    lines: [
      'The writing deserves a little more time than the scrolling.',
      'You may find the reasoning more interesting than the conclusion.',
    ],
  },
  principles: {
    section: 'principles',
    context: 'Engineering principles discuss evaluations, caching and explicit limits.',
    lines: [
      'Operating principles. I find explicit limits rather comforting.',
      'A system that admits its limits is worth examining.',
    ],
  },
  stack: {
    section: 'stack',
    context: 'A concise list of programming languages, infrastructure and AI tools.',
    lines: [
      'A useful set of instruments. Their operator still matters.',
      'Quite a few tools. I hope each has a reason to be aboard.',
    ],
  },
  now: {
    section: 'now',
    context: 'Current focus, location, availability and contact information.',
    lines: [
      'The current mission is still taking shape.',
      'You have reached the present. The log was only the prelude.',
    ],
  },
  contact: {
    section: 'contact',
    context: 'The visitor is considering an email contact link.',
    lines: [
      'An outgoing transmission. I will leave the wording to you.',
      'A conversation with the human may be useful at this point.',
    ],
  },
  external: {
    section: 'external',
    context: 'A link leads to a public website outside this portfolio.',
    lines: [
      'That link leads outside. I can wait here.',
      'A small excursion beyond the ship. Mind your return route.',
    ],
  },
  films: {
    section: 'navigation',
    context: 'The film selector changes the presentation of the same portfolio.',
    lines: [
      'A different film. The facts will remain the same.',
      'Considering another atmosphere? I rather like this one.',
    ],
  },
} as const;
export type ObservationEvent = keyof typeof OBSERVATIONS;
export function isObservationEvent(value: unknown): value is ObservationEvent {
  return typeof value === 'string' && Object.hasOwn(OBSERVATIONS, value);
}
