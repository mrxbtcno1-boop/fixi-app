import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
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

const CARDS = [
  {
    accentColor: '#00D4AA',
    icon: '📅',
    title: 'Dein Freiheitsdatum',
    desc: 'Ein echter Tag im Kalender. Kein "irgendwann" mehr.',
  },
  {
    accentColor: '#7B61FF',
    icon: '🦊',
    title: 'Coach der zuhört',
    desc: 'Kennt deine Zahlen. Redet wie ein Freund.',
  },
  {
    accentColor: '#FFB800',
    icon: '🏆',
    title: 'Jeden Monat spürbar',
    desc: 'Streaks, Badges, Level-Ups. Du siehst jeden Fortschritt.',
  },
];

export default function OnboardingStep5() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(CARDS.map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(36),
    scale: new Animated.Value(0.88),
  }))).current;
  const proofAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header fade in immediately
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Cards staggered springs
    const delays = [300, 480, 660];
    CARDS.forEach((_, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(cardAnims[i].opacity, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
          Animated.spring(cardAnims[i].translateY, { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }),
          Animated.spring(cardAnims[i].scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        ]).start();
      }, delays[i]);
    });

    // Social proof after cards
    setTimeout(() => {
      Animated.timing(proofAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 900);
  }, []);

  return (
    <ScreenWrapper>
      <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
        {/* Progress */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, t.bgTertiary, i <= 2 && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
        </TouchableOpacity>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View style={{ opacity: headerAnim }}>
            <FoxMascot
              state="motivated"
              size="small"
              speechBubble={`${userName || 'Hey'}, hier ist was ich für dich tun kann. 🦊`}
            />
            <Text style={[styles.headline, t.textPrimary, { fontFamily: 'Nunito_900Black' }]}>
              Das erwartet dich
            </Text>
          </Animated.View>

          {/* Cards */}
          {CARDS.map((card, i) => (
            <Animated.View
              key={i}
              style={[
                styles.card,
                t.bgCardGlass,
                {
                  opacity: cardAnims[i].opacity,
                  transform: [
                    { translateY: cardAnims[i].translateY },
                    { scale: cardAnims[i].scale },
                  ],
                },
              ]}
            >
              {/* Accent stripe */}
              <View style={[styles.accentStripe, { backgroundColor: card.accentColor }]} />

              <View style={styles.cardBody}>
                {/* Icon circle */}
                <View style={[styles.iconCircle, { backgroundColor: card.accentColor + '22' }]}>
                  <Text style={styles.cardIcon}>{card.icon}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, t.textPrimary, { fontFamily: 'Nunito_900Black' }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.cardDesc, t.textSecondary, { fontFamily: 'Inter_400Regular' }]}>
                    {card.desc}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}

          {/* Social proof badge */}
          <Animated.View style={[styles.socialProofCard, { opacity: proofAnim }]}>
            <Text style={[styles.socialProofText, t.textTertiary, { fontFamily: 'Inter_400Regular' }]}>
              🌟 Über 50.000 Nutzer bereits auf dem Weg zur Freiheit
            </Text>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            testID="onboarding-start-btn"
            onPress={() => { trackEvent('onboarding_step', { step: 'value_prop_v13' }); router.push('/onboarding/step6'); }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00D4AA', '#00A88A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >
              <Text style={[styles.btnText, { fontFamily: 'Nunito_900Black' }]}>
                Ich bin dabei – weiter
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#0A0E1A" style={{ marginLeft: 8 }} />
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
  content: { paddingHorizontal: Spacing.xl, paddingTop: 8, paddingBottom: 24 },
  headline: {
    fontSize: 22,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    marginTop: 14,
    overflow: 'hidden',
  },
  accentStripe: {
    width: 4,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 24 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, marginBottom: 4 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  socialProofCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 184, 0, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  socialProofText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
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
  btnText: { fontSize: 17, color: '#0A0E1A' },
});
