import { test } from 'node:test';
import assert from 'node:assert';
import { getDisplayName } from './user.ts';

// These tests run against the *default* env (no NEXT_PUBLIC_KING_LABEL etc.),
// since module-load reads env once at import time. The defaults are
// "King" / "Queen" with no special handles configured.

test('getDisplayName returns Love when profile is null', () => {
    assert.strictEqual(getDisplayName(null), 'Love');
});

test('getDisplayName returns the default KING label for king role', () => {
    const profile = { role: 'king' } as any;
    assert.strictEqual(getDisplayName(profile), 'King');
});

test('getDisplayName returns the default QUEEN label for queen role', () => {
    const profile = { role: 'queen' } as any;
    assert.strictEqual(getDisplayName(profile), 'Queen');
});

test('getDisplayName returns username for regular users', () => {
    const profile = { username: 'regularUser', role: 'commoner' } as any;
    assert.strictEqual(getDisplayName(profile), 'regularUser');
});

test('getDisplayName returns Love if username is missing', () => {
    const profile = { role: 'commoner' } as any;
    assert.strictEqual(getDisplayName(profile), 'Love');
});

test('getDisplayName returns the raw username when KING_HANDLES is empty', () => {
    // With no NEXT_PUBLIC_KING_HANDLES set, no usernames are aliased to "Love".
    const profile = { username: 'someone.official' } as any;
    assert.strictEqual(getDisplayName(profile), 'someone.official');
});
