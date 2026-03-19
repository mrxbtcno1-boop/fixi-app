import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useThemeOverrides } from '../src/contexts/ThemeContext';
import { ScreenWrapper } from '../src/components/ScreenWrapper';

export const DEBT_TYPES = [
  {
    key: 'ratenkredit',
    label: 'Ratenkredit',
    emoji: '🏦',
    description: 'Bankkredit mit festen monatlichen Raten',
    monthlyRequired: true,
    defaultIcon: 'bank',
  },
  {
    key: 'dispositionskredit',
    label: 'Dispositionskredit',
    emoji: '📊',
    description: 'Dispo / Kontoüberziehung – keine Mindestzahlung nötig',
    monthlyRequired: false,
    defaultIcon: 'bank',
  },
  {
    key: 'kreditkarte',
    label: 'Kreditkarte',
    emoji: '💳',
    description: 'Kreditkarten-Schulden – flexible Tilgung',
    monthlyRequired: false,
    defaultIcon: 'card',
  },
  {
    key: 'ratenkauf',
    label: 'Ratenkauf',
    emoji: '🛍️',
    description: 'Klarna, PayPal Ratenzahlung, 0%-Finanzierung',
    monthlyRequired: true,
    defaultIcon: 'shopping',
  },
  {
    key: 'sonstiges',
    label: 'Sonstiges',
    emoji: '📋',
    description: 'Privatkredite, sonstige Verbindlichkeiten',
    monthlyRequired: true,
    defaultIcon: 'document',
  },
];

export default function DebtTypeScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    router.push(`/add-debt?type=${selected}`);
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={[styles.safe, t.bg]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="close-debt-type"
            onPress={() => router.back()}
            style={[styles.closeBtn, t.bgCard]}
          >
            <Ionicons name="close" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, t.textPrimary]}>Schuldenart wählen</Text>
          <View style={{ width: 44 }} />
        </View>

        <Text style={[styles.subtitle, t.textSecondary]}>
          Welche Art von Schuld möchtest du eintragen?
        </Text>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {DEBT_TYPES.map((type) => {
            const isSelected = selected === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                testID={`debt-type-${type.key}`}
                style={[
                  styles.typeCard,
                  { backgroundColor: t.colors.background.secondary, borderColor: t.colors.glass.stroke },
                  isSelected && {
                    borderColor: t.colors.brand.primary,
                    backgroundColor: t.colors.brand.primaryDim,
                  },
                ]}
                onPress={() => setSelected(type.key)}
                activeOpacity={0.7}
              >
                <View style={styles.typeLeft}>
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <View style={styles.typeInfo}>
                    <Text style={[styles.typeLabel, t.textPrimary, isSelected && { color: t.colors.brand.primary }]}>
                      {type.label}
                    </Text>
                    <Text style={[styles.typeDesc, t.textTertiary]}>
                      {type.description}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={t.colors.brand.primary} />
                )}
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* CTA Button */}
        <View style={[styles.footer, { backgroundColor: t.colors.background.primary }]}>
          <TouchableOpacity
            testID="debt-type-continue-btn"
            onPress={handleContinue}
            disabled={!selected}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selected ? ['#00D4AA', '#00A88A'] : [t.colors.background.tertiary, t.colors.background.tertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
            >
              <Text style={styles.continueBtnText}>Weiter</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.text.inverse} style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '600', color: Colors.text.primary },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    paddingHorizontal: Spacing.xl,
    marginBottom: 20,
  },
  content: { paddingHorizontal: Spacing.xl },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.glass.stroke,
  },
  typeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeEmoji: { fontSize: 28, marginRight: 14 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 3 },
  typeDesc: { fontSize: 13, color: Colors.text.tertiary, lineHeight: 18 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    paddingTop: 16,
    backgroundColor: Colors.background.primary,
  },
  continueBtn: {
    height: 56,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: { fontSize: 17, fontWeight: '600', color: Colors.text.inverse },
});
