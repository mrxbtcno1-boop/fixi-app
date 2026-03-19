import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
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

export default function OnboardingStep1() {
  const router = useRouter();
  const setUserName = useAppStore(s => s.setUserName);
  const t = useThemeOverrides();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 500);
    trackEvent('onboarding_start');
  }, []);

  const canContinue = name.trim().length >= 2;

  const handleNext = () => {
    if (!canContinue) return;
    setUserName(name.trim());
    trackEvent('onboarding_step', { step: 'name' });
    router.push('/onboarding/step3');
  };

  return (
    <ScreenWrapper>
    <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Progress */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, t.bgTertiary, i === 0 && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.content}>
          <FoxMascot state="welcome" size="medium" speechBubble="Hey! Ich bin Fixi – dein persönlicher Finanz-Fuchs! 🦊" />

          <Text style={[styles.question, t.textPrimary]}>Wie darf ich dich nennen?</Text>

          <TextInput
            ref={inputRef}
            testID="onboarding-name-input"
            style={[styles.input, t.bgCard, { color: t.colors.text.primary }]}
            value={name}
            onChangeText={setName}
            placeholder="Dein Vorname"
            placeholderTextColor={t.colors.text.tertiary}
            returnKeyType="done"
            onSubmitEditing={handleNext}
            maxLength={20}
          />

          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed" size={14} color={t.colors.text.tertiary} />
            <Text style={[styles.privacyText, t.textTertiary]}>Fixi speichert alles nur auf deinem Gerät.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            testID="onboarding-next-btn"
            style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>Weiter</Text>
            <Ionicons name="arrow-forward" size={20} color="#0A0E1A" />
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
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  question: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: 24, marginBottom: 16 },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: Colors.text.primary,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  privacyText: { fontSize: 13, color: Colors.text.tertiary },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 16 },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnDisabled: { opacity: 0.3 },
  nextBtnText: { fontSize: 17, fontWeight: '700', color: '#0A0E1A' },
});
