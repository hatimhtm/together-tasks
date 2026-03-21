import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { Capacitor } from '@capacitor/core';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
    triggerHaptic,
    triggerHapticSuccess,
    triggerHapticError,
    triggerHapticVibrate,
    HapticsConfig
} from './haptics';

describe('haptics utilities', () => {
    let originalIsNativePlatform: () => boolean;
    let originalClient: any;

    beforeEach(() => {
        originalIsNativePlatform = Capacitor.isNativePlatform;
        originalClient = HapticsConfig.client;

        // Default to true for these tests
        Capacitor.isNativePlatform = () => true;

        // Provide a mock client
        HapticsConfig.client = {
            impact: mock.fn(async () => {}),
            notification: mock.fn(async () => {}),
            vibrate: mock.fn(async () => {})
        } as any;
    });

    afterEach(() => {
        Capacitor.isNativePlatform = originalIsNativePlatform;
        HapticsConfig.client = originalClient;
        mock.restoreAll();
    });

    test('should not trigger haptics on non-native platform', async () => {
        Capacitor.isNativePlatform = () => false;

        await triggerHaptic();

        assert.strictEqual(HapticsConfig.client.impact.mock.callCount(), 0);
    });

    test('triggerHaptic should call impact and handle errors', async () => {
        HapticsConfig.client.impact.mock.mockImplementationOnce(async () => {
            throw new Error('Haptics failed');
        });

        // This should not throw
        await triggerHaptic(ImpactStyle.Heavy);

        assert.strictEqual(HapticsConfig.client.impact.mock.callCount(), 1);
        assert.deepStrictEqual(HapticsConfig.client.impact.mock.calls[0].arguments, [{ style: ImpactStyle.Heavy }]);
    });

    test('triggerHapticSuccess should call notification and handle errors', async () => {
        HapticsConfig.client.notification.mock.mockImplementationOnce(async () => {
            throw new Error('Haptics failed');
        });

        // This should not throw
        await triggerHapticSuccess();

        assert.strictEqual(HapticsConfig.client.notification.mock.callCount(), 1);
        assert.deepStrictEqual(HapticsConfig.client.notification.mock.calls[0].arguments, [{ type: NotificationType.Success }]);
    });

    test('triggerHapticError should call notification and handle errors', async () => {
        HapticsConfig.client.notification.mock.mockImplementationOnce(async () => {
            throw new Error('Haptics failed');
        });

        // This should not throw
        await triggerHapticError();

        assert.strictEqual(HapticsConfig.client.notification.mock.callCount(), 1);
        assert.deepStrictEqual(HapticsConfig.client.notification.mock.calls[0].arguments, [{ type: NotificationType.Error }]);
    });

    test('triggerHapticVibrate should call vibrate and handle errors', async () => {
        HapticsConfig.client.vibrate.mock.mockImplementationOnce(async () => {
            throw new Error('Haptics failed');
        });

        // This should not throw
        await triggerHapticVibrate();

        assert.strictEqual(HapticsConfig.client.vibrate.mock.callCount(), 1);
    });
});
