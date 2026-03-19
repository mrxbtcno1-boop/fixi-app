import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../src/constants/theme';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { useThemeOverrides } from '../src/contexts/ThemeContext';

const today = new Date();
const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

export default function TermsScreen() {
  const router = useRouter();
  const t = useThemeOverrides();

  return (
    <ScreenWrapper>
        <SafeAreaView style={[s.safe, t.bg]} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} testID="terms-back-btn">
            <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, t.textPrimary]}>Nutzungsbedingungen</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[s.title, t.textPrimary]}>Fixi Nutzungsbedingungen</Text>
        <Text style={[s.date, t.textTertiary]}>Stand: {dateStr}</Text>

        <Text style={[s.heading, t.textPrimary]}>1. Allgemeines</Text>
        <Text style={[s.body, t.textSecondary]}>
          Fixi ist ein Planungs-Tool zur Unterstuetzung beim Schuldenabbau. Fixi ist keine Finanzberatung und ersetzt keine professionelle Beratung durch Schuldnerberater, Steuerberater oder Rechtsanwaelte.
        </Text>

        <Text style={[s.heading, t.textPrimary]}>2. Berechnungen</Text>
        <Text style={[s.body, t.textSecondary]}>
          Alle Berechnungen (Schuldenfreiheits-Datum, Zinsersparnis, Tilgungspläne) sind Schätzungen basierend auf den vom Nutzer eingegebenen Daten. Tatsächliche Ergebnisse können abweichen.
        </Text>

        <Text style={[s.heading, t.textPrimary]}>3. Haftung</Text>
        <Text style={[s.body, t.textSecondary]}>
          Fixi übernimmt keine Haftung für finanzielle Entscheidungen, die auf Basis der App-Berechnungen getroffen werden. Die Nutzung erfolgt auf eigenes Risiko.
        </Text>

        <Text style={[s.heading, t.textPrimary]}>4. Premium-Abonnement</Text>
        <Text style={[s.body, t.textSecondary]}>
          {'\u2022'} Das Premium-Abo wird über Apple App Store / Google Play Store verwaltet.{'\n'}
          {'\u2022'} Die Kündigung ist jederzeit über den jeweiligen Store möglich.{'\n'}
          {'\u2022'} Das Abo verlängert sich automatisch, sofern es nicht mindestens 24 Stunden vor Ablauf gekündigt wird.
        </Text>

        <Text style={[s.heading, t.textPrimary]}>5. Mindestalter</Text>
        <Text style={[s.body, t.textSecondary]}>
          Die Nutzung von Fixi erfordert ein Mindestalter von 18 Jahren.
        </Text>

        <Text style={[s.heading, t.textPrimary]}>6. Datenschutz</Text>
        <Text style={[s.body, t.textSecondary]}>
          Details zur Datenverarbeitung findest du in unserer Datenschutzerklaerung.
        </Text>

        <Text style={s.contact}>Kontakt: legal@fixi.app</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8, marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text.primary },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  date: { fontSize: 13, color: Colors.text.tertiary, marginBottom: Spacing.xl },
  heading: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  body: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
  contact: { fontSize: 14, color: Colors.brand.primary, marginTop: Spacing.xl },
});
