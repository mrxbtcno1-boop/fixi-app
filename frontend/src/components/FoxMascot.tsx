/**
 * FoxMascot v3 – Fixi Official Brand Characters
 *
 * State → Image mapping:
 *   celebrating / excited  → fox-celebrating.png (Arme hoch, strahlendes Lachen)
 *   happy / welcome        → fox-happy.png (winkend, zwinkerndes Auge)
 *   proud / strong         → fox-proud.png (Arme verschränkt, selbstbewusst)
 *   coaching / motivated   → fox-coaching.png (zeigend, entschlossen)
 *   empathy / sad / worried→ fox-empathy.png (einfühlsam, Hände zusammen)
 *   default / base         → fox-base.png (neutral, Arme aus)
 *   tiny                   → icon.png (Fuchskopf-Logo, rund)
 *
 * Props-Kompatibilität zu v1/v2 ist vollständig erhalten.
 */
import { useRef, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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
  | 'strong'
  | 'happy';

export interface FoxMascotProps {
  state?: FixiState;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  /** Text shown in speech bubble above the fox */
  speechBubble?: string;
  /** Set false to disable built-in animation (when parent controls animation) */
  animated?: boolean;
  /** Override image with evolution asset (fox-starter, fox-fighter, etc.) */
  evolutionImage?: any;
  // Legacy props kept for backwards compatibility
  accessory?: string;
  onPress?: () => void;
  showSpeechBubble?: boolean;
  percentPaid?: number;
}

// ── Image Assets ─────────────────────────────────────────────────────────────
const IMAGES = {
  base:        require('../../assets/images/fox-base.png'),
  happy:       require('../../assets/images/fox-happy.png'),
  celebrating: require('../../assets/images/fox-celebrating.png'),
  coaching:    require('../../assets/images/fox-coaching.png'),
  empathy:     require('../../assets/images/fox-empathy.png'),
  proud:       require('../../assets/images/fox-proud.png'),
  icon:        require('../../assets/images/icon.png'),  // 3D head, for tiny
};

// ── State → Image Mapping ─────────────────────────────────────────────────────
const STATE_IMAGE: Record<FixiState, keyof typeof IMAGES> = {
  celebrating: 'celebrating',
  excited:     'celebrating',
  happy:       'happy',
  welcome:     'happy',
  proud:       'proud',
  strong:      'proud',
  coaching:    'coaching',
  motivated:   'coaching',
  empathy:     'empathy',
  sad:         'empathy',
  worried:     'empathy',
  thinking:    'base',
  sleeping:    'base',
};

// ── Size Mapping ──────────────────────────────────────────────────────────────
const SIZES: Record<NonNullable<FoxMascotProps['size']>, number> = {
  tiny:   36,
  small:  80,
  medium: 120,
  large:  180,
};

// ── Premium Glow Colors ───────────────────────────────────────────────────────
const GLOW: Partial<Record<FixiState, string>> = {
  celebrating: '#00D4AA',
  excited:     '#FF8C42',
  happy:       '#00D4AA',
  proud:       '#FFB800',
  strong:      '#FFB800',
  motivated:   '#00D4AA',
  empathy:     '#A78BFA',
};

// ─────────────────────────────────────────────────────────────────────────────

export function FoxMascot({
  state = 'welcome',
  size = 'medium',
  speechBubble,
  animated: enableAnim = true,
  evolutionImage,
  onPress,
}: FoxMascotProps) {
  const { isDark } = useTheme();
  const foxSize = SIZES[size];
  const glowColor = evolutionImage ? '#00D4AA' : (GLOW[state] ?? null);

  const isTiny = size === 'tiny';
  // evolutionImage overrides the state-based image
  const imageSource = isTiny ? IMAGES.icon : (evolutionImage ?? IMAGES[STATE_IMAGE[state] ?? 'base']);

  // ── Animation values ────────────────────────────────────────────────────────
  const transY  = useRef(new Animated.Value(0)).current;
  const transX  = useRef(new Animated.Value(0)).current;
  const scaleAn = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    transY.stopAnimation();  transY.setValue(0);
    transX.stopAnimation();  transX.setValue(0);
    scaleAn.stopAnimation(); scaleAn.setValue(1);

    if (!enableAnim || isTiny) return;

    switch (state) {
      // ── Celebratory bounce ─────────────────────────────────────────────────
      case 'celebrating':
      case 'happy':
        Animated.loop(
          Animated.sequence([
            Animated.timing(transY, { toValue: -14, duration: 400, useNativeDriver: true }),
            Animated.timing(transY, { toValue: 2,   duration: 200, useNativeDriver: true }),
            Animated.timing(transY, { toValue: 0,   duration: 180, useNativeDriver: true }),
            Animated.delay(300),
          ])
        ).start();
        break;

      // ── Rapid excited wiggle ───────────────────────────────────────────────
      case 'excited':
        Animated.loop(
          Animated.sequence([
            Animated.timing(transX, { toValue:  8, duration: 75, useNativeDriver: true }),
            Animated.timing(transX, { toValue: -8, duration: 75, useNativeDriver: true }),
            Animated.timing(transX, { toValue:  5, duration: 75, useNativeDriver: true }),
            Animated.timing(transX, { toValue: -5, duration: 75, useNativeDriver: true }),
            Animated.timing(transX, { toValue:  0, duration: 75, useNativeDriver: true }),
            Animated.delay(600),
          ])
        ).start();
        break;

      // ── Gentle idle bob ────────────────────────────────────────────────────
      case 'welcome':
      case 'coaching':
        Animated.loop(
          Animated.sequence([
            Animated.timing(transY, { toValue: -6, duration: 1400, useNativeDriver: true }),
            Animated.timing(transY, { toValue:  0, duration: 1400, useNativeDriver: true }),
          ])
        ).start();
        break;

      // ── Slow empathetic nod ────────────────────────────────────────────────
      case 'empathy':
        Animated.loop(
          Animated.sequence([
            Animated.timing(transY, { toValue: -4, duration: 1900, useNativeDriver: true }),
            Animated.timing(transY, { toValue:  0, duration: 1900, useNativeDriver: true }),
          ])
        ).start();
        break;

      // ── Power pulse ────────────────────────────────────────────────────────
      case 'proud':
      case 'motivated':
      case 'strong':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAn, { toValue: 1.07, duration: 700, useNativeDriver: true }),
            Animated.timing(scaleAn, { toValue: 1.00, duration: 700, useNativeDriver: true }),
          ])
        ).start();
        break;

      // ── Sad droop ──────────────────────────────────────────────────────────
      case 'sad':
      case 'worried':
        Animated.loop(
          Animated.sequence([
            Animated.timing(transY, { toValue: 5, duration: 2200, useNativeDriver: true }),
            Animated.timing(transY, { toValue: 0, duration: 2200, useNativeDriver: true }),
          ])
        ).start();
        break;

      // ── Thoughtful sway ────────────────────────────────────────────────────
      case 'thinking':
        Animated.loop(
          Animated.sequence([
            Animated.timing(transX, { toValue:  6, duration: 900, useNativeDriver: true }),
            Animated.timing(transX, { toValue: -6, duration: 900, useNativeDriver: true }),
            Animated.timing(transX, { toValue:  0, duration: 600, useNativeDriver: true }),
            Animated.delay(400),
          ])
        ).start();
        break;

      // ── Ultra-slow sleeping breath ─────────────────────────────────────────
      case 'sleeping':
        Animated.loop(
          Animated.sequence([
            Animated.timing(transY, { toValue: 4, duration: 2800, useNativeDriver: true }),
            Animated.timing(transY, { toValue: 0, duration: 2800, useNativeDriver: true }),
          ])
        ).start();
        break;
    }

    return () => {
      transY.stopAnimation();
      transX.stopAnimation();
      scaleAn.stopAnimation();
    };
  }, [state, enableAnim, isTiny]);

  // ── Speech bubble ──────────────────────────────────────────────────────────
  const bubbleBg     = isDark ? 'rgba(0,212,170,0.13)' : '#E8FDF8';
  const bubbleBorder = isDark ? 'rgba(0,212,170,0.48)' : 'rgba(0,184,153,0.32)';
  // Guarantee every bubble ends with 🦊
  const bubbleText = speechBubble
    ? (speechBubble.endsWith('🦊') ? speechBubble : `${speechBubble} 🦊`)
    : null;

  // ── Fox image element ──────────────────────────────────────────────────────
  const foxEl = (
    <Animated.View
      style={{
        backgroundColor: 'transparent',
        transform: [{ translateY: transY }, { translateX: transX }, { scale: scaleAn }],
        // Web: CSS filter drop-shadow follows the actual PNG shape (not the bounding box)
        // Native: native shadow props render as a soft halo on iOS only
        ...(Platform.OS === 'web'
          ? (glowColor && !isTiny
              ? { filter: `drop-shadow(0 0 ${Math.round(foxSize * 0.12)}px ${glowColor})` }
              : {})
          : {
              shadowColor: glowColor ?? 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glowColor ? 0.55 : 0,
              shadowRadius: foxSize * 0.2,
              elevation: 0,
            }),
        ...(isTiny ? { borderRadius: foxSize / 2 } : {}),
      }}
    >
      {isTiny ? (
        // ── Tiny: circular icon (3D fox head) ─────────────────────────────
        <View style={{ width: foxSize, height: foxSize, borderRadius: foxSize / 2, overflow: 'hidden', backgroundColor: 'transparent' }}>
          <Image source={imageSource} style={{ width: foxSize, height: foxSize, backgroundColor: 'transparent' }} resizeMode="cover" />
        </View>
      ) : (
        // ── Small / Medium / Large: full-body character, fully transparent ─
        <Image
          source={imageSource}
          style={{ width: foxSize, height: foxSize, backgroundColor: 'transparent' }}
          resizeMode="contain"
        />
      )}
    </Animated.View>
  );

  return (
    <View style={styles.wrapper}>
      {/* Speech bubble (shown above the fox) */}
      {bubbleText ? (
        <View style={[styles.bubble, { backgroundColor: bubbleBg, borderColor: bubbleBorder }]}>
          <Text style={[styles.bubbleText, { color: '#00D4AA' }]}>{bubbleText}</Text>
        </View>
      ) : null}

      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          {foxEl}
        </TouchableOpacity>
      ) : foxEl}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    maxWidth: 280,
    marginBottom: 8,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: 'Nunito_900Black',
    textAlign: 'center',
    lineHeight: 20,
  },
});
