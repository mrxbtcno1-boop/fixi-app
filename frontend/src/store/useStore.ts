import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
const generateUUID = () => Crypto.randomUUID();

// User Account & Consent Types
export interface UserAccount {
  id: string;
  email: string | null;
  displayName: string | null;
  authProvider: 'anonymous' | 'email' | 'apple' | 'google';
  isAccountCreated: boolean;
  marketingOptIn: boolean;
  marketingOptInDate: string | null;
  dataProcessingConsent: boolean;
  dataProcessingConsentDate: string | null;
  createdAt: string;
}

export interface TriggerState {
  trigger1Shown: number; // Count shown
  trigger1Dismissed: number; // Count dismissed
  trigger1LastShown: string | null;
  trigger2Shown: number;
  trigger2Dismissed: number;
  trigger2LastShown: string | null;
  trigger3Shown: number;
  trigger3Dismissed: number;
  trigger3LastShown: string | null;
  trigger4Shown: number;
  trigger4Dismissed: number;
  trigger4LastShown: string | null;
  trigger5DismissedUntil: string | null; // Dashboard banner dismiss date
  trigger6Shown: number;
  trigger6Dismissed: number;
  trigger6LastShown: string | null;
  lastTriggerShownInSession: number | null; // timestamp, reset on app start
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  color: string;
  icon: string;
  dueDay: number;
  debtType?: string;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  isExtra: boolean;
}

const DEBT_COLORS = ['#00D4AA', '#7B61FF', '#FF6B6B', '#FFB06B', '#6B9FFF', '#FF6BD6'];

interface AppState {
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  
  // Anonymous User System
  anonymousId: string;
  userAccount: UserAccount | null;
  triggerState: TriggerState;
  installDate: string;
  firstPaymentMade: boolean;
  
  // Trial System
  trialStartDate: string | null;
  trialPlan: 'yearly' | 'monthly' | null;
  trialExpiredSeen: boolean; // Whether the SoftDowngrade modal was shown
  
  // Onboarding
  onboardingComplete: boolean;
  onboardingTotalDebt: number;
  onboardingMonthlyPayment: number;
  onboardingEmotion: string;
  selectedEmotions: string[];
  onboardingAgeRange: string;
  onboardingGender: string;
  onboardingCompletedAt: string;
  userName: string;
  isPremium: boolean;
  method: 'snowball' | 'avalanche';
  notificationsEnabled: boolean;
  selectedAvatar: number;
  createdAt: string;
  streakCount: number;
  lastActiveDate: string;
  badges: string[];
  debts: Debt[];
  payments: Payment[];
  lastShownLevel: number;
  lastDailyGreeting: string;
  clearedDebts: string[];
  
  // Notification & Digest
  notificationPermissionAsked: boolean;
  lastWeeklyDigestDate: string;
  notifMorning: boolean;
  notifEvening: boolean;
  notifStreak: boolean;
  notifDigest: boolean;
  notifDueDate: boolean;
  currency: string;
  darkMode: boolean;
  
  // Account Actions
  initAnonymousUser: () => void;
  createAccount: (email: string, authProvider: 'email' | 'apple' | 'google', displayName?: string) => void;
  setMarketingOptIn: (optIn: boolean) => void;
  
  // Trigger Actions
  recordTriggerShown: (triggerId: 1 | 2 | 3 | 4 | 5 | 6) => void;
  recordTriggerDismissed: (triggerId: 1 | 2 | 3 | 4 | 5 | 6) => void;
  recordTriggerConverted: (triggerId: 1 | 2 | 3 | 4 | 5 | 6) => void;
  dismissDashboardBanner: () => void;
  shouldShowTrigger: (triggerId: 1 | 2 | 3 | 4 | 5 | 6) => boolean;
  markFirstPaymentMade: () => void;
  
  // Trial Actions
  startTrial: (plan: 'yearly' | 'monthly') => void;
  getTrialDay: () => number; // 1-7, 0 if not in trial
  isTrialActive: () => boolean;
  hasTrialExpired: () => boolean;
  markTrialExpiredSeen: () => void;
  hasPremiumAccess: () => boolean; // isPremium OR trial active
  
  // Existing Actions
  setOnboardingTotalDebt: (v: number) => void;
  setOnboardingEmotion: (v: string) => void;
  setSelectedEmotions: (emotions: string[]) => void;
  setOnboardingMonthlyPayment: (v: number) => void;
  setOnboardingAgeRange: (v: string) => void;
  setOnboardingGender: (v: string) => void;
  completeOnboarding: () => void;
  setUserName: (name: string) => void;
  setMethod: (method: 'snowball' | 'avalanche') => void;
  setPremium: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  setAvatar: (i: number) => void;
  addDebt: (debt: Omit<Debt, 'id' | 'color'>) => void;
  updateDebt: (id: string, updates: Partial<Omit<Debt, 'id'>>) => void;
  deleteDebt: (id: string) => void;
  addPayment: (debtId: string, amount: number, isExtra: boolean, date?: string) => void;
  updateStreak: () => void;
  addBadge: (badge: string) => void;
  resetOnboarding: () => void;
  setLastShownLevel: (level: number) => void;
  setLastDailyGreeting: (date: string) => void;
  markDebtCleared: (debtId: string) => void;
}

const initialTriggerState: TriggerState = {
  trigger1Shown: 0,
  trigger1Dismissed: 0,
  trigger1LastShown: null,
  trigger2Shown: 0,
  trigger2Dismissed: 0,
  trigger2LastShown: null,
  trigger3Shown: 0,
  trigger3Dismissed: 0,
  trigger3LastShown: null,
  trigger4Shown: 0,
  trigger4Dismissed: 0,
  trigger4LastShown: null,
  trigger5DismissedUntil: null,
  trigger6Shown: 0,
  trigger6Dismissed: 0,
  trigger6LastShown: null,
  lastTriggerShownInSession: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // Anonymous User System
      anonymousId: '',
      userAccount: null,
      triggerState: initialTriggerState,
      installDate: '',
      firstPaymentMade: false,

      // Trial System
      trialStartDate: null,
      trialPlan: null,
      trialExpiredSeen: false,

      // Onboarding
      onboardingComplete: false,
      onboardingTotalDebt: 10000,
      onboardingMonthlyPayment: 200,
      onboardingEmotion: '',
      selectedEmotions: [] as string[],
      onboardingAgeRange: '',
      onboardingGender: '',
      onboardingCompletedAt: '',

      userName: '',
      isPremium: false,
      method: 'snowball' as const,
      notificationsEnabled: true,
      selectedAvatar: 0,
      createdAt: '',

      streakCount: 0,
      lastActiveDate: '',
      badges: [],
      lastShownLevel: 1,
      lastDailyGreeting: '',
      clearedDebts: [],
      notificationPermissionAsked: false,
      lastWeeklyDigestDate: '',
      notifMorning: true,
      notifEvening: true,
      notifStreak: true,
      notifDigest: true,
      notifDueDate: true,
      currency: 'EUR',
      darkMode: true,

      debts: [],
      payments: [],

      // Initialize anonymous user on first launch
      initAnonymousUser: () => {
        const state = get();
        if (!state.anonymousId) {
          set({
            anonymousId: generateUUID(),
            installDate: new Date().toISOString(),
          });
        }
      },

      // Create account (upgrade from anonymous)
      createAccount: (email, authProvider, displayName) => {
        const state = get();
        const now = new Date().toISOString();
        set({
          userAccount: {
            id: state.anonymousId || generateUUID(),
            email,
            displayName: displayName || null,
            authProvider,
            isAccountCreated: true,
            marketingOptIn: false,
            marketingOptInDate: null,
            dataProcessingConsent: true,
            dataProcessingConsentDate: now,
            createdAt: now,
          },
        });
      },

      setMarketingOptIn: (optIn) => {
        const state = get();
        if (state.userAccount) {
          set({
            userAccount: {
              ...state.userAccount,
              marketingOptIn: optIn,
              marketingOptInDate: optIn ? new Date().toISOString() : null,
            },
          });
        }
      },

      // Trigger tracking
      recordTriggerShown: (triggerId) => {
        set((state) => ({
          triggerState: {
            ...state.triggerState,
            [`trigger${triggerId}Shown`]: (state.triggerState[`trigger${triggerId}Shown` as keyof TriggerState] as number || 0) + 1,
            [`trigger${triggerId}LastShown`]: new Date().toISOString(),
            lastTriggerShownInSession: Date.now(),
          },
        }));
      },

      recordTriggerDismissed: (triggerId) => {
        set((state) => ({
          triggerState: {
            ...state.triggerState,
            [`trigger${triggerId}Dismissed`]: (state.triggerState[`trigger${triggerId}Dismissed` as keyof TriggerState] as number || 0) + 1,
          },
        }));
      },

      recordTriggerConverted: (triggerId) => {
        // Account was created from this trigger - conversion tracked
        // Trigger converted
      },

      dismissDashboardBanner: () => {
        const dismissUntil = new Date();
        dismissUntil.setDate(dismissUntil.getDate() + 7); // 7 days
        set((state) => ({
          triggerState: {
            ...state.triggerState,
            trigger5DismissedUntil: dismissUntil.toISOString(),
          },
        }));
      },

      shouldShowTrigger: (triggerId) => {
        const state = get();
        // Never show if account already created
        if (state.userAccount?.isAccountCreated) return false;
        
        const ts = state.triggerState;
        const dismissed = ts[`trigger${triggerId}Dismissed` as keyof TriggerState] as number || 0;
        const lastShown = ts[`trigger${triggerId}LastShown` as keyof TriggerState] as string | null;
        
        // If dismissed 3+ times, never show again
        if (dismissed >= 3) return false;
        
        // If shown recently (within 3 days cooldown), don't show
        if (lastShown) {
          const daysSince = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 3) return false;
        }

        // Only 1 trigger per session (check if any trigger shown in last 30 min)
        if (ts.lastTriggerShownInSession) {
          const minsSince = (Date.now() - ts.lastTriggerShownInSession) / (1000 * 60);
          if (minsSince < 30) return false;
        }
        
        // Special case for dashboard banner (trigger 5)
        if (triggerId === 5) {
          const dismissedUntil = ts.trigger5DismissedUntil;
          if (dismissedUntil && new Date(dismissedUntil) > new Date()) return false;
          if (state.installDate) {
            const daysSinceInstall = (Date.now() - new Date(state.installDate).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceInstall < 3) return false;
          }
        }
        
        return true;
      },

      markFirstPaymentMade: () => set({ firstPaymentMade: true }),

      // Trial Actions
      startTrial: (plan) => {
        set({
          trialStartDate: new Date().toISOString(),
          trialPlan: plan,
          isPremium: true,
          trialExpiredSeen: false,
        });
      },

      getTrialDay: () => {
        const state = get();
        if (!state.trialStartDate) return 0;
        const start = new Date(state.trialStartDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return Math.min(Math.max(diffDays, 1), 8); // 8 means expired
      },

      isTrialActive: () => {
        const state = get();
        if (!state.trialStartDate) return false;
        const day = state.getTrialDay();
        return day >= 1 && day <= 7;
      },

      hasTrialExpired: () => {
        const state = get();
        if (!state.trialStartDate) return false;
        return state.getTrialDay() > 7;
      },

      markTrialExpiredSeen: () => set({ trialExpiredSeen: true }),

      hasPremiumAccess: () => {
        const state = get();
        // Paid premium always has access
        if (state.isPremium && !state.trialStartDate) return true;
        // Trial active has access
        if (state.trialStartDate && state.isTrialActive()) return true;
        return false;
      },

      setOnboardingTotalDebt: (v) => set({ onboardingTotalDebt: v }),
      setOnboardingEmotion: (v) => set({ onboardingEmotion: v }),
      setSelectedEmotions: (emotions) => set({ selectedEmotions: emotions }),
      setOnboardingMonthlyPayment: (v) => set({ onboardingMonthlyPayment: v }),
      setOnboardingAgeRange: (v) => set({ onboardingAgeRange: v }),
      setOnboardingGender: (v) => set({ onboardingGender: v }),

      completeOnboarding: () => set({
        onboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        badges: ['first_step'],
      }),

      setUserName: (name) => set({ userName: name }),
      setMethod: (method) => set({ method }),
      setPremium: (v) => set({ isPremium: v }),
      setNotifications: (v) => set({ notificationsEnabled: v }),
      setAvatar: (i) => set({ selectedAvatar: i }),

      addDebt: (debt) => {
        const id = generateId();
        const colorIndex = get().debts.length % DEBT_COLORS.length;
        set((state) => ({
          debts: [...state.debts, {
            ...debt,
            id,
            color: DEBT_COLORS[colorIndex],
            icon: debt.icon || 'document',
            dueDay: debt.dueDay || 1,
          }],
        }));
      },

      updateDebt: (id, updates) =>
        set((state) => ({
          debts: state.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),

      deleteDebt: (id) =>
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
          payments: state.payments.filter((p) => p.debtId !== id),
        })),

      addPayment: (debtId, amount, isExtra, date) => {
        const payment: Payment = {
          id: generateId(),
          debtId,
          amount,
          date: date || new Date().toISOString(),
          isExtra,
        };
        set((state) => {
          const debt = state.debts.find((d) => d.id === debtId);
          const newRemaining = debt ? Math.max(0, debt.remainingAmount - amount) : 0;
          const newBadges = [...state.badges];
          const totalPaid = state.payments.reduce((s, p) => s + p.amount, 0) + amount;
          if (totalPaid >= 1000 && !newBadges.includes('1k_paid')) newBadges.push('1k_paid');
          if (totalPaid >= 5000 && !newBadges.includes('5k_paid')) newBadges.push('5k_paid');
          if (isExtra && !newBadges.includes('sprint_king')) newBadges.push('sprint_king');
          if (state.payments.length === 0 && !newBadges.includes('first_payment'))
            newBadges.push('first_payment');

          const totalDebt = state.debts.reduce((s, d) => s + d.totalAmount, 0);
          const totalRemaining =
            state.debts.reduce((s, d) => s + (d.id === debtId ? newRemaining : d.remainingAmount), 0);
          const percentPaid = totalDebt > 0 ? ((totalDebt - totalRemaining) / totalDebt) * 100 : 0;
          if (percentPaid >= 50 && !newBadges.includes('halftime')) newBadges.push('halftime');

          return {
            payments: [...state.payments, payment],
            debts: state.debts.map((d) =>
              d.id === debtId ? { ...d, remainingAmount: newRemaining } : d
            ),
            badges: newBadges,
          };
        });
      },

      updateStreak: () => {
        const today = new Date().toDateString();
        const state = get();
        if (state.lastActiveDate === today) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dayBefore = new Date();
        dayBefore.setDate(dayBefore.getDate() - 2);
        let newStreak = state.streakCount;
        if (
          state.lastActiveDate === yesterday.toDateString() ||
          state.lastActiveDate === dayBefore.toDateString()
        ) {
          newStreak += 1;
        } else if (state.lastActiveDate !== today) {
          newStreak = 1;
        }
        const newBadges = [...state.badges];
        if (newStreak >= 7 && !newBadges.includes('7_day_streak')) newBadges.push('7_day_streak');
        if (newStreak >= 30 && !newBadges.includes('30_day_streak')) newBadges.push('30_day_streak');
        set({ streakCount: newStreak, lastActiveDate: today, badges: newBadges });
      },

      addBadge: (badge) =>
        set((state) => ({
          badges: state.badges.includes(badge) ? state.badges : [...state.badges, badge],
        })),

      setLastShownLevel: (level) => set({ lastShownLevel: level }),
      setLastDailyGreeting: (date) => set({ lastDailyGreeting: date }),
      markDebtCleared: (debtId) =>
        set((state) => ({
          clearedDebts: state.clearedDebts.includes(debtId)
            ? state.clearedDebts
            : [...state.clearedDebts, debtId],
        })),

      resetOnboarding: () =>
        set({
          onboardingComplete: false,
          onboardingTotalDebt: 10000,
          onboardingMonthlyPayment: 200,
          onboardingEmotion: '',
          selectedEmotions: [],
          onboardingAgeRange: '',
          onboardingGender: '',
          onboardingCompletedAt: '',
          debts: [],
          payments: [],
          badges: [],
          streakCount: 0,
          userName: '',
          createdAt: '',
          lastShownLevel: 1,
          lastDailyGreeting: '',
          clearedDebts: [],
          firstPaymentMade: false,
          userAccount: null,
          triggerState: initialTriggerState,
          trialStartDate: null,
          trialPlan: null,
          trialExpiredSeen: false,
          isPremium: false,
        }),
    }),
    {
      name: 'fixi-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const { _hasHydrated, setHasHydrated, ...rest } = state;
        const data: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (typeof value !== 'function') {
            data[key] = value;
          }
        }
        return data;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
