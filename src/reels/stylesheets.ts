/**
 * Each reel's built stylesheet URL, keyed by reel id. A reel's CSS is not in
 * the homepage bundle: the head bootstrap writes the saved reel's <link>
 * before first paint, and the engine loads any other reel's while the
 * projector shows its title card. House lights loads none of them.
 */
import cameraCss from './camera.css?url';
export const CAMERA_CSS = cameraCss;

const urls = import.meta.glob<string>('./*/reel.css', {
  query: '?url',
  import: 'default',
  eager: true,
});

export const REEL_CSS: Record<string, string> = Object.fromEntries(
  Object.entries(urls).map(([path, url]) => [path.split('/')[1], url]),
);
