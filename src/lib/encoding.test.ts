import { test } from 'node:test';
import assert from 'node:assert';
import { base64ToUint8Array } from './encoding.ts';

test('base64ToUint8Array converts standard base64 string to Uint8Array', () => {
    const input = 'SGVsbG8gV29ybGQ='; // "Hello World" in Base64
    const expected = new Uint8Array([
        72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100
    ]);

    const result = base64ToUint8Array(input);
    assert.deepStrictEqual(result, expected);
});

test('base64ToUint8Array handles URL-safe base64 with missing padding', () => {
    // ">>??" -> Standard Base64: "Pj4/Pw=="
    // URL Safe: "Pj4_Pw" ('+'->'-', '/'->'_', no padding)

    const input = "Pj4_Pw";
    const expected = new Uint8Array([62, 62, 63, 63]);

    const result = base64ToUint8Array(input);
    assert.deepStrictEqual(result, expected);
});
