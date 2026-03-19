import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSION_KEY = 'fixi_notification_permission_asked';
const REMINDER_HOUR_KEY = 'fixi_reminder_hour';
const PAYMENT_REMINDER_PREFIX = 'fixi_payment_reminder_';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissionIfReady(): Promise<boolean> {
  if (!Device.isDevice) return false;
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function requestPermissionAfterFirstDebt(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;

  const asked = await AsyncStorage.getItem(PERMISSION_KEY);
  if (asked === 'true') return false;

  await AsyncStorage.setItem(PERMISSION_KEY, 'true');
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasAskedPermission(): Promise<boolean> {
  const asked = await AsyncStorage.getItem(PERMISSION_KEY);
  return asked === 'true';
}

export async function markPermissionAsked(): Promise<void> {
  await AsyncStorage.setItem(PERMISSION_KEY, 'true');
}

export async function getReminderHour(): Promise<number> {
  const stored = await AsyncStorage.getItem(REMINDER_HOUR_KEY);
  return stored ? parseInt(stored, 10) : 20;
}

export async function setReminderHour(hour: number): Promise<void> {
  await AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour));
}

// ─── P2: Typ 1 – Zahlungserinnerung (2 Tage vor Fälligkeit) ─────────────────

export async function schedulePaymentReminder(
  debtId: string,
  debtName: string,
  dueDay: number,
  monthlyPayment: number,
  userName: string = '',
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    // Cancel previous reminder for this debt
    const existingId = await AsyncStorage.getItem(PAYMENT_REMINDER_PREFIX + debtId);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }

    const now = new Date();
    const reminderDay = Math.max(1, dueDay - 2);

    // Find next occurrence of reminderDay
    let targetDate = new Date(now.getFullYear(), now.getMonth(), reminderDay, 9, 0, 0);
    if (targetDate <= now) {
      targetDate = new Date(now.getFullYear(), now.getMonth() + 1, reminderDay, 9, 0, 0);
    }

    const namePrefix = userName ? `${userName}, ` : '';
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Fixi 🦊 – Zahlung in 2 Tagen',
        body: `${namePrefix}deine Rate für "${debtName}" (${monthlyPayment.toFixed(0)}€) ist in 2 Tagen fällig.`,
        sound: true,
        data: { type: 'payment_reminder', debtId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      },
    });
    await AsyncStorage.setItem(PAYMENT_REMINDER_PREFIX + debtId, id);
  } catch {}
}

export async function cancelPaymentReminder(debtId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const id = await AsyncStorage.getItem(PAYMENT_REMINDER_PREFIX + debtId);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(PAYMENT_REMINDER_PREFIX + debtId);
    }
  } catch {}
}

// ─── P2: Typ 2 – Monatsbericht (1. des Monats) ──────────────────────────────

const MONTHLY_REPORT_ID_KEY = 'fixi_monthly_report_id';

export async function scheduleMonthlyReport(userName: string = ''): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const existingId = await AsyncStorage.getItem(MONTHLY_REPORT_ID_KEY);
    if (existingId) return; // Already scheduled

    const namePrefix = userName ? `${userName}, ` : '';
    const month = new Date().toLocaleString('de-DE', { month: 'long' });

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Dein Fixi Monatsbericht 📊',
        body: `${namePrefix}dein ${month}-Report ist bereit. Wie weit bist du heute?`,
        sound: true,
        data: { type: 'monthly_report' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: 1,
        hour: 9,
        minute: 0,
      } as any,
    });
    await AsyncStorage.setItem(MONTHLY_REPORT_ID_KEY, id);
  } catch {}
}

// ─── P2: Typ 3 – Meilenstein (unter 500€, 100€, 0€) ────────────────────────

const MILESTONE_PREFIX = 'fixi_milestone_';

export async function checkAndTriggerMilestone(
  debtId: string,
  debtName: string,
  newRemainingAmount: number,
  userName: string = '',
): Promise<void> {
  if (Platform.OS === 'web') return;

  const milestones = [500, 100, 0];
  for (const milestone of milestones) {
    const key = `${MILESTONE_PREFIX}${debtId}_${milestone}`;
    const alreadySent = await AsyncStorage.getItem(key);
    if (!alreadySent && newRemainingAmount <= milestone) {
      await AsyncStorage.setItem(key, 'true');
      const namePrefix = userName ? `${userName}! ` : '';
      const msg =
        milestone === 0
          ? `🎉 ${namePrefix}Du hast "${debtName}" vollständig abbezahlt! Unglaublich!`
          : `${namePrefix}"${debtName}" ist unter ${milestone}€ gefallen – du bist fast da!`;

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: milestone === 0 ? 'Schuld erledigt! 🎉' : `Meilenstein: unter ${milestone}€! 🎯`,
            body: msg,
            sound: true,
            data: { type: 'milestone', debtId, milestone },
          },
          trigger: null, // Sofort anzeigen
        });
      } catch {}
    }
  }
}

// ─── Bestehende Funktionen ────────────────────────────────────────────────────

const DAILY_MESSAGES = [
  (name: string) => `Hey ${name}! Hast du heute schon deine Zahlung eingetragen?`,
  (name: string, streak: number) => `Dein Streak ist bei ${streak} Tagen. Nicht aufhören!`,
  (_name: string) => `Fixi wartet auf dich! Nur kurz reinschauen?`,
];

const WEEKLY_MESSAGES = [
  (betrag: string) => `Du hast schon ${betrag} zurückgezahlt! Weiter so!`,
  (monate: string) => `Noch ${monate} bis zur Schuldenfreiheit. Du packst das!`,
  (level: string) => `Level ${level} erreicht! Schau dir deine Badges an.`,
];

export async function setupDailyReminder(
  name: string,
  streak: number,
): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hour = await getReminderHour();
    const msg = DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Fixi 🦊',
        body: msg(name, streak),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  } catch {}
}

export async function setupWeeklyMotivation(
  betrag: string,
  monate: string,
  level: string,
): Promise<void> {
  try {
    const msg = WEEKLY_MESSAGES[Math.floor(Math.random() * WEEKLY_MESSAGES.length)];
    const body = msg === WEEKLY_MESSAGES[0] ? msg(betrag) : msg === WEEKLY_MESSAGES[1] ? msg(monate) : msg(level);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Fixi Motivation 💪',
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: Math.floor(Math.random() * 5) + 2,
        hour: 12,
        minute: 0,
      },
    });
  } catch {}
}

export async function setupAllNotifications(
  name: string,
  streak: number,
  betrag: string,
  monate: string,
  level: string,
): Promise<void> {
  await setupDailyReminder(name, streak);
  await setupWeeklyMotivation(betrag, monate, level);
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
