import { test } from 'node:test';
import assert from 'node:assert';

// Set env BEFORE importing the module so the constants pick up these values.
process.env.NEXT_PUBLIC_KING_LABEL = 'King Hatim';
process.env.NEXT_PUBLIC_QUEEN_LABEL = 'Queen Pookie';
process.env.NEXT_PUBLIC_KING_HANDLES = 'hatimhtm2003,.official';

const { getDisplayName } = await import('./user.ts');

test('getDisplayName returns Love when profile is null', () => {
    assert.strictEqual(getDisplayName(null), 'Love');
});

test('getDisplayName returns the configured KING label for king role', () => {
    const profile = { role: 'king' } as any;
    assert.strictEqual(getDisplayName(profile), 'King Hatim');
});

test('getDisplayName returns the configured QUEEN label for queen role', () => {
    const profile = { role: 'queen' } as any;
    assert.strictEqual(getDisplayName(profile), 'Queen Pookie');
});

test('getDisplayName returns Love for handles in NEXT_PUBLIC_KING_HANDLES', () => {
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
