import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TrialStatus {
  trialStartDate: string | null;
  trialEndDate: string | null;
  trialDay: number; // 1-7, 0 if not in trial
  isTrialActive: boolean;
  hasTrialExpired: boolean;
  convertedToPaid: boolean;
  conversionDate: string | null;
  selectedPlan: 'yearly' | 'monthly' | null;
  cancellationReason: string | null;
}

export interface TrialDayProgress {
  day1_completedOnboarding: boolean;
  day1_addedDebt: boolean;
  day2_usedSimulator: boolean;
  day3_startedChallenge: boolean;
  day4_usedCoach: boolean;
  day5_viewedStats: boolean;
  day6_sawSummary: boolean;
  day7_sawFinalOffer: boolean;
}

export interface ReEngagementState {
  postTrialDay: number;
  specialOfferShown: boolean;
  specialOfferConverted: boolean;
  miniTrialOffered: boolean;
  miniTrialConverted: boolean;
}

const TRIAL_STORAGE_KEY = 'fixi_trial_status';
const TRIAL_PROGRESS_KEY = 'fixi_trial_progress';
const REENGAGEMENT_KEY = 'fixi_reengagement';

const defaultTrialStatus: TrialStatus = {
  trialStartDate: null,
  trialEndDate: null,
  trialDay: 0,
  isTrialActive: false,
  hasTrialExpired: false,
  convertedToPaid: false,
  conversionDate: null,
  selectedPlan: null,
  cancellationReason: null,
};

const defaultTrialProgress: TrialDayProgress = {
  day1_completedOnboarding: false,
  day1_addedDebt: false,
  day2_usedSimulator: false,
  day3_startedChallenge: false,
  day4_usedCoach: false,
  day5_viewedStats: false,
  day6_sawSummary: false,
  day7_sawFinalOffer: false,
};

const defaultReEngagement: ReEngagementState = {
  postTrialDay: 0,
  specialOfferShown: false,
  specialOfferConverted: false,
  miniTrialOffered: false,
  miniTrialConverted: false,
};

// Calculate trial day based on start date
const calculateTrialDay = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), 7);
};

// Calculate days since trial ended
const calculatePostTrialDays = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = now.getTime() - end.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

export const TrialService = {
  // Get current trial status
  async getTrialStatus(): Promise<TrialStatus> {
    try {
      const stored = await AsyncStorage.getItem(TRIAL_STORAGE_KEY);
      if (!stored) return defaultTrialStatus;
      
      const status: TrialStatus = JSON.parse(stored);
      
      // Update trial day if active
      if (status.trialStartDate && !status.convertedToPaid) {
        const day = calculateTrialDay(status.trialStartDate);
        const endDate = new Date(status.trialStartDate);
        endDate.setDate(endDate.getDate() + 7);
        
        status.trialDay = day;
        status.trialEndDate = endDate.toISOString();
        status.isTrialActive = day <= 7 && !status.hasTrialExpired;
        
        // Check if trial just expired
        if (day > 7 && !status.hasTrialExpired && !status.convertedToPaid) {
          status.hasTrialExpired = true;
          status.isTrialActive = false;
          await this.saveTrialStatus(status);
        }
      }
      
      return status;
    } catch {
      return defaultTrialStatus;
    }
  },

  // Save trial status
  async saveTrialStatus(status: TrialStatus): Promise<void> {
    await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(status));
  },

  // Start trial
  async startTrial(plan: 'yearly' | 'monthly' = 'yearly'): Promise<TrialStatus> {
    const now = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const status: TrialStatus = {
      trialStartDate: now,
      trialEndDate: endDate.toISOString(),
      trialDay: 1,
      isTrialActive: true,
      hasTrialExpired: false,
      convertedToPaid: false,
      conversionDate: null,
      selectedPlan: plan,
      cancellationReason: null,
    };
    
    await this.saveTrialStatus(status);
    await this.resetTrialProgress();
    return status;
  },

  // Convert trial to paid
  async convertToPaid(plan: 'yearly' | 'monthly'): Promise<TrialStatus> {
    const status = await this.getTrialStatus();
    status.convertedToPaid = true;
    status.conversionDate = new Date().toISOString();
    status.selectedPlan = plan;
    status.isTrialActive = false;
    await this.saveTrialStatus(status);
    return status;
  },

  // Get trial progress
  async getTrialProgress(): Promise<TrialDayProgress> {
    try {
      const stored = await AsyncStorage.getItem(TRIAL_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : defaultTrialProgress;
    } catch {
      return defaultTrialProgress;
    }
  },

  // Update trial progress
  async updateTrialProgress(key: keyof TrialDayProgress): Promise<void> {
    const progress = await this.getTrialProgress();
    progress[key] = true;
    await AsyncStorage.setItem(TRIAL_PROGRESS_KEY, JSON.stringify(progress));
  },

  // Reset trial progress
  async resetTrialProgress(): Promise<void> {
    await AsyncStorage.setItem(TRIAL_PROGRESS_KEY, JSON.stringify(defaultTrialProgress));
  },

  // Get re-engagement state
  async getReEngagementState(): Promise<ReEngagementState> {
    try {
      const status = await this.getTrialStatus();
      const stored = await AsyncStorage.getItem(REENGAGEMENT_KEY);
      const state: ReEngagementState = stored ? JSON.parse(stored) : defaultReEngagement;
      
      // Update post-trial days
      if (status.hasTrialExpired && status.trialEndDate) {
        state.postTrialDay = calculatePostTrialDays(status.trialEndDate);
      }
      
      return state;
    } catch {
      return defaultReEngagement;
    }
  },

  // Update re-engagement state
  async updateReEngagementState(updates: Partial<ReEngagementState>): Promise<void> {
    const state = await this.getReEngagementState();
    await AsyncStorage.setItem(REENGAGEMENT_KEY, JSON.stringify({ ...state, ...updates }));
  },

  // Check if should show special offer (30 days)
  async shouldShowSpecialOffer(): Promise<boolean> {
    const reEngagement = await this.getReEngagementState();
    const status = await this.getTrialStatus();
    
    return (
      status.hasTrialExpired &&
      !status.convertedToPaid &&
      reEngagement.postTrialDay >= 30 &&
      !reEngagement.specialOfferShown
    );
  },

  // Check if should show mini trial (60 days)
  async shouldShowMiniTrial(): Promise<boolean> {
    const reEngagement = await this.getReEngagementState();
    const status = await this.getTrialStatus();
    
    return (
      status.hasTrialExpired &&
      !status.convertedToPaid &&
      reEngagement.postTrialDay >= 60 &&
      !reEngagement.miniTrialOffered
    );
  },

  // Format remaining trial time
  formatRemainingTime(endDate: string): string {
    const end = new Date(endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Abgelaufen';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} Tag${days > 1 ? 'e' : ''}`;
    if (hours > 0) return `${hours} Stunde${hours > 1 ? 'n' : ''}`;
    return 'Weniger als 1 Stunde';
  },

  // Cancel subscription with reason
  async cancelWithReason(reason: string): Promise<void> {
    const status = await this.getTrialStatus();
    status.cancellationReason = reason;
    await this.saveTrialStatus(status);
  },
};

export default TrialService;
