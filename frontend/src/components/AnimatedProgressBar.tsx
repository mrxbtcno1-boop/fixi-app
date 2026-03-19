import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../constants/theme';
import { useThemeOverrides } from '../contexts/ThemeContext';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  height?: number;
  colors?: [string, string];
  showTrack?: boolean;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height = 8,
  colors = [Colors.brand.primary, Colors.brand.secondary],
  showTrack = true,
}) => {
  const t = useThemeOverrides();
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: Math.min(100, Math.max(0, progress)),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.track, { height, backgroundColor: t.colors.background.tertiary }, !showTrack && { backgroundColor: 'transparent' }]}>
      <Animated.View style={[styles.fill, { width, height }]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
    overflow: 'hidden',
  },
});
