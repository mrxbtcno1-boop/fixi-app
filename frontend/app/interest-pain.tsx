import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Colors, Spacing } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import { useThemeOverrides } from '../src/contexts/ThemeContext';
import { trackEvent } from '../src/services/supabase';

export const INTEREST_PAIN_KEY = 'hasSeenInterestPainScreen';

export default function InterestPainScreen() {
  const router = useRouter();
  const debts = useAppStore(s => s.debts);
  const hasHydrated = useAppStore(s => s._hasHydrated);
  const t = useThemeOverrides();
  const { isDark } = t;

  // Calculate total monthly interest from all debts
  const monthlyInterest = debts.reduce((sum, debt) => {
    const rate = (debt.interestRate ?? 0) / 100 / 12;
    const balance = debt.remainingAmount ?? debt.totalAmount ?? 0;
    return sum + balance * rate;
  }, 0);

  // Animations
  const numberTranslateY = useRef(new Animated.Value(60)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const mintOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const [showMint, setShowMint] = useState(false);

  useEffect(() => {
    // Wait for store hydration before running logic
    if (!hasHydrated) return;

    // Mark as seen
    AsyncStorage.setItem(INTEREST_PAIN_KEY, 'true');
    trackEvent('interest_pain_screen_shown', { monthly_interest: monthlyInterest });

    // If no interest at all → skip directly to paywall
    if (monthlyInterest < 1) {
      router.replace('/paywall');
      return;
    }

    // Phase 1: Slide + fade number in (0.8s ease-out)
    Animated.parallel([
      Animated.timing(numberTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(numberOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start(() => {
      // Phase 2: Subtitle fades in (0.4s)
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });

    // Phase 3: After 1.5s pause → mint text appears
    const mintTimer = setTimeout(() => {
      setShowMint(true);
      Animated.timing(mintOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        // Phase 4: CTA button fades in
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 1500);

    return () => clearTimeout(mintTimer);
  }, [hasHydrated]);

  const handleCTA = () => {
    trackEvent('interest_pain_cta_tapped');
    router.replace('/paywall');
  };

  const formatEuro = (value: number) =>
    value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '€';

  const textPrimary = isDark ? '#F0F4FF' : '#0D1526';
  const bg = isDark ? '#080E1C' : '#F4F6FA';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Red number – slides in from below */}
        <Animated.View
          style={{
            opacity: numberOpacity,
            transform: [{ translateY: numberTranslateY }],
            alignItems: 'center',
          }}
        >
          <Text style={[styles.interestNumber, { color: isDark ? '#FF6B6B' : '#E05555' }]} testID="interest-pain-amount">
            {formatEuro(monthlyInterest)}
          </Text>
        </Animated.View>

        {/* Subtitle – fades in after number */}
        <Animated.View style={{ opacity: subtitleOpacity, alignItems: 'center', marginTop: 8 }}>
          <Text style={[styles.subtitle, { color: textPrimary }]}>
            Zinsen die du diesen Monat bezahlst
          </Text>
          <Text style={[styles.caption, { color: isDark ? '#5A6882' : '#8A96A8' }]}>
            Jeden Monat. Ohne Plan. Ohne Ende.
          </Text>
        </Animated.View>

        {/* Mint text – delayed appearance */}
        {showMint && (
          <Animated.View style={{ opacity: mintOpacity, alignItems: 'center', marginTop: 40 }}>
            <Text style={[styles.mintText, { color: isDark ? '#00D4AA' : '#00B899' }]} testID="interest-pain-mint-text">
              Mit Fixi hörst du damit auf.
            </Text>
          </Animated.View>
        )}

        {/* CTA Button – fades in after mint text */}
        <Animated.View style={[{ opacity: btnOpacity }, styles.btnWrapper]}>
          <TouchableOpacity
            testID="interest-pain-cta-btn"
            onPress={handleCTA}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00D4AA', '#00A589']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaBtnText}>Meinen Plan aktivieren</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            testID="interest-pain-skip-btn"
            onPress={() => router.replace('/paywall')}
            style={styles.skipBtn}
          >
            <Text style={[styles.skipText, { color: isDark ? '#5A6882' : '#8A96A8' }]}>
              Vielleicht später
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
  },
  interestNumber: {
    fontSize: 72,
    fontWeight: '800',
    fontFamily: 'Nunito_900Black',
    letterSpacing: -2,
    textAlign: 'center',
    lineHeight: 80,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 28,
  },
  caption: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  mintText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  btnWrapper: {
    width: '100%',
    marginTop: 48,
    alignItems: 'center',
    gap: 16,
  },
  ctaBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    minWidth: 280,
  },
  ctaBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A0E1A',
    letterSpacing: 0.3,
  },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontSize: 15 },
});
