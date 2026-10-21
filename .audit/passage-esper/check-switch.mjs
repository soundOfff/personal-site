import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';

function loadSwitch(source, prepare) {
  const file = ts.createSourceFile('engine.ts', source, ts.ScriptTarget.Latest, true);
  const node = file.statements.find(
    (item) => ts.isFunctionDeclaration(item) && item.name?.text === 'switchReel',
  );
  assert(node, 'real engine exports switchReel');
  const code = ts.transpileModule(
    ts.createPrinter().printNode(ts.EmitHint.Unspecified, node, file),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    },
  ).outputText;
  const applied = [];
  let current = { id: 'house' };
  const context = {
    exports: {},
    prepare,
    reducedMotion: { matches: false },
    document: { querySelector: () => null },
    reelById: (id) => ({ id }),
    currentReel: () => current,
    apply: (reel) => {
      current = reel;
      applied.push(reel.id);
    },
    restartAtTop() {},
    mount: async () => null,
    announce() {},
  };
  vm.runInNewContext(`let switching = false; let mounted = null;\n${code}`, context);
  return { switchReel: context.exports.switchReel, applied };
}

async function race(source) {
  let release;
  const first = new Promise((resolve) => {
    release = resolve;
  });
  const engine = loadSwitch(source, (id) => (id === 'parasite' ? first : Promise.resolve(null)));
  const pending = engine.switchReel('parasite', { instant: true });
  await engine.switchReel('br2049', { instant: true });
  release(null);
  await pending;
  return engine.applied;
}

const before = execFileSync('git', ['show', '29a3f2f:src/reels/engine.ts'], { encoding: 'utf8' });
const after = readFileSync('src/reels/engine.ts', 'utf8');
assert.deepEqual(
  await race(before),
  ['br2049', 'parasite'],
  'baseline reproduces stale selection overwriting the newer one',
);
assert.deepEqual(await race(after), ['parasite'], 'pending choice serializes every engine caller');
const failures = loadSwitch(after, (id) =>
  id === 'parasite' ? Promise.reject(new Error('load failed')) : Promise.resolve(null),
);
await assert.rejects(failures.switchReel('parasite', { instant: true }), /load failed/);
await failures.switchReel('br2049', { instant: true });
assert.deepEqual(
  failures.applied,
  ['br2049'],
  'failed loading releases the shared selection guard',
);
console.log(
  'PASS: baseline race reproduced, shared selection serialization verified, failure unlock verified.',
);
