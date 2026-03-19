import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
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

const EMOTION_CATEGORIES = [
  {
    title: 'SO GEHT ES MIR GERADE',
    accentColor: '#FF6B6B',
    emotions: [
      { icon: '😰', label: 'Überfordert', value: 'Überfordert' },
      { icon: '😤', label: 'Gestresst', value: 'Gestresst' },
      { icon: '😔', label: 'Hoffnungslos', value: 'Hoffnungslos' },
      { icon: '😠', label: 'Wütend auf mich', value: 'Wütend auf mich' },
    ],
  },
  {
    title: 'MEIN WENDEPUNKT',
    accentColor: '#00D4AA',
    emotions: [
      { icon: '💪', label: 'Bereit es anzugehen', value: 'Bereit es anzugehen' },
      { icon: '😓', label: 'Erschöpft vom Verstecken', value: 'Erschöpft vom Verstecken' },
      { icon: '😳', label: 'Ich schäme mich', value: 'Ich schäme mich' },
      { icon: '🔥', label: 'Motiviert', value: 'Motiviert' },
    ],
  },
  {
    title: 'MEINE EINSTELLUNG',
    accentColor: '#FFB800',
    emotions: [
      { icon: '🤔', label: 'Skeptisch', value: 'Skeptisch' },
      { icon: '🌱', label: 'Vorsichtig optimistisch', value: 'Vorsichtig optimistisch' },
      { icon: '😌', label: 'Erleichtert', value: 'Erleichtert' },
      { icon: '✨', label: 'Bereit für Veränderung', value: 'Bereit für Veränderung' },
    ],
  },
];

function EmotionChip({
  em,
  isSelected,
  onToggle,
  fadeAnim,
  t,
}: {
  em: { icon: string; label: string; value: string };
  isSelected: boolean;
  onToggle: () => void;
  fadeAnim: Animated.Value;
  t: ReturnType<typeof useThemeOverrides>;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 100,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
    ]).start();
    onToggle();
  };

  const glowStyle = isSelected
    ? Platform.OS === 'web'
      ? { filter: 'drop-shadow(0 0 8px rgba(0,212,170,0.4))' }
      : {
          shadowColor: '#00D4AA',
          shadowOpacity: 0.4,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        }
    : {};

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale }],
      }}
    >
      <TouchableOpacity
        testID={`emotion-option-${em.value}`}
        style={[
          styles.emotionChip,
          {
            backgroundColor: t.isDark ? 'rgba(20, 25, 41, 0.85)' : '#F0F4FF',
            borderColor: t.colors.glass.stroke,
          },
          isSelected && styles.chipSelected,
          glowStyle as any,
        ]}
        onPress={handlePress}
        activeOpacity={0.95}
      >
        <Text style={styles.emotionIcon}>{em.icon}</Text>
        <Text
          style={[
            styles.emotionLabel,
            { color: isSelected ? '#00D4AA' : t.colors.text.secondary, fontFamily: isSelected ? 'Inter_500Medium' : 'Inter_400Regular' },
          ]}
        >
          {em.label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={14} color="#00D4AA" style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function OnboardingStep4() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const setSelectedEmotions = useAppStore(s => s.setSelectedEmotions);

  const [selected, setSelected] = useState<string[]>([]);

  // 12 fade animations (4 per category) + 1 for the banner
  const fadeAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const chipAnimations = fadeAnims.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      })
    );
    Animated.sequence([
      Animated.stagger(40, chipAnimations),
      Animated.timing(bannerAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleEmotion = (value: string) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    setSelectedEmotions(selected);
    trackEvent('onboarding_step', { step: 'emotions_v13', count: selected.length });
    router.push('/onboarding/step5');
  };

  const canContinue = selected.length > 0;

  return (
    <ScreenWrapper>
      <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
        {/* Progress */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, t.bgTertiary, i <= 1 && styles.dotActive]} />
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
            state="empathy"
            size="small"
            speechBubble={`${userName || 'Hey'}, wie fühlst du dich gerade wirklich?`}
          />

          <Text style={[styles.question, t.textPrimary]}>Wie fühlst du dich?</Text>

          {EMOTION_CATEGORIES.map((cat, ci) => (
            <View key={ci} style={styles.category}>
              {/* Category title with accent line */}
              <View style={styles.catTitleRow}>
                <View style={[styles.catAccentLine, { backgroundColor: cat.accentColor }]} />
                <Text style={[styles.categoryTitle, { color: t.colors.text.tertiary }]}>{cat.title}</Text>
              </View>

              <View style={styles.emotionRow}>
                {cat.emotions.map((em, ei) => (
                  <EmotionChip
                    key={em.value}
                    em={em}
                    isSelected={selected.includes(em.value)}
                    onToggle={() => toggleEmotion(em.value)}
                    fadeAnim={fadeAnims[ci * 4 + ei]}
                    t={t}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* Glassmorphism affirmation banner */}
          <Animated.View
            style={[
              styles.affirmationBanner,
              {
                backgroundColor: t.isDark ? 'rgba(20, 25, 41, 0.85)' : '#FFFFFF',
                borderColor: t.colors.glass.stroke,
                opacity: bannerAnim,
                transform: [
                  {
                    translateY: bannerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.bannerAccentLine} />
            <Text style={[styles.affirmationText, { color: t.colors.text.secondary }]}>
              Egal was du fühlst – es ist okay.{'\n'}Wir ändern das zusammen. 🦊
            </Text>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            testID="emotions-continue-btn"
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                canContinue
                  ? ['#00D4AA', '#00A88A']
                  : [t.colors.background.tertiary, t.colors.background.tertiary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.btn, !canContinue && styles.btnDisabled]}
            >
              <Text style={[styles.btnText, { fontFamily: 'Nunito_900Black' }]}>
                {canContinue ? `Weiter (${selected.length})` : 'Weiter'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  content: { paddingHorizontal: Spacing.xl, paddingTop: 12, paddingBottom: 24 },
  question: {
    fontSize: 24,
    fontFamily: 'Nunito_900Black',
    marginTop: 18,
    marginBottom: 6,
  },

  // Category section
  category: { marginTop: 20 },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 11,
  },
  catAccentLine: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  categoryTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#5A6882',
    fontFamily: 'Inter_500Medium',
  },

  // Emotion chips
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    gap: 6,
    backgroundColor: 'rgba(20, 25, 41, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipSelected: {
    borderColor: '#00D4AA',
    backgroundColor: 'rgba(0,212,170,0.10)',
  },
  emotionIcon: { fontSize: 18 },
  emotionLabel: { fontSize: 14 },

  // Affirmation banner
  affirmationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(20, 25, 41, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  bannerAccentLine: {
    width: 3,
    height: 38,
    borderRadius: 2,
    backgroundColor: '#00D4AA',
    flexShrink: 0,
  },
  affirmationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#8A9BBE',
    lineHeight: 22,
  },

  // Footer / CTA
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 36, paddingTop: 8 },
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
