import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { FoxMascot } from '../../src/components/FoxMascot';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';
import { useThemeOverrides } from '../../src/contexts/ThemeContext';

const TOTAL_STEPS = 5;

const AGE_OPTIONS = [
  { icon: '🎓', label: '18 - 24', sublabel: 'Jahre', value: '18-24' },
  { icon: '💼', label: '25 - 34', sublabel: 'Jahre', value: '25-34' },
  { icon: '🏠', label: '35 - 44', sublabel: 'Jahre', value: '35-44' },
  { icon: '👨‍👩‍👧', label: '45 - 54', sublabel: 'Jahre', value: '45-54' },
  { icon: '🧭', label: '55 - 64', sublabel: 'Jahre', value: '55-64' },
  { icon: '🌟', label: '65+', sublabel: 'Jahre', value: '65+' },
];

function AgeCard({
  opt,
  isSelected,
  onSelect,
  t,
}: {
  opt: typeof AGE_OPTIONS[0];
  isSelected: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useThemeOverrides>;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 5,
    }).start();

  return (
    <Pressable
      testID={`age-option-${opt.value}`}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onSelect}
      style={styles.cardWrap}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            backgroundColor: t.isDark ? 'rgba(20, 25, 41, 0.85)' : '#FFFFFF',
          },
          isSelected
            ? styles.cardSelected
            : { borderColor: t.colors.glass.stroke },
        ]}
      >
        <Text style={styles.cardIcon}>{opt.icon}</Text>
        <Text
          style={[
            styles.cardLabel,
            { color: isSelected ? '#00D4AA' : t.colors.text.primary },
          ]}
        >
          {opt.label}
        </Text>
        <Text style={[styles.cardSublabel, { color: t.colors.text.tertiary }]}>Jahre</Text>
        {isSelected && (
          <View style={styles.selectedDot} />
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function OnboardingStep3() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const setAgeRange = useAppStore(s => s.setOnboardingAgeRange);
  const [pending, setPending] = useState<string | null>(null);

  const handleSelect = useCallback(
    (value: string) => {
      setPending(value);
      setTimeout(() => {
        setAgeRange(value);
        trackEvent('onboarding_step', { step: 'age_v13', value });
        router.push('/onboarding/step4');
      }, 200);
    },
    [setAgeRange, router],
  );

  return (
    <ScreenWrapper>
      <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
        {/* Progress */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, t.bgTertiary, i === 0 && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
        </TouchableOpacity>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FoxMascot
            state="coaching"
            size="small"
            speechBubble={`Noch kurz, ${userName || 'du'} – wie alt bist du?`}
          />

          <Text style={[styles.question, t.textPrimary]}>Wie alt bist du?</Text>

          {/* 2×3 Grid */}
          <View style={styles.grid}>
            {AGE_OPTIONS.map(opt => (
              <AgeCard
                key={opt.value}
                opt={opt}
                isSelected={pending === opt.value}
                onSelect={() => handleSelect(opt.value)}
                t={t}
              />
            ))}
          </View>

          <Text style={[styles.hint, t.textTertiary]}>
            Das hilft mir, dich besser zu verstehen.
          </Text>
        </ScrollView>
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
  content: { paddingHorizontal: Spacing.xl, paddingTop: 12, paddingBottom: 32 },
  question: {
    fontSize: 24,
    fontFamily: 'Nunito_900Black',
    marginTop: 20,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardWrap: {
    width: '47.5%',
  },
  card: {
    backgroundColor: 'rgba(20, 25, 41, 0.85)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#00D4AA',
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
  },
  selectedDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00D4AA',
  },
  cardIcon: { fontSize: 32, marginBottom: 7 },
  cardLabel: {
    fontSize: 19,
    fontFamily: 'Nunito_900Black',
    textAlign: 'center',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  cardSublabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#8A9BBE',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
});
