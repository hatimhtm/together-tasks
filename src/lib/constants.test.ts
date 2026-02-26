import assert from 'node:assert';
import { test } from 'node:test';
import { KING_EMAIL, QUEEN_EMAIL } from './constants.ts';

test('constants should have default values when env vars are missing', () => {
    assert.strictEqual(KING_EMAIL, "hatimhtm2003@gmail.com", "KING_EMAIL should default to hatimhtm2003@gmail.com");
    assert.strictEqual(QUEEN_EMAIL, "queen@example.com", "QUEEN_EMAIL should default to queen@example.com");
});
