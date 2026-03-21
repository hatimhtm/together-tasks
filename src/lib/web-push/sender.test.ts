import { test, describe, it, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { sendWebPush } from './sender.ts'

describe('sendWebPush', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        originalEnv = { ...process.env }
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key'
        process.env.VAPID_PRIVATE_KEY = 'test-private-key'
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it('should warn and return if VAPID keys are missing', async () => {
        delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

        const consoleWarnMock = mock.method(console, 'warn', () => {})

        const createClientMock: any = mock.fn()

        await sendWebPush('user-1', 'Test', 'Body', createClientMock)

        assert.strictEqual(consoleWarnMock.mock.callCount(), 1)
        assert.match(consoleWarnMock.mock.calls[0].arguments[0], /VAPID keys not configured/)

        consoleWarnMock.mock.restore()
    })

    it('should send notifications to subscriptions', async () => {
        const setVapidDetailsMock = mock.fn()
        const sendNotificationMock = mock.fn()

        const webpushMock: any = {
            setVapidDetails: setVapidDetailsMock,
            sendNotification: sendNotificationMock
        }

        const subscriptions = [
            { id: 1, endpoint: 'ep1', p256dh: 'key1', auth: 'auth1', user_id: 'user-1' },
            { id: 2, endpoint: 'ep2', p256dh: 'key2', auth: 'auth2', user_id: 'user-1' }
        ]

        const supabaseMock = {
            from: mock.fn(() => ({
                select: mock.fn(() => ({
                    eq: mock.fn(async () => ({ data: subscriptions, error: null }))
                })),
                delete: mock.fn(() => ({
                    in: mock.fn(async () => {})
                }))
            }))
        }

        const createClientMock: any = mock.fn(async () => supabaseMock)

        await sendWebPush('user-1', 'Test Title', 'Test Body', createClientMock, webpushMock)

        assert.strictEqual(setVapidDetailsMock.mock.callCount(), 1)
        assert.strictEqual(sendNotificationMock.mock.callCount(), 2)

        const call1 = sendNotificationMock.mock.calls[0]
        assert.deepStrictEqual(call1.arguments[0], {
            endpoint: 'ep1',
            keys: { p256dh: 'key1', auth: 'auth1' }
        })
        assert.strictEqual(call1.arguments[1], JSON.stringify({ title: 'Test Title', body: 'Test Body' }))
    })

    it('should do nothing if no subscriptions found', async () => {
         const sendNotificationMock = mock.fn()
         const webpushMock: any = {
            setVapidDetails: mock.fn(),
            sendNotification: sendNotificationMock
        }

        const supabaseMock = {
            from: mock.fn(() => ({
                select: mock.fn(() => ({
                    eq: mock.fn(async () => ({ data: [], error: null }))
                }))
            }))
        }

        const createClientMock: any = mock.fn(async () => supabaseMock)

        await sendWebPush('user-1', 'Test', 'Body', createClientMock, webpushMock)

        assert.strictEqual(sendNotificationMock.mock.callCount(), 0)
    })

    it('should delete subscription on 410 error', async () => {
        const sendNotificationMock = mock.fn(async () => {
            const err: any = new Error('Gone')
            err.statusCode = 410
            throw err
        })

        const webpushMock: any = {
            setVapidDetails: mock.fn(),
            sendNotification: sendNotificationMock
        }

        const subscription = { id: 123, endpoint: 'ep1', p256dh: 'key1', auth: 'auth1' }

        const deleteInMock = mock.fn(async () => {})
        const deleteMock = mock.fn(() => ({ in: deleteInMock }))

        const supabaseMock = {
            from: mock.fn((table) => {
                if (table === 'push_subscriptions') {
                    return {
                        select: mock.fn(() => ({
                            eq: mock.fn(async () => ({ data: [subscription], error: null }))
                        })),
                        delete: deleteMock
                    }
                }
                return {}
            })
        }

        const consoleErrorMock = mock.method(console, 'error', () => {})

        const createClientMock: any = mock.fn(async () => supabaseMock)

        await sendWebPush('user-1', 'Test', 'Body', createClientMock, webpushMock)

        assert.strictEqual(deleteMock.mock.callCount(), 1)
        assert.strictEqual(deleteInMock.mock.callCount(), 1)
        assert.strictEqual(deleteInMock.mock.calls[0].arguments[0], 'id')
        assert.deepStrictEqual(deleteInMock.mock.calls[0].arguments[1], [123])

        consoleErrorMock.mock.restore()
    })
})
