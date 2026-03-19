export type FixiState =
  | 'welcome'
  | 'empathy'
  | 'excited'
  | 'coaching'
  | 'celebrating'
  | 'motivated'
  | 'sad'
  | 'worried'
  | 'proud'
  | 'sleeping'
  | 'thinking'
  | 'strong';

export type FixiSize = 'tiny' | 'small' | 'medium' | 'large';

export const FIXI_SIZES: Record<FixiSize, number> = {
  tiny: 28,
  small: 40,
  medium: 80,
  large: 150,
};

export interface FixiStateConfig {
  state: FixiState;
  label: string;
  eyeStyle: 'normal' | 'closed' | 'wide' | 'sleepy' | 'star' | 'heart';
  mouthStyle: 'smile' | 'open' | 'sad' | 'worried' | 'grin' | 'sleeping' | 'determined';
  extras: string[]; // extra visual elements like glasses, party hat, etc.
  bodyPose: 'standing' | 'jumping' | 'sitting' | 'sleeping' | 'flexing' | 'waving';
}

export const FIXI_STATE_CONFIGS: Record<FixiState, FixiStateConfig> = {
  welcome: {
    state: 'welcome',
    label: 'Willkommen',
    eyeStyle: 'normal',
    mouthStyle: 'smile',
    extras: ['wave'],
    bodyPose: 'waving',
  },
  empathy: {
    state: 'empathy',
    label: 'Mitfühlend',
    eyeStyle: 'heart',
    mouthStyle: 'smile',
    extras: ['heart_hand'],
    bodyPose: 'standing',
  },
  excited: {
    state: 'excited',
    label: 'Aufgeregt',
    eyeStyle: 'star',
    mouthStyle: 'open',
    extras: ['stars'],
    bodyPose: 'jumping',
  },
  coaching: {
    state: 'coaching',
    label: 'Coach',
    eyeStyle: 'normal',
    mouthStyle: 'smile',
    extras: ['glasses'],
    bodyPose: 'standing',
  },
  celebrating: {
    state: 'celebrating',
    label: 'Feiern',
    eyeStyle: 'closed',
    mouthStyle: 'grin',
    extras: ['party_hat', 'confetti'],
    bodyPose: 'jumping',
  },
  motivated: {
    state: 'motivated',
    label: 'Motiviert',
    eyeStyle: 'wide',
    mouthStyle: 'determined',
    extras: ['fist'],
    bodyPose: 'standing',
  },
  sad: {
    state: 'sad',
    label: 'Traurig',
    eyeStyle: 'sleepy',
    mouthStyle: 'sad',
    extras: ['tear'],
    bodyPose: 'sitting',
  },
  worried: {
    state: 'worried',
    label: 'Besorgt',
    eyeStyle: 'wide',
    mouthStyle: 'worried',
    extras: ['sweat'],
    bodyPose: 'standing',
  },
  proud: {
    state: 'proud',
    label: 'Stolz',
    eyeStyle: 'closed',
    mouthStyle: 'grin',
    extras: ['sparkle'],
    bodyPose: 'standing',
  },
  sleeping: {
    state: 'sleeping',
    label: 'Schlafend',
    eyeStyle: 'closed',
    mouthStyle: 'sleeping',
    extras: ['zzz'],
    bodyPose: 'sleeping',
  },
  thinking: {
    state: 'thinking',
    label: 'Nachdenkend',
    eyeStyle: 'normal',
    mouthStyle: 'worried',
    extras: ['thought_bubble'],
    bodyPose: 'standing',
  },
  strong: {
    state: 'strong',
    label: 'Stark',
    eyeStyle: 'wide',
    mouthStyle: 'grin',
    extras: ['cape', 'bicep'],
    bodyPose: 'flexing',
  },
};
