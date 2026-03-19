import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import { FoxMascot } from '../src/components/FoxMascot';
import { formatCurrency } from '../src/utils/calculations';
import type { FixiState } from '../src/components/Fixi/FixiStates';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { useThemeOverrides } from '../src/contexts/ThemeContext';

type Mood = 'good' | 'okay' | 'hard' | null;

const MOODS = [
  { key: 'good' as Mood, emoji: '\uD83D\uDE0A', label: 'Gut' },
  { key: 'okay' as Mood, emoji: '\uD83D\uDE10', label: 'Okay' },
  { key: 'hard' as Mood, emoji: '\uD83D\uDE14', label: 'Schwer' },
];

const TIPS = [
  'Mach dir morgens eine Liste: Was brauchst du WIRKLICH?',
  'Koche heute Abend vor – Meal Prep spart 100€+ im Monat.',
  'Check deine Abos – welches nutzt du kaum?',
  'Überleg: Brauchst du es, oder willst du es nur?',
  'Setz dir ein Budget für Spontankäufe: Max 20€/Woche.',
  'Trink Wasser statt Kaffee to go – spart 3€/Tag!',
  'Vergleiche Preise vor dem nächsten Einkauf.',
];

function getResponse(mood: Mood, spent: boolean): { text: string; state: FixiState } {
  if (mood === 'good' && !spent)
    return { text: 'Perfekter Tag! Du bist eine Maschine. Schlaf gut – morgen machen wir weiter! \uD83C\uDF1F', state: 'celebrating' };
  if (mood === 'good' && spent)
    return { text: 'Immerhin ein guter Tag! Und hey, morgen achtest du einfach ein bisschen mehr drauf. Kein Stress!', state: 'coaching' };
  if (mood === 'okay' && !spent)
    return { text: 'Okay ist okay! Nicht jeder Tag muss ein Highlight sein. Du warst trotzdem diszipliniert – das zählt.', state: 'motivated' };
  if (mood === 'okay' && spent)
    return { text: 'Passiert jedem. Wichtig ist: Morgen ist ein neuer Tag. Und du bist immer noch auf dem richtigen Weg.', state: 'empathy' };
  if (mood === 'hard' && !spent)
    return { text: 'Schwere Tage gehören dazu. Aber du hast trotzdem nichts Unnötiges ausgegeben – das ist echte Stärke. \uD83D\uDC9A', state: 'empathy' };
  return { text: 'Schwerer Tag UND die Disziplin war schwierig? Das ist menschlich. Morgen starten wir neu zusammen. Kein Vorwurf – versprochen. \uD83E\uDD8A', state: 'empathy' };
}

export default function EveningReflectionScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const debts = useAppStore((s) => s.debts);
  const payments = useAppStore((s) => s.payments);
  const streakCount = useAppStore((s) => s.streakCount);

  const [mood, setMood] = useState<Mood>(null);
  const [unnecessarySpending, setUnnecessarySpending] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);

  const totalRemaining = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.totalAmount, 0);
  const percentPaid = totalOriginal > 0 ? ((totalOriginal - totalRemaining) / totalOriginal) * 100 : 0;

  // Today's payments
  const today = new Date().toISOString().slice(0, 10);
  const todayPayments = payments.filter(p => p.date.slice(0, 10) === today);
  const todayAmount = todayPayments.reduce((s, p) => s + p.amount, 0);

  const response = mood && unnecessarySpending !== null ? getResponse(mood, unnecessarySpending) : null;
  const tip = TIPS[new Date().getDate() % TIPS.length];

  const handleComplete = () => {
    setCompleted(true);
    // In a real app, save reflection to store
  };

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="close-reflection" onPress={() => router.back()} style={[styles.closeBtn, t.bgCard]}>
            <Ionicons name="close" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, t.textPrimary]}>{'🌙'} Abend-Check</Text>
          <View style={{ width: 44 }} />
        </View>

        {!completed ? (
          <>
            {/* Fixi */}
            <View style={styles.fixiRow}>
              <FoxMascot
                state={response ? response.state : 'coaching'}
                size="medium"
                speechBubble={response ? response.text : 'Wie war dein Tag finanziell?'}
              />
            </View>

            {/* Mood Selection */}
            {!mood && (
              <View style={styles.section}>
                <Text style={[styles.question, t.textPrimary]}>Wie war dein Tag?</Text>
                <View style={styles.moodRow}>
                  {MOODS.map(m => (
                    <TouchableOpacity
                      key={m.key}
                      testID={`mood-${m.key}`}
                      style={[styles.moodCard, t.bgCard]}
                      onPress={() => setMood(m.key)}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={[styles.moodLabel, t.textPrimary]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Unnecessary Spending Question */}
            {mood && unnecessarySpending === null && (
              <View style={styles.section}>
                <Text style={[styles.question, t.textPrimary]}>Hast du heute Geld ausgegeben das du hättest sparen können?</Text>
                <View style={styles.moodRow}>
                  <TouchableOpacity
                    testID="spent-yes"
                    style={[styles.spentCard, t.bgCard]}
                    onPress={() => setUnnecessarySpending(true)}
                  >
                <Text style={[styles.spentEmoji, t.textPrimary]}>Ja {'\uD83D\uDE05'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="spent-no"
                    style={[styles.spentCard, t.bgCard]}
                    onPress={() => setUnnecessarySpending(false)}
                  >
                <Text style={[styles.spentEmoji, t.textPrimary]}>Nein {'💪'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Response + Day Summary */}
            {response && (
              <>
                <View style={[styles.daySummary, t.bgCard]}>
                  <Text style={[styles.summaryTitle, t.textPrimary]}>Dein Tag in Zahlen</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryIcon}>{'💰'}</Text>
                      <Text style={[styles.summaryValue, t.textPrimary]}>{formatCurrency(todayAmount)}</Text>
                      <Text style={[styles.summaryLabel, t.textTertiary]}>Getilgt heute</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryIcon}>{'🔥'}</Text>
                      <Text style={[styles.summaryValue, t.textPrimary]}>Tag {streakCount}</Text>
                      <Text style={[styles.summaryLabel, t.textTertiary]}>Streak</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryIcon}>{'\uD83D\uDCCA'}</Text>
                      <Text style={[styles.summaryValue, t.textPrimary]}>{percentPaid.toFixed(1)}%</Text>
                      <Text style={[styles.summaryLabel, t.textTertiary]}>Fortschritt</Text>
                    </View>
                  </View>
                </View>

                {/* Tip */}
                <View style={styles.tipCard}>
                  <Text style={styles.tipTitle}>{'\uD83D\uDCA1'} Fixis Tipp für morgen:</Text>
                  <Text style={[styles.tipText, t.textSecondary]}>"{tip}"</Text>
                </View>

                <TouchableOpacity testID="complete-reflection" style={styles.completeBtn} onPress={handleComplete}>
                  <Text style={styles.completeBtnText}>Gute Nacht, Fixi {'🌙'}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          /* Completed State */
          <View style={styles.completedState}>
            <FoxMascot state="sleeping" size="large" speechBubble="Schlaf gut! Morgen wird ein guter Tag." />
            <Text style={styles.completedText}>Reflexion gespeichert</Text>
            <TouchableOpacity style={[styles.backHomeBtn, t.bgCard]} onPress={() => router.replace('/(tabs)')}>
              <Text style={[styles.backHomeBtnText, t.textPrimary]}>Zurück zum Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background.secondary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  fixiRow: { alignItems: 'center', marginBottom: 24 },
  section: { marginBottom: 24 },
  question: { fontSize: 18, fontWeight: '600', color: Colors.text.primary, textAlign: 'center', marginBottom: 16 },
  moodRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  moodCard: {
    width: 100,
    height: 100,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  moodEmoji: { fontSize: 36, marginBottom: 4 },
  moodLabel: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  spentCard: {
    flex: 1,
    height: 64,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  spentEmoji: { fontSize: 18, fontWeight: '600', color: Colors.text.primary },
  daySummary: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 16, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryIcon: { fontSize: 22, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  summaryLabel: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  tipCard: {
    backgroundColor: Colors.brand.primaryDim,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  tipTitle: { fontSize: 14, fontWeight: '600', color: Colors.brand.primary, marginBottom: 6 },
  tipText: { fontSize: 15, color: Colors.text.primary, fontStyle: 'italic', lineHeight: 22 },
  completeBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: { fontSize: 17, fontWeight: '600', color: Colors.text.inverse },
  completedState: { alignItems: 'center', paddingTop: 60 },
  completedText: { fontSize: 16, color: Colors.text.secondary, marginTop: 20, marginBottom: 24 },
  backHomeBtn: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  backHomeBtnText: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
});
