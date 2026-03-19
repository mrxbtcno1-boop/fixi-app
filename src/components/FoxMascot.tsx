/**
 * FoxMascot – Zentralisierte Fuchs-Maskottchen-Komponente.
 * Alle Screens MÜSSEN diesen Component verwenden, damit
 * ein Asset-Tausch in P3 einmalig hier stattfinden kann.
 */
import { Fixi } from './Fixi';
import type { FixiState } from './Fixi/FixiStates';

interface FoxMascotProps {
  state?: FixiState;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  speechBubble?: string;
  animated?: boolean;
  accessory?: string;
  onPress?: () => void;
  showSpeechBubble?: boolean;
  percentPaid?: number;
}

export function FoxMascot({
  state = 'welcome',
  size = 'medium',
  speechBubble,
  animated,
  accessory,
  onPress,
  showSpeechBubble,
  percentPaid,
}: FoxMascotProps) {
  return (
    <Fixi
      state={state}
      size={size}
      speechBubble={speechBubble}
      animated={animated}
      accessory={accessory}
      onPress={onPress}
      showSpeechBubble={showSpeechBubble}
      percentPaid={percentPaid}
    />
  );
}
