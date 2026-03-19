import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FixiSvg } from './FixiSvg';
import { FixiSpeechBubble } from './FixiSpeechBubble';
import { FixiState, FIXI_SIZES, FixiSize } from './FixiStates';
import { getFixiLevel } from './FixiAccessories';
import { useAppStore } from '../../store/useStore';

interface FixiProps {
  state: FixiState;
  size?: FixiSize;
  speechBubble?: string;
  animated?: boolean;
  accessory?: string;
  onPress?: () => void;
  showSpeechBubble?: boolean;
  percentPaid?: number;
}

export function Fixi({
  state,
  size = 'medium',
  speechBubble,
  animated = true,
  accessory: accessoryProp,
  onPress,
  showSpeechBubble = true,
  percentPaid,
}: FixiProps) {
  const debts = useAppStore((s) => s.debts);
  const onboardingTotalDebt = useAppStore((s) => s.onboardingTotalDebt);

  // Calculate accessory from level if not provided
  const computedPercent = percentPaid ?? (() => {
    const totalDebt = debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt;
    const remaining = debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
    return totalDebt > 0 ? ((totalDebt - remaining) / totalDebt) * 100 : 0;
  })();

  const fixiLevel = getFixiLevel(computedPercent);
  const accessory = accessoryProp ?? fixiLevel.accessory;

  const pixelSize = FIXI_SIZES[size];

  // Animation values
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Idle animation - gentle floating
  useEffect(() => {
    if (!animated) return;
    translateY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [animated]);

  // Tap bounce animation
  const handleTap = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1.15, { damping: 4, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 150 })
    );
    rotation.value = withSequence(
      withTiming(-5, { duration: 60 }),
      withTiming(5, { duration: 80 }),
      withTiming(-3, { duration: 60 }),
      withTiming(0, { duration: 80 })
    );

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const bubbleMaxWidth = size === 'small' ? 140 : size === 'medium' ? 200 : 260;

  return (
    <Animated.View
      entering={animated ? FadeIn.duration(500) : undefined}
      style={styles.wrapper}
    >
      {/* Speech Bubble */}
      {speechBubble && showSpeechBubble && (
        <FixiSpeechBubble
          text={speechBubble}
          animated={animated}
          maxWidth={bubbleMaxWidth}
        />
      )}

      {/* Fixi Character */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleTap}
        disabled={!onPress && !animated}
      >
        <Animated.View style={[animatedStyle]}>
          <FixiSvg size={pixelSize} state={state} accessory={accessory} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Loading version of Fixi - replaces spinner
export function FixiLoading({ size = 'small' }: { size?: FixiSize }) {
  const pixelSize = FIXI_SIZES[size];
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.loadingWrapper}>
      <Animated.View style={animatedStyle}>
        <FixiSvg size={pixelSize} state="thinking" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 4,
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
