import { FixiQuote } from './FixiQuotes';
import * as Quotes from './FixiQuotes';
import { FixiState } from '../components/Fixi/FixiStates';

export interface FixiContext {
  progress: number;
  streak: number;
  emotion: string;
  totalPaid: number;
  restbetrag: number;
  gesamtbetrag: number;
  debtCount: number;
  daysSinceLastVisit: number;
  lastPaymentAmount: number;
  freedomDate: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}

function getProgressBucket(p: number): string {
  if (p >= 100) return 'p100';
  if (p >= 90) return 'p90';
  if (p >= 75) return 'p75';
  if (p >= 50) return 'p50';
  if (p >= 30) return 'p30';
  if (p >= 15) return 'p15';
  if (p >= 5) return 'p5';
  return 'p0';
}

function getTimeQuotes(): FixiQuote[] {
  switch (getTimeOfDay()) {
    case 'morning': return Quotes.MORNING_QUOTES;
    case 'afternoon': return Quotes.AFTERNOON_QUOTES;
    case 'evening': return Quotes.EVENING_QUOTES;
    case 'night': return Quotes.NIGHT_QUOTES;
  }
}

function replacePlaceholders(text: string, ctx: FixiContext): string {
  return text
    .replace(/\[progress\]/g, String(Math.round(ctx.progress)))
    .replace(/\[totalPaid\]/g, formatAmount(ctx.totalPaid))
    .replace(/\[restbetrag\]/g, formatAmount(ctx.restbetrag))
    .replace(/\[gesamtbetrag\]/g, formatAmount(ctx.gesamtbetrag))
    .replace(/\[betrag\]/g, formatAmount(ctx.lastPaymentAmount))
    .replace(/\[streak\]/g, String(ctx.streak))
    .replace(/\[datum\]/g, ctx.freedomDate)
    .replace(/\[daysToMilestone\]/g, '---')
    .replace(/\[nextMilestone\]/g, getNextMilestoneName(ctx.progress))
    .replace(/\[X\]/g, '---');
}

function formatAmount(v: number): string {
  return v.toLocaleString('de-DE', { maximumFractionDigits: 0 });
}

function getNextMilestoneName(progress: number): string {
  if (progress < 25) return '25%';
  if (progress < 50) return '50%';
  if (progress < 75) return '75%';
  if (progress < 100) return '100%';
  return 'Ziel';
}

// Pick a quote avoiding recent ones
function pickQuote(pool: FixiQuote[], recentTexts: string[]): FixiQuote {
  const fresh = pool.filter(q => !recentTexts.includes(q.text));
  const list = fresh.length > 0 ? fresh : pool;
  return list[Math.floor(Math.random() * list.length)];
}

// === MAIN API ===

export function getDashboardMotivation(ctx: FixiContext, recentTexts: string[]): FixiQuote {
  // 1. Returning after absence?
  if (ctx.daysSinceLastVisit >= 7) {
    const q = pickQuote(Quotes.RETURN_QUOTES, recentTexts);
    return { ...q, text: replacePlaceholders(q.text, ctx) };
  }

  // 2. Mix time-based + progress-based
  const timeQuotes = getTimeQuotes();
  const bucket = getProgressBucket(ctx.progress);
  const progressQuotes = Quotes.PROGRESS_QUOTES[bucket] || [];
  const emotionQuotes = ctx.emotion ? (Quotes.EMOTION_QUOTES[ctx.emotion] || []) : [];

  // Weighted pool: 40% time, 35% progress, 25% emotion
  const pool: FixiQuote[] = [];
  for (let i = 0; i < 4; i++) pool.push(...timeQuotes);
  for (let i = 0; i < 3; i++) pool.push(...progressQuotes);
  for (let i = 0; i < 2; i++) pool.push(...emotionQuotes);

  const q = pickQuote(pool.length > 0 ? pool : timeQuotes, recentTexts);
  return { ...q, text: replacePlaceholders(q.text, ctx) };
}

export function getPaymentMotivation(ctx: FixiContext, isFirst: boolean, isExtra: boolean): FixiQuote {
  let pool: FixiQuote[];
  if (isFirst) pool = Quotes.FIRST_PAYMENT_QUOTES;
  else if (isExtra) pool = Quotes.EXTRA_PAYMENT_QUOTES;
  else pool = Quotes.PAYMENT_QUOTES;
  const q = pool[Math.floor(Math.random() * pool.length)];
  return { ...q, text: replacePlaceholders(q.text, ctx) };
}

export function getStreakMotivation(streak: number): FixiQuote | null {
  const milestones = [3, 7, 14, 30, 60, 90, 100, 365];
  const key = milestones.find(m => m === streak);
  if (key) return Quotes.STREAK_QUOTES[String(key)];
  return null;
}

export function getMilestoneMotivation(key: string): FixiQuote | null {
  return Quotes.MILESTONE_QUOTES[key] || null;
}
