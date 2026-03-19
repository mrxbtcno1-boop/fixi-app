import AsyncStorage from '@react-native-async-storage/async-storage';

const RATE_LIMIT_KEY = 'fixi_coach_rate_limit';
const FREE_DAILY_LIMIT = 10;

interface RateLimitData {
  date: string;
  count: number;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getRateLimitInfo(): Promise<{ remaining: number; limitReached: boolean }> {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return { remaining: FREE_DAILY_LIMIT, limitReached: false };
    const data: RateLimitData = JSON.parse(stored);
    if (data.date !== getTodayString()) return { remaining: FREE_DAILY_LIMIT, limitReached: false };
    const remaining = Math.max(0, FREE_DAILY_LIMIT - data.count);
    return { remaining, limitReached: remaining <= 0 };
  } catch {
    return { remaining: FREE_DAILY_LIMIT, limitReached: false };
  }
}

export async function incrementMessageCount(): Promise<{ remaining: number; limitReached: boolean }> {
  try {
    const today = getTodayString();
    const stored = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    let data: RateLimitData = { date: today, count: 0 };
    if (stored) {
      data = JSON.parse(stored);
      if (data.date !== today) {
        data = { date: today, count: 0 };
      }
    }
    data.count += 1;
    await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    const remaining = Math.max(0, FREE_DAILY_LIMIT - data.count);
    return { remaining, limitReached: remaining <= 0 };
  } catch {
    return { remaining: FREE_DAILY_LIMIT, limitReached: false };
  }
}
