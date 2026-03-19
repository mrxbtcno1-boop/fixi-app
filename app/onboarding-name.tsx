import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import { FoxMascot } from '../src/components/FoxMascot';
import { trackEvent } from '../src/services/supabase';
import { useThemeOverrides } from '../src/contexts/ThemeContext';

export default function OnboardingNameScreen() {
  const router = useRouter();
  const setUserName = useAppStore(s => s.setUserName);
  const t = useThemeOverrides();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  const canContinue = name.trim().length >= 2;

  const handleNext = async () => {
    if (!canContinue) return;
    const trimmed = name.trim();
    setUserName(trimmed);
    await AsyncStorage.setItem('hasSeenNameScreen', 'true');
    trackEvent('onboarding_name_entered');
    // Skip onboarding step 1 (name) → go directly to step 2
    router.replace('/onboarding/step2');
  };

  return (
    <View style={[styles.container, t.bg]}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            <FoxMascot
              state="welcome"
              size="medium"
              speechBubble="Hey! Ich bin Fixi – dein persönlicher Finanz-Fuchs!"
            />

            <Text style={[styles.question, t.textPrimary]}>
              Wie sollen wir dich nennen?
            </Text>

            <TextInput
              ref={inputRef}
              testID="name-screen-input"
              style={[styles.input, { backgroundColor: t.colors.background.secondary, color: t.colors.text.primary, borderColor: t.colors.glass.stroke }]}
              value={name}
              onChangeText={setName}
              placeholder="Dein Vorname"
              placeholderTextColor={t.colors.text.tertiary}
              returnKeyType="done"
              onSubmitEditing={handleNext}
              autoCapitalize="words"
            />

            <Text style={[styles.hint, t.textTertiary]}>
              Fixi speichert alles nur auf deinem Gerät.
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              testID="name-screen-continue-btn"
              onPress={handleNext}
              disabled={!canContinue}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canContinue ? [Colors.brand.primary, Colors.brand.secondary] : ['#333', '#222']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.btn, !canContinue && styles.btnDisabled]}
              >
                <Text style={styles.btnText}>Weiter →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    marginTop: 10,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    paddingTop: 8,
  },
  btn: {
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 17, fontWeight: '700', color: '#0A0E1A' },
});
