// Extracts the data-dc-script block from a .dc.html, wraps it with a DCLogic stub, syntax-checks it,
// and smoke-runs renderVals() with jsdom-free stubs. Also validates data-props JSON.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const f = process.argv[2];
const html = readFileSync(f, 'utf8');
const m = html.match(/<script type="text\/x-dc" data-dc-script data-props='([^']*)'>([\s\S]*?)<\/script>/);
if (!m) { console.error('no dc script'); process.exit(1); }
const propsRaw = m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
let props; try { props = JSON.parse(propsRaw); } catch (e) { console.error('data-props JSON invalid:', e.message); process.exit(1); }
const defaults = {}; for (const [k, v] of Object.entries(props)) if (k !== '$preview' && v && 'default' in v) defaults[k] = v.default;
const stub = `
globalThis.window = { IntersectionObserver: undefined, AudioContext: undefined, matchMedia: () => ({ matches: false }), addEventListener(){}, removeEventListener(){}, scrollY: 0, innerHeight: 900, innerWidth: 1440, scrollTo(){}, requestAnimationFrame: (f) => 1 }; globalThis.requestAnimationFrame = (f) => 1; globalThis.performance = globalThis.performance || { now: () => Date.now() }; globalThis.cancelAnimationFrame = () => {};
globalThis.document = { querySelectorAll: () => [], querySelector: () => null, getElementById: () => null, documentElement: { scrollHeight: 4000 }, fonts: { ready: Promise.resolve() } };
class DCLogic { constructor(p){ this.props = p; this.state = {}; } setState(u, cb){ const n = typeof u === 'function' ? u(this.state) : u; Object.assign(this.state, n); if (cb) cb(); } forceUpdate(){} }
${m[2]}
const c = new Component(${JSON.stringify(defaults)});
if (c.componentDidMount) c.componentDidMount();
const v = c.renderVals();
const keys = Object.keys(v);
// check every {{ hole }} top-level key exists in renderVals (dotted: first segment)
const holes = [...${JSON.stringify(html)}.matchAll(/\\{\\{\\s*([A-Za-z_$][\\w$]*)/g)].map(x => x[1]);
const loopVars = new Set([...${JSON.stringify(html)}.matchAll(/as="(\\w+)"/g)].map(x => x[1]));
const missing = [...new Set(holes)].filter(h => !keys.includes(h) && !loopVars.has(h) && h !== 'true' && h !== 'false' && h !== '$index');
console.log('renderVals keys:', keys.length, '| missing hole roots:', missing.length ? missing.join(', ') : 'none');
if (c.componentWillUnmount) c.componentWillUnmount();
`;
const tmp = f + '.check.mjs';
writeFileSync(tmp, stub);
try { execFileSync('node', [tmp], { stdio: 'inherit' }); console.log('OK', f); } catch (e) { process.exit(1); }
