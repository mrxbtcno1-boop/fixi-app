import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Easing, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { useTheme, useThemeOverrides } from '../../src/contexts/ThemeContext';
import { CircularProgress } from '../../src/components/CircularProgress';
import { FoxMascot } from '../../src/components/FoxMascot';
import { getFixiLevel, FIXI_LEVELS, getCurrentEvoFox } from '../../src/components/Fixi/FixiAccessories';
import type { FixiState } from '../../src/components/Fixi/FixiStates';
import { FixiDailyCard } from '../../src/components/FixiDailyCard';
import { FixiFullscreenMoment } from '../../src/components/FixiFullscreenMoment';
import { TrialDayCard } from '../../src/components/TrialDayCard';
import { SoftDowngrade } from '../../src/components/SoftDowngrade';
import { TrialDayEngine } from '../../src/services/TrialDayEngine';
import type { TrialDayContent } from '../../src/services/TrialDayEngine';
import { formatCurrency, calculateFreedomDate, formatDateDE, monthsToYearsMonths, monthsToPayoff, getLevel } from '../../src/utils/calculations';
import { AnimatedProgressBar } from '../../src/components/AnimatedProgressBar';
import { AnimatedCounter } from '../../src/components/AnimatedCounter';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUOTES = [
  'Jeder Euro zählt. Du bist stärker als deine Schulden. \uD83D\uDCAA',
  'Kleine Schritte führen zu großen Veränderungen. \uD83D\uDE80',
  'Du bist nicht deine Schulden. Du bist so viel mehr. \u2764\uFE0F',
  'Heute ist ein guter Tag für deine Freiheit. \u2600\uFE0F',
  'Jede Zahlung ist ein Sieg. Feiere dich! \uD83C\uDF89',
  'Dein zukünftiges Ich wird dir danken. \uD83D\uDE4F',
];

const FIXI_MOTIVATION: Record<string, { state: FixiState; bubble: string }> = {
  '0': { state: 'motivated', bubble: 'Jeder Euro zählt!' },
  '10': { state: 'coaching', bubble: 'Du bist auf einem guten Weg!' },
  '25': { state: 'excited', bubble: 'Wow, fast die Hälfte!' },
  '50': { state: 'strong', bubble: 'Unaufhaltbar!' },
  '75': { state: 'proud', bubble: 'Du bist ein Fixi Master!' },
  '100': { state: 'celebrating', bubble: 'WIR HABEN ES GESCHAFFT! \uD83C\uDFC6' },
};

const RANDOM_TIPS = [
  '\uD83E\uDD8A Wusstest du? Ein € pro Tag = 365€ im Jahr!',
  '\uD83E\uDD8A Tipp: Starte mit der kleinsten Schuld – Schneeball!',
  '\uD83E\uDD8A Motiviert? Extra-Zahlung macht den Unterschied!',
  '\uD83E\uDD8A Gemeinsam schaffen wir das! Bleib dran!',
  '\uD83E\uDD8A Jede Zahlung bringt dich näher an die Freiheit!',
];

function getFixiMotivation(percent: number): { state: FixiState; bubble: string } {
  if (percent >= 100) return FIXI_MOTIVATION['100'];
  if (percent >= 75) return FIXI_MOTIVATION['75'];
  if (percent >= 50) return FIXI_MOTIVATION['50'];
  if (percent >= 25) return FIXI_MOTIVATION['25'];
  if (percent >= 10) return FIXI_MOTIVATION['10'];
  return FIXI_MOTIVATION['0'];
}

export default function HomeScreen() {
  const router = useRouter();
  const userName = useAppStore((s) => s.userName);
  const debts = useAppStore((s) => s.debts);
  const payments = useAppStore((s) => s.payments);
  const streakCount = useAppStore((s) => s.streakCount);
  const badges = useAppStore((s) => s.badges);
  const onboardingTotalDebt = useAppStore((s) => s.onboardingTotalDebt);
  const onboardingMonthlyPayment = useAppStore((s) => s.onboardingMonthlyPayment);
  const lastShownLevel = useAppStore((s) => s.lastShownLevel);
  const lastDailyGreeting = useAppStore((s) => s.lastDailyGreeting);
  const setLastShownLevel = useAppStore((s) => s.setLastShownLevel);
  const setLastDailyGreeting = useAppStore((s) => s.setLastDailyGreeting);

  // Trial system
  const trialStartDate = useAppStore((s) => s.trialStartDate);
  const isTrialActive = useAppStore((s) => s.isTrialActive);
  const getTrialDay = useAppStore((s) => s.getTrialDay);
  const hasTrialExpired = useAppStore((s) => s.hasTrialExpired);
  const trialExpiredSeen = useAppStore((s) => s.trialExpiredSeen);
  const markTrialExpiredSeen = useAppStore((s) => s.markTrialExpiredSeen);
  const isPremium = useAppStore((s) => s.isPremium);

  const hasPremiumAccess = isPremium || (trialStartDate !== null && isTrialActive());

  const t = useThemeOverrides();
  const { isDark } = useTheme();

  // Trial day content
  const [trialDayContent, setTrialDayContent] = useState<TrialDayContent | null>(null);
  const [showSoftDowngrade, setShowSoftDowngrade] = useState(false);

  // Fullscreen moment states
  const [showMoment, setShowMoment] = useState(false);
  const [momentType, setMomentType] = useState<'greeting' | 'levelup' | 'milestone' | 'debt_cleared'>('greeting');
  const [momentData, setMomentData] = useState({ title: '', subtitle: '', fixiSpeech: '', newLevel: '' });

  // P1.3 – Simulator Bottom Sheet
  const [showSimulatorSheet, setShowSimulatorSheet] = useState(false);
  // P1.4 – Onboarding Trial Paywall
  const [showOnboardingPaywall, setShowOnboardingPaywall] = useState(false);

  // P1.5 – Animated Counter für Simulator Sheet
  const counterRef = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [counterDisplay, setCounterDisplay] = useState(0);

  // Enhancement – Streak-Glow (7+ Tage = goldener pulsierender Glow-Ring)
  const glowPulse = useRef(new Animated.Value(0)).current;
  const isStreakGlowing = streakCount >= 7;
  const isStreakLegendary = streakCount >= 30;
  const goldColor = t.gold;
  const maxGlowOpacity = isDark ? 0.6 : 0.3;
  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, maxGlowOpacity],
  });

  // Notification permission dialog
  // Handled by NotificationPermissionDialog at root level

  const totalDebt = useMemo(() =>
    debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt,
    [debts, onboardingTotalDebt]
  );
  const remaining = useMemo(() =>
    debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt,
    [debts, onboardingTotalDebt]
  );
  const paid = totalDebt - remaining;
  const progress = totalDebt > 0 ? paid / totalDebt : 0;
  const percentText = Math.round(progress * 100);

  const monthlyPayment = useMemo(() =>
    debts.length > 0 ? debts.reduce((s, d) => s + d.monthlyPayment, 0) : onboardingMonthlyPayment,
    [debts, onboardingMonthlyPayment]
  );
  const weightedRate = useMemo(() =>
    debts.length > 0 && remaining > 0
      ? debts.reduce((s, d) => s + d.interestRate * d.remainingAmount, 0) / remaining
      : 0,
    [debts, remaining]
  );
  const freedomDate = calculateFreedomDate(remaining, weightedRate, monthlyPayment);
  const totalMonths = monthsToPayoff(remaining, weightedRate, monthlyPayment);
  const { years, months } = monthsToYearsMonths(totalMonths);
  const level = getLevel(percentText);

  // Pre-calculate simulator scenarios (moved here so remaining/weightedRate/monthlyPayment are initialized)
  const simCurrentMonths = useMemo(() =>
    monthlyPayment > 0 && remaining > 0 ? monthsToPayoff(remaining, weightedRate, monthlyPayment) : 0,
    [remaining, weightedRate, monthlyPayment]);
  const simFasterMonths = useMemo(() =>
    monthlyPayment > 0 && remaining > 0 ? monthsToPayoff(remaining, weightedRate, monthlyPayment + 50) : 0,
    [remaining, weightedRate, monthlyPayment]);
  const simCurrentInterest = useMemo(() =>
    simCurrentMonths > 0 ? Math.max(0, Math.round(monthlyPayment * simCurrentMonths - remaining)) : 0,
    [simCurrentMonths, monthlyPayment, remaining]);
  const simFasterInterest = useMemo(() =>
    simFasterMonths > 0 ? Math.max(0, Math.round((monthlyPayment + 50) * simFasterMonths - remaining)) : 0,
    [simFasterMonths, monthlyPayment, remaining]);
  const simSavedInterest = Math.max(0, simCurrentInterest - simFasterInterest);
  const simSavedMonths = Math.max(0, Math.round(simCurrentMonths - simFasterMonths));

  // Animate counter when sheet opens (placed here so simSavedInterest is initialized)
  useEffect(() => {
    if (!showSimulatorSheet) {
      counterRef.setValue(0);
      setCounterDisplay(0);
      pulseAnim.setValue(1);
      return;
    }
    const listener = counterRef.addListener(({ value }) => setCounterDisplay(Math.round(value)));
    const timer = setTimeout(() => {
      Animated.timing(counterRef, {
        toValue: simSavedInterest,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.07, duration: 160, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
        ]).start();
      });
    }, 350);
    return () => { counterRef.removeListener(listener); clearTimeout(timer); };
  }, [showSimulatorSheet, simSavedInterest]);

  const quoteIndex = new Date().getDate() % QUOTES.length;
  const greeting = userName ? `Hey ${userName} \uD83D\uDC4B` : 'Hey du \uD83D\uDC4B';

  const fixiMotivation = getFixiMotivation(percentText);
  const fixiLevel = getFixiLevel(percentText);
  const [fixiBubble, setFixiBubble] = useState(fixiMotivation.bubble);
  const [recentQuotes, setRecentQuotes] = useState<string[]>([]);

  // P1.3 – Simulator Bottom Sheet: show 5s after first dashboard visit with debts
  useEffect(() => {
    if (debts.length === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    AsyncStorage.getItem('hasSeenSimulatorSheet').then(seen => {
      if (!seen) {
        timer = setTimeout(async () => {
          await AsyncStorage.setItem('hasSeenSimulatorSheet', 'true');
          setShowSimulatorSheet(true);
          trackEvent('simulator_sheet_shown');
        }, 5000);
      }
    });
    return () => clearTimeout(timer);
  }, [debts.length]);

  // P1.4 – Show onboarding paywall after simulator sheet
  const handleSimulatorSheetDismiss = useCallback(async (openSimulator: boolean) => {
    setShowSimulatorSheet(false);
    if (openSimulator) router.push('/simulator');
    if (!hasPremiumAccess) {
      // P3-Enhancement: Zinsschmerz-Screen einmalig vor der Paywall zeigen
      if (!openSimulator) {
        const seenPain = await AsyncStorage.getItem('hasSeenInterestPainScreen');
        if (!seenPain) {
          router.push('/interest-pain');
          return;
        }
      }
      const seen = await AsyncStorage.getItem('hasSeenOnboardingPaywall');
      if (!seen) {
        await AsyncStorage.setItem('hasSeenOnboardingPaywall', 'true');
        setShowOnboardingPaywall(true);
        trackEvent('onboarding_paywall_shown');
      }
    }
  }, [hasPremiumAccess, router]);

  // Load trial day content and check for soft downgrade
  useEffect(() => {
    if (trialStartDate && isTrialActive()) {
      const day = getTrialDay();
      const content = TrialDayEngine.getDayContent(day);
      setTrialDayContent(content);
    } else {
      setTrialDayContent(null);
    }

    // Show SoftDowngrade if trial expired and not yet seen
    if (trialStartDate && hasTrialExpired() && !trialExpiredSeen) {
      setShowSoftDowngrade(true);
    }
  }, [trialStartDate, isTrialActive, getTrialDay, hasTrialExpired, trialExpiredSeen]);

  // Streak-Glow: Pulse animation für 7+ Tage Streak
  useEffect(() => {
    if (!isStreakGlowing) {
      glowPulse.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1000, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1000, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isStreakGlowing]);

  // Check for Fullscreen Moments on mount
  useEffect(() => {
    const today = new Date().toDateString();
    
    // Check for daily greeting (first visit of the day)
    if (lastDailyGreeting !== today) {
      const hour = new Date().getHours();
      let greetingText = 'Guten Morgen';
      if (hour >= 12 && hour < 18) greetingText = 'Guten Tag';
      else if (hour >= 18) greetingText = 'Guten Abend';
      
      setMomentType('greeting');
      setMomentData({
        title: `${greetingText}, ${userName || 'Freund'}!`,
        subtitle: `Streak: ${streakCount} Tage 🔥`,
        fixiSpeech: 'Schön, dass du da bist! Lass uns gemeinsam weitermachen!',
        newLevel: '',
      });
      setShowMoment(true);
      setLastDailyGreeting(today);
      return;
    }
    
    // Check for level up
    if (fixiLevel.level > lastShownLevel) {
      const levelInfo = FIXI_LEVELS.find(l => l.level === fixiLevel.level);
      setMomentType('levelup');
      setMomentData({
        title: 'Level Up! 🎉',
        subtitle: `Du hast ${percentText}% deiner Schulden getilgt!`,
        fixiSpeech: levelInfo?.accessoryLabel 
          ? `Wow! Ich hab jetzt ${levelInfo.accessoryLabel}! Du machst das großartig!`
          : 'Unglaublich! Du wirst immer stärker!',
        newLevel: `Level ${fixiLevel.level}: ${fixiLevel.name}`,
      });
      setShowMoment(true);
      setLastShownLevel(fixiLevel.level);
    }
  }, [fixiLevel.level, lastShownLevel, lastDailyGreeting, userName, streakCount, percentText, setLastShownLevel, setLastDailyGreeting]);

  const handleQuoteShown = useCallback((text: string) => {
    setRecentQuotes(prev => [...prev.slice(-9), text]);
  }, []);

  const handleFixiTap = useCallback(() => {
    const tip = RANDOM_TIPS[Math.floor(Math.random() * RANDOM_TIPS.length)];
    setFixiBubble(tip);
    // Reset after 4 seconds
    setTimeout(() => setFixiBubble(fixiMotivation.bubble), 4000);
  }, [fixiMotivation.bubble]);

  // Fix 5: Alle Quick-Actions auf einheitliche Primärfarbe Mint
  const quickActions = [
    { icon: 'add-circle', label: 'Zahlung eintragen', route: '/record-payment', color: Colors.brand.primary },
    { icon: 'trending-up', label: 'Simulator', route: '/simulator', color: Colors.brand.primary },
    { icon: 'chatbubbles', label: 'KI-Coach', route: '/ai-coach', color: Colors.brand.primary },
    { icon: 'stats-chart', label: 'Statistiken', route: '/(tabs)/stats', color: Colors.brand.primary },
  ];

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View testID="home-dashboard">
          {/* Trial Day Card - shown during active trial */}
          {trialDayContent && (
            <TrialDayCard
              content={trialDayContent}
              remainingDays={7 - getTrialDay() + 1}
            />
          )}

          {/* Greeting + Fixi */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text style={[styles.greeting, t.textPrimary]}>{greeting}</Text>
              <Text style={[styles.quote, t.textSecondary]}>{QUOTES[quoteIndex]}</Text>
            </View>
            <FoxMascot
              state={fixiMotivation.state}
              size="medium"
              speechBubble={fixiBubble}
              onPress={handleFixiTap}
              percentPaid={percentText}
              evolutionImage={getCurrentEvoFox(percentText)}
            />
          </View>

          {/* Progress Ring */}
          <View style={[styles.progressCard, t.bgCardGlass]}>
            <CircularProgress
              progress={progress}
              size={200}
              strokeWidth={14}
              bgColor={t.isDark ? 'rgba(255,255,255,0.06)' : t.colors.background.tertiary}
            >
              <Text style={[styles.progressPercent, t.textPrimary]}>{percentText}%</Text>
              <Text style={[styles.progressLabel, t.textSecondary]}>geschafft</Text>
            </CircularProgress>
            <View style={styles.progressInfo}>
              <View style={styles.progressRow}>
                <Text style={[styles.progressInfoLabel, t.textSecondary]}>Verbleibend</Text>
                <Text style={[styles.progressInfoValue, t.textPrimary]}>{formatCurrency(remaining)}</Text>
              </View>
              <View style={styles.progressRow}>
                <Text style={[styles.progressInfoLabel, t.textSecondary]}>Bereits getilgt</Text>
                <Text style={styles.progressInfoValueGreen}>{formatCurrency(paid)}</Text>
              </View>
            </View>
          </View>

          {/* Countdown – P3: Dominant, Syne Font, Glow */}
          <View style={[
            styles.countdownCard,
            t.bgCardGlass,
          ]}>
            <Text style={[styles.countdownLabel, t.textSecondary]}>Schuldenfreiheit in:</Text>
            <View style={styles.countdownRow}>
              <View style={styles.countdownUnit}>
                <Text style={[styles.countdownNum, t.textPrimary]}>{years}</Text>
                <Text style={[styles.countdownUnitLabel, t.textSecondary]}>Jahre</Text>
              </View>
              <Text style={[styles.countdownDot, t.textTertiary]}>·</Text>
              <View style={styles.countdownUnit}>
                <Text style={[styles.countdownNum, t.textPrimary]}>{months}</Text>
                <Text style={[styles.countdownUnitLabel, t.textSecondary]}>Monate</Text>
              </View>
            </View>
            {/* P3: Dominant freedom date with glow */}
            <View style={styles.freedomDateWrap}>
              <Text style={[styles.freedomDateDominant, {
                color: Colors.brand.primary,
                textShadowColor: isDark ? Colors.brand.primary + '60' : 'transparent',
                textShadowRadius: isDark ? 12 : 0,
              }]}>
                {formatDateDE(freedomDate)}
              </Text>
              <Text style={[styles.freedomDateCaption, t.textTertiary]}>Dein Schuldenfreiheitstag</Text>
            </View>
            {/* P3: Gold savings metric */}
            {simCurrentInterest > 0 && (
              <View style={[styles.goldMetricRow, { backgroundColor: isDark ? 'rgba(255,184,0,0.12)' : 'rgba(229,165,0,0.10)', borderColor: isDark ? '#FFB800' + '30' : '#E5A500' + '40' }]}>
                <Ionicons name="trending-up" size={14} color={isDark ? '#FFB800' : '#E5A500'} />
                <Text style={[styles.goldMetricText, { color: isDark ? '#FFB800' : '#E5A500' }]}>
                  Mit Fixi sparst du {formatCurrency(simCurrentInterest)} Zinsen
                </Text>
              </View>
            )}
            <TouchableOpacity testID="faster-btn" onPress={() => router.push('/simulator')} style={styles.fasterBtn}>
              <Text style={styles.fasterText}>{'Schneller werden? \u2192'}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={styles.quickContent}>
            {quickActions.map((a, i) => (
              <TouchableOpacity
                key={i}
                testID={`quick-action-${i}`}
                style={[styles.quickCard, t.bgCardGlass]}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickIcon, { backgroundColor: a.color + '20' }]}>
                  <Ionicons name={a.icon as any} size={24} color={a.color} />
                </View>
                <Text
                  style={[styles.quickLabel, t.textSecondary]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Streak – mit Glow-Ring ab 7+ Tagen */}
          <View style={styles.streakWrapper}>
            {isStreakGlowing && (
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: BorderRadius.lg,
                    opacity: glowOpacity,
                    ...Platform.select({
                      web: { boxShadow: `0 0 ${isStreakLegendary ? 20 : 12}px ${goldColor}` } as any,
                    }),
                  },
                ]}
              />
            )}
            <View style={[styles.streakCard, t.bgCardGlass, isStreakGlowing && { borderColor: goldColor, borderWidth: isStreakLegendary ? 2 : 1.5 }]}>
              <View style={styles.streakHeader}>
                <Text style={styles.streakEmoji}>{'🔥'}</Text>
                <Text style={[styles.streakCount, t.textPrimary]}>{streakCount} Tage in Folge aktiv!</Text>
                {isStreakLegendary && (
                  <Text style={{ fontSize: 11, color: goldColor, fontWeight: '700', marginLeft: 6, letterSpacing: 0.5 }}>LEGENDE</Text>
                )}
              </View>
              <View style={styles.streakDots}>
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={[styles.streakDot, { backgroundColor: t.colors.background.tertiary }, i < Math.min(streakCount, 7) && styles.streakDotActive]} />
                ))}
              </View>
              <Text style={[styles.streakHint, t.textSecondary]}>
                Bleib dran! Noch {7 - Math.min(streakCount % 7, 6)} Tage bis zum n{'ä'}chsten Meilenstein
              </Text>
            </View>
          </View>

          {/* Weekly Digest CTA */}
          {hasPremiumAccess ? (
            <TouchableOpacity
              style={[styles.digestCta, t.bgCard]}
              onPress={() => router.push('/weekly-digest')}
              testID="dashboard-weekly-digest-btn"
              activeOpacity={0.8}
            >
              <View style={styles.digestIcon}>
                <Ionicons name="calendar" size={18} color={Colors.brand.primary} />
              </View>
              <Text style={[styles.digestText, t.textPrimary]}>Wochen-Rückblick ansehen</Text>
              <Ionicons name="chevron-forward" size={16} color={t.colors.text.tertiary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/paywall')}
              testID="dashboard-weekly-digest-locked"
              activeOpacity={0.8}
              style={{ marginBottom: 16 }}
            >
              <View style={[{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.glass.stroke,
                overflow: 'hidden',
              }, t.bgCard]}>
                {/* Content - dimmed */}
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, opacity: 0.3 }}>
                  <View style={styles.digestIcon}>
                    <Ionicons name="calendar" size={18} color={t.colors.text.tertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.digestText, t.textPrimary]}>Wochenrückblick</Text>
                    <Text style={{ fontSize: 12, color: t.colors.text.tertiary, marginTop: 2 }}>Dein wöchentlicher Fortschrittsbericht</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={t.colors.text.tertiary} />
                </View>
                {/* Lock badge - overlaps content via negative margin */}
                <View style={{
                  alignItems: 'center',
                  marginTop: -36,
                  marginBottom: 10,
                  zIndex: 10,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#00D4AA',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}>
                    <Ionicons name="lock-closed" size={14} color="#0A0E1A" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0A0E1A' }}>Premium freischalten</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Fixi Daily Card */}
          <FixiDailyCard
            recentQuotes={recentQuotes}
            onQuoteShown={handleQuoteShown}
          />

          {/* Fixi Level */}
          <View style={[styles.levelCard, t.bgCardGlass]}>
            <View style={styles.levelHeader}>
              <FoxMascot
                state={fixiMotivation.state}
                size="small"
                showSpeechBubble={false}
                percentPaid={percentText}
                evolutionImage={getCurrentEvoFox(percentText)}
              />
              <View>
                <Text style={[styles.levelName, t.textPrimary]}>Fixi Level {fixiLevel.level}: {fixiLevel.name}</Text>
                <Text style={[styles.levelProgress, t.textSecondary]}>{percentText}% getilgt</Text>
              </View>
            </View>
            <View style={[styles.levelBar, t.bgTertiary]}>
              <AnimatedProgressBar progress={percentText} height={8} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Moment */}
      <FixiFullscreenMoment
        visible={showMoment}
        type={momentType}
        title={momentData.title}
        subtitle={momentData.subtitle}
        fixiState={momentType === 'levelup' ? 'celebrating' : momentType === 'greeting' ? 'welcome' : 'proud'}
        fixiSpeech={momentData.fixiSpeech}
        newLevel={momentData.newLevel}
        onDismiss={() => setShowMoment(false)}
      />

      {/* Soft Downgrade Modal - shown when trial expires */}
      <SoftDowngrade
        visible={showSoftDowngrade}
        onDismiss={() => {
          setShowSoftDowngrade(false);
          markTrialExpiredSeen();
        }}
      />

      {/* P1.3 – Simulator Bottom Sheet (Redesigned P1.5) */}
      <Modal
        visible={showSimulatorSheet}
        transparent
        animationType="slide"
        testID="simulator-bottom-sheet"
        onRequestClose={() => handleSimulatorSheetDismiss(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => handleSimulatorSheetDismiss(false)}
        />
        <View style={[styles.sheetContainer, { backgroundColor: t.colors.background.secondary }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetEmoji}>💡</Text>
          <Text style={[styles.sheetTitle, t.textPrimary]}>
            {userName ? `${userName}, was` : 'Was'} wäre wenn du 50€ mehr zahlst?
          </Text>

          {/* Two-column comparison */}
          <View style={styles.sheetCompare}>
            <View style={[styles.sheetCompareCol, { borderColor: t.colors.glass.stroke }]}>
              <Text style={[styles.sheetCompareHeader, t.textSecondary]}>Ohne Extra</Text>
              <Text style={[styles.sheetCompareDate, t.textPrimary]}>
                {formatDateDE(calculateFreedomDate(remaining, weightedRate, monthlyPayment))}
              </Text>
              <Text style={[styles.sheetCompareInterest, t.textTertiary]}>
                Zinsen: {formatCurrency(simCurrentInterest)}
              </Text>
            </View>
            <View style={[styles.sheetCompareSep, { backgroundColor: t.colors.glass.stroke }]} />
            <View style={[styles.sheetCompareCol, { borderColor: Colors.brand.primary + '60' }]}>
              <Text style={[styles.sheetCompareHeader, { color: Colors.brand.primary }]}>Mit +50€/Monat</Text>
              <Text style={[styles.sheetCompareDate, { color: Colors.brand.primary }]}>
                {formatDateDE(calculateFreedomDate(remaining, weightedRate, monthlyPayment + 50))}
              </Text>
              <Text style={[styles.sheetCompareInterest, t.textTertiary]}>
                Zinsen: {formatCurrency(simFasterInterest)}
              </Text>
            </View>
          </View>

          {/* Animated Counter – Gold */}
          <Animated.View style={[styles.sheetSavedWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={[styles.sheetSavedGold, { color: isDark ? '#FFB800' : '#0D1526' }]}>
              Du sparst {formatCurrency(counterDisplay)} und {simSavedMonths} Monate
            </Text>
          </Animated.View>

          {/* Dave Ramsey Reference */}
          <Text style={[styles.sheetDaveRef, { color: isDark ? Colors.text.tertiary : '#8A96A8' }]}>
            Basierend auf der wissenschaftlich belegten Schneeball-Methode
          </Text>

          <TouchableOpacity
            testID="open-simulator-btn"
            onPress={() => handleSimulatorSheetDismiss(true)}
            activeOpacity={0.8}
            style={{ marginTop: 16, width: '100%' }}
          >
            <LinearGradient
              colors={[Colors.brand.primary, Colors.brand.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheetPrimaryBtn}
            >
              <Text style={styles.sheetPrimaryBtnText}>Simulator öffnen</Text>
              <Ionicons name="trending-up" size={18} color="#0A0E1A" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity testID="simulator-sheet-dismiss" onPress={() => handleSimulatorSheetDismiss(false)} style={styles.sheetDismissBtn}>
            <Text style={[styles.sheetDismissText, t.textTertiary]}>Vielleicht später</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* P1.4 – Onboarding Trial Paywall */}
      <Modal
        visible={showOnboardingPaywall}
        transparent
        animationType="slide"
        testID="onboarding-paywall"
        onRequestClose={() => setShowOnboardingPaywall(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowOnboardingPaywall(false)}
        />
        <View style={[styles.sheetContainer, { backgroundColor: t.colors.background.secondary }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.paywallTitle, t.textPrimary]}>Hol das Maximum aus deinem Plan</Text>
          <Text style={[styles.paywallSubtext, t.textSecondary]}>
            Unbegrenzter KI-Coach · Alle Strategien · Monatliche Reports
          </Text>
          <TouchableOpacity
            testID="onboarding-paywall-trial-btn"
            onPress={() => {
              setShowOnboardingPaywall(false);
              trackEvent('onboarding_paywall_trial_clicked');
              router.push('/paywall');
            }}
            activeOpacity={0.8}
            style={{ marginTop: 20, width: '100%' }}
          >
            <LinearGradient
              colors={[Colors.brand.primary, Colors.brand.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheetPrimaryBtn}
            >
              <Text style={styles.sheetPrimaryBtnText}>7 Tage kostenlos testen</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            testID="onboarding-paywall-dismiss"
            onPress={() => {
              setShowOnboardingPaywall(false);
              trackEvent('onboarding_paywall_dismissed');
            }}
            style={styles.sheetDismissBtn}
          >
            <Text style={[styles.sheetDismissText, t.textTertiary]}>Später</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16, marginBottom: 16 },
  greetingText: { flex: 1, marginRight: 8 },
  greeting: { fontSize: 28, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Nunito_900Black' },
  quote: { fontSize: 14, color: Colors.text.secondary, marginTop: 4 },
  progressCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    marginBottom: 16,
  },
  progressPercent: { fontSize: 42, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Nunito_900Black' },
  progressLabel: { fontSize: 14, color: Colors.text.secondary },
  progressInfo: { width: '100%', marginTop: 20, gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressInfoLabel: { fontSize: 15, color: Colors.text.secondary },
  progressInfoValue: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  progressInfoValueGreen: { fontSize: 15, fontWeight: '600', color: Colors.brand.primary },
  countdownCard: {
    borderRadius: BorderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownLabel: { fontSize: 11, color: Colors.text.secondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  countdownUnit: { alignItems: 'center' },
  countdownNum: { fontSize: 44, fontWeight: '700', color: Colors.text.primary, lineHeight: 52, fontFamily: 'Nunito_900Black' },
  countdownUnitLabel: { fontSize: 12, color: Colors.text.secondary },
  countdownDot: { fontSize: 28, color: Colors.text.tertiary },
  // P3: Dominant freedom date
  freedomDateWrap: { alignItems: 'center', marginVertical: 10 },
  freedomDateDominant: {
    fontSize: 26,
    fontFamily: 'Nunito_900Black',
    color: Colors.brand.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  freedomDateCaption: { fontSize: 11, color: Colors.text.tertiary, marginTop: 3 },
  // P3: Gold metric
  goldMetricRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, marginBottom: 2,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
    alignSelf: 'center',
  },
  goldMetricText: { fontSize: 12, fontWeight: '600' },
  countdownDate: { fontSize: 14, color: Colors.text.secondary, marginTop: 12 },
  fasterBtn: { marginTop: 12 },
  fasterText: { fontSize: 15, fontWeight: '600', color: Colors.brand.primary },
  quickScroll: { marginBottom: 16 },
  quickContent: { gap: 8, paddingVertical: 4, paddingHorizontal: 16 },
  quickCard: {
    width: 88,
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, color: Colors.text.secondary, textAlign: 'center', width: '100%' },
  streakWrapper: { position: 'relative', marginBottom: 16 },
  streakCard: {
    borderRadius: BorderRadius.lg,
    padding: 20,
    borderWidth: 1,
  },
  streakHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  streakEmoji: { fontSize: 24 },
  streakCount: { fontSize: 17, fontWeight: '600', color: Colors.text.primary },
  streakDots: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  streakDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.tertiary,
  },
  streakDotActive: { backgroundColor: Colors.brand.primary },
  streakHint: { fontSize: 13, color: Colors.text.tertiary },
  digestCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    marginBottom: 16,
  },
  digestIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.brand.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  digestText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  digestCtaLocked: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  digestLockedContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
  },
  digestLockedHint: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  digestOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 10,
  },
  digestOverlayBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.brand.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  digestPremiumText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FEFEFF',
  },
  levelCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    marginBottom: 16,
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  levelName: { fontSize: 17, fontWeight: '600', color: Colors.text.primary },
  levelProgress: { fontSize: 13, color: Colors.text.secondary },
  levelBar: {
    height: 8,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelBarFill: { height: '100%', backgroundColor: Colors.brand.primary, borderRadius: 4 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetContainer: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: Colors.background.tertiary,
    borderRadius: 2, marginBottom: 20,
  },
  sheetEmoji: { fontSize: 36, marginBottom: 12 },
  sheetTitle: {
    fontSize: 20, fontWeight: '700', color: Colors.text.primary,
    textAlign: 'center', marginBottom: 16, lineHeight: 28,
  },
  // Two-column comparison
  sheetCompare: {
    flexDirection: 'row', width: '100%', marginBottom: 16,
    borderRadius: 12, overflow: 'hidden',
  },
  sheetCompareCol: {
    flex: 1, alignItems: 'center', padding: 14,
    borderWidth: 1.5, borderRadius: 12,
  },
  sheetCompareHeader: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  sheetCompareDate: { fontSize: 14, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  sheetCompareInterest: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center' },
  sheetCompareSep: { width: 1, backgroundColor: Colors.glass.stroke, marginVertical: 8, marginHorizontal: 6 },
  // Gold animated counter
  sheetSavedWrap: { marginVertical: 8 },
  sheetSavedGold: {
    fontSize: 20, fontWeight: '800', color: '#FFB800',
    textAlign: 'center', letterSpacing: -0.3,
  },
  sheetDaveRef: {
    fontSize: 11, color: Colors.text.tertiary,
    textAlign: 'center', marginBottom: 4, lineHeight: 16,
  },
  // Legacy (no longer used but kept for safety)
  sheetCalcBox: {
    width: '100%', borderRadius: 12, padding: 16,
  },
  sheetCalcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetCalcLabel: { fontSize: 14, color: Colors.text.secondary },
  sheetCalcValue: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  sheetCalcDivider: { height: 1, backgroundColor: Colors.glass.stroke, marginVertical: 8 },
  sheetSaved: {
    fontSize: 18, fontWeight: '700', color: Colors.brand.primary,
    textAlign: 'center', marginTop: 4,
  },
  sheetPrimaryBtn: {
    height: 54, borderRadius: 30, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  sheetPrimaryBtnText: { fontSize: 16, fontWeight: '700', color: '#0A0E1A' },
  sheetDismissBtn: { paddingVertical: 16 },
  sheetDismissText: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center' },
  paywallTitle: {
    fontSize: 22, fontWeight: '700', color: Colors.text.primary,
    textAlign: 'center', marginBottom: 8, marginTop: 8,
  },
  paywallSubtext: {
    fontSize: 14, color: Colors.text.secondary,
    textAlign: 'center', lineHeight: 20, marginBottom: 8,
  },
});
