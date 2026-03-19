import { TrialService } from './TrialService';
import type { FixiState } from '../components/Fixi/FixiStates';

export interface TrialDayContent {
  day: number;
  title: string;
  fixiState: FixiState;
  fixiSpeech: string;
  featureHighlight: {
    icon: string;
    title: string;
    description: string;
    action: string;
    route: string;
  };
  pushNotifications: {
    time: string;
    message: string;
  }[];
}

export interface TrialSummaryData {
  daysSinceTrial: number;
  debtsAdded: number;
  amountPaid: number;
  longestStreak: number;
  simulationsRun: number;
  coachChats: number;
  badgesEarned: number;
}

const TRIAL_DAY_CONTENT: Record<number, TrialDayContent> = {
  1: {
    day: 1,
    title: 'Der Start',
    fixiState: 'excited',
    fixiSpeech: 'Tag 1! Lass uns deine Schulden eintragen. Je genauer, desto besser kann ich dir helfen.',
    featureHighlight: {
      icon: '📋',
      title: 'Schulden eintragen',
      description: 'Je mehr ich weiß, desto besser mein Plan!',
      action: 'Jetzt eintragen',
      route: '/add-debt',
    },
    pushNotifications: [
      { time: '20:00', message: '🦊 Hast du alle Schulden eingetragen? Je mehr ich weiß, desto besser!' },
    ],
  },
  2: {
    day: 2,
    title: 'Der Augenöffner',
    fixiState: 'coaching',
    fixiSpeech: 'Tag 2! Ich hab was für dich – check mal den Simulator. Da wird\'s spannend!',
    featureHighlight: {
      icon: '🔮',
      title: 'Was wäre wenn du €50 mehr zahlst?',
      description: 'Schon kleine Beträge können MONATE an Unterschied machen!',
      action: 'Jetzt simulieren',
      route: '/simulator',
    },
    pushNotifications: [
      { time: '12:00', message: '🦊 Wusstest du? Schon €50 extra im Monat können MONATE an Unterschied machen. Probier den Simulator!' },
    ],
  },
  3: {
    day: 3,
    title: 'Erste Challenge',
    fixiState: 'motivated',
    fixiSpeech: 'Tag 3! Bereit für deine erste Challenge? Finde diese Woche einen Abo-Service den du kündigen kannst!',
    featureHighlight: {
      icon: '🎯',
      title: 'Deine erste Challenge',
      description: 'Eine Kündigung = mehr Geld für Schulden!',
      action: 'Challenge starten',
      route: '/(tabs)/achievements',
    },
    pushNotifications: [
      { time: '09:00', message: '🦊 Challenge-Tag! Eine Kündigung = mehr Geld für Schulden. Du schaffst das!' },
    ],
  },
  4: {
    day: 4,
    title: 'Frag Fixi',
    fixiState: 'coaching',
    fixiSpeech: 'Tag 4! Wusstest du, dass du mich alles fragen kannst? Probier\'s mal!',
    featureHighlight: {
      icon: '🦊',
      title: 'Frag Fixi: "Wo kann ich sparen?"',
      description: 'Ich hab ein paar Spar-Ideen für dich!',
      action: 'Chat öffnen',
      route: '/ai-coach',
    },
    pushNotifications: [
      { time: '15:00', message: '🦊 Ich hab ein paar Spar-Ideen für dich. Komm in den Chat!' },
    ],
  },
  5: {
    day: 5,
    title: 'Dein Fortschritt',
    fixiState: 'proud',
    fixiSpeech: 'Tag 5! Zeit für einen Reality-Check. Schau dir mal deine Statistiken an!',
    featureHighlight: {
      icon: '📊',
      title: 'Dein Fortschritt seit Tag 1',
      description: 'Du wirst überrascht sein wie viel sich getan hat!',
      action: 'Stats öffnen',
      route: '/(tabs)/stats',
    },
    pushNotifications: [
      { time: '18:00', message: '🦊 5 Tage dabei! Deine Stats sehen gut aus. Check sie mal!' },
    ],
  },
  6: {
    day: 6,
    title: 'Der Reminder',
    fixiState: 'empathy',
    fixiSpeech: 'Hey, morgen endet dein Premium-Test. Bevor es soweit ist, schau mal was wir zusammen erreicht haben...',
    featureHighlight: {
      icon: '💫',
      title: 'Deine Trial-Zusammenfassung',
      description: 'Das alles in nur 6 Tagen!',
      action: 'Zusammenfassung ansehen',
      route: '/trial-summary',
    },
    pushNotifications: [
      { time: '10:00', message: '🦊 Morgen endet dein Premium-Test. Schau dir an was wir zusammen geschafft haben...' },
      { time: '20:00', message: '🦊 Noch 1 Tag Premium. Ich will ehrlich sein: Ich würde dich ungern als Premium-Nutzer verlieren.' },
    ],
  },
  7: {
    day: 7,
    title: 'Entscheidungstag',
    fixiState: 'worried',
    fixiSpeech: 'Heute ist der letzte Tag. Egal wie du dich entscheidest – ich bin stolz auf dich.',
    featureHighlight: {
      icon: '⏰',
      title: 'Dein Premium-Test endet heute',
      description: 'Zeit für eine Entscheidung',
      action: 'Premium behalten',
      route: '/paywall',
    },
    pushNotifications: [
      { time: '09:00', message: '🦊 Heute ist der letzte Tag. Egal wie du dich entscheidest – danke für die letzten 7 Tage.' },
      { time: '20:00', message: '🦊 Noch 4 Stunden... Premium ab €3,33/Monat. Weniger als ein Kaffee. Und Kaffee hilft nicht beim Schuldenabbau. 😉' },
    ],
  },
};

// Post-trial Fixi messages (for free users)
const POST_TRIAL_FIXI_MESSAGES: Record<number, { state: FixiState; message: string }> = {
  1: { state: 'motivated', message: 'Ich bin zwar eingeschränkt, aber ich bin DA. Zusammen schaffen wir das auch so.' },
  2: { state: 'coaching', message: 'Kleiner Tipp: Mit dem Simulator könntest du ausrechnen wie viel schneller es ginge...' },
  3: { state: 'thinking', message: 'Ich hätte so viele Tipps für dich... wenn du mich lässt. Nur so als Info. 🦊' },
  4: { state: 'empathy', message: 'Ein Monat ohne Premium. Du machst das trotzdem gut. Aber es könnte NOCH besser sein...' },
};

export const TrialDayEngine = {
  // Get content for current trial day
  async getCurrentDayContent(): Promise<TrialDayContent | null> {
    const status = await TrialService.getTrialStatus();
    if (!status.isTrialActive || status.trialDay < 1 || status.trialDay > 7) {
      return null;
    }
    return TRIAL_DAY_CONTENT[status.trialDay];
  },

  // Get specific day content
  getDayContent(day: number): TrialDayContent | null {
    return TRIAL_DAY_CONTENT[day] || null;
  },

  // Get post-trial Fixi message based on weeks since trial ended
  async getPostTrialFixiMessage(): Promise<{ state: FixiState; message: string } | null> {
    const status = await TrialService.getTrialStatus();
    if (!status.hasTrialExpired || status.convertedToPaid) {
      return null;
    }
    
    const reEngagement = await TrialService.getReEngagementState();
    const weeksSinceExpired = Math.floor(reEngagement.postTrialDay / 7) + 1;
    const weekKey = Math.min(weeksSinceExpired, 4);
    
    return POST_TRIAL_FIXI_MESSAGES[weekKey] || POST_TRIAL_FIXI_MESSAGES[4];
  },

  // Get trial summary data (would need real data from store)
  async getTrialSummaryData(storeData: {
    debts: any[];
    payments: any[];
    streakCount: number;
    badges: string[];
  }): Promise<TrialSummaryData> {
    const status = await TrialService.getTrialStatus();
    const daysSinceTrial = status.trialDay || 0;
    
    const amountPaid = storeData.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    return {
      daysSinceTrial,
      debtsAdded: storeData.debts?.length || 0,
      amountPaid,
      longestStreak: storeData.streakCount || 0,
      simulationsRun: 0, // Would track separately
      coachChats: 0, // Would track separately
      badgesEarned: storeData.badges?.length || 0,
    };
  },

  // Check if should show trial day card on dashboard
  async shouldShowTrialDayCard(): Promise<boolean> {
    const status = await TrialService.getTrialStatus();
    return status.isTrialActive && status.trialDay >= 1 && status.trialDay <= 7;
  },

  // Check if should show trial summary (Day 6)
  async shouldShowTrialSummary(): Promise<boolean> {
    const status = await TrialService.getTrialStatus();
    const progress = await TrialService.getTrialProgress();
    return status.isTrialActive && status.trialDay === 6 && !progress.day6_sawSummary;
  },

  // Check if should show final offer (Day 7)
  async shouldShowFinalOffer(): Promise<boolean> {
    const status = await TrialService.getTrialStatus();
    const progress = await TrialService.getTrialProgress();
    return status.isTrialActive && status.trialDay === 7 && !progress.day7_sawFinalOffer;
  },

  // Mark day progress
  async markDayProgress(day: number, action: string): Promise<void> {
    const keyMap: Record<string, keyof import('./TrialService').TrialDayProgress> = {
      '1_onboarding': 'day1_completedOnboarding',
      '1_debt': 'day1_addedDebt',
      '2_simulator': 'day2_usedSimulator',
      '3_challenge': 'day3_startedChallenge',
      '4_coach': 'day4_usedCoach',
      '5_stats': 'day5_viewedStats',
      '6_summary': 'day6_sawSummary',
      '7_offer': 'day7_sawFinalOffer',
    };
    
    const key = keyMap[`${day}_${action}`];
    if (key) {
      await TrialService.updateTrialProgress(key);
    }
  },
};

export default TrialDayEngine;
