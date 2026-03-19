import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import { FoxMascot } from '../src/components/FoxMascot';
import { trackEvent } from '../src/services/supabase';
import { useThemeOverrides } from '../src/contexts/ThemeContext';

const MINT = '#00D4AA';

export default function OnboardingNameScreen() {
  const router = useRouter();
  const setUserName = useAppStore(s => s.setUserName);
  const t = useThemeOverrides();
  const [name, setName] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    setTimeout(() => inputRef.current?.focus(), 700);
  }, []);

  const handleTextChange = (text: string) => {
    setName(text);
    if (!hasTyped && text.length > 0) {
      setHasTyped(true);
      Animated.parallel([
        Animated.spring(bubbleOpacity, { toValue: 1, useNativeDriver: true, friction: 8 }),
        Animated.spring(bubbleScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
      ]).start();
    }
  };

  const canContinue = name.trim().length >= 2;

  const handleNext = async () => {
    if (!canContinue) return;
    const trimmed = name.trim();
    setUserName(trimmed);
    await AsyncStorage.setItem('hasSeenNameScreen', 'true');
    trackEvent('onboarding_name_entered');
    router.replace('/onboarding/step3');
  };

  const bubbleText = name.trim().length >= 2
    ? `Schön dich kennenzulernen, ${name.trim()}! 🦊`
    : 'Dein Name... 🦊';

  const bubbleBg = t.isDark ? 'rgba(0,212,170,0.12)' : '#E8FDF8';
  const bubbleBorder = t.isDark ? 'rgba(0,212,170,0.45)' : 'rgba(0,184,153,0.3)';
  const inputUnderlineColor = isInputFocused || name.length > 0 ? MINT : (t.isDark ? '#5A6882' : '#D1D5DB');

  return (
    <View style={[styles.container, t.bg]}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Fox mascot – large */}
            <FoxMascot state="welcome" size="large" />

            {/* Dynamic speech bubble */}
            {hasTyped && (
              <Animated.View
                style={[
                  styles.speechBubble,
                  { backgroundColor: bubbleBg, borderColor: bubbleBorder, opacity: bubbleOpacity, transform: [{ scale: bubbleScale }] },
                ]}
              >
                <Text style={[styles.speechText, { fontFamily: 'Nunito_900Black', color: MINT }]}>
                  {bubbleText}
                </Text>
              </Animated.View>
            )}

            {/* Question */}
            <Text style={[styles.question, t.textPrimary, { fontFamily: 'Nunito_900Black' }]}>
              Wie sollen wir dich nennen?
            </Text>

            {/* Underline input */}
            <View style={[styles.inputWrap, { borderBottomColor: inputUnderlineColor }]}>
              <TextInput
                ref={inputRef}
                testID="name-screen-input"
                style={[styles.input, { color: t.colors.text.primary, fontFamily: 'Nunito_900Black' }]}
                value={name}
                onChangeText={handleTextChange}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Dein Vorname"
                placeholderTextColor={t.colors.text.tertiary}
                returnKeyType="done"
                onSubmitEditing={handleNext}
                autoCapitalize="words"
                maxLength={20}
              />
            </View>

            {/* Privacy hint */}
            <View style={styles.privacyRow}>
              <Ionicons name="lock-closed-outline" size={13} color={t.colors.text.tertiary} />
              <Text style={[styles.hint, t.textTertiary, { fontFamily: 'Inter_400Regular' }]}>
                Fixi speichert alles nur auf deinem Gerät.
              </Text>
            </View>

            {/* Fact card */}
            <View style={styles.factCard}>
              <Text style={[styles.factText, { color: t.isDark ? '#00D4AA' : '#00A88A', fontFamily: 'Inter_400Regular' }]}>
                ⭐ Wer seinen Schuldenplan aufschreibt, zahlt 2× schneller zurück.
              </Text>
            </View>
          </Animated.View>

          {/* CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              testID="name-screen-continue-btn"
              onPress={handleNext}
              disabled={!canContinue}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canContinue ? ['#00D4AA', '#00A88A'] : [t.colors.background.tertiary, t.colors.background.tertiary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.btn, !canContinue && styles.btnDisabled]}
              >
                <Text style={[styles.btnText, { fontFamily: 'Nunito_900Black' }]}>Weiter →</Text>
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
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechBubble: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    maxWidth: '90%',
  },
  speechText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  question: {
    fontSize: 24,
    marginTop: 22,
    marginBottom: 18,
    textAlign: 'center',
  },
  inputWrap: {
    width: '100%',
    borderBottomWidth: 2,
    paddingBottom: 8,
    marginBottom: 12,
  },
  input: {
    fontSize: 22,
    textAlign: 'center',
    paddingVertical: 4,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 20,
  },
  hint: { fontSize: 13 },
  factCard: {
    width: '100%',
    backgroundColor: 'rgba(0,212,170,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  factText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    paddingTop: 8,
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
  btnDisabled: { shadowOpacity: 0, elevation: 0, opacity: 0.45 },
  btnText: { fontSize: 18, color: '#0A0E1A' },
});
