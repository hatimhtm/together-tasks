import { test } from 'node:test';
import assert from 'node:assert';
import { getDisplayName } from './user.ts';

test('getDisplayName returns Love when profile is null', () => {
  assert.strictEqual(getDisplayName(null), 'Love');
});

test('getDisplayName returns King Hatim for king role', () => {
  const profile = { role: 'king' } as any;
  assert.strictEqual(getDisplayName(profile), 'King Hatim');
});

test('getDisplayName returns Queen Pookie for queen role', () => {
  const profile = { role: 'queen' } as any;
  assert.strictEqual(getDisplayName(profile), 'Queen Pookie');
});

test('getDisplayName returns Love for special usernames', () => {
  const profile1 = { username: 'hatimhtm2003' } as any;
  assert.strictEqual(getDisplayName(profile1), 'Love');

  const profile2 = { username: 'someone.official' } as any;
  assert.strictEqual(getDisplayName(profile2), 'Love');
});

test('getDisplayName returns username for regular users', () => {
  const profile = { username: 'regularUser', role: 'commoner' } as any;
  assert.strictEqual(getDisplayName(profile), 'regularUser');
});

test('getDisplayName returns Love if username is missing', () => {
  const profile = { role: 'commoner' } as any;
  assert.strictEqual(getDisplayName(profile), 'Love');
});
