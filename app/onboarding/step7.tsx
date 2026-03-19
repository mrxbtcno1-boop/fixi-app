import { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { FoxMascot } from '../../src/components/FoxMascot';
import { formatDateDE } from '../../src/utils/calculations';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';
import { requestReviewIfAppropriate } from '../../src/services/ReviewService';
import { useThemeOverrides } from '../../src/contexts/ThemeContext';

const TOTAL_STEPS = 7;

export default function OnboardingStep7() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const debts = useAppStore(s => s.debts);
  const method = useAppStore(s => s.method);
  const completeOnboarding = useAppStore(s => s.completeOnboarding);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const dateScale = useRef(new Animated.Value(0.5)).current;
  const confettiOpacity = useRef(
    Array.from({ length: 12 }).map(() => new Animated.Value(0))
  ).current;
  const confettiY = useRef(
    Array.from({ length: 12 }).map(() => new Animated.Value(-20))
  ).current;

  const payoffInfo = useMemo(() => {
    if (debts.length === 0) return { date: 'Unbekannt', months: 0 };
    const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0);
    const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);
    if (totalMonthly <= 0) return { date: 'Unbekannt', months: 0 };
    const months = Math.ceil(totalDebt / totalMonthly);
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return {
      date: formatDateDE(date),
      months,
    };
  }, [debts, method]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(dateScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    // Confetti
    confettiOpacity.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(800 + i * 80),
        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
    confettiY.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(800 + i * 80),
        Animated.timing(anim, { toValue: Math.random() * 200 + 50, duration: 1500, useNativeDriver: true }),
      ]).start();
    });

    requestReviewIfAppropriate();
  }, []);

  const handleFinish = () => {
    completeOnboarding();
    trackEvent('onboarding_step', { step: 'wow_moment' });
    trackEvent('onboarding_complete');
    router.replace('/paywall');
  };

  const confettiColors = ['#00D4AA', '#7B61FF', '#FF6B6B', '#FFB06B', '#6B9FFF', '#FF6BD6'];

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
      {/* Confetti */}
      {confettiOpacity.map((opacity, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confetti,
            {
              left: `${10 + (i * 7) % 80}%`,
              opacity,
              backgroundColor: confettiColors[i % confettiColors.length],
              transform: [{ translateY: confettiY[i] }, { rotate: `${i * 30}deg` }],
            },
          ]}
        />
      ))}

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, styles.dotActive]} />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>  
        <FoxMascot state="celebrating" size="medium" speechBubble={`${userName}, du kannst am...`} />

        <Animated.View style={[styles.dateContainer, { transform: [{ scale: dateScale }] }]}>
          <Text style={styles.dateText}>{payoffInfo.date}</Text>
        </Animated.View>

        <Text style={[styles.freeText, t.textPrimary]}>schuldenfrei sein!</Text>

        <Text style={[styles.monthsText, t.textSecondary]}>
          Das sind nur noch {payoffInfo.months} Monate.{'\n'}Fixi hilft dir jeden Tag dabei.
        </Text>

        <View style={styles.divider} />

        <FoxMascot state="motivated" size="small" speechBubble="Bereit? Ich bin es!" />
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity testID="onboarding-finish-btn" onPress={handleFinish} activeOpacity={0.8}>
          <LinearGradient
            colors={['#00D4AA', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.gradientBtnText}>Mein Dashboard öffnen</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.background.tertiary },
  dotActive: { width: 24, backgroundColor: Colors.brand.primary },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center', alignItems: 'center' },
  dateContainer: {
    marginVertical: 20,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  dateText: { fontSize: 28, fontWeight: '800', color: Colors.brand.primary, textAlign: 'center' },
  freeText: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, textAlign: 'center' },
  monthsText: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', marginTop: 16, lineHeight: 22 },
  divider: { width: '80%', height: 1, backgroundColor: Colors.glass.stroke, marginVertical: 24 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 16 },
  gradientBtn: { borderRadius: BorderRadius.full, paddingVertical: 16, alignItems: 'center' },
  gradientBtnText: { fontSize: 17, fontWeight: '700', color: '#0A0E1A' },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 0,
  },
});
