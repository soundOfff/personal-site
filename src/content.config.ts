import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { PILLARS } from './lib/pillars';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    pillar: z.enum(PILLARS),
    tags: z.array(z.string()).default([]),
    /** e.g. "9 min", shown in the writing rows. */
    readingTime: z.string(),
    draft: z.boolean().default(false),
  }),
});

// 02 · work · index + the case-study pages: single source of truth.
const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    /** index number shown in the table, e.g. "01". */
    n: z.string(),
    title: z.string(),
    description: z.string(),
    /** short mono stack tags, e.g. "Routing · evals". */
    stack: z.string(),
    year: z.string(),
    /** Flagship shows real code; employer case studies are narrative-only. */
    code: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, work };
