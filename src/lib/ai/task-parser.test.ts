import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { processFunctionCalls } from './task-parser.ts';

describe('processFunctionCalls', () => {
    let mockSupabase: any;
    let mockInsert: any;
    let mockEq: any;

    beforeEach(() => {
        mockInsert = async () => ({ error: null });
        mockEq = () => ({ error: null });

        mockSupabase = {
            from: (table: string) => {
                if (table === 'tasks') {
                    return {
                        insert: mockInsert
                    };
                }
                if (table === 'profiles') {
                    return {
                        update: () => ({
                            eq: mockEq
                        })
                    };
                }
                return {};
            }
        };
    });

    it('should process valid create_task call', async () => {
        let insertedData: any = null;
        mockInsert = async (data: any) => {
            insertedData = data;
            return { error: null };
        };

        mockSupabase.from = (table: string) => {
             if (table === 'tasks') return { insert: mockInsert };
             return {};
        };

        const calls = [{
            name: 'create_task',
            args: {
                title: 'Test Task',
                description: 'Test Description',
                assign_to: 'me'
            }
        }];
        const context = { userId: 'user-123' };

        const result = await processFunctionCalls(calls, context, mockSupabase, '');

        assert.ok(result.includes('created the task'));
        assert.deepStrictEqual(insertedData, {
            creator_id: 'user-123',
            assignee_id: 'user-123',
            title: 'Test Task',
            description: 'Test Description',
            is_completed: false,
            scope: null,
            priority: 'medium',
            emergency_level: 'medium',
            importance_level: 'medium',
            duration_estimate: 15
        });
    });

    it('should ignore create_task with invalid title', async () => {
        let insertCalled = false;
        mockInsert = async () => { insertCalled = true; return {}; };

        mockSupabase.from = () => ({ insert: mockInsert });

        const calls = [{
            name: 'create_task',
            args: {
                title: 123, // Invalid type
                assign_to: 'me'
            }
        }];
        const context = { userId: 'user-123' };

        const result = await processFunctionCalls(calls, context, mockSupabase, '');

        assert.strictEqual(insertCalled, false);
        assert.strictEqual(result, '');
    });

    it('should ignore create_task with empty title', async () => {
        let insertCalled = false;
        mockInsert = async () => { insertCalled = true; return {}; };
        mockSupabase.from = () => ({ insert: mockInsert });

        const calls = [{
            name: 'create_task',
            args: {
                title: '   ', // Empty after trim
                assign_to: 'me'
            }
        }];
        const context = { userId: 'user-123' };

        await processFunctionCalls(calls, context, mockSupabase, '');
        assert.strictEqual(insertCalled, false);
    });

    it('should truncate long titles', async () => {
        let insertedData: any = null;
        mockInsert = async (data: any) => { insertedData = data; return {}; };
        mockSupabase.from = () => ({ insert: mockInsert });

        const longTitle = 'a'.repeat(2000);
        const calls = [{
            name: 'create_task',
            args: {
                title: longTitle,
                assign_to: 'me'
            }
        }];
        const context = { userId: 'user-123' };

        await processFunctionCalls(calls, context, mockSupabase, '');

        assert.strictEqual(insertedData.title.length, 1000);
    });

    it('should process valid store_memory call', async () => {
        let updatedData: any = null;
        let queryFilters: any = {};

        mockEq = (field: string, value: any) => {
            queryFilters[field] = value;
            return { error: null };
        };

        mockSupabase.from = (table: string) => {
            if (table === 'profiles') return {
                update: (data: any) => {
                    updatedData = data;
                    return { eq: mockEq };
                }
            };
            return {};
        };

        const calls = [{
            name: 'store_memory',
            args: {
                fact: 'Likes cats'
            }
        }];
        const context = { userId: 'user-123' };
        const initialMemory = 'Old memory';

        const result = await processFunctionCalls(calls, context, mockSupabase, initialMemory);

        assert.ok(result.includes('committed that to memory'));
        assert.strictEqual(updatedData.ai_personality, 'Old memory\n- Likes cats');
        assert.strictEqual(queryFilters.id, 'user-123');
    });

    it('should ignore store_memory with invalid fact', async () => {
         let updateCalled = false;
         mockSupabase.from = () => ({
             update: () => { updateCalled = true; return { eq: () => {} }; }
         });

         const calls = [{
            name: 'store_memory',
            args: {
                fact: {} // Invalid
            }
        }];
        const context = { userId: 'user-123' };

        await processFunctionCalls(calls, context, mockSupabase, '');
        assert.strictEqual(updateCalled, false);
    });
});
