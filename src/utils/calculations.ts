// ─── Core Payoff Formulas ──────────────────────────

/** Monthly interest rate from annual percentage */
export function monthlyRate(annualPercent: number): number {
  return annualPercent / 100 / 12;
}

/**
 * Months to pay off a single debt using annuity formula.
 * Edge cases: 0% interest → simple division, payment <= interest → Infinity
 */
export function monthsToPayoff(principal: number, annualRate: number, monthlyPayment: number): number {
  if (principal <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;
  if (monthlyPayment >= principal) return 1;
  if (annualRate <= 0) return Math.ceil(principal / monthlyPayment);
  const r = monthlyRate(annualRate);
  const interest = principal * r;
  if (monthlyPayment <= interest) return Infinity;
  return Math.ceil(-Math.log(1 - (principal * r) / monthlyPayment) / Math.log(1 + r));
}

/** Total interest paid over the life of a single debt */
export function totalInterestPaid(principal: number, annualRate: number, monthlyPayment: number): number {
  if (annualRate <= 0 || principal <= 0 || monthlyPayment <= 0) return 0;
  const months = monthsToPayoff(principal, annualRate, monthlyPayment);
  if (!isFinite(months)) return 0;
  // Simulate month by month for accuracy (last payment may be smaller)
  let balance = principal;
  let totalPaid = 0;
  const r = monthlyRate(annualRate);
  for (let m = 0; m < months && balance > 0; m++) {
    const interest = balance * r;
    const payment = Math.min(monthlyPayment, balance + interest);
    balance = balance + interest - payment;
    totalPaid += payment;
  }
  return Math.max(0, totalPaid - principal);
}

/** Freedom date calculated with interest */
export function calculateFreedomDate(principal: number, annualRate: number, monthlyPayment: number): Date {
  const months = monthsToPayoff(principal, annualRate, monthlyPayment);
  const date = new Date();
  if (!isFinite(months) || months > 600) {
    return new Date(2099, 11, 31);
  }
  date.setMonth(date.getMonth() + months);
  return date;
}

// ─── Debt Payoff Simulation (Schneeball / Lawine) ──

export interface DebtInput {
  id: string;
  name: string;
  remainingAmount: number;
  monthlyPayment: number; // minimum payment
  interestRate: number; // annual %
}

export interface PayoffResult {
  totalMonths: number;
  totalPaid: number;
  totalInterest: number;
  freedomDate: Date;
  debtOrder: { id: string; name: string; paidOffMonth: number }[];
}

/**
 * Full month-by-month simulation of Schneeball or Lawine method.
 * 
 * @param debts - Array of debts with remaining, minimum payment, and interest
 * @param totalMonthlyBudget - Total amount available per month for all debts
 * @param method - 'snowball' (kleinste zuerst) or 'avalanche' (höchster Zins zuerst)
 * @param extraOneTime - Optional one-time extra payment applied at start
 */
export function simulatePayoff(
  debts: DebtInput[],
  totalMonthlyBudget: number,
  method: 'snowball' | 'avalanche',
  extraOneTime = 0,
): PayoffResult {
  if (debts.length === 0) {
    return { totalMonths: 0, totalPaid: 0, totalInterest: 0, freedomDate: new Date(), debtOrder: [] };
  }

  // Clone balances
  const balances = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.remainingAmount,
    minPayment: d.monthlyPayment,
    rate: d.interestRate,
    paidOffMonth: 0,
  }));

  // Apply one-time payment to first priority debt
  if (extraOneTime > 0) {
    const sorted = sortForMethod(balances, method);
    for (const d of sorted) {
      if (d.balance > 0) {
        const applied = Math.min(extraOneTime, d.balance);
        d.balance -= applied;
        break;
      }
    }
  }

  let totalPaid = extraOneTime;
  let month = 0;
  const MAX_MONTHS = 600; // 50 years cap

  while (month < MAX_MONTHS) {
    // Check if all debts are paid off
    const activeDebts = balances.filter(d => d.balance > 0);
    if (activeDebts.length === 0) break;

    month++;

    // 1. Apply interest to all active debts
    for (const d of activeDebts) {
      const r = monthlyRate(d.rate);
      d.balance += d.balance * r;
    }

    // 2. Pay minimums on all active debts
    let budgetRemaining = totalMonthlyBudget;
    for (const d of activeDebts) {
      const payment = Math.min(d.minPayment, d.balance);
      d.balance -= payment;
      budgetRemaining -= payment;
      totalPaid += payment;
      if (d.balance <= 0.01) {
        d.balance = 0;
        if (d.paidOffMonth === 0) d.paidOffMonth = month;
      }
    }

    // 3. Apply overflow to priority debt (Schneeball/Lawine order)
    if (budgetRemaining > 0) {
      const prioritized = sortForMethod(balances.filter(d => d.balance > 0), method);
      for (const d of prioritized) {
        if (budgetRemaining <= 0) break;
        const extra = Math.min(budgetRemaining, d.balance);
        d.balance -= extra;
        budgetRemaining -= extra;
        totalPaid += extra;
        if (d.balance <= 0.01) {
          d.balance = 0;
          if (d.paidOffMonth === 0) d.paidOffMonth = month;
        }
      }
    }
  }

  const totalOriginal = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + month);

  return {
    totalMonths: month,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(Math.max(0, totalPaid - totalOriginal - extraOneTime) * 100) / 100,
    freedomDate,
    debtOrder: balances.map(d => ({ id: d.id, name: d.name, paidOffMonth: d.paidOffMonth })),
  };
}

function sortForMethod<T extends { balance: number; rate: number }>(debts: T[], method: 'snowball' | 'avalanche'): T[] {
  if (method === 'snowball') {
    return [...debts].sort((a, b) => a.balance - b.balance);
  }
  return [...debts].sort((a, b) => b.rate - a.rate);
}

// ─── Simulator Savings Calculation ──────────────────

export interface SavingsResult {
  monthsWithout: number;
  monthsWith: number;
  savedMonths: number;
  interestWithout: number;
  interestWith: number;
  savedInterest: number;
  freedomDateWithout: Date;
  freedomDateWith: Date;
}

/**
 * Compare current payoff vs. optimized payoff (extra monthly or one-time)
 */
export function calculateSavings(
  debts: DebtInput[],
  totalMonthlyBudget: number,
  method: 'snowball' | 'avalanche',
  extraMonthly: number,
  extraOneTime: number,
): SavingsResult {
  const without = simulatePayoff(debts, totalMonthlyBudget, method, 0);
  const with_ = simulatePayoff(debts, totalMonthlyBudget + extraMonthly, method, extraOneTime);

  return {
    monthsWithout: without.totalMonths,
    monthsWith: with_.totalMonths,
    savedMonths: Math.max(0, without.totalMonths - with_.totalMonths),
    interestWithout: without.totalInterest,
    interestWith: with_.totalInterest,
    savedInterest: Math.max(0, without.totalInterest - with_.totalInterest),
    freedomDateWithout: without.freedomDate,
    freedomDateWith: with_.freedomDate,
  };
}

// ─── Formatting Helpers ─────────────────────────────

export function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return Math.round(amount).toLocaleString('de-DE') + ' €';
  }
  return Math.round(amount) + ' €';
}

export function formatDateDE(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function monthsToYearsMonths(totalMonths: number): { years: number; months: number } {
  if (!isFinite(totalMonths) || totalMonths <= 0) return { years: 0, months: 0 };
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

// ─── Level System ───────────────────────────────────

export function getLevel(percentPaid: number): { level: number; name: string; emoji: string; min: number; max: number } {
  if (percentPaid >= 100) return { level: 6, name: 'Fixi Legend', emoji: '🏆', min: 100, max: 100 };
  if (percentPaid >= 75) return { level: 5, name: 'Fixi Master', emoji: '\u26A1', min: 75, max: 100 };
  if (percentPaid >= 50) return { level: 4, name: 'Fixi Champion', emoji: '\uD83C\uDFC5', min: 50, max: 75 };
  if (percentPaid >= 25) return { level: 3, name: 'Fixi Warrior', emoji: '\u2694\uFE0F', min: 25, max: 50 };
  if (percentPaid >= 10) return { level: 2, name: 'Fixi Fighter', emoji: '\uD83E\uDD4A', min: 10, max: 25 };
  return { level: 1, name: 'Fixi Starter', emoji: '\uD83C\uDF31', min: 0, max: 10 };
}

// ─── Debt Sorting ───────────────────────────────────

export function snowballOrder<T extends { remainingAmount: number }>(debts: T[]): T[] {
  return [...debts].sort((a, b) => a.remainingAmount - b.remainingAmount);
}

export function avalancheOrder<T extends { interestRate: number }>(debts: T[]): T[] {
  return [...debts].sort((a, b) => b.interestRate - a.interestRate);
}
