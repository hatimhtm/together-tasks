import { describe, expect, test, mock, afterAll } from "bun:test";

// Mock next/server
mock.module("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
        return {
            status: init?.status || 200,
            json: async () => body
        };
    }
  }
}));

// Mock Supabase
mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-123", email: "test@example.com" } } }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { id: "user-123", partner_id: "partner-456" } }),
            }),
          }),
          insert: async () => ({ error: null }),
        };
      }
      if (table === 'tasks') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: "task-789", title: "Test Task" }, error: null }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) };
    },
  }),
}));

// Mock Web Push - Delay 100ms
mock.module("@/lib/web-push/sender", () => ({
  sendWebPush: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  },
}));

// Mock AI Task Parser
mock.module("@/lib/ai/task-parser", () => ({
  parseTaskInput: async () => ({
    title: "Parsed Task",
    description: "Parsed Description",
  }),
}));

// Mock Fetch - Delay 100ms
const originalFetch = global.fetch;
global.fetch = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return new Response(JSON.stringify({ success: true }));
};

// Dynamic import to ensure mocks apply
const { POST } = await import("./route");

describe("POST /api/tasks Performance", () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });

  test("Task creation timing check", async () => {
    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        input: '@partner ' + JSON.stringify({ title: "Test Task", description: "Test" }),
        useAI: false,
      }),
    });

    const start = performance.now();
    const res = await POST(req);
    const end = performance.now();
    const duration = end - start;

    // Check response
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.task).toBeDefined();

    console.log(`Task creation took ${duration.toFixed(2)}ms`);

    // Assert that we are waiting for background tasks (mocked to take 100ms)
    expect(duration).toBeGreaterThan(100);
  });
});
