import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore, Debt } from '../src/store/useStore';
import { FoxMascot } from '../src/components/FoxMascot';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCurrency } from '../src/utils/calculations';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { trackEvent } from '../src/services/supabase';
import { useThemeOverrides } from '../src/contexts/ThemeContext';
import { DEBT_TYPES } from './debt-type';
import {
  requestPermissionAfterFirstDebt,
  schedulePaymentReminder,
  scheduleMonthlyReport,
} from '../src/services/NotificationService';

// Debt types where monthly rate is optional (uses 2% minimum payment)
const OPTIONAL_MONTHLY_TYPES = ['dispositionskredit', 'kreditkarte'];
const COACH_INTRO_KEY = 'hasSeenCoachIntro';

const CATEGORY_ICONS = [
  { key: 'card', label: 'Kreditkarte', emoji: '💳' },
  { key: 'bank', label: 'Bank', emoji: '🏦' },
  { key: 'car', label: 'Auto', emoji: '🚗' },
  { key: 'person', label: 'Person', emoji: '👤' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { key: 'document', label: 'Sonstiges', emoji: '📋' },
];

function getIconEmoji(key: string): string {
  return CATEGORY_ICONS.find(i => i.key === key)?.emoji || '📋';
}

function getFixiPaymentReaction(isFirst: boolean, isExtra: boolean, amount: number): { bubble: string; state: 'celebrating' | 'proud' | 'excited' } {
  if (isFirst) return { bubble: `Deine erste Zahlung! ${amount}€ – das ist der wichtigste Schritt!`, state: 'celebrating' };
  if (isExtra) return { bubble: `Extra-Zahlung von ${amount}€? Du bist unaufhaltbar!`, state: 'excited' };
  if (amount >= 500) return { bubble: `Wow, ${amount}€ auf einen Schlag! Stark!`, state: 'celebrating' };
  return { bubble: `${amount}€ verbucht! Jeder Euro zählt.`, state: 'proud' };
}

export default function AddDebtScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const inputStyle = { backgroundColor: t.colors.background.secondary, color: t.colors.text.primary, borderColor: t.colors.glass.stroke };
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const debtType = params.type || null;
  const debtTypeInfo = DEBT_TYPES.find((d) => d.key === debtType) || null;
  const isMonthlyOptional = debtType ? OPTIONAL_MONTHLY_TYPES.includes(debtType) : false;
  const debts = useAppStore((s) => s.debts);
  const payments = useAppStore((s) => s.payments);
  const addDebt = useAppStore((s) => s.addDebt);
  const updateDebt = useAppStore((s) => s.updateDebt);
  const deleteDebt = useAppStore((s) => s.deleteDebt);
  const addPayment = useAppStore((s) => s.addPayment);
  const markDebtCleared = useAppStore((s) => s.markDebtCleared);
  const addBadge = useAppStore((s) => s.addBadge);
  const clearedDebts = useAppStore((s) => s.clearedDebts);
  const userName = useAppStore((s) => s.userName);

  const editingDebt = params.id ? debts.find((d) => d.id === params.id) : null;
  const isEditing = !!editingDebt;

  // Form state
  const [name, setName] = useState(editingDebt?.name || '');
  const [total, setTotal] = useState(editingDebt?.totalAmount?.toString() || '');
  const [remaining, setRemaining] = useState(editingDebt?.remainingAmount?.toString() || '');
  const [rate, setRate] = useState(editingDebt?.interestRate?.toString() || '0');
  const [monthly, setMonthly] = useState(editingDebt?.monthlyPayment?.toString() || '');
  const [selectedIcon, setSelectedIcon] = useState(editingDebt?.icon || debtTypeInfo?.defaultIcon || 'document');
  const [dueDay, setDueDay] = useState(editingDebt?.dueDay?.toString() || '1');

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isExtraPayment, setIsExtraPayment] = useState(false);

  // Fixi reaction state
  const [fixiReaction, setFixiReaction] = useState<{ bubble: string; state: 'coaching' | 'celebrating' | 'proud' | 'excited' } | null>(null);

  // First Achievement state (P1.2)
  const [showAchievement, setShowAchievement] = useState(false);

  // Progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const debtProgress = editingDebt
    ? (editingDebt.totalAmount - editingDebt.remainingAmount) / editingDebt.totalAmount
    : 0;

  useEffect(() => {
    if (editingDebt) {
      Animated.timing(progressAnim, {
        toValue: debtProgress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [editingDebt?.remainingAmount]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSave = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) errors.name = 'Name erforderlich';
    if (!total || parseFloat(total) <= 0) errors.total = 'Betrag muss groesser als 0 sein';
    // Monthly rate is optional for Dispo & Kreditkarte
    if (!isMonthlyOptional && (!monthly || parseFloat(monthly) <= 0)) errors.monthly = 'Rate muss groesser als 0 sein';
    if (rate && parseFloat(rate) > 100) errors.rate = 'Zinssatz über 100% — bist du sicher?';
    
    setValidationErrors(errors);
    
    if (errors.name || errors.total || errors.monthly) {
      setFixiReaction({ bubble: 'Hmm, da stimmt was nicht...', state: 'coaching' });
      setTimeout(() => setFixiReaction(null), 2500);
      return;
    }
    const totalNum = parseFloat(total);
    const remainingNum = remaining ? parseFloat(remaining) : totalNum;
    const rateNum = parseFloat(rate) || 0;
    // For Dispo/Kreditkarte: if no monthly rate entered, calculate 2% minimum payment
    const monthlyNum = monthly && parseFloat(monthly) > 0
      ? parseFloat(monthly)
      : isMonthlyOptional
        ? Math.max(10, Math.round(remainingNum * 0.02 * 100) / 100)
        : 0;
    const dueDayNum = Math.max(1, Math.min(31, parseInt(dueDay) || 1));

    if (isEditing && editingDebt) {
      updateDebt(editingDebt.id, {
        name: name.trim(),
        totalAmount: totalNum,
        remainingAmount: Math.min(remainingNum, totalNum),
        interestRate: rateNum,
        monthlyPayment: monthlyNum,
        icon: selectedIcon,
        dueDay: dueDayNum,
      });
      setFixiReaction({ bubble: 'Aktualisiert! Ich berechne deinen Plan neu...', state: 'coaching' });
      setTimeout(() => router.back(), 1500);
    } else {
      const isFirstDebt = debts.length === 0;
      addDebt({
        name: name.trim(),
        totalAmount: totalNum,
        remainingAmount: Math.min(remainingNum, totalNum),
        interestRate: rateNum,
        monthlyPayment: monthlyNum,
        startDate: new Date().toISOString(),
        icon: selectedIcon,
        dueDay: dueDayNum,
        debtType: debtType || undefined,
      });
      trackEvent('debt_added', { amount: totalNum, debtType: debtType || 'unknown' });

      if (isFirstDebt) {
        // P1.2 – First Achievement Animation
        setShowAchievement(true);
        // P2 – Request notification permission after first debt
        requestPermissionAfterFirstDebt().then(granted => {
          if (granted) {
            schedulePaymentReminder(
              `new_debt_${Date.now()}`, name.trim(), dueDayNum, monthlyNum, userName || ''
            );
            scheduleMonthlyReport(userName || '');
          }
        });
        setTimeout(async () => {
          setShowAchievement(false);
          // P1.1 – KI-Coach Auto-Open (einmalig)
          const seen = await AsyncStorage.getItem(COACH_INTRO_KEY);
          if (!seen) {
            await AsyncStorage.setItem(COACH_INTRO_KEY, 'true');
            router.replace('/ai-coach?introMode=true' as any);
          } else {
            router.back();
          }
        }, 3000);
      } else {
        // P2 – Schedule payment reminder for existing debt
        schedulePaymentReminder(
          `debt_${Date.now()}`, name.trim(), dueDayNum, monthlyNum, userName || ''
        );
        router.back();
      }
    }
  }, [name, total, remaining, rate, monthly, selectedIcon, dueDay, isMonthlyOptional, debtType, isEditing, editingDebt]);

  const handleDelete = useCallback(() => {
    if (!editingDebt) return;

    if (Platform.OS === 'web') {
      // Web: use custom modal-like approach
      const choice = window.confirm(
        `"${editingDebt.name}" - Bist du sicher?\n\nOK = Schuld ist getilgt! ✅\nAbbrechen = Nicht löschen`
      );
      if (choice) {
        // Treat as "getilgt"
        markDebtCleared(editingDebt.id);
        if (clearedDebts.length === 0) addBadge('first_debt_cleared');
        addBadge('debt_destroyer');
        deleteDebt(editingDebt.id);
        setFixiReaction({ bubble: 'GESCHAFFT! Eine Schuld weniger! Das ist riesig!', state: 'celebrating' });
        setTimeout(() => router.back(), 2000);
      } else {
        // Ask if they want to just remove
        const remove = window.confirm('Soll die Schuld einfach entfernt werden (ohne Feier)?');
        if (remove) {
          deleteDebt(editingDebt.id);
          router.back();
        }
      }
    } else {
      Alert.alert(
        'Schuld entfernen?',
        `Was soll mit "${editingDebt.name}" passieren?`,
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: '✅ Schuld ist getilgt!',
            onPress: () => {
              markDebtCleared(editingDebt.id);
              if (clearedDebts.length === 0) addBadge('first_debt_cleared');
              addBadge('debt_destroyer');
              deleteDebt(editingDebt.id);
              setFixiReaction({ bubble: 'GESCHAFFT! Eine Schuld weniger! Das ist riesig!', state: 'celebrating' });
              setTimeout(() => router.back(), 2000);
            },
          },
          {
            text: '\uD83D\uDDD1 Einfach entfernen',
            style: 'destructive',
            onPress: () => {
              deleteDebt(editingDebt.id);
              router.back();
            },
          },
        ]
      );
    }
  }, [editingDebt, clearedDebts]);

  const handlePayment = useCallback(() => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0 || !editingDebt) return;

    const isFirstPayment = payments.length === 0;
    addPayment(editingDebt.id, amt, isExtraPayment);
    const reaction = getFixiPaymentReaction(isFirstPayment, isExtraPayment, amt);
    setFixiReaction({ bubble: reaction.bubble, state: reaction.state });

    const newRemaining = Math.max(0, editingDebt.remainingAmount - amt);
    setRemaining(String(newRemaining));
    setPaymentAmount('');
    setShowPayment(false);
    setIsExtraPayment(false);

    // Animate progress
    const newProgress = (editingDebt.totalAmount - newRemaining) / editingDebt.totalAmount;
    Animated.timing(progressAnim, {
      toValue: newProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [paymentAmount, editingDebt, isExtraPayment, payments.length]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getProgressColor = () => {
    if (debtProgress >= 0.75) return Colors.brand.primary; // green
    if (debtProgress >= 0.25) return '#FFA500'; // orange
    return '#FF6B6B'; // red
  };

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity testID="close-add-debt" onPress={() => router.back()} style={[styles.closeBtn, t.bgCard]}>
              <Ionicons name="close" size={24} color={t.colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.title, t.textPrimary]}>{isEditing ? 'Schuld bearbeiten' : 'Neue Schuld'}</Text>
              {debtTypeInfo && !isEditing && (
                <View style={[styles.debtTypeBadge, { backgroundColor: t.colors.brand.primaryDim, borderColor: t.colors.brand.primary }]}>
                  <Text style={styles.debtTypeBadgeEmoji}>{debtTypeInfo.emoji}</Text>
                  <Text style={[styles.debtTypeBadgeText, { color: t.colors.brand.primary }]}>{debtTypeInfo.label}</Text>
                </View>
              )}
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Fixi Reaction */}
          {fixiReaction && (
            <View style={styles.fixiReaction} data-testid="fixi-reaction">
              <FoxMascot state={fixiReaction.state} size="small" speechBubble={fixiReaction.bubble} />
            </View>
          )}

          {/* Progress bar for editing */}
          {isEditing && editingDebt && (
            <View style={[styles.editProgressCard, t.bgCard]} data-testid="debt-edit-progress">
              <View style={styles.editProgressHeader}>
                <Text style={styles.editProgressIcon}>{getIconEmoji(editingDebt.icon)}</Text>
                <View style={styles.editProgressInfo}>
                  <Text style={[styles.editProgressName, t.textPrimary]}>{editingDebt.name}</Text>
                  <Text style={[styles.editProgressPercent, t.textTertiary]}>
                    {Math.round(debtProgress * 100)}% getilgt
                  </Text>
                </View>
                <Text style={[styles.editProgressAmount, t.textSecondary]}>
                  {formatCurrency(editingDebt.remainingAmount)} verbleibend
                </Text>
              </View>
              <View style={[styles.editProgressBar, t.bgTertiary]}>
                <Animated.View
                  style={[
                    styles.editProgressFill,
                    { width: progressWidth, backgroundColor: getProgressColor() },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Category Icon Selector */}
          <View style={styles.field}>
            <Text style={[styles.label, t.textSecondary]}>Kategorie</Text>
            <View style={styles.iconRow} data-testid="icon-selector">
              {CATEGORY_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon.key}
                  testID={`icon-${icon.key}`}
                  style={[styles.iconBtn, { backgroundColor: t.colors.background.secondary, borderColor: t.colors.glass.stroke }, selectedIcon === icon.key && styles.iconBtnActive]}
                  onPress={() => setSelectedIcon(icon.key)}
                >
                  <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                  <Text style={[styles.iconLabel, selectedIcon === icon.key && styles.iconLabelActive]}>
                    {icon.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, t.textSecondary]}>Name der Schuld</Text>
            <TextInput
              testID="debt-name-input"
              style={[styles.input, inputStyle]}
              value={name}
              onChangeText={setName}
              placeholder='z.B. "Kredit Sparkasse", "Klarna"'
              placeholderTextColor={t.colors.text.tertiary}
            />
          </View>

          {/* Total + Already paid */}
          <View style={styles.row}>
            <View style={[styles.field, styles.flex]}>
              <Text style={[styles.label, t.textSecondary]}>Gesamtbetrag (€)</Text>
              <TextInput
                testID="debt-total-input"
                style={[styles.input, inputStyle]}
                value={total}
                onChangeText={setTotal}
                keyboardType="numeric"
                placeholder="10000"
                placeholderTextColor={t.colors.text.tertiary}
              />
            </View>
            <View style={[styles.field, styles.flex]}>
              <Text style={[styles.label, t.textSecondary]}>Bereits getilgt (€)</Text>
              <TextInput
                testID="debt-paid-input"
                style={[styles.input, inputStyle]}
                value={total && remaining ? String(Math.max(0, parseFloat(total) - parseFloat(remaining) || 0)) : '0'}
                onChangeText={(v) => {
                  const paid = parseFloat(v) || 0;
                  const totalNum = parseFloat(total) || 0;
                  setRemaining(String(Math.max(0, totalNum - paid)));
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={t.colors.text.tertiary}
              />
            </View>
          </View>

          {/* Monthly + Interest */}
          <View style={styles.row}>
            <View style={[styles.field, styles.flex]}>
              <Text style={[styles.label, t.textSecondary]}>
                Monatliche Rate (€){isMonthlyOptional ? ' – optional' : ''}
              </Text>
              <TextInput
                testID="debt-monthly-input"
                style={[styles.input, inputStyle]}
                value={monthly}
                onChangeText={setMonthly}
                keyboardType="numeric"
                placeholder={isMonthlyOptional ? 'Optional' : '200'}
                placeholderTextColor={t.colors.text.tertiary}
              />
              {isMonthlyOptional && !monthly && (
                <View style={[styles.dispoInfoBox, { backgroundColor: t.colors.background.tertiary, borderColor: t.colors.functional.info }]}>
                  <Ionicons name="information-circle-outline" size={15} color={t.colors.functional.info} />
                  <Text style={[styles.dispoInfoText, { color: t.colors.functional.info }]}>
                    Keine Rate? Es wird eine Mindestrate von 2% des Restbetrags berechnet.
                  </Text>
                </View>
              )}
              {isMonthlyOptional && !monthly && total && parseFloat(total) > 0 && (
                <Text style={[styles.dispoCalcText, { color: t.colors.brand.primary }]}>
                  Berechnet: {formatCurrency(Math.max(10, Math.round((parseFloat(remaining || total) * 0.02) * 100) / 100))}/Monat
                </Text>
              )}
            </View>
            <View style={[styles.field, styles.flex]}>
              <Text style={[styles.label, t.textSecondary]}>Zinssatz (% p.a.)</Text>
              <TextInput
                testID="debt-rate-input"
                style={[styles.input, inputStyle]}
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={t.colors.text.tertiary}
              />
            </View>
          </View>

          {/* Due Day */}
          <View style={styles.field}>
            <Text style={[styles.label, t.textSecondary]}>Fälligkeitstag im Monat</Text>
            <View style={styles.dueDayRow}>
              <TextInput
                testID="debt-dueday-input"
                style={[styles.input, styles.dueDayInput, inputStyle]}
                value={dueDay}
                onChangeText={(v) => setDueDay(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={t.colors.text.tertiary}
                maxLength={2}
              />
              <Text style={[styles.dueDayLabel, t.textSecondary]}>. des Monats</Text>
            </View>
          </View>

          {/* Payment Section (editing only) */}
          {isEditing && editingDebt && (
            <View style={styles.paymentSection}>
              {showPayment ? (
                <View style={[styles.paymentCard, { backgroundColor: t.colors.background.secondary }]}>
                  <Text style={[styles.paymentTitle, t.textPrimary]}>Zahlung eintragen</Text>
                  <TextInput
                    testID="payment-amount-input"
                    style={[styles.input, inputStyle]}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    keyboardType="numeric"
                    placeholder="Betrag in €"
                    placeholderTextColor={t.colors.text.tertiary}
                  />

                  {/* Extra Payment Toggle */}
                  <TouchableOpacity
                    testID="extra-payment-toggle"
                    style={[styles.extraToggle, { backgroundColor: t.colors.background.tertiary }, isExtraPayment && styles.extraToggleActive]}
                    onPress={() => setIsExtraPayment(!isExtraPayment)}
                  >
                    <View style={[styles.toggleDot, isExtraPayment && styles.toggleDotActive]} />
                    <Text style={[styles.extraToggleText, t.textSecondary, isExtraPayment && styles.extraToggleTextActive]}>
                      Extra-Zahlung (über der normalen Rate)
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.paymentBtns}>
                    <TouchableOpacity style={[styles.cancelPayBtn, t.bgTertiary]} onPress={() => setShowPayment(false)}>
                      <Text style={[styles.cancelPayText, t.textSecondary]}>Abbrechen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID="confirm-payment-btn" style={styles.confirmPayBtn} onPress={handlePayment}>
                      <Text style={styles.confirmPayText}>Eintragen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity testID="add-payment-btn" style={styles.addPaymentBtn} onPress={() => setShowPayment(true)}>
                  <Ionicons name="add-circle" size={20} color={Colors.brand.primary} />
                  <Text style={styles.addPaymentText}>Zahlung eintragen</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity testID="save-debt-btn" onPress={handleSave} activeOpacity={0.8} style={{ marginTop: 24 }}>
            <LinearGradient
              colors={[Colors.brand.primary, Colors.brand.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>{isEditing ? 'Speichern' : 'Schuld hinzufügen'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Delete Button */}
          {isEditing && (
            <TouchableOpacity testID="delete-debt-btn" onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.functional.error} />
              <Text style={styles.deleteBtnText}>Schuld entfernen</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>

    {/* P1.2 – First Achievement Overlay */}
    <Modal visible={showAchievement} transparent animationType="fade" testID="achievement-modal">
      <View style={styles.achievementOverlay}>
        <View style={[styles.achievementCard, { backgroundColor: t.colors.background.secondary, borderColor: t.colors.brand.primary + '60' }]}>
          <Text style={styles.achievementEmoji}>🎉</Text>
          <Text style={[styles.achievementTitle, t.textPrimary]}>
            Erster Schritt gemacht{userName ? `, ${userName}` : ''}!
          </Text>
          <Text style={[styles.achievementSubtitle, t.textSecondary]}>
            Du hast deinen Schuldenplan erstellt!
          </Text>
          <Text style={[styles.achievementHint, { color: t.colors.brand.primary }]}>Fixi analysiert deinen Plan...</Text>
        </View>
      </View>
    </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  headerCenter: { flex: 1, alignItems: 'center' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background.secondary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: Colors.text.primary },
  debtTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  debtTypeBadgeEmoji: { fontSize: 13 },
  debtTypeBadgeText: { fontSize: 12, fontWeight: '600' },
  dispoInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dispoInfoText: { fontSize: 12, lineHeight: 17, flex: 1 },
  dispoCalcText: { fontSize: 13, fontWeight: '600', marginTop: 4, marginLeft: 2 },
  fixiReaction: { marginBottom: 16, alignItems: 'center' },
  editProgressCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  editProgressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  editProgressIcon: { fontSize: 28, marginRight: 12 },
  editProgressInfo: { flex: 1 },
  editProgressName: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  editProgressPercent: { fontSize: 13, color: Colors.text.tertiary, marginTop: 2 },
  editProgressAmount: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary },
  editProgressBar: {
    height: 8,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  editProgressFill: { height: '100%', borderRadius: 4 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, color: Colors.text.secondary, marginBottom: 6 },
  input: {
    height: 52,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  row: { flexDirection: 'row', gap: 12 },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    alignItems: 'center',
    minWidth: 72,
  },
  iconBtnActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primaryDim,
  },
  iconEmoji: { fontSize: 22, marginBottom: 4 },
  iconLabel: { fontSize: 11, color: Colors.text.tertiary },
  iconLabelActive: { color: Colors.brand.primary, fontWeight: '600' },
  dueDayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dueDayInput: { width: 70, textAlign: 'center' },
  dueDayLabel: { fontSize: 16, color: Colors.text.secondary },
  paymentSection: { marginTop: 8 },
  paymentCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.brand.primaryDim,
  },
  paymentTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  extraToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
  },
  extraToggleActive: {
    backgroundColor: Colors.brand.primaryDim,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.text.tertiary,
  },
  toggleDotActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary,
  },
  extraToggleText: { fontSize: 14, color: Colors.text.secondary },
  extraToggleTextActive: { color: Colors.brand.primary, fontWeight: '500' },
  paymentBtns: { flexDirection: 'row', gap: 12 },
  cancelPayBtn: { flex: 1, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  cancelPayText: { fontSize: 15, color: Colors.text.secondary },
  confirmPayBtn: { flex: 1, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.brand.primary, alignItems: 'center', justifyContent: 'center' },
  confirmPayText: { fontSize: 15, fontWeight: '600', color: Colors.text.inverse },
  addPaymentBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  addPaymentText: { fontSize: 16, fontWeight: '500', color: Colors.brand.primary },
  saveBtn: { height: 56, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 17, fontWeight: '600', color: Colors.text.inverse },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
  deleteBtnText: { fontSize: 15, color: Colors.functional.error },
  // Achievement overlay (P1.2)
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.brand.primary + '60',
  },
  achievementEmoji: { fontSize: 56, marginBottom: 16 },
  achievementTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  achievementHint: {
    fontSize: 13,
    color: Colors.brand.primary,
    fontWeight: '500',
  },
});
