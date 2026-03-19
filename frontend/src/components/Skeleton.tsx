import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: Colors.background.tertiary, opacity },
        style,
      ]}
    />
  );
};

/** Skeleton for a stat card */
export const StatCardSkeleton: React.FC = () => (
  <View style={s.statCard}>
    <Skeleton width={36} height={36} borderRadius={18} />
    <View style={{ marginTop: 10, gap: 6 }}>
      <Skeleton width={80} height={20} />
      <Skeleton width={120} height={12} />
    </View>
  </View>
);

/** Skeleton for a debt list item */
export const DebtItemSkeleton: React.FC = () => (
  <View style={s.debtItem}>
    <View style={s.debtRow}>
      <Skeleton width={40} height={40} borderRadius={12} />
      <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={60} height={16} />
    </View>
    <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 10 }} />
  </View>
);

/** Skeleton for chart area */
export const ChartSkeleton: React.FC = () => (
  <View style={s.chartArea}>
    <Skeleton width="100%" height={160} borderRadius={12} />
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
      <Skeleton width={60} height={12} />
      <Skeleton width={60} height={12} />
      <Skeleton width={60} height={12} />
    </View>
  </View>
);

const s = StyleSheet.create({
  statCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    minWidth: '45%',
  },
  debtItem: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    marginBottom: Spacing.md,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartArea: {
    marginBottom: Spacing.lg,
  },
});
