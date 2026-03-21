import { Haptics as CapacitorHaptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Allows injecting a mock during tests
export const HapticsConfig = {
    client: CapacitorHaptics
};

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    // Only trigger on actual mobile devices to avoid web console spam
    if (!Capacitor.isNativePlatform()) return;
    try {
        await HapticsConfig.client.impact({ style });
    } catch (e) { }
};

export const triggerHapticSuccess = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await HapticsConfig.client.notification({ type: NotificationType.Success });
    } catch (e) { }
};

export const triggerHapticError = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await HapticsConfig.client.notification({ type: NotificationType.Error });
    } catch (e) { }
};

export const triggerHapticVibrate = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await HapticsConfig.client.vibrate();
    } catch (e) { }
};
