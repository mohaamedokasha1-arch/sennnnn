#!/usr/bin/env node
/** Regression checks for the root-layout Google Tag, without contacting Google. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const layout = readFileSync(new URL('../app/layout.jsx', import.meta.url), 'utf8');
assert.match(layout, /import Script from 'next\/script'/);
const scripts = [...layout.matchAll(/<Script\b[\s\S]*?(?:\/>|<\/Script>)/g)].map(([script]) => script);
const init = scripts.find((script) => script.includes('id="google-analytics-init"'));
const loader = scripts.find((script) => script.includes('id="google-analytics-loader"'));
assert.ok(init && loader, 'Both scripts must be in the shared root layout');
for (const script of [init, loader]) {
  assert.match(script, /strategy="afterInteractive"/);
}
assert.match(loader, /src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-MTEY12JS7Q"/);
const code = init.match(/\{`([\s\S]*?)`\}/)?.[1];
assert.ok(code, 'Initialization must remain a browser-executed script string');
// Server rendering must never evaluate window access as a JSX expression.
assert.equal(layout.match(/window\./g)?.length, code.match(/window\./g)?.length);

for (const existingQueue of [undefined, [{ event: 'existing-event' }]]) {
  const window = existingQueue ? { dataLayer: existingQueue } : {};
  vm.runInNewContext(code, { window });
  if (existingQueue) assert.equal(window.dataLayer, existingQueue, 'Preserve any existing queue');
  const commands = window.dataLayer.slice(existingQueue ? 1 : 0).map((args) => Array.from(args));
  assert.equal(commands.length, 2);
  assert.equal(commands[0][0], 'js');
  assert.equal(Object.prototype.toString.call(commands[0][1]), '[object Date]');
  assert.deepEqual(commands[1], ['config', 'G-MTEY12JS7Q']);
}
console.log('✓ Google Tag: shared layout, afterInteractive, correct ID, safe dataLayer initialization.');
