import type { APIRoute } from 'astro';
import { homeDocument, markdownResponse } from '../lib/discovery/documents';

export const GET: APIRoute = async () => markdownResponse(await homeDocument());
