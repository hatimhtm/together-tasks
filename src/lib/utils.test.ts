import { test } from 'node:test';
import assert from 'node:assert';
import { cn } from './utils.ts';

test('cn merges simple class names', () => {
  const result = cn('c1', 'c2');
  assert.strictEqual(result, 'c1 c2');
});

test('cn handles conditional classes (objects)', () => {
  const result = cn('c1', { c2: true, c3: false });
  assert.strictEqual(result, 'c1 c2');
});

test('cn handles arrays of classes', () => {
  const result = cn(['c1', 'c2']);
  assert.strictEqual(result, 'c1 c2');
});

test('cn resolves Tailwind CSS conflicts (merges padding)', () => {
  const result = cn('p-4', 'p-2');
  assert.strictEqual(result, 'p-2');
});

test('cn resolves Tailwind CSS conflicts (merges text color)', () => {
  const result = cn('text-red-500', 'text-blue-500');
  assert.strictEqual(result, 'text-blue-500');
});

test('cn handles undefined, null, and empty strings', () => {
  const result = cn('c1', undefined, null, '', 'c2');
  assert.strictEqual(result, 'c1 c2');
});

test('cn handles complex combinations of inputs', () => {
  const result = cn('c1', ['c2', { c3: true, c4: false }], 'p-4', 'p-2', undefined);
  assert.strictEqual(result, 'c1 c2 c3 p-2');
});

test('cn handles boolean inputs directly (though not common)', () => {
  // clsx handles booleans by ignoring them (unless in object values)
  // cn(true, false, 'c1') -> 'c1'
  const result = cn(true, false, 'c1');
  assert.strictEqual(result, 'c1');
});
