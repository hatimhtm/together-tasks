import assert from 'node:assert';
import { test } from 'node:test';
import { KING_EMAIL, QUEEN_EMAIL, KING_LABEL, QUEEN_LABEL, KING_HANDLES } from './constants.ts';

test('KING_EMAIL is a string (env-driven, falls back to "")', () => {
    assert.strictEqual(typeof KING_EMAIL, 'string', 'KING_EMAIL should be a string');
});

test('QUEEN_EMAIL is a string (env-driven, falls back to "")', () => {
    assert.strictEqual(typeof QUEEN_EMAIL, 'string', 'QUEEN_EMAIL should be a string');
});

test('KING_LABEL defaults to "King" when no env override', () => {
    if (!process.env.NEXT_PUBLIC_KING_LABEL) {
        assert.strictEqual(KING_LABEL, 'King');
    } else {
        assert.strictEqual(KING_LABEL, process.env.NEXT_PUBLIC_KING_LABEL);
    }
});

test('QUEEN_LABEL defaults to "Queen" when no env override', () => {
    if (!process.env.NEXT_PUBLIC_QUEEN_LABEL) {
        assert.strictEqual(QUEEN_LABEL, 'Queen');
    } else {
        assert.strictEqual(QUEEN_LABEL, process.env.NEXT_PUBLIC_QUEEN_LABEL);
    }
});

test('KING_HANDLES is always an array', () => {
    assert.ok(Array.isArray(KING_HANDLES), 'KING_HANDLES should be a string[]');
});
