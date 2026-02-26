import { test, expect, mock, beforeEach, afterEach, describe, spyOn } from "bun:test";

// 1. Setup Mock infrastructure
// We need a mutable handler to change behavior per test
let mockResponseHandler: Function = async () => ({ text: () => "{}" });

const mockGenerateContent = mock(async (...args) => {
    return mockResponseHandler(...args);
});

// Mock the module before importing the subject
mock.module("@google/genai", () => {
    return {
        GoogleGenAI: class {
            constructor() {
                this.models = {
                    generateContent: mockGenerateContent
                };
            }
        }
    };
});

// Import the subject under test
// Note: We use dynamic import to ensure the mock is applied first,
// but since this is top-level await in Bun, it works fine.
const { parseTaskInput } = await import("./task-parser");

describe("parseTaskInput", () => {
    let consoleSpy: any;

    beforeEach(() => {
        mockGenerateContent.mockClear();
        // Default behavior: empty valid JSON returned via text() method
        mockResponseHandler = async () => ({ text: () => "{}" });
        // Suppress console.error for clean test output
        consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    test("should parse valid task input correctly", async () => {
        const validTask = {
            title: "Buy groceries",
            description: "Milk, eggs, bread",
            dueDate: "2023-12-25",
            dueTime: "10:00",
            priority: "high",
            category: "home",
            emergency_level: "medium",
            importance_level: "high",
            duration_estimate: 45,
            subtasks: ["Buy milk", "Buy eggs"]
        };

        mockResponseHandler = async () => ({
            text: () => JSON.stringify(validTask)
        });

        const result = await parseTaskInput("Buy groceries for Christmas");

        expect(result).toEqual(validTask);
        expect(mockGenerateContent).toHaveBeenCalled();
        // Verify we sent the right prompt
        const callArgs = mockGenerateContent.mock.calls[0];
        // The first arg is the config object passed to generateContent
        expect(callArgs[0].contents).toBe("Buy groceries for Christmas");
    });

    test("should handle API errors gracefully by returning fallback", async () => {
        const input = "Clean the garage";

        // Simulate API failure
        mockResponseHandler = async () => {
            throw new Error("API Timeout");
        };

        const result = await parseTaskInput(input);

        // Expect fallback object
        expect(result).toEqual({
            title: input,
            dueDate: null,
            priority: 'medium',
            category: 'personal',
            emergency_level: 'medium',
            importance_level: 'medium',
            duration_estimate: 15,
            subtasks: []
        });
    });

    test("should handle invalid JSON response by returning fallback", async () => {
        const input = "Walk the dog";

        // Simulate malformed JSON
        mockResponseHandler = async () => ({
            text: () => "This is not JSON"
        });

        // The parser attempts JSON.parse, which throws.
        // The catch block should handle it and return fallback.

        const result = await parseTaskInput(input);

        expect(result).toEqual({
            title: input,
            dueDate: null,
            priority: 'medium',
            category: 'personal',
            emergency_level: 'medium',
            importance_level: 'medium',
            duration_estimate: 15,
            subtasks: []
        });
    });

    test("should handle empty response string by defaulting to empty object", async () => {
        // The implementation defaults empty text to "{}"
        const input = "Read a book";

        mockResponseHandler = async () => ({
            text: () => ""
        });

        const result = await parseTaskInput(input);

         expect(result).toEqual({});
    });

    test("should handle valid but empty JSON response", async () => {
        const input = "Meditate";

        // API returns valid JSON but empty object
        mockResponseHandler = async () => ({
            text: () => "{}"
        });

        const result = await parseTaskInput(input);

        expect(result).toEqual({});
    });

});
