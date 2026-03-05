import assert from 'node:assert';
import { test } from 'node:test';
import { KING_EMAIL, QUEEN_EMAIL } from './constants.ts';

test('constants should have default values when env vars are missing', () => {
    assert.strictEqual(KING_EMAIL, "", "KING_EMAIL should default to empty string");
    assert.strictEqual(QUEEN_EMAIL, "", "QUEEN_EMAIL should default to empty string");
});
