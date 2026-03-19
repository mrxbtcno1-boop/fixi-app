import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { FoxMascot } from '../../src/components/FoxMascot';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';
import { useThemeOverrides } from '../../src/contexts/ThemeContext';

const TOTAL_STEPS = 7;

const CARDS = [
  {
    icon: '\uD83D\uDCC5',
    title: 'Dein Schuldenfreiheits-Datum',
    desc: 'Fixi berechnet GENAU wann du schuldenfrei bist. Ein konkretes Datum.',
  },
  {
    icon: '\uD83E\uDDE0',
    title: 'Dein persönlicher Coach',
    desc: 'Fixi kennt deine Situation und gibt dir Tipps die wirklich zu dir passen.',
  },
  {
    icon: '🏆',
    title: 'Motivation die bleibt',
    desc: 'Badges, Level-Ups, Streaks. Schulden abbauen wird zum Spiel – und du gewinnst.',
  },
];

export default function OnboardingStep5() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();

  const anims = useRef(CARDS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    CARDS.forEach((_, i) => {
      Animated.timing(anims[i], {
        toValue: 1,
        duration: 500,
        delay: 300 + i * 200,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, t.bgTertiary, i <= 4 && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
      </TouchableOpacity>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <FoxMascot state="celebrating" size="small" speechBubble={`${userName}, das kann Fixi für dich tun:`} />

        {CARDS.map((card, i) => (
          <Animated.View
            key={i}
            style={[
              styles.card,
              t.bgCardGlass,
              {
                opacity: anims[i],
                transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
              },
            ]}
          >
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <Text style={[styles.cardTitle, t.textPrimary]}>{card.title}</Text>
            <Text style={[styles.cardDesc, t.textSecondary]}>{card.desc}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          testID="onboarding-start-btn"
          onPress={() => { trackEvent('onboarding_step', { step: 'value_prop' }); router.push('/onboarding/step6'); }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00D4AA', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.gradientBtnText}>Los geht's!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    padding: 20,
    marginTop: 14,
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 },
  cardDesc: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 16 },
  gradientBtn: { borderRadius: BorderRadius.full, paddingVertical: 16, alignItems: 'center' },
  gradientBtnText: { fontSize: 17, fontWeight: '700', color: '#0A0E1A' },
});
