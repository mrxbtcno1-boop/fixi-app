import { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { FoxMascot } from '../../src/components/FoxMascot';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';
import { useThemeOverrides } from '../../src/contexts/ThemeContext';

const TOTAL_STEPS = 5;
const MINT = '#00D4AA';

export default function OnboardingStep6() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const addDebt = useAppStore(s => s.addDebt);
  const setOnboardingTotalDebt = useAppStore(s => s.setOnboardingTotalDebt);
  const setOnboardingMonthlyPayment = useAppStore(s => s.setOnboardingMonthlyPayment);

  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [monthly, setMonthly] = useState('');
  const [interest, setInterest] = useState('');
  const [error, setError] = useState('');

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && total.length > 0 && monthly.length > 0;

  const handleSubmit = () => {
    setError('');
    if (!name.trim()) { setError('Bitte gib einen Namen ein'); return; }
    const totalNum = parseFloat(total.replace(',', '.'));
    if (isNaN(totalNum) || totalNum <= 0) { setError('Bitte gib einen gültigen Betrag ein'); return; }
    const monthlyNum = parseFloat(monthly.replace(',', '.'));
    if (isNaN(monthlyNum) || monthlyNum <= 0) { setError('Bitte gib eine monatliche Rate ein'); return; }
    const interestNum = interest ? parseFloat(interest.replace(',', '.')) : 0;

    addDebt({
      name: name.trim(),
      totalAmount: totalNum,
      remainingAmount: totalNum,
      monthlyPayment: monthlyNum,
      interestRate: isNaN(interestNum) ? 0 : interestNum,
      startDate: new Date().toISOString(),
    });
    setOnboardingTotalDebt(totalNum);
    setOnboardingMonthlyPayment(monthlyNum);
    trackEvent('onboarding_step', { step: 'debt_entry_v13' });
    router.push('/onboarding/step7');
  };

  const borderColor = (field: string) =>
    focusedField === field ? MINT : t.colors.glass.stroke;

  return (
    <ScreenWrapper>
      <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Progress */}
          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, t.bgTertiary, i <= 3 && styles.dotActive]} />
            ))}
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Mascot – medium */}
            <FoxMascot
              state="coaching"
              size="medium"
              speechBubble={`Fast geschafft, ${userName || 'du'}! Eine letzte Info – dann berechne ich alles. 🦊`}
            />

            {/* Section title + privacy trust */}
            <Text style={[styles.sectionTitle, t.textPrimary, { fontFamily: 'Nunito_900Black' }]}>
              Deine erste Schuld
            </Text>
            <View style={styles.privacyBadge}>
              <View style={styles.privacyIconWrap}>
                <Ionicons name="lock-closed" size={12} color="#00D4AA" />
              </View>
              <Text style={styles.privacyText}>Verschlüsselt · Nur auf deinem Gerät</Text>
            </View>

            {/* Bezeichnung */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.labelIcon]}>🏷️</Text>
                <Text style={[styles.label, { color: MINT, fontFamily: 'Inter_500Medium' }]}>BEZEICHNUNG</Text>
              </View>
              <TextInput
                testID="debt-name-input"
                style={[styles.input, t.bgCardGlass, { color: t.colors.text.primary, borderColor: borderColor('name'), fontFamily: 'Inter_500Medium' }]}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="z.B. Sparkassen-Kredit"
                placeholderTextColor={t.colors.text.tertiary}
              />
            </View>

            {/* Gesamtbetrag */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.labelIcon}>💰</Text>
                <Text style={[styles.label, { color: MINT, fontFamily: 'Inter_500Medium' }]}>GESAMTBETRAG</Text>
              </View>
              <View style={[styles.inputRow, t.bgCardGlass, { borderColor: borderColor('total') }]}>
                <TextInput
                  testID="debt-total-input"
                  style={[styles.bigInput, { color: t.colors.text.primary, fontFamily: 'Nunito_900Black' }]}
                  value={total}
                  onChangeText={setTotal}
                  onFocus={() => setFocusedField('total')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="10.000"
                  placeholderTextColor={t.colors.text.tertiary}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.unitBig, { color: MINT, fontFamily: 'Nunito_900Black' }]}>EUR</Text>
              </View>
            </View>

            {/* Monatliche Rate */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.labelIcon}>📅</Text>
                <Text style={[styles.label, { color: MINT, fontFamily: 'Inter_500Medium' }]}>MONATLICHE RATE</Text>
              </View>
              <View style={[styles.inputRow, t.bgCardGlass, { borderColor: borderColor('monthly') }]}>
                <TextInput
                  testID="debt-monthly-input"
                  style={[styles.normalInput, { color: t.colors.text.primary, fontFamily: 'Inter_500Medium' }]}
                  value={monthly}
                  onChangeText={setMonthly}
                  onFocus={() => setFocusedField('monthly')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="200"
                  placeholderTextColor={t.colors.text.tertiary}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.unit, t.textTertiary, { fontFamily: 'Inter_400Regular' }]}>EUR/Mo.</Text>
              </View>
            </View>

            {/* Zinssatz optional */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.labelIcon}>📈</Text>
                <Text style={[styles.label, { color: t.colors.text.tertiary, fontFamily: 'Inter_500Medium' }]}>ZINSSATZ (optional)</Text>
              </View>
              <View style={[styles.inputRow, t.bgCardGlass, { borderColor: borderColor('interest') }]}>
                <TextInput
                  testID="debt-interest-input"
                  style={[styles.normalInput, { color: t.colors.text.primary, fontFamily: 'Inter_500Medium' }]}
                  value={interest}
                  onChangeText={setInterest}
                  onFocus={() => setFocusedField('interest')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="0"
                  placeholderTextColor={t.colors.text.tertiary}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.unit, t.textTertiary, { fontFamily: 'Inter_400Regular' }]}>%</Text>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Hint card */}
            <View style={styles.hintCard}>
              <Text style={[styles.hintText, t.textTertiary, { fontFamily: 'Inter_400Regular' }]}>
                Kein Problem wenn du den Zinssatz nicht kennst – trag ein was du kannst!
              </Text>
            </View>
          </ScrollView>

          {/* CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              testID="debt-submit-btn"
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canSubmit ? ['#00D4AA', '#00A88A'] : [t.colors.background.tertiary, t.colors.background.tertiary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.btn, !canSubmit && styles.btnDisabled]}
              >
                <Ionicons name="calculator-outline" size={20} color={canSubmit ? '#0A0E1A' : t.colors.text.tertiary} style={{ marginRight: 8 }} />
                <Text style={[styles.btnText, { fontFamily: 'Nunito_900Black', color: canSubmit ? '#0A0E1A' : t.colors.text.tertiary }]}>
                  Mein Datum berechnen
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: '#00D4AA' },
  backBtn: { paddingHorizontal: Spacing.xl, paddingTop: 12, paddingBottom: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 8, paddingBottom: 24 },
  sectionTitle: { fontSize: 22, marginTop: 18, marginBottom: 4 },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,212,170,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.22)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  privacyIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,212,170,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#00D4AA',
    letterSpacing: 0.3,
  },
  fieldGroup: { marginTop: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  labelIcon: { fontSize: 14 },
  label: { fontSize: 12, letterSpacing: 0.8 },
  input: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    paddingRight: 16,
  },
  bigInput: {
    flex: 1,
    fontSize: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  normalInput: {
    flex: 1,
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  unitBig: { fontSize: 20, marginLeft: 4 },
  unit: { fontSize: 14, marginLeft: 4 },
  error: { color: '#FF6B6B', fontSize: 14, marginTop: 12 },
  hintCard: {
    marginTop: 20,
    backgroundColor: 'rgba(0,212,170,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hintText: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 36, paddingTop: 8 },
  btn: {
    height: 58,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  btnDisabled: { shadowOpacity: 0, elevation: 0, opacity: 0.45 },
  btnText: { fontSize: 17 },
});
