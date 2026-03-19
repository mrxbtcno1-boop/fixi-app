import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import {
  formatCurrency, calculateFreedomDate, formatDateDE,
  monthsToPayoff, monthsToYearsMonths, totalInterestPaid,
  simulatePayoff, calculateSavings,
  type DebtInput,
} from '../src/utils/calculations';
import { FoxMascot } from '../src/components/FoxMascot';
import type { FixiState } from '../src/components/Fixi/FixiStates';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { trackEvent } from '../src/services/supabase';
import { useThemeOverrides } from '../src/contexts/ThemeContext';

type ScenarioType = 'extra' | 'bonus' | 'sidejob' | 'reduce' | null;

const EXPENSE_CHIPS = [
  { label: 'Netflix', amount: 13 },
  { label: 'Gym', amount: 30 },
  { label: 'Essen bestellen', amount: 80 },
  { label: 'Streaming+', amount: 25 },
  { label: 'Coffee to go', amount: 60 },
];

function getFixiStateForExtra(amount: number): { state: FixiState; bubble: string } {
  if (amount === 0) return { state: 'thinking', bubble: 'Hmm, was wäre wenn...' };
  if (amount <= 100) return { state: 'motivated', bubble: 'Schon ein Unterschied!' };
  if (amount <= 300) return { state: 'excited', bubble: 'WOW! Das macht richtig was aus!' };
  return { state: 'celebrating', bubble: 'DU BIST EINE MASCHINE!' };
}

function calcMonthsWithInterest(principal: number, annualRate: number, monthly: number): number {
  if (monthly <= 0 || principal <= 0) return 9999;
  if (annualRate <= 0) return Math.ceil(principal / monthly);
  const r = annualRate / 100 / 12;
  const interest = principal * r;
  if (monthly <= interest) return 9999;
  return Math.ceil(-Math.log(1 - (principal * r) / monthly) / Math.log(1 + r));
}

function calcTotalInterest(principal: number, annualRate: number, monthly: number): number {
  const months = calcMonthsWithInterest(principal, annualRate, monthly);
  if (months >= 9999) return 0;
  return Math.max(0, (months * monthly) - principal);
}

export default function SimulatorScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const debts = useAppStore((s) => s.debts);
  const method = useAppStore((s) => s.method);
  const isPremium = useAppStore((s) => s.isPremium);
  const isTrialActive = useAppStore((s) => s.isTrialActive);
  const addBadge = useAppStore((s) => s.addBadge);
  const onboardingTotalDebt = useAppStore((s) => s.onboardingTotalDebt);
  const onboardingMonthlyPayment = useAppStore((s) => s.onboardingMonthlyPayment);

  const hasPremiumAccess = isPremium || isTrialActive();

  const remaining = debts.length > 0
    ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
  const currentMonthly = debts.length > 0
    ? debts.reduce((s, d) => s + d.monthlyPayment, 0) : onboardingMonthlyPayment;
  const weightedRate = debts.length > 0
    ? debts.reduce((s, d) => s + d.interestRate * d.remainingAmount, 0) / (remaining || 1) : 0;

  // Main state
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('extra');
  const [extraMonthly, setExtraMonthly] = useState(150);
  const [bonusAmount, setBonusAmount] = useState(1000);
  const [sidejobAmount, setSidejobAmount] = useState(300);
  const [reduceAmount, setReduceAmount] = useState(0);
  const [customReduceText, setCustomReduceText] = useState('');
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());

  // Free-user blur state
  const [showBlur, setShowBlur] = useState(false);
  const blurAnim = useRef(new Animated.Value(0)).current;

  // Badge for simulator usage
  useEffect(() => {
    trackEvent('simulator_used');
    addBadge('simulator_used');
  }, []);

  // Free user blur after 2 seconds
  useEffect(() => {
    if (!hasPremiumAccess) {
      const timer = setTimeout(() => {
        setShowBlur(true);
        Animated.timing(blurAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }).start();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasPremiumAccess]);

  // Calculations using real simulation
  const debtInputs: DebtInput[] = useMemo(() => {
    if (debts.length > 0) {
      return debts.map(d => ({
        id: d.id,
        name: d.name,
        remainingAmount: d.remainingAmount,
        monthlyPayment: d.monthlyPayment,
        interestRate: d.interestRate,
      }));
    }
    // Fallback: use onboarding data as a single debt
    return [{
      id: 'onboarding',
      name: 'Schulden',
      remainingAmount: onboardingTotalDebt,
      monthlyPayment: onboardingMonthlyPayment,
      interestRate: 0,
    }];
  }, [debts, onboardingTotalDebt, onboardingMonthlyPayment]);

  const calc = useMemo(() => {
    let extraMo = 0;
    let extraOnce = 0;

    if (activeScenario === 'extra') extraMo = extraMonthly;
    else if (activeScenario === 'sidejob') extraMo = sidejobAmount;
    else if (activeScenario === 'bonus') extraOnce = bonusAmount;
    else if (activeScenario === 'reduce') extraMo = reduceAmount + (parseInt(customReduceText) || 0);

    const savings = calculateSavings(debtInputs, currentMonthly, method as 'snowball' | 'avalanche', extraMo, extraOnce);

    const currentYM = monthsToYearsMonths(savings.monthsWithout);
    const newYM = monthsToYearsMonths(savings.monthsWith);

    let extraLabel = '';
    if (activeScenario === 'extra' || activeScenario === 'sidejob') {
      extraLabel = `${extraMo}€/Monat extra`;
    } else if (activeScenario === 'bonus') {
      extraLabel = `${formatCurrency(bonusAmount)} Einmalzahlung`;
    } else if (activeScenario === 'reduce') {
      extraLabel = `${extraMo}€/Monat einsparen`;
    }

    return {
      currentMonths: savings.monthsWithout,
      currentInterest: savings.interestWithout,
      currentDate: savings.freedomDateWithout,
      currentYM,
      newMonths: savings.monthsWith,
      newInterest: savings.interestWith,
      newDate: savings.freedomDateWith,
      newYM,
      savedMonths: savings.savedMonths,
      savedInterest: savings.savedInterest,
      extraLabel,
      resultText: '',
    };
  }, [activeScenario, extraMonthly, bonusAmount, sidejobAmount, reduceAmount, customReduceText, debtInputs, currentMonthly, method]);

  const fixiState = useMemo(() => {
    if (activeScenario === 'extra') return getFixiStateForExtra(extraMonthly);
    if (activeScenario === 'bonus') return getFixiStateForExtra(bonusAmount / 10);
    if (activeScenario === 'sidejob') return getFixiStateForExtra(sidejobAmount);
    if (activeScenario === 'reduce') return getFixiStateForExtra(reduceAmount);
    return { state: 'thinking' as FixiState, bubble: 'Wähle ein Szenario...' };
  }, [activeScenario, extraMonthly, bonusAmount, sidejobAmount, reduceAmount]);

  const toggleChip = useCallback((label: string, amount: number) => {
    setSelectedChips(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
        setReduceAmount(a => a - amount);
      } else {
        next.add(label);
        setReduceAmount(a => a + amount);
      }
      return next;
    });
  }, []);

  const switchScenario = useCallback((s: ScenarioType) => {
    setActiveScenario(s);
    setSelectedChips(new Set());
    setReduceAmount(0);
    setCustomReduceText('');
  }, []);

  const blurOpacity = blurAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="close-simulator" onPress={() => router.back()} style={[styles.closeBtn, t.bgCard]}>
            <Ionicons name="close" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, t.textPrimary]}>{'\uD83D\uDD2E'} Was wäre wenn...</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Fixi */}
        <View style={styles.fixiRow}>
          <FoxMascot state={fixiState.state} size="medium" speechBubble={fixiState.bubble} />
        </View>

        {/* Scenario Tabs */}
        <View style={styles.scenarioTabs} data-testid="scenario-tabs">
          {[
            { key: 'extra' as ScenarioType, icon: '💰', label: 'Extra-Zahlung' },
            { key: 'bonus' as ScenarioType, icon: '\uD83C\uDF81', label: 'Bonus' },
            { key: 'sidejob' as ScenarioType, icon: '\uD83D\uDCBC', label: 'Nebenjob' },
            { key: 'reduce' as ScenarioType, icon: '\u2702\uFE0F', label: 'Einsparen' },
          ].map(s => (
            <TouchableOpacity
              key={s.key}
              testID={`scenario-${s.key}`}
              style={[styles.scenarioTab, t.bgCard, activeScenario === s.key && styles.scenarioTabActive]}
              onPress={() => switchScenario(s.key)}
            >
              <Text style={styles.scenarioTabIcon}>{s.icon}</Text>
              <Text style={[styles.scenarioTabText, activeScenario === s.key && styles.scenarioTabTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scenario Content */}
        <View style={[styles.sliderCard, t.bgCard]}>
          {activeScenario === 'extra' && (
            <>
              <Text style={[styles.sliderTitle, t.textSecondary]}>Wenn du monatlich extra zahlst:</Text>
              <View style={styles.sliderValueRow}>
                <Text style={styles.sliderValueBig}>{extraMonthly} €</Text>
                <Text style={[styles.sliderValueSub, t.textTertiary]}>/ Monat</Text>
              </View>
              <Slider
                testID="extra-slider"
                style={styles.slider}
                minimumValue={0}
                maximumValue={500}
                step={10}
                value={extraMonthly}
                onValueChange={setExtraMonthly}
                minimumTrackTintColor={Colors.brand.primary}
                maximumTrackTintColor={Colors.background.tertiary}
                thumbTintColor={Colors.brand.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabelText, t.textTertiary]}>0 €</Text>
                <Text style={[styles.sliderLabelText, t.textTertiary]}>500 €</Text>
              </View>
            </>
          )}

          {activeScenario === 'bonus' && (
            <>
              <Text style={[styles.sliderTitle, t.textSecondary]}>Wenn du eine Einmal-Zahlung machst:</Text>
              <View style={styles.sliderValueRow}>
                <Text style={styles.sliderValueBig}>{formatCurrency(bonusAmount)}</Text>
                <Text style={[styles.sliderValueSub, t.textTertiary]}>einmalig</Text>
              </View>
              <Slider
                testID="bonus-slider"
                style={styles.slider}
                minimumValue={100}
                maximumValue={10000}
                step={100}
                value={bonusAmount}
                onValueChange={setBonusAmount}
                minimumTrackTintColor={Colors.brand.secondary}
                maximumTrackTintColor={Colors.background.tertiary}
                thumbTintColor={Colors.brand.secondary}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabelText, t.textTertiary]}>100 €</Text>
                <Text style={[styles.sliderLabelText, t.textTertiary]}>10.000 €</Text>
              </View>
            </>
          )}

          {activeScenario === 'sidejob' && (
            <>
              <Text style={[styles.sliderTitle, t.textSecondary]}>Wenn du monatlich extra verdienst:</Text>
              <View style={styles.sliderValueRow}>
                <Text style={styles.sliderValueBig}>{sidejobAmount} €</Text>
                <Text style={[styles.sliderValueSub, t.textTertiary]}>/ Monat</Text>
              </View>
              <Slider
                testID="sidejob-slider"
                style={styles.slider}
                minimumValue={100}
                maximumValue={2000}
                step={50}
                value={sidejobAmount}
                onValueChange={setSidejobAmount}
                minimumTrackTintColor={Colors.functional.warning}
                maximumTrackTintColor={Colors.background.tertiary}
                thumbTintColor={Colors.functional.warning}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabelText, t.textTertiary]}>100 €</Text>
                <Text style={[styles.sliderLabelText, t.textTertiary]}>2.000 €</Text>
              </View>
            </>
          )}

          {activeScenario === 'reduce' && (
            <>
              <Text style={[styles.sliderTitle, t.textSecondary]}>Wenn du monatlich einsparst:</Text>
              <View style={styles.chipRow}>
                {EXPENSE_CHIPS.map(chip => (
                  <TouchableOpacity
                    key={chip.label}
                    testID={`chip-${chip.label.toLowerCase().replace(/\s/g, '-')}`}
                    style={[styles.chip, t.bgTertiary, selectedChips.has(chip.label) && styles.chipActive]}
                    onPress={() => toggleChip(chip.label, chip.amount)}
                  >
                    <Text style={[styles.chipText, selectedChips.has(chip.label) && styles.chipTextActive]}>
                      {chip.label} {chip.amount}€
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.customReduceRow}>
                <Text style={[styles.customReduceLabel, t.textSecondary]}>Custom:</Text>
                <TextInput
                  testID="custom-reduce-input"
                  style={[styles.customReduceInput, { backgroundColor: t.colors.background.tertiary, color: t.colors.text.primary, borderColor: t.colors.glass.stroke }]}
                  value={customReduceText}
                  onChangeText={setCustomReduceText}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.text.tertiary}
                />
                <Text style={[styles.customReduceLabel, t.textSecondary]}>€/Mon.</Text>
              </View>
              <View style={styles.sliderValueRow}>
                <Text style={styles.sliderValueBig}>
                  {reduceAmount + (parseInt(customReduceText) || 0)} €
                </Text>
                <Text style={[styles.sliderValueSub, t.textTertiary]}>Ersparnis / Monat</Text>
              </View>
            </>
          )}
        </View>

        {/* Results Section - with blur for free users */}
        <View style={styles.resultsWrapper}>
          {/* Highlight Card */}
          {calc.savedMonths > 0 && (
            <LinearGradient
              colors={[Colors.brand.primary, Colors.brand.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.highlightGradientBorder}
            >
              <View style={[styles.highlightInner, t.bgCard]} data-testid="highlight-result">
                <Text style={styles.highlightEmoji}>{'🎉'}</Text>
                <Text style={[styles.highlightTitle, t.textPrimary]}>
                  {calc.savedMonths} MONATE FRÜHER FREI!
                </Text>
                {calc.savedInterest > 0 && (
                  <Text style={styles.highlightSubtitle}>
                    {'💰'} Du sparst {formatCurrency(calc.savedInterest)} Zinsen
                  </Text>
                )}
                {calc.resultText ? (
                  <Text style={[styles.highlightExtra, t.textSecondary]}>{calc.resultText}</Text>
                ) : null}
              </View>
            </LinearGradient>
          )}

          {/* Date Comparison */}
          <View style={[styles.dateCard, t.bgCard]}>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateIcon}>{'\uD83D\uDCC5'}</Text>
                <Text style={[styles.dateLabel, t.textSecondary]}>Aktuell schuldenfrei:</Text>
                <Text style={[styles.dateValue, t.textPrimary]}>{formatDateDE(calc.currentDate)}</Text>
              </View>
            </View>
            <View style={[styles.dateRow, { marginTop: 12 }]}>
              <View style={styles.dateCol}>
                <Text style={styles.dateIcon}>{'\u26A1'}</Text>
                <Text style={[styles.dateLabel, { color: Colors.brand.primary }]}>
                  Mit {calc.extraLabel || 'Optimierung'}:
                </Text>
                <Text style={[styles.dateValue, { color: Colors.brand.primary }]}>
                  {formatDateDE(calc.newDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Visual Comparison Bars */}
          <View style={[styles.compCard, t.bgCard]} data-testid="visual-comparison">
            <Text style={[styles.compTitle, t.textPrimary]}>Visueller Vergleich</Text>
            <View style={styles.compItem}>
              <Text style={[styles.compLabel, t.textSecondary]}>Aktuell:</Text>
              <View style={styles.compBarContainer}>
                <View style={[styles.compBarFill, { width: '100%', backgroundColor: '#FF6B6B' }]} />
              </View>
              <Text style={[styles.compBarLabel, t.textSecondary]}>
                {calc.currentYM.years > 0 ? `${calc.currentYM.years}J ${calc.currentYM.months}M` : `${calc.currentYM.months}M`}
              </Text>
            </View>
            <View style={styles.compItem}>
              <Text style={[styles.compLabel, { color: Colors.brand.primary }]}>Optimiert:</Text>
              <View style={styles.compBarContainer}>
                <LinearGradient
                  colors={[Colors.brand.primary, Colors.brand.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.compBarFill, {
                    width: `${calc.currentMonths > 0 ? Math.max(15, (calc.newMonths / calc.currentMonths) * 100) : 100}%`,
                  }]}
                />
              </View>
              <Text style={[styles.compBarLabel, { color: Colors.brand.primary }]}>
                {calc.newYM.years > 0 ? `${calc.newYM.years}J ${calc.newYM.months}M` : `${calc.newYM.months}M`}
              </Text>
            </View>
          </View>

          {/* Free-user blur overlay */}
          {!hasPremiumAccess && showBlur && (
            <Animated.View style={[styles.blurOverlay, { opacity: blurOpacity }]} pointerEvents="box-none">
              <BlurView intensity={25} tint={t.isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
              <View style={styles.blurContent}>
                <FoxMascot state="sad" size="small" speechBubble="Das Ergebnis ist krass... aber ich darf es dir nur mit Premium zeigen" />
                <TouchableOpacity
                  testID="simulator-premium-cta"
                  style={styles.premiumCta}
                  onPress={() => router.push('/paywall')}
                >
                  <LinearGradient
                    colors={[Colors.brand.primary, Colors.brand.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.premiumCtaInner}
                  >
                    <Text style={styles.premiumCtaText}>
                      {'\uD83D\uDD13'} Premium freischalten
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background.secondary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  fixiRow: { alignItems: 'center', marginBottom: 16 },

  // Scenario Tabs
  scenarioTabs: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  scenarioTab: {
    flex: 1,
    minWidth: 75,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    alignItems: 'center',
  },
  scenarioTabActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primaryDim },
  scenarioTabIcon: { fontSize: 18, marginBottom: 2 },
  scenarioTabText: { fontSize: 10, color: Colors.text.tertiary, textAlign: 'center' },
  scenarioTabTextActive: { color: Colors.brand.primary, fontWeight: '600' },

  // Slider Card
  sliderCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  sliderTitle: { fontSize: 15, color: Colors.text.secondary, marginBottom: 12 },
  sliderValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  sliderValueBig: { fontSize: 32, fontWeight: '800', color: Colors.brand.primary },
  sliderValueSub: { fontSize: 14, color: Colors.text.tertiary },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabelText: { fontSize: 12, color: Colors.text.tertiary },

  // Chips for reduce scenario
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  chipActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primaryDim },
  chipText: { fontSize: 13, color: Colors.text.secondary },
  chipTextActive: { color: Colors.brand.primary, fontWeight: '600' },
  customReduceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  customReduceLabel: { fontSize: 14, color: Colors.text.secondary },
  customReduceInput: {
    width: 80,
    height: 40,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },

  // Results
  resultsWrapper: { position: 'relative' },
  highlightGradientBorder: {
    borderRadius: BorderRadius.lg + 2,
    padding: 2,
    marginBottom: 16,
  },
  highlightInner: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: 'center',
  },
  highlightEmoji: { fontSize: 36, marginBottom: 8 },
  highlightTitle: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, textAlign: 'center' },
  highlightSubtitle: { fontSize: 16, color: Colors.brand.primary, fontWeight: '600', marginTop: 8 },
  highlightExtra: { fontSize: 14, color: Colors.text.secondary, marginTop: 6 },

  // Date Comparison
  dateCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateCol: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dateIcon: { fontSize: 18 },
  dateLabel: { fontSize: 14, color: Colors.text.secondary, flex: 1 },
  dateValue: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },

  // Visual Comparison
  compCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  compTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 16 },
  compItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  compLabel: { fontSize: 13, color: Colors.text.secondary, width: 65 },
  compBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  compBarFill: { height: '100%', borderRadius: 6 },
  compBarLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.secondary, width: 55, textAlign: 'right' },

  // Free-user blur overlay
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    overflow: 'hidden',
  },
  blurContent: { alignItems: 'center', gap: 16 },
  premiumCta: { width: '100%', marginTop: 8 },
  premiumCtaInner: {
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCtaText: { fontSize: 16, fontWeight: '700', color: Colors.text.inverse },
});
