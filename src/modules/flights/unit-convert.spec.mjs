import assert from 'node:assert/strict';
import { convertUnit } from './unit-convert.ts';

const value = (magnitude, raw, from, to) => {
  const result = convertUnit(magnitude, raw, from, to);
  assert.equal(result.ok, true, `${magnitude} ${raw} ${from}->${to}`);
  return result.text;
};

assert.equal(value('length', '1', 'NM', 'km'), '1.852');
assert.equal(value('speed', '1', 'kt', 'km/h'), '1.852');
assert.equal(value('time', '01:30', 'HH:MM', 'h'), '1.5');
assert.equal(value('time', '1.5', 'h', 'HH:MM'), '1:30');
assert.equal(value('temperature', '0', '°C', '°F'), '32');
assert.equal(value('volume', '1', 'US gal', 'L'), '3.785411784');
assert.equal(value('volume', '1', 'Imperial gal', 'L'), '4.54609');
assert.equal(convertUnit('time', '01:60', 'HH:MM', 'h').ok, false);
assert.equal(convertUnit('temperature', '-1', 'K', '°C').ok, false);
assert.equal(convertUnit('length', '', 'NM', 'km').reason, 'empty');

console.log('unit-convert.spec.mjs ok');
