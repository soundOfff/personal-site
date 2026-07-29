/**
 * Query-time filtering of the [portfolio snapshot](./snapshot.ts).
 *
 * The whole snapshot is only a few thousand tokens, so this is not really about
 * fitting in the context window — it is about attention. Handing the model
 * eleven equally-weighted posts for a question about routing makes it hedge and
 * list; handing it the same eleven with the three routing posts expanded and the
 * rest as one-line stubs makes it answer.
 *
 * So: everything stays visible (the agent must never claim a post doesn't exist
 * because retrieval hid it), but only what scores well arrives with its
 * description and excerpt attached.
 *
 * The scorer is TF-IDF over the site's own corpus, which is the right amount of
 * machinery here — embeddings would mean a second model call and an index to
 * keep warm, to rank eleven documents.
 */

import type { PortfolioSnapshot, PostItem, WorkItem } from './snapshot';

/** How many posts and work items arrive with full text attached. */
const EXPANDED_POSTS = 5;
const EXPANDED_WORK = 3;

/** Words that match everything and therefore rank nothing. */
const STOPWORDS = new Set([
  'a',
  'about',
  'all',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'been',
  'built',
  'but',
  'by',
  'can',
  'did',
  'do',
  'does',
  'for',
  'from',
  'get',
  'give',
  'has',
  'have',
  'his',
  'how',
  'i',
  'in',
  'is',
  'it',
  'its',
  'know',
  'like',
  'list',
  'me',
  'more',
  'most',
  'my',
  'of',
  'on',
  'or',
  'show',
  'some',
  'tell',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'to',
  'up',
  'us',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'work',
  'would',
  'you',
  'your',
]);

/**
 * Lowercase, split on non-word characters, drop stopwords and single letters,
 * then trim one trailing "s" so "evals" and "eval" are the same term. Crude
 * stemming, but the corpus is small enough that anything cleverer is noise.
 */
function terms(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map((word) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word));
}

/** Fields weighted by how strongly a hit there signals the document is on-topic. */
interface Field {
  text: string;
  weight: number;
}

function postFields(post: PostItem): Field[] {
  return [
    { text: post.title, weight: 3 },
    { text: post.tags.join(' '), weight: 2.5 },
    { text: post.pillar, weight: 1.5 },
    { text: post.description, weight: 1.5 },
    { text: post.excerpt, weight: 1 },
  ];
}

function workFields(item: WorkItem): Field[] {
  return [
    { text: item.title, weight: 3 },
    { text: item.stack, weight: 2.5 },
    { text: item.description, weight: 1.5 },
    { text: item.excerpt, weight: 1 },
  ];
}

/**
 * Inverse document frequency across the corpus. A term in two of eleven posts
 * separates them; a term in all eleven ("the site", "engineering") does not, and
 * this is what stops the latter from dominating a long question.
 */
function idf(documents: string[][]): Map<string, number> {
  const seen = new Map<string, number>();
  for (const document of documents) {
    for (const term of new Set(document)) seen.set(term, (seen.get(term) ?? 0) + 1);
  }

  const scores = new Map<string, number>();
  for (const [term, count] of seen) {
    scores.set(term, Math.log(1 + documents.length / count));
  }
  return scores;
}

function score(fields: Field[], query: string[], weights: Map<string, number>): number {
  if (!query.length) return 0;

  let total = 0;
  for (const field of fields) {
    const bag = new Set(terms(field.text));
    for (const term of query) {
      if (bag.has(term)) total += field.weight * (weights.get(term) ?? 1);
    }
  }
  return total;
}

/* -------------------------------------------------------------- the payload */

/** A post the query didn't reach: enough to name and link, nothing more. */
type PostStub = Pick<PostItem, 'title' | 'href' | 'date' | 'pillar' | 'readingTime'>;
type WorkStub = Pick<WorkItem, 'title' | 'href' | 'year' | 'stack'>;

export interface AgentContext {
  profile: PortfolioSnapshot['profile'];
  proofs: PortfolioSnapshot['proofs'];
  /** Ranked. Expanded entries carry `description` and `excerpt`; stubs don't. */
  work: (WorkItem | WorkStub)[];
  posts: (PostItem | PostStub)[];
  repos: PortfolioSnapshot['repos'];
  log: PortfolioSnapshot['log'];
  principles: PortfolioSnapshot['principles'];
  toolbox: PortfolioSnapshot['toolbox'];
  now: PortfolioSnapshot['now'];
  /** What scored highest, so the prompt can say so out loud. */
  relevant: string[];
}

function postStub(post: PostItem): PostStub {
  const { title, href, date, pillar, readingTime } = post;
  return { title, href, date, pillar, readingTime };
}

function workStub(item: WorkItem): WorkStub {
  const { title, href, year, stack } = item;
  return { title, href, year, stack };
}

/**
 * Rank and trim the snapshot for one question.
 *
 * `query` should be the visitor's message plus any earlier ones — a follow-up
 * like "and the second one?" carries no terms of its own, and inheriting the
 * thread's vocabulary is what keeps the ranking stable across a conversation.
 */
export function selectContext(snapshot: PortfolioSnapshot, query: string): AgentContext {
  const queryTerms = terms(query);
  const weights = idf([
    ...snapshot.posts.map((post) =>
      terms(
        postFields(post)
          .map((f) => f.text)
          .join(' '),
      ),
    ),
    ...snapshot.work.map((item) =>
      terms(
        workFields(item)
          .map((f) => f.text)
          .join(' '),
      ),
    ),
  ]);

  // Posts are already newest-first from the snapshot, so a stable sort on score
  // alone leaves recency as the tiebreak — which is the right default for an
  // unscored question like "what are you writing about?".
  const rankedPosts = snapshot.posts
    .map((post) => ({ post, points: score(postFields(post), queryTerms, weights) }))
    .sort((a, b) => b.points - a.points);

  const rankedWork = snapshot.work
    .map((item) => ({ item, points: score(workFields(item), queryTerms, weights) }))
    .sort((a, b) => b.points - a.points);

  return {
    profile: snapshot.profile,
    proofs: snapshot.proofs,
    work: rankedWork.map(({ item }, i) => (i < EXPANDED_WORK ? item : workStub(item))),
    posts: rankedPosts.map(({ post }, i) => (i < EXPANDED_POSTS ? post : postStub(post))),
    repos: snapshot.repos,
    log: snapshot.log,
    principles: snapshot.principles,
    toolbox: snapshot.toolbox,
    now: snapshot.now,
    relevant: [...rankedWork, ...rankedPosts]
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .map((entry) => ('item' in entry ? entry.item.title : entry.post.title)),
  };
}
