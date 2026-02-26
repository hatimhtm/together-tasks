import { mock, describe, expect, test } from "bun:test";

// Mock createClient
mock.module("@/lib/supabase/server", () => ({
  createClient: mock(async () => ({
    auth: {
      exchangeCodeForSession: mock(async (code) => {
          if (code === "valid_code") return { error: null };
          return { error: { message: "Invalid code" } };
      }),
    },
  })),
}));

// Mock NextResponse
const mockRedirect = mock((url) => {
    return {
        status: 307,
        url: url,
        headers: new Map([["Location", url]])
    };
});

mock.module("next/server", () => ({
  NextResponse: {
    redirect: mockRedirect,
  },
}));

// Import after mocks
import { GET } from "./route";

describe("Auth Callback Open Redirect", () => {
  const origin = "http://localhost:3000";

  test("should redirect to / for valid code without next param", async () => {
    const req = new Request(`${origin}/auth/callback?code=valid_code`);
    const res = await GET(req);
    // @ts-ignore
    expect(res.url).toBe(`${origin}/`);
  });

  test("should redirect to next param if valid relative path", async () => {
    const req = new Request(`${origin}/auth/callback?code=valid_code&next=/dashboard`);
    const res = await GET(req);
    // @ts-ignore
    expect(res.url).toBe(`${origin}/dashboard`);
  });

  test("should sanitize open redirect attempt using @", async () => {
    const req = new Request(`${origin}/auth/callback?code=valid_code&next=@evil.com`);
    const res = await GET(req);
    // This expects the vulnerability to be fixed (i.e., redirect to /)
    // If vulnerable, it redirects to ...@evil.com
    // @ts-ignore
    expect(res.url).toBe(`${origin}/`);
  });

  test("should sanitize open redirect attempt using //", async () => {
    const req = new Request(`${origin}/auth/callback?code=valid_code&next=//evil.com`);
    const res = await GET(req);
    // @ts-ignore
    expect(res.url).toBe(`${origin}/`);
  });

   test("should sanitize absolute URL", async () => {
    const req = new Request(`${origin}/auth/callback?code=valid_code&next=https://evil.com`);
    const res = await GET(req);
    // @ts-ignore
    expect(res.url).toBe(`${origin}/`);
  });
});
