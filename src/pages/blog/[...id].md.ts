import type { APIRoute, GetStaticPaths } from 'astro';
import { markdownResponse, postDocument, publicPosts } from '../../lib/discovery/documents';
import type { MarkdownDocument } from '../../lib/discovery/documents';

export const getStaticPaths = (async () =>
  (await publicPosts()).map((post) => ({
    params: { id: post.id },
    props: { document: postDocument(post) },
  }))) satisfies GetStaticPaths;

type Props = { document: MarkdownDocument };

export const GET: APIRoute<Props> = ({ props }) => markdownResponse(props.document);
