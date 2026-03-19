import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, BounceIn, SlideInUp } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';
import { FixiState } from './Fixi/FixiStates';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface FullscreenMomentProps {
  visible: boolean;
  type: 'milestone' | 'levelup' | 'debt_cleared' | 'greeting';
  title: string;
  subtitle: string;
  fixiState: FixiState;
  fixiSpeech: string;
  onDismiss: () => void;
  badgeName?: string;
  newLevel?: string;
}

export function FixiFullscreenMoment({
  visible,
  type,
  title,
  subtitle,
  fixiState,
  fixiSpeech,
  onDismiss,
  badgeName,
  newLevel,
}: FullscreenMomentProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
  }, [visible]);

  if (!show) return null;

  const emoji = type === 'milestone' ? '🏆'
    : type === 'levelup' ? '\u2B06\uFE0F'
    : type === 'debt_cleared' ? '\uD83D\uDCA5'
    : '🦊';

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <LinearGradient
        colors={['rgba(10,14,26,0.97)', 'rgba(20,25,41,0.97)']}
        style={styles.gradient}
      >
        {/* Confetti dots */}
        {(type === 'milestone' || type === 'levelup' || type === 'debt_cleared') && (
          <View style={styles.confettiLayer}>
            {Array.from({ length: 20 }).map((_, i) => (
              <Animated.View
                key={i}
                entering={FadeIn.delay(i * 50).duration(400)}
                style={[
                  styles.confettiDot,
                  {
                    left: `${Math.random() * 90 + 5}%`,
                    top: `${Math.random() * 50 + 5}%`,
                    backgroundColor: ['#00D4AA', '#7B61FF', '#FFD700', '#FF6B6B', '#FF9B7A'][i % 5],
                    width: 4 + Math.random() * 6,
                    height: 4 + Math.random() * 6,
                    borderRadius: 3 + Math.random() * 3,
                    transform: [{ rotate: `${Math.random() * 360}deg` }],
                  },
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.content}>
          <Animated.Text entering={BounceIn.delay(200)} style={styles.emoji}>
            {emoji}
          </Animated.Text>

          <Animated.Text entering={SlideInUp.delay(400).springify()} style={styles.title}>
            {title}
          </Animated.Text>

          <Animated.View entering={BounceIn.delay(600)}>
            <FoxMascot state={fixiState} size="large" speechBubble={fixiSpeech} />
          </Animated.View>

          {subtitle ? (
            <Animated.Text entering={FadeIn.delay(800)} style={styles.subtitle}>
              {subtitle}
            </Animated.Text>
          ) : null}

          {newLevel ? (
            <Animated.Text entering={FadeIn.delay(900)} style={styles.levelBadge}>
              {newLevel}
            </Animated.Text>
          ) : null}

          <Animated.View entering={FadeIn.delay(1200)}>
            <TouchableOpacity style={styles.continueBtn} onPress={onDismiss} activeOpacity={0.8} testID="fullscreen-moment-continue">
              <LinearGradient
                colors={[Colors.brand.primary, Colors.brand.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueBtnInner}
              >
                <Text style={styles.continueBtnText}>{'Weiter \u2192'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiDot: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  levelBadge: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brand.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  continueBtn: {
    marginTop: 16,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  continueBtnInner: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.inverse,
    textAlign: 'center',
  },
});
