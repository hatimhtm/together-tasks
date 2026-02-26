import { test, mock } from 'node:test';
import assert from 'node:assert';
import { analyzeTaskForPartnerNotification } from './task-analyzer.ts';

// Mock types
interface MockResponse {
  ok: boolean;
  json: () => Promise<any>;
}

test('analyzeTaskForPartnerNotification should notify partner when AI recommends it', async (t) => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-api-key';
  const originalFetch = global.fetch;

  const mockAiResponse = {
    shouldNotifyPartner: true,
    notificationType: "urgent",
    reasoning: "Important deadline",
    suggestedMessage: "Remember the meeting!",
    hoursBeforeToNotify: 2
  };

  global.fetch = mock.fn(async () => ({
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify(mockAiResponse) }]
        }
      }]
    })
  })) as any;

  const task = {
    title: "Important Meeting",
    description: "Discuss quarterly goals",
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    priority: "high"
  };

  const owner = { name: "King John", role: "king" as const };
  const partner = { name: "Queen Jane", role: "queen" as const };

  try {
    const result = await analyzeTaskForPartnerNotification(task, owner, partner);

    assert.strictEqual(result.shouldNotifyPartner, true);
    assert.strictEqual(result.notificationType, "urgent");
    assert.strictEqual(result.reasoning, "Important deadline");
    assert.strictEqual(result.suggestedMessage, "Remember the meeting!");
    assert.strictEqual(result.hoursBeforeToNotify, 2);

    // Check notifyAt calculation
    const dueDate = new Date(task.due_date);
    const expectedNotifyAt = new Date(dueDate.getTime() - 2 * 60 * 60 * 1000);
    assert.strictEqual(result.notifyAt?.toISOString(), expectedNotifyAt.toISOString());

  } finally {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test('analyzeTaskForPartnerNotification should NOT notify partner when AI advises against it', async (t) => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-api-key';
  const originalFetch = global.fetch;

  const mockAiResponse = {
    shouldNotifyPartner: false,
    notificationType: null,
    reasoning: "Routine task",
    suggestedMessage: "",
    hoursBeforeToNotify: null
  };

  global.fetch = mock.fn(async () => ({
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify(mockAiResponse) }]
        }
      }]
    })
  })) as any;

  const task = {
    title: "Buy Groceries",
    description: "Milk and eggs",
    due_date: null,
    priority: "low"
  };

  const owner = { name: "King John", role: "king" as const };
  const partner = { name: "Queen Jane", role: "queen" as const };

  try {
    const result = await analyzeTaskForPartnerNotification(task, owner, partner);

    assert.strictEqual(result.shouldNotifyPartner, false);
    assert.strictEqual(result.notificationType, null);

  } finally {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test('analyzeTaskForPartnerNotification handles API errors gracefully', async (t) => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-api-key';
  const originalFetch = global.fetch;

  // Mock fetch to throw error
  global.fetch = mock.fn(async () => {
    throw new Error("API Connection Failed");
  }) as any;

  const task = {
    title: "Unknown Task",
    priority: "medium"
  };

  const owner = { role: "king" as const };
  const partner = { role: "queen" as const };

  try {
    const result = await analyzeTaskForPartnerNotification(task, owner, partner);

    // Should return default safe response
    assert.strictEqual(result.shouldNotifyPartner, false);
    assert.strictEqual(result.notificationType, null);
    assert.strictEqual(result.reasoning, "Analysis failed");

  } finally {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test('analyzeTaskForPartnerNotification handles malformed AI response', async (t) => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-api-key';
  const originalFetch = global.fetch;

  global.fetch = mock.fn(async () => ({
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{ text: "Invalid JSON Response" }]
        }
      }]
    })
  })) as any;

  const task = {
    title: "Task",
    priority: "medium"
  };

  const owner = { role: "king" as const };
  const partner = { role: "queen" as const };

  try {
    const result = await analyzeTaskForPartnerNotification(task, owner, partner);

    // Should catch JSON parse error and return default
    assert.strictEqual(result.shouldNotifyPartner, false);
    assert.strictEqual(result.reasoning, "Analysis failed");

  } finally {
    global.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalApiKey;
  }
});
