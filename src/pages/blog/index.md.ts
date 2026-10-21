import type { APIRoute } from 'astro';
import { blogDocument, markdownResponse } from '../../lib/discovery/documents';

export const GET: APIRoute = async () => markdownResponse(await blogDocument());
