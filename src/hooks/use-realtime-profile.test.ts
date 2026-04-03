import { test, describe, before, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";

// Setup JSDOM environment globally before importing React
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});

Object.defineProperty(global, "window", {
  value: dom.window,
  writable: true,
});
Object.defineProperty(global, "document", {
  value: dom.window.document,
  writable: true,
});
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  writable: true,
});
Object.defineProperty(global, "Event", {
  value: dom.window.Event,
  writable: true,
});

global.TextDecoder = TextDecoder as any;

// Polyfill minimal requestAnimationFrame for React
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

describe("useRealtimeProfile", () => {
  let renderHook: any;
  let act: any;
  let waitFor: any;
  let useRealtimeProfile: any;

  // Mocks
  let mockSupabase: any;
  let mockChannel: any;
  let mockSelect: any;
  let mockEq: any;
  let mockSingle: any;

  before(async () => {
    // Mock Supabase client
    mockChannel = {
      on: mock.fn(() => mockChannel),
      subscribe: mock.fn(() => mockChannel),
      unsubscribe: mock.fn(),
    };

    mockSingle = mock.fn(() => Promise.resolve({ data: null, error: null }));

    mockEq = mock.fn(() => ({
      single: mockSingle,
    }));

    mockSelect = mock.fn(() => ({
      eq: mockEq,
    }));

    mockSupabase = {
      from: mock.fn(() => ({
        select: mockSelect,
      })),
      channel: mock.fn(() => mockChannel),
    };

    // Mock via global injection
    process.env.NODE_ENV = "test";
    (global as any).__MOCK_SUPABASE__ = mockSupabase;

    // Import libraries after mocks and JSDOM setup
    const testingLibrary = await import("@testing-library/react");
    renderHook = testingLibrary.renderHook;
    act = testingLibrary.act;
    waitFor = testingLibrary.waitFor;

    // Import the hook
    const hookModule = await import("./use-realtime-profile.ts");
    useRealtimeProfile = hookModule.useRealtimeProfile;
  });

  beforeEach(() => {
    // Reset mocks
    mockSelect.mock.resetCalls();
    mockEq.mock.resetCalls();
    mockSingle.mock.resetCalls();
    mockChannel.on.mock.resetCalls();
    mockChannel.subscribe.mock.resetCalls();
    mockChannel.unsubscribe.mock.resetCalls();
    mockSupabase.from.mock.resetCalls();
    mockSupabase.channel.mock.resetCalls();
  });

  test("should do nothing if userId is undefined", async () => {
    const { result } = renderHook(() => useRealtimeProfile(undefined));

    assert.strictEqual(result.current.loading, true);
    assert.strictEqual(result.current.profile, null);

    // Verify no Supabase calls were made
    assert.strictEqual(mockSupabase.from.mock.calls.length, 0);
    assert.strictEqual(mockSupabase.channel.mock.calls.length, 0);
  });

  test("should fetch profile on mount successfully", async () => {
    const mockProfile = { id: "user1", username: "Test User" };
    mockSingle.mock.mockImplementationOnce(() =>
      Promise.resolve({ data: mockProfile, error: null }),
    );

    const { result } = renderHook(() => useRealtimeProfile("user1"));

    // Initially loading
    assert.strictEqual(result.current.loading, true);
    assert.strictEqual(result.current.profile, null);

    // Wait for profile to load
    await waitFor(() => {
      assert.strictEqual(result.current.loading, false);
    });

    assert.strictEqual(result.current.profile?.username, "Test User");

    // Verify Supabase calls
    assert.strictEqual(mockSupabase.from.mock.calls.length, 1);
    assert.strictEqual(mockSelect.mock.calls.length, 1);
    assert.strictEqual(mockEq.mock.calls.length, 1);
    assert.strictEqual(mockEq.mock.calls[0].arguments[0], "id");
    assert.strictEqual(mockEq.mock.calls[0].arguments[1], "user1");
    assert.strictEqual(mockSingle.mock.calls.length, 1);
  });

  test("should handle fetch profile error gracefully", async () => {
    const originalConsoleError = console.error;
    console.error = () => {}; // Suppress expected error log

    try {
      mockSingle.mock.mockImplementationOnce(() =>
        Promise.resolve({ data: null, error: new Error("Fetch failed") }),
      );

      const { result } = renderHook(() => useRealtimeProfile("user1"));

      await waitFor(() => {
        assert.strictEqual(result.current.loading, false);
      });

      // State should still be null due to error
      assert.strictEqual(result.current.profile, null);
    } finally {
      console.error = originalConsoleError;
    }
  });

  test("should setup realtime subscription when userId is provided", async () => {
    mockSingle.mock.mockImplementationOnce(() =>
      Promise.resolve({ data: { id: "user1" }, error: null }),
    );

    const { result } = renderHook(() => useRealtimeProfile("user1"));

    await waitFor(() => {
      assert.strictEqual(result.current.loading, false);
    });

    assert.strictEqual(mockSupabase.channel.mock.calls.length, 1);
    assert.strictEqual(
      mockSupabase.channel.mock.calls[0].arguments[0],
      "profile-user1",
    );
    assert.strictEqual(mockChannel.on.mock.calls.length, 1);
    assert.strictEqual(mockChannel.subscribe.mock.calls.length, 1);
  });

  test("should update profile state on realtime UPDATE event", async () => {
    const initialProfile = { id: "user1", username: "Old Name" };
    mockSingle.mock.mockImplementationOnce(() =>
      Promise.resolve({ data: initialProfile, error: null }),
    );

    const { result } = renderHook(() => useRealtimeProfile("user1"));

    await waitFor(() => {
      assert.strictEqual(result.current.loading, false);
    });

    // Find the callback passed to .on
    const onCall = mockChannel.on.mock.calls[0];
    assert.ok(onCall, "Subscription for profile not found");
    const callback = onCall.arguments[2];

    const updatedProfile = { id: "user1", username: "New Name" };

    // Simulate realtime event
    act(() => {
      callback({
        new: updatedProfile,
      });
    });

    await waitFor(() => {
      assert.strictEqual(result.current.profile?.username, "New Name");
    });
  });

  test("should unsubscribe from realtime channel on unmount", async () => {
    mockSingle.mock.mockImplementationOnce(() =>
      Promise.resolve({ data: { id: "user1" }, error: null }),
    );

    const { unmount } = renderHook(() => useRealtimeProfile("user1"));

    // Wait for fetch to happen so useEffect doesn't crash on unmount if it's mid-flight,
    // though realistically returning the cleanup function happens synchronously after setup.

    unmount();

    assert.strictEqual(mockChannel.unsubscribe.mock.calls.length, 1);
  });
});
