import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { useThemeOverrides } from '../src/contexts/ThemeContext';

const today = new Date();
const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const t = useThemeOverrides();

  return (
    <ScreenWrapper>
        <SafeAreaView style={[s.safe, t.bg]} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} testID="privacy-back-btn">
            <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, t.textPrimary]}>Datenschutz</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[s.title, t.textPrimary]}>Fixi Datenschutzerklaerung</Text>
        <Text style={[s.date, t.textTertiary]}>Stand: {dateStr}</Text>

        <Text style={[s.heading, t.textPrimary]}>1. Welche Daten speichert Fixi?</Text>
        <Text style={[s.body, t.textSecondary]}>
          {'\u2022'} Schulden-Daten (Betraege, Zinsen, Raten){'\n'}
          {'\u2022'} Zahlungshistorie{'\n'}
          {'\u2022'} App-Nutzungsdaten (Streak, Level, Badges){'\n'}
          {'\u2022'} E-Mail-Adresse (nur wenn Account erstellt){'\n'}
          {'\u2022'} Keine Bankverbindungen, keine Kontodaten
        </Text>

        <Text style={[s.heading, t.textPrimary]}>2. Wo werden die Daten gespeichert?</Text>
        <Text style={[s.body, t.textSecondary]}>
          {'\u2022'} Standardmäßig nur auf deinem Gerät (lokal){'\n'}
          {'\u2022'} Bei Account-Erstellung: Verschluesselt in der Cloud{'\n'}
          {'\u2022'} Server-Standort: EU (DSGVO-konform)
        </Text>

        <Text style={[s.heading, t.textPrimary]}>3. Was wir NICHT tun</Text>
        <Text style={[s.body, t.textSecondary]}>
          {'\u2022'} Deine Daten an Dritte verkaufen{'\n'}
          {'\u2022'} Deine Finanzdaten für Werbung nutzen{'\n'}
          {'\u2022'} Daten ohne deine Zustimmung teilen
        </Text>

        <Text style={[s.heading, t.textPrimary]}>4. Marketing-E-Mails</Text>
        <Text style={[s.body, t.textSecondary]}>
          {'\u2022'} Nur mit deinem expliziten Opt-In{'\n'}
          {'\u2022'} Jederzeit abmeldbar{'\n'}
          {'\u2022'} Maximal 1x pro Woche
        </Text>

        <Text style={[s.heading, t.textPrimary]}>5. Deine Rechte</Text>
        <Text style={[s.body, t.textSecondary]}>
          {'\u2022'} Auskunft über gespeicherte Daten{'\n'}
          {'\u2022'} Loeschung aller Daten{'\n'}
          {'\u2022'} Widerruf der Einwilligung{'\n'}
          {'\u2022'} Export deiner Daten
        </Text>

        <Text style={s.contact}>Kontakt: privacy@fixi.app</Text>
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
