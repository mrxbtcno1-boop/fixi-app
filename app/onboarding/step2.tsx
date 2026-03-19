import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
const OPTIONS = ['18 – 24', '25 – 34', '35 – 44', '45 – 54', '55+'];
const VALUES = ['18-24', '25-34', '35-44', '45-54', '55+'];

export default function OnboardingStep2() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const setAgeRange = useAppStore(s => s.setOnboardingAgeRange);

  const handleSelect = (index: number) => {
    setAgeRange(VALUES[index]);
    trackEvent('onboarding_step', { step: 'age' });
    router.push('/onboarding/step3');
  };

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, t.bgTertiary, i <= 1 && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <FoxMascot state="thinking" size="small" speechBubble={`Schön dich kennenzulernen, ${userName}! Eine kurze Frage...`} />
        <Text style={[styles.question, t.textPrimary]}>Wie alt bist du?</Text>
        {OPTIONS.map((label, i) => (
          <TouchableOpacity
            key={i}
            testID={`age-option-${i}`}
            style={[styles.option, t.bgCard]}
            onPress={() => handleSelect(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, t.textPrimary]}>{label}</Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.hint, t.textTertiary]}>Das hilft mir, dich besser zu verstehen.</Text>
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
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 16 },
  question: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: 20, marginBottom: 16 },
  option: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  optionText: { fontSize: 17, fontWeight: '600', color: Colors.text.primary },
  hint: { fontSize: 13, color: Colors.text.tertiary, marginTop: 8 },
});
