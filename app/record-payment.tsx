import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import { useTheme, useThemeOverrides } from '../src/contexts/ThemeContext';
import { FoxMascot } from '../src/components/FoxMascot';
import { formatCurrency } from '../src/utils/calculations';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { trackEvent } from '../src/services/supabase';
import { checkAndTriggerMilestone } from '../src/services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';

const CONFETTI_COLORS = ['#00D4AA', '#FFB800', '#5B9CF6', '#FF6B6B', '#FFFFFF'];
const MILESTONES = [25, 50, 75, 100];

const ICON_MAP: Record<string, string> = {
  card: '💳', bank: '🏦', car: '🚗', person: '👤', shopping: '🛍️', document: '📋',
};

type Step = 'select' | 'amount' | 'done';

export default function RecordPaymentScreen() {
  const router = useRouter();
  const debts = useAppStore(s => s.debts);
  const t = useThemeOverrides();
  const addPayment = useAppStore(s => s.addPayment);
  const userName = useAppStore(s => s.userName);

  const [step, setStep] = useState<Step>('select');
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [isExtra, setIsExtra] = useState(false);
  const [fixiMessage, setFixiMessage] = useState('Welche Schuld hast du heute bezahlt?');
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);

  // Fire confetti when showConfetti becomes true
  useEffect(() => {
    if (showConfetti && confettiRef.current) {
      confettiRef.current.start();
    }
  }, [showConfetti]);

  const selectedDebt = useMemo(
    () => debts.find(d => d.id === selectedDebtId),
    [debts, selectedDebtId]
  );

  const activeDebts = useMemo(
    () => debts.filter(d => d.remainingAmount > 0),
    [debts]
  );

  const handleSelectDebt = (debtId: string) => {
    setSelectedDebtId(debtId);
    const debt = debts.find(d => d.id === debtId);
    setAmount(debt?.monthlyPayment?.toString() || '');
    setFixiMessage(`Super! Wie viel hast du für "${debt?.name}" bezahlt?`);
    setStep('amount');
  };

  const handleConfirm = async () => {
    if (!selectedDebtId || !amount) return;
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setFixiMessage('Bitte gib einen gueltigen Betrag ein.');
      return;
    }

    // Calculate milestone crossing BEFORE updating state
    const debtBefore = debts.find(d => d.id === selectedDebtId);
    const totalDebt = debtBefore?.totalAmount || 0;
    const remainingBefore = debtBefore?.remainingAmount || 0;
    const newRemaining = Math.max(0, remainingBefore - numAmount);
    const percentBefore = totalDebt > 0 ? ((totalDebt - remainingBefore) / totalDebt) * 100 : 0;
    const percentAfter = totalDebt > 0 ? ((totalDebt - newRemaining) / totalDebt) * 100 : 0;

    // Check overall portfolio milestone
    const allDebtsTotal = debts.reduce((s, d) => s + d.totalAmount, 0);
    const allRemainingBefore = debts.reduce((s, d) => s + d.remainingAmount, 0);
    const allRemainingAfter = Math.max(0, allRemainingBefore - numAmount);
    const portfolioPctBefore = allDebtsTotal > 0 ? ((allDebtsTotal - allRemainingBefore) / allDebtsTotal) * 100 : 0;
    const portfolioPctAfter = allDebtsTotal > 0 ? ((allDebtsTotal - allRemainingAfter) / allDebtsTotal) * 100 : 0;

    addPayment(selectedDebtId, numAmount, isExtra);
    trackEvent('payment_logged', { amount: numAmount });

    // P2 – Check milestone notifications
    checkAndTriggerMilestone(
      selectedDebtId,
      debtBefore?.name || '',
      newRemaining,
      userName || '',
    );

    // Check confetti milestone
    const crossedMilestone = MILESTONES.find(m => portfolioPctBefore < m && portfolioPctAfter >= m);
    if (crossedMilestone) {
      const flagKey = `fixi_confetti_${crossedMilestone}`;
      const seen = await AsyncStorage.getItem(flagKey);
      if (!seen) {
        await AsyncStorage.setItem(flagKey, 'true');
        setShowConfetti(true);
        trackEvent('milestone_confetti_shown', { milestone: crossedMilestone });
      }
    }

    if (newRemaining <= 0) {
      setFixiMessage('GESCHAFFT! Diese Schuld ist komplett getilgt! Du bist unglaublich!');
    } else if (isExtra) {
      setFixiMessage('Extra-Zahlung! Du bist ein Turbo-Tilger! Weiter so!');
    } else {
      setFixiMessage('Zahlung gespeichert! Jeder Euro zaehlt. Stark!');
    }
    setStep('done');
  };

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="payment-back-btn"
            onPress={() => step === 'amount' ? setStep('select') : router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, t.textPrimary]}>Zahlung eintragen</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Fixi */}
        <View style={styles.fixiRow}>
          <FoxMascot
            state={step === 'done' ? 'celebrating' : 'coaching'}
            size="small"
            speechBubble={fixiMessage}
          />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Step 1: Select Debt */}
          {step === 'select' && (
            <>
              <Text style={[styles.sectionTitle, t.textPrimary]}>Waehle eine Schuld</Text>
              {activeDebts.length === 0 ? (
                <View style={[styles.emptyCard, t.bgCard]}>
                  <Text style={[styles.emptyText, t.textSecondary]}>Keine aktiven Schulden vorhanden.</Text>
                  <TouchableOpacity
                    style={styles.addDebtBtn}
                    onPress={() => router.push('/add-debt')}
                  >
                    <Text style={styles.addDebtBtnText}>Schuld hinzufuegen</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                activeDebts.map(debt => (
                  <TouchableOpacity
                    key={debt.id}
                    testID={`select-debt-${debt.id}`}
                    style={[styles.debtCard, t.bgCard]}
                    onPress={() => handleSelectDebt(debt.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.debtIcon, { backgroundColor: debt.color + '20' }]}>
                      <Text style={{ fontSize: 22, textAlign: 'center' }}>{ICON_MAP[debt.icon] || '📋'}</Text>
                    </View>
                    <View style={styles.debtInfo}>
                      <Text style={[styles.debtName, t.textPrimary]}>{debt.name}</Text>
                      <Text style={[styles.debtRemaining, t.textSecondary]}>
                        Restbetrag: {formatCurrency(debt.remainingAmount)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {/* Step 2: Enter Amount */}
          {step === 'amount' && selectedDebt && (
            <>
              <View style={[styles.selectedDebtBadge, t.bgCard]}>
                <Text style={{ fontSize: 16 }}>{ICON_MAP[selectedDebt.icon] || '📋'}</Text>
                <Text style={[styles.selectedDebtName, t.textPrimary]}>{selectedDebt.name}</Text>
              </View>

              <Text style={[styles.inputLabel, t.textSecondary]}>Betrag</Text>
              <View style={[styles.inputRow, t.bgCard]}>
                <TextInput
                  testID="payment-amount-input"
                  style={[styles.amountInput, { color: t.colors.text.primary }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={t.colors.text.tertiary}
                  autoFocus
                />
                <Text style={[styles.currencyLabel, t.textTertiary]}>EUR</Text>
              </View>

              <View style={styles.quickAmounts}>
                {[selectedDebt.monthlyPayment, selectedDebt.monthlyPayment * 1.5, selectedDebt.monthlyPayment * 2].map((val, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.quickAmountBtn, t.bgCard, amount === val.toFixed(2) && styles.quickAmountBtnActive]}
                    onPress={() => setAmount(val.toFixed(2))}
                  >
                    <Text style={[styles.quickAmountText, t.textSecondary, amount === val.toFixed(2) && styles.quickAmountTextActive]}>
                      {formatCurrency(val)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Extra-Zahlung Toggle */}
              <TouchableOpacity
                testID="payment-extra-toggle"
                style={[styles.extraToggle, t.bgCard, isExtra && styles.extraToggleActive]}
                onPress={() => setIsExtra(!isExtra)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isExtra ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isExtra ? Colors.brand.primary : t.colors.text.tertiary}
                />
                <View style={styles.extraToggleText}>
                  <Text style={[styles.extraLabel, t.textPrimary]}>Extra-Zahlung</Text>
                  <Text style={[styles.extraHint, t.textTertiary]}>Zusaetzlich zur regulaeren Rate</Text>
                </View>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                testID="payment-confirm-btn"
                style={[styles.confirmBtn, (!amount || parseFloat(amount.replace(',', '.')) <= 0) && styles.confirmBtnDisabled]}
                onPress={handleConfirm}
                disabled={!amount || parseFloat(amount.replace(',', '.')) <= 0}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Zahlung speichern</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <View style={styles.doneContainer}>
              {/* Confetti Cannon – fires on milestone */}
              {showConfetti && (
                <ConfettiCannon
                  ref={confettiRef}
                  count={180}
                  origin={{ x: 0, y: 0 }}
                  autoStart={true}
                  fadeOut={true}
                  colors={CONFETTI_COLORS}
                  fallSpeed={3000}
                  explosionSpeed={350}
                />
              )}
              <View style={styles.doneCheckCircle}>
                <Ionicons name="checkmark" size={48} color="#0A0E1A" />
              </View>
              <Text style={[styles.doneTitle, t.textPrimary]}>Zahlung gespeichert!</Text>
              <Text style={[styles.doneSubtitle, t.textSecondary]}>
                {formatCurrency(parseFloat(amount.replace(',', '.')))} für {selectedDebt?.name}
              </Text>
              {isExtra && (
                <View style={styles.extraBadge}>
                  <Ionicons name="flash" size={14} color={Colors.brand.primary} />
                  <Text style={styles.extraBadgeText}>Extra-Zahlung</Text>
                </View>
              )}

              <TouchableOpacity
                testID="payment-done-btn"
                style={styles.confirmBtn}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>Zurück zum Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="payment-another-btn"
                style={styles.secondaryBtn}
                onPress={() => {
                  setStep('select');
                  setSelectedDebtId(null);
                  setAmount('');
                  setIsExtra(false);
                  setShowConfetti(false);
                  setFixiMessage('Noch eine Zahlung? Du bist heute richtig fleissig!');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>Weitere Zahlung eintragen</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  fixiRow: { paddingHorizontal: Spacing.xl, marginBottom: 8 },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.secondary, marginBottom: 12 },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  debtIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'visible',
  },
  debtInfo: { flex: 1 },
  debtName: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  debtRemaining: { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },
  emptyCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  emptyText: { fontSize: 15, color: Colors.text.secondary, marginBottom: 16 },
  addDebtBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addDebtBtnText: { fontSize: 15, fontWeight: '600', color: '#0A0E1A' },
  selectedDebtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  selectedDebtName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  inputLabel: { fontSize: 14, fontWeight: '500', color: Colors.text.secondary, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    paddingVertical: 16,
  },
  currencyLabel: { fontSize: 18, fontWeight: '600', color: Colors.text.tertiary },
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  quickAmountBtnActive: {
    backgroundColor: Colors.brand.primaryDim,
    borderColor: Colors.brand.primary,
  },
  quickAmountText: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary },
  quickAmountTextActive: { color: Colors.brand.primary },
  extraToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    gap: 12,
  },
  extraToggleActive: { borderColor: Colors.brand.primary },
  extraToggleText: { flex: 1 },
  extraLabel: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  extraHint: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  confirmBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#0A0E1A' },
  doneContainer: { alignItems: 'center', paddingTop: 24 },
  doneCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  doneTitle: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, marginBottom: 8 },
  doneSubtitle: { fontSize: 16, color: Colors.text.secondary, marginBottom: 12 },
  extraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primaryDim,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    marginBottom: 32,
  },
  extraBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.brand.primary },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: Colors.brand.primary },
});
