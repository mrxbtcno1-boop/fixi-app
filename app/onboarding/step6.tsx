import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { FoxMascot } from '../../src/components/FoxMascot';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';
import { useThemeOverrides } from '../../src/contexts/ThemeContext';

const TOTAL_STEPS = 7;

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

  const handleSubmit = () => {
    setError('');
    if (!name.trim()) { setError('Bitte gib einen Namen ein'); return; }
    const totalNum = parseFloat(total.replace(',', '.'));
    if (isNaN(totalNum) || totalNum <= 0) { setError('Bitte gib einen gueltigen Betrag ein'); return; }
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
    trackEvent('onboarding_step', { step: 'debt_entry' });
    router.push('/onboarding/step7');
  };

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, t.bgTertiary, i <= 5 && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
        </TouchableOpacity>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FoxMascot state="motivated" size="small" speechBubble={`Okay ${userName}, lass uns starten! Trag deine erste Schuld ein:`} />

          <View style={styles.form}>
            <Text style={[styles.label, t.textSecondary]}>Bezeichnung</Text>
            <TextInput
              testID="debt-name-input"
              style={[styles.input, t.bgCardGlass, { color: t.colors.text.primary }]}
              value={name}
              onChangeText={setName}
              placeholder="z.B. Sparkasse"
              placeholderTextColor={t.colors.text.tertiary}
            />

            <Text style={[styles.label, t.textSecondary]}>Gesamtbetrag</Text>
            <View style={[styles.inputRow, t.bgCardGlass]}>
              <TextInput
                testID="debt-total-input"
                style={[styles.input, { flex: 1, backgroundColor: 'transparent', borderWidth: 0, color: t.colors.text.primary }]}
                value={total}
                onChangeText={setTotal}
                placeholder="10.000"
                placeholderTextColor={t.colors.text.tertiary}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.unit, t.textTertiary]}>EUR</Text>
            </View>

            <Text style={[styles.label, t.textSecondary]}>Monatliche Rate</Text>
            <View style={[styles.inputRow, t.bgCardGlass]}>
              <TextInput
                testID="debt-monthly-input"
                style={[styles.input, { flex: 1, backgroundColor: 'transparent', borderWidth: 0, color: t.colors.text.primary }]}
                value={monthly}
                onChangeText={setMonthly}
                placeholder="200"
                placeholderTextColor={t.colors.text.tertiary}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.unit, t.textTertiary]}>EUR</Text>
            </View>

            <Text style={[styles.label, t.textSecondary]}>Zinssatz (optional)</Text>
            <View style={[styles.inputRow, t.bgCardGlass]}>
              <TextInput
                testID="debt-interest-input"
                style={[styles.input, { flex: 1, backgroundColor: 'transparent', borderWidth: 0, color: t.colors.text.primary }]}
                value={interest}
                onChangeText={setInterest}
                placeholder="0"
                placeholderTextColor={t.colors.text.tertiary}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.unit, t.textTertiary]}>%</Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={[styles.hint, t.textTertiary]}>Du musst nicht alles wissen – trag ein was du kannst. Ich rechne den Rest!</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            testID="debt-submit-btn"
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Berechnen</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.background.tertiary },
  dotActive: { width: 24, backgroundColor: Colors.brand.primary },
  backBtn: { paddingHorizontal: Spacing.xl, paddingTop: 12 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 16, paddingBottom: 20 },
  form: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text.secondary, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: Colors.text.primary,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  unit: { fontSize: 16, fontWeight: '600', color: Colors.text.tertiary, width: 40 },
  error: { color: Colors.functional.error, fontSize: 14, marginTop: 12 },
  hint: { fontSize: 13, color: Colors.text.tertiary, marginTop: 16, lineHeight: 18 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 16 },
  submitBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#0A0E1A' },
});
