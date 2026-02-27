import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    // Only trigger on actual mobile devices to avoid web console spam
    if (!Capacitor.isNativePlatform()) return;
    try {
        await Haptics.impact({ style });
    } catch (e) { }
};

export const triggerHapticSuccess = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await Haptics.notification({ type: NotificationType.Success });
    } catch (e) { }
};

export const triggerHapticError = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await Haptics.notification({ type: NotificationType.Error });
    } catch (e) { }
};

export const triggerHapticVibrate = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await Haptics.vibrate();
    } catch (e) { }
};
