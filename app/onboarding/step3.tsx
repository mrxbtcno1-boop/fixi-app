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
const OPTIONS = [
  { icon: '\uD83D\uDC69', label: 'Frau', value: 'female' },
  { icon: '\uD83D\uDC68', label: 'Mann', value: 'male' },
  { icon: '\uD83C\uDF08', label: 'Divers', value: 'diverse' },
  { icon: '\uD83E\uDD10', label: 'Möchte ich nicht sagen', value: 'prefer_not_to_say' },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const setGender = useAppStore(s => s.setOnboardingGender);

  const handleSelect = (value: string) => {
    setGender(value);
    trackEvent('onboarding_step', { step: 'gender' });
    router.push('/onboarding/step4');
  };

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top', 'bottom']}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, t.bgTertiary, i <= 2 && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <FoxMascot state="coaching" size="small" speechBubble={`Noch eine Frage, ${userName}...`} />
        <Text style={[styles.question, t.textPrimary]}>Wie identifizierst du dich?</Text>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            testID={`gender-option-${opt.value}`}
            style={[styles.option, t.bgCardGlass]}
            onPress={() => handleSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionIcon}>{opt.icon}</Text>
            <Text style={[styles.optionText, t.textPrimary]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  optionIcon: { fontSize: 22 },
  optionText: { fontSize: 17, fontWeight: '600', color: Colors.text.primary },
});
