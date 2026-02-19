import { test, mock } from 'node:test';
import assert from 'node:assert';
import { generateRoyalWelcome } from './ai.ts';

test('generateRoyalWelcome fallback works when API fails', async () => {
  // Setup
  const originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-api-key';
  const originalFetch = global.fetch;

  // Mock fetch to fail
  global.fetch = mock.fn(async () => ({
    ok: false,
    json: async () => ({ error: 'API Error' })
  })) as any;

  const params = {
    usersName: 'King Hatim',
    partnerName: 'Queen Enarcylyn',
    theme: 'Space',
    goals: 'Explore the galaxy',
    personality: 'Wise Astrologer',
    habits: 'Daily meditation'
  };

  try {
    const result = await generateRoyalWelcome(params);

    // The expected fallback string (matches the one in ai.ts including indentation)
    const expected = `Hear ye! The Stars align for ${params.usersName} and ${params.partnerName}.
        Though the Royal Sage is in deep meditation, your shared goal of "${params.goals}"
        shall be achieved through your habits of "${params.habits}".
        Rule your ${params.theme} Kingdom with love and glory!`;

    assert.strictEqual(result, expected);
  } finally {
    // Cleanup
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test('generateRoyalWelcome returns AI response on success', async () => {
  // Setup
  const originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-api-key';
  const originalFetch = global.fetch;

  const mockAiResponse = "Welcome, oh Great King and Queen, to your cosmic domain!";

  // Mock fetch to succeed
  global.fetch = mock.fn(async () => ({
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{ text: mockAiResponse }]
        }
      }]
    })
  })) as any;

  const params = {
    usersName: 'King Hatim',
    partnerName: 'Queen Enarcylyn',
    theme: 'Space',
    goals: 'Explore the galaxy',
    personality: 'Wise Astrologer',
    habits: 'Daily meditation'
  };

  try {
    const result = await generateRoyalWelcome(params);
    assert.strictEqual(result, mockAiResponse);
  } finally {
    // Cleanup
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
  }
});
