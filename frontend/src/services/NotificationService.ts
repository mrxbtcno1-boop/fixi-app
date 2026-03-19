/**
 * NotificationService – Lokale Push-Notifications für Fixi
 *
 * Exports:
 *  · requestPermissionIfReady()         – Permission prüfen/anfordern
 *  · requestPermissionAfterFirstDebt()  – Permission nach erstem Debt
 *  · requestNotificationPermissions()   – Permission anfordern (generisch)
 *  · setupAllNotifications()            – Morning/Evening/Streak Notifications
 *  · cancelAllNotifications()           – Alle Notifications canceln
 *  · schedulePaymentReminder()          – Monatliche Zahlungserinnerung
 *  · scheduleMonthlyReport()            – Monatlicher Fortschrittsbericht
 *  · checkAndTriggerMilestone()         – Meilenstein-Notification
 *  · scheduleDebtFreeNotifications()    – Freedom-Day + 30-Tage-Reminder [NEU]
 *  · cancelDebtFreeNotifications()      – Freedom Notifications canceln [NEU]
 *  · rescheduleNotifications()          – Nach Schulden-Änderung [NEU]
 */
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEY_FREEDOM_NOTIF_ID  = '@fixi:notif_freedom_id';
const KEY_REMINDER_NOTIF_ID = '@fixi:notif_reminder_30_id';
const KEY_MORNING_NOTIF_ID  = '@fixi:notif_morning_id';
const KEY_EVENING_NOTIF_ID  = '@fixi:notif_evening_id';
const KEY_STREAK_NOTIF_ID   = '@fixi:notif_streak_id';

export const KEY_PLANNED_FREEDOM_DATE = '@fixi:planned_freedom_date';
export const KEY_ONBOARDING_START     = '@fixi:onboarding_start';

// ── Foreground notification appearance ────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Backward-compatible alias */
export async function requestPermissionIfReady(): Promise<boolean> {
  return requestNotificationPermissions();
}

/** Called after the first debt is added */
export async function requestPermissionAfterFirstDebt(): Promise<boolean> {
  return requestNotificationPermissions();
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup all recurring notifications (morning / evening / streak)
// ─────────────────────────────────────────────────────────────────────────────

export async function setupAllNotifications(
  userName: string,
  streakCount: number,
  _morningId?: string,
  _eveningId?: string,
  _streakId?: string,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel old recurring notifications before re-scheduling
  const [morningId, eveningId, streakId] = await Promise.all([
    AsyncStorage.getItem(KEY_MORNING_NOTIF_ID),
    AsyncStorage.getItem(KEY_EVENING_NOTIF_ID),
    AsyncStorage.getItem(KEY_STREAK_NOTIF_ID),
  ]);
  for (const id of [morningId, eveningId, streakId]) {
    if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  }

  const firstName = userName?.split(' ')[0] || '';

  try {
    // Morning motivation – daily at 8:00
    const mId = await Notifications.scheduleNotificationAsync({
      content: {
        title: firstName ? `Guten Morgen, ${firstName}! 🦊` : 'Guten Morgen! 🦊',
        body: 'Heute ist ein neuer Tag auf dem Weg zur Freiheit.',
        data: { screen: 'home' },
      },
      trigger: { hour: 8, minute: 0, repeats: true } as any,
    });
    await AsyncStorage.setItem(KEY_MORNING_NOTIF_ID, mId);
  } catch {}

  try {
    // Evening check-in – daily at 20:00
    const eId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hast du heute etwas getilgt? 🦊',
        body: 'Jeder Euro zählt. Trag deine Zahlung ein.',
        data: { screen: 'home' },
      },
      trigger: { hour: 20, minute: 0, repeats: true } as any,
    });
    await AsyncStorage.setItem(KEY_EVENING_NOTIF_ID, eId);
  } catch {}

  try {
    // Streak warning – daily at 21:00 (only relevant if user hasn't checked in)
    const streakDays = streakCount || 0;
    if (streakDays > 0) {
      const sId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${streakDays} Tage Streak in Gefahr! 🔥`,
          body: 'Melde dich kurz an, um deinen Streak zu retten.',
          data: { screen: 'home' },
        },
        trigger: { hour: 21, minute: 0, repeats: true } as any,
      });
      await AsyncStorage.setItem(KEY_STREAK_NOTIF_ID, sId);
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel all notifications
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Promise.all([
      AsyncStorage.removeItem(KEY_MORNING_NOTIF_ID),
      AsyncStorage.removeItem(KEY_EVENING_NOTIF_ID),
      AsyncStorage.removeItem(KEY_STREAK_NOTIF_ID),
      AsyncStorage.removeItem(KEY_FREEDOM_NOTIF_ID),
      AsyncStorage.removeItem(KEY_REMINDER_NOTIF_ID),
    ]);
  } catch (e) {
    console.warn('[Fixi] cancelAllNotifications error:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment reminder – monthly on dueDay
// ─────────────────────────────────────────────────────────────────────────────

export async function schedulePaymentReminder(
  debtId: string,
  debtName: string,
  dueDay: number,
  amount: number,
  _userName: string,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `payment_reminder_${debtId}`,
      content: {
        title: `Zahlung fällig: ${debtName} 🦊`,
        body: `Denk daran, ${amount.toFixed(0)}€ für "${debtName}" zu zahlen.`,
        data: { screen: 'home', debtId },
      },
      trigger: { day: Math.max(1, Math.min(28, dueDay)), hour: 9, minute: 0, repeats: true } as any,
    });
  } catch (e) {
    console.warn('[Fixi] schedulePaymentReminder error:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly progress report – on the 1st of each month
// ─────────────────────────────────────────────────────────────────────────────

export async function scheduleMonthlyReport(_userName: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: 'monthly_report',
      content: {
        title: 'Dein Monats-Report ist bereit 🦊',
        body: 'Schau, wie weit du in diesem Monat gekommen bist!',
        data: { screen: 'home' },
      },
      trigger: { day: 1, hour: 10, minute: 0, repeats: true } as any,
    });
  } catch (e) {
    console.warn('[Fixi] scheduleMonthlyReport error:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestone trigger – when a debt is fully paid or hits 25/50/75%
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAndTriggerMilestone(
  debtId: string,
  debtName: string,
  remaining: number,
  _userName: string,
): Promise<void> {
  if (Platform.OS === 'web') return;
  if (remaining > 0) return; // only trigger when fully paid for now

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Schuld getilgt! 🦊🎉',
        body: `"${debtName}" ist komplett abgezahlt! Du bist unglaublich.`,
        data: { screen: 'home', debtId },
      },
      trigger: null, // immediate
    });
  } catch (e) {
    console.warn('[Fixi] checkAndTriggerMilestone error:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Freedom Day + 30-day reminder notifications [NEU in V1.3.3]
// ─────────────────────────────────────────────────────────────────────────────

export async function scheduleDebtFreeNotifications(freedomDate: Date): Promise<void> {
  if (Platform.OS === 'web') return;

  const now = new Date();
  if (freedomDate <= now) return;

  await cancelDebtFreeNotifications();

  // ── 30-day reminder ──────────────────────────────────────────────────────
  const reminderDate = new Date(freedomDate);
  reminderDate.setDate(reminderDate.getDate() - 30);

  if (reminderDate > now) {
    try {
      const reminderId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Noch 30 Tage. 🦊',
          body: 'Dein Schuldenfreiheitsdatum rückt näher. Du schaffst das.',
          data: { screen: 'home' },
          sound: true,
        },
        trigger: { date: reminderDate } as any,
      });
      await AsyncStorage.setItem(KEY_REMINDER_NOTIF_ID, reminderId);
    } catch (e) {
      console.warn('[Fixi] 30-day reminder scheduling failed:', e);
    }
  }

  // ── Freedom Day notification ─────────────────────────────────────────────
  const startIso   = await AsyncStorage.getItem(KEY_ONBOARDING_START);
  const startMs    = startIso ? new Date(startIso).getTime() : now.getTime();
  const years      = Math.round((freedomDate.getTime() - startMs) / (1000 * 60 * 60 * 24 * 365.25));
  const yearsLabel = years <= 1 ? 'einem Jahr' : `${years} Jahren`;

  try {
    const freedomId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Heute wärst du schuldenfrei. 🦊',
        body: `Du hast vor ${yearsLabel} den ersten Schritt gemacht. Fixi ist stolz auf dich.`,
        data: { screen: 'home' },
        sound: true,
      },
      trigger: { date: freedomDate } as any,
    });
    await AsyncStorage.setItem(KEY_FREEDOM_NOTIF_ID, freedomId);
  } catch (e) {
    console.warn('[Fixi] Freedom notification scheduling failed:', e);
  }
}

export async function cancelDebtFreeNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const [freedomId, reminderId] = await Promise.all([
      AsyncStorage.getItem(KEY_FREEDOM_NOTIF_ID),
      AsyncStorage.getItem(KEY_REMINDER_NOTIF_ID),
    ]);
    const toCancel = [freedomId, reminderId].filter((id): id is string => Boolean(id));
    await Promise.all(toCancel.map(id => Notifications.cancelScheduledNotificationAsync(id)));
    await Promise.all([
      AsyncStorage.removeItem(KEY_FREEDOM_NOTIF_ID),
      AsyncStorage.removeItem(KEY_REMINDER_NOTIF_ID),
    ]);
  } catch (e) {
    console.warn('[Fixi] cancelDebtFreeNotifications error:', e);
  }
}

/** Call when debt amounts/monthly rate change to update freedom day notification */
export async function rescheduleNotifications(newFreedomDate: Date): Promise<void> {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await AsyncStorage.setItem(KEY_PLANNED_FREEDOM_DATE, newFreedomDate.toISOString());
  await scheduleDebtFreeNotifications(newFreedomDate);
}
