import assert from 'node:assert/strict';

// Smoke test: required module/tab keys exist in both locale blocks of catalog.ts.
const requiredTabs = [
  'crewData',
  'crewSchedule',
  'crewExperience',
  'aircraftOverview',
  'flightPlanning',
  'opsOverview',
  'mxOverview',
  'commMeetings',
  'settingsGeneral',
];

const requiredModules = [
  'home',
  'crew',
  'aircraft',
  'flights',
  'operations',
  'maintenance',
  'sms',
  'communication',
  'library',
  'settings',
];

// Dynamic import of built catalog via ts is not available; validate the source text instead.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(dir, 'catalog.ts'), 'utf8');

for (const key of requiredTabs) {
  assert.match(src, new RegExp(`${key}:`), `missing tab key ${key}`);
}
for (const key of requiredModules) {
  const re = new RegExp(`${key}:`, 'g');
  const matches = src.match(re) || [];
  assert.ok(matches.length >= 2, `module key ${key} should appear in en and es`);
}

assert.match(src, /moduleSubs:/);
assert.match(src, /Plan\. File\. Track/);
assert.match(src, /Planifica\. Presenta/);
assert.match(src, /tableSearch:/);
assert.match(src, /Search this list/);
assert.match(src, /Buscar en esta lista/);
console.log('catalog.spec.mjs ok');
