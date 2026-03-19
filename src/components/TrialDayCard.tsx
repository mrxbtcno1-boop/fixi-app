import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import type { TrialDayContent } from '../services/TrialDayEngine';

interface TrialDayCardProps {
  content: TrialDayContent;
  remainingDays: number;
}

export const TrialDayCard: React.FC<TrialDayCardProps> = ({ content, remainingDays }) => {
  const router = useRouter();
  
  // Subtle glow animation
  const glowOpacity = useSharedValue(0.5);
  
  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    if (content.featureHighlight.route) {
      router.push(content.featureHighlight.route as any);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <LinearGradient
        colors={[Colors.brand.primary + '20', Colors.brand.secondary + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Animated glow border */}
        <Animated.View style={[styles.glowBorder, glowStyle]}>
          <LinearGradient
            colors={[Colors.brand.primary, Colors.brand.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowGradient}
          />
        </Animated.View>
        
        {/* Trial day badge */}
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>Tag {content.day}/7</Text>
          <Text style={styles.remainingText}>• {remainingDays} Tage übrig</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{content.featureHighlight.icon}</Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{content.featureHighlight.title}</Text>
            <Text style={styles.description}>{content.featureHighlight.description}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          onPress={handlePress}
          style={styles.actionBtn}
          testID="trial-day-action-btn"
        >
          <Text style={styles.actionBtnText}>{content.featureHighlight.action}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.brand.primary} />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  gradient: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.brand.primary + '40',
  },
  glowBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    opacity: 0.3,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  remainingText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.primary + '15',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.primary,
  },
});

export default TrialDayCard;
