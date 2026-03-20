import { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEY_PLANNED_FREEDOM_DATE, KEY_ONBOARDING_START } from '../../src/services/NotificationService';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { FoxMascot } from '../../src/components/FoxMascot';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';
import { requestReviewIfAppropriate } from '../../src/services/ReviewService';
import { useThemeOverrides } from '../../src/contexts/ThemeContext';
import { simulatePayoff, formatDateDE, formatCurrency, DebtInput } from '../../src/utils/calculations';

const TOTAL_STEPS = 5;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Crown area dimensions relative to the 180px fox image
const FOX_SIZE = 180;
const CROWN_TOP = 2;
const CROWN_LEFT = 52;
const CROWN_WIDTH = 76;
const CROWN_HEIGHT = 52;

export default function OnboardingStep7() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const debts = useAppStore(s => s.debts);
  const method = useAppStore(s => s.method);
  const onboardingTotalDebt = useAppStore(s => s.onboardingTotalDebt);
  const onboardingMonthlyPayment = useAppStore(s => s.onboardingMonthlyPayment);
  const completeOnboarding = useAppStore(s => s.completeOnboarding);

  const [isSharing, setIsSharing] = useState(false);

  // Animation refs
  const confettiRef = useRef<any>(null);
  const contentRef = useRef<View>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const dateScale = useRef(new Animated.Value(0.4)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsTranslateY = useRef(new Animated.Value(20)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;

  // Crown shimmer sweep
  const shimmerX = useRef(new Animated.Value(-CROWN_WIDTH * 2)).current;

  const payoffInfo = useMemo(() => {
    if (debts.length > 0) {
      const debtInputs: DebtInput[] = debts.map(d => ({
        id: d.id,
        name: d.name,
        remainingAmount: d.remainingAmount,
        monthlyPayment: d.monthlyPayment,
        interestRate: d.interestRate,
      }));
      const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);
      const result = simulatePayoff(debtInputs, totalMonthly, method);
      return {
        date: formatDateDE(result.freedomDate),
        months: result.totalMonths,
        interestSaved: result.totalInterest,
        rawDate: result.freedomDate,
      };
    }
    const months = onboardingMonthlyPayment > 0
      ? Math.ceil(onboardingTotalDebt / onboardingMonthlyPayment)
      : 0;
    const freedomDate = new Date();
    freedomDate.setMonth(freedomDate.getMonth() + months);
    return { date: formatDateDE(freedomDate), months, interestSaved: 0, rawDate: freedomDate };
  }, [debts, method, onboardingTotalDebt, onboardingMonthlyPayment]);

  useEffect(() => {
    // ── Cinematic entrance choreography ──────────────────────────────────────
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    setTimeout(() => confettiRef.current?.start(), 500);

    // Date springs in with energy
    setTimeout(() => {
      Animated.spring(dateScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, 400);

    // Stats float up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(statsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(statsTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 900);

    // Quote and branding fade in
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(quoteOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(brandOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 1300);

    // ── Crown shimmer sweep – starts after entrance completes ─────────────────
    // Pokémon-shiny light ray sweeps over the golden crown
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerX, {
            toValue: CROWN_WIDTH * 2,
            duration: 750,
            useNativeDriver: true,
          }),
          // instant reset (no visible jump inside the overflow:hidden window)
          Animated.timing(shimmerX, {
            toValue: -CROWN_WIDTH * 2,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(2800),
        ])
      ).start();
    }, 1900);

    requestReviewIfAppropriate();
  }, []);

  const handleFinish = () => {
    // Fire-and-forget: save freedom date for notification scheduling in face-id
    AsyncStorage.setItem(KEY_PLANNED_FREEDOM_DATE, payoffInfo.rawDate.toISOString());
    AsyncStorage.setItem(KEY_ONBOARDING_START, new Date().toISOString());
    completeOnboarding();
    trackEvent('onboarding_step', { step: 'wow_moment_v13' });
    trackEvent('onboarding_complete');
    router.replace('/face-id');
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      // Capture the beautiful reveal content as an image
      const uri = await captureRef(contentRef, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Mein Schuldenfreiheitsdatum teilen',
          UTI: 'public.png',
        });
      } else if (Platform.OS === 'web') {
        // Web fallback: navigator.share or download
        try {
          if (typeof navigator !== 'undefined' && navigator.share) {
            await navigator.share({
              title: 'Mein Schuldenfreiheitsdatum 🦊',
              text: `Ich werde am ${payoffInfo.date} schuldenfrei sein! Berechnet mit Fixi.`,
            });
          } else {
            // Fallback: trigger image download
            const link = document.createElement('a');
            link.href = uri;
            link.download = 'fixi-schuldenfrei.png';
            link.click();
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Share capture error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const statsBg = t.isDark ? '#0D1526' : '#FFFFFF';

  return (
    <ScreenWrapper>
      <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
        {/* Confetti */}
        <ConfettiCannon
          ref={confettiRef}
          count={130}
          origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
          autoStart={false}
          fadeOut
          colors={['#00D4AA', '#FFB800', '#FF6B6B', '#FFB06B', '#6B9FFF', '#FFFFFF']}
        />

        {/* ── Capturable content area ─────────────────────────────────────────── */}
        <Animated.View
          ref={contentRef as any}
          collapsable={false}
          style={[styles.content, { opacity: fadeIn }]}
        >
          {/* Fox with golden crown shimmer */}
          <View style={styles.foxWrap}>
            <FoxMascot state="celebrating" size="large" />

            {/* Crown shimmer window – clips to crown area only */}
            <View style={styles.crownWindow} pointerEvents="none">
              <Animated.View
                style={{
                  transform: [{ translateX: shimmerX }],
                  width: CROWN_WIDTH * 5,
                  height: CROWN_HEIGHT,
                  marginLeft: -CROWN_WIDTH,
                  backgroundColor: 'transparent',
                }}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255,200,50,0.0)',
                    'rgba(255,220,80,0.55)',
                    'rgba(255,255,180,0.85)',
                    'rgba(255,220,80,0.55)',
                    'rgba(255,200,50,0.0)',
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1, backgroundColor: 'transparent' }}
                />
              </Animated.View>
            </View>
          </View>

          {/* Label */}
          <Text style={[styles.preLabel, { color: '#00D4AA', fontFamily: 'Inter_500Medium' }]}>
            {userName ? userName.toUpperCase() + ', DU KANNST AM...' : 'DU KANNST AM...'}
          </Text>

          {/* Date card springs in */}
          <Animated.View style={[styles.dateCard, { transform: [{ scale: dateScale }] }]}>
            <LinearGradient
              colors={['rgba(0,212,170,0.15)', 'rgba(0,212,170,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dateGradient}
            >
              <Text style={[styles.dateText, { fontFamily: 'Nunito_900Black', color: '#00D4AA' }]}>
                {payoffInfo.date}
              </Text>
              <Text style={[styles.freeText, t.textPrimary, { fontFamily: 'Inter_500Medium' }]}>
                schuldenfrei sein!
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Stats */}
          <Animated.View
            style={[
              styles.statsCard,
              {
                backgroundColor: statsBg,
                opacity: statsOpacity,
                transform: [{ translateY: statsTranslateY }],
              },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily: 'Nunito_900Black', color: '#00D4AA' }]}>
                {payoffInfo.months}
              </Text>
              <Text style={[styles.statLabel, t.textSecondary, { fontFamily: 'Inter_400Regular' }]}>
                Monate{'\n'}bis zur Freiheit
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily: 'Nunito_900Black', color: '#FFB800' }]}>
                {formatCurrency(payoffInfo.interestSaved)}
              </Text>
              <Text style={[styles.statLabel, t.textSecondary, { fontFamily: 'Inter_400Regular' }]}>
                Zinsen{'\n'}gespart
              </Text>
            </View>
          </Animated.View>

          {/* Quote */}
          <Animated.Text
            style={[styles.quote, t.textSecondary, { fontFamily: 'Inter_500Medium', opacity: quoteOpacity }]}
          >
            "Du schaffst das. Ich bin jeden Tag dabei. 🦊"
          </Animated.Text>

          {/* Fixi branding – visible in shared image */}
          <Animated.Text style={[styles.brandTag, { opacity: brandOpacity }]}>
            Fixi · Schuldenfrei mit KI-Plan
          </Animated.Text>
        </Animated.View>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          {/* Primary CTA */}
          <TouchableOpacity
            testID="onboarding-finish-btn"
            onPress={handleFinish}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00D4AA', '#00A88A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >
              <Text style={[styles.btnText, { fontFamily: 'Nunito_900Black' }]}>
                Los geht's! Meinen Plan starten
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity
            testID="share-freedom-btn"
            style={styles.shareBtn}
            onPress={handleShare}
            activeOpacity={0.7}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#00D4AA" />
            ) : (
              <Text style={[styles.shareBtnText, { fontFamily: 'Nunito_900Black' }]}>
                Teilen 🦊
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  // ── Capturable content ───────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  // ── Fox + Crown shimmer ──────────────────────────────────────────────────
  foxWrap: {
    width: FOX_SIZE,
    height: FOX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  crownWindow: {
    position: 'absolute',
    top: CROWN_TOP,
    left: CROWN_LEFT,
    width: CROWN_WIDTH,
    height: CROWN_HEIGHT,
    overflow: 'hidden',
    zIndex: 5,
    backgroundColor: 'transparent',
  },

  // ── Date reveal ──────────────────────────────────────────────────────────
  preLabel: {
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 8,
    marginBottom: 4,
  },
  dateCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#00D4AA',
    overflow: 'hidden',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  dateGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dateText: { fontSize: 52, textAlign: 'center', lineHeight: 60 },
  freeText: { fontSize: 18, textAlign: 'center', marginTop: 4 },

  // ── Stats ────────────────────────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.15)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,212,170,0.2)',
    marginHorizontal: 16,
  },

  // ── Quote + Branding ─────────────────────────────────────────────────────
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  brandTag: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(0,212,170,0.45)',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    paddingTop: 8,
    gap: 12,
  },
  btn: {
    height: 58,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  btnText: { fontSize: 18, color: '#0A0E1A' },
  shareBtn: {
    height: 50,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shareBtnText: {
    fontSize: 16,
    color: '#00D4AA',
    letterSpacing: 0.3,
  },
});
