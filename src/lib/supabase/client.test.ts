import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createClient } from './client.ts';

describe('Supabase Client Creation', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Clean up global mock and restore env after each test to prevent pollution
    delete (global as any).__MOCK_SUPABASE__;
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  test('returns the mock client when in test environment and mock is defined', () => {
    process.env.NODE_ENV = 'test';
    const mockClient = { isMock: true };
    (global as any).__MOCK_SUPABASE__ = mockClient;

    const client = createClient();

    assert.strictEqual(client, mockClient);
  });

  test('returns the real client when not in test environment, even if mock is defined', () => {
    process.env.NODE_ENV = 'development';
    const mockClient = { isMock: true };
    (global as any).__MOCK_SUPABASE__ = mockClient;

    const client = createClient();

    assert.notStrictEqual(client, mockClient);
  });

  test('returns a real client singleton when mock is not defined', () => {
    process.env.NODE_ENV = 'test';
    delete (global as any).__MOCK_SUPABASE__;

    const client1 = createClient();
    const client2 = createClient();

    // Verify it returns an object (the client)
    assert.ok(client1);
    assert.strictEqual(typeof client1, 'object');

    // Verify the singleton pattern (same instance returned on subsequent calls)
    assert.strictEqual(client1, client2);
  });
});
