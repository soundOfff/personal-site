/**
 * Reel 04 · The Grand Budapest Hotel: the reel's behaviour (scroll scenes, motifs, sound).
 * Loaded on demand when the reel starts screening; everything registered
 * against ctx.signal is torn down when it stops.
 */
import type { ReelModule } from '../types';

const reel: ReelModule = {
  mount(_ctx) {
    return () => {};
  },
};

export default reel;
