import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { useTheme, useThemeOverrides } from '../../src/contexts/ThemeContext';
import { formatCurrency, monthsToPayoff, totalInterestPaid } from '../../src/utils/calculations';

import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';

export default function StatsScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const payments = useAppStore((s) => s.payments);
  const debts = useAppStore((s) => s.debts);
  const streakCount = useAppStore((s) => s.streakCount);
  const createdAt = useAppStore((s) => s.createdAt);
  const onboardingTotalDebt = useAppStore((s) => s.onboardingTotalDebt);
  const isPremium = useAppStore((s) => s.isPremium);
  const isTrialActive = useAppStore((s) => s.isTrialActive);
  const trialStartDate = useAppStore((s) => s.trialStartDate);

  const hasPremium = isPremium || (trialStartDate !== null && isTrialActive());

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const totalDebt = debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt;
  const remaining = debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
  const percentDone = totalDebt > 0 ? Math.round(((totalDebt - remaining) / totalDebt) * 100) : 0;
  const totalPaymentCount = payments.length;
  const extraPayments = payments.filter((p) => p.isExtra).length;

  useEffect(() => { trackEvent('statistics_viewed'); }, []);

  // Monthly payment data for chart
  const monthlyData = useMemo(() => {
    const data: Record<string, number> = {};
    payments.forEach((p) => {
      const date = new Date(p.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      data[key] = (data[key] || 0) + p.amount;
    });
    const sorted = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.slice(-6);
  }, [payments]);

  const maxPayment = monthlyData.length > 0 ? Math.max(...monthlyData.map(([, v]) => v)) : 1;
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Interest savings calculation
  const interestSavings = useMemo(() => {
    if (debts.length === 0) return 0;
    let minPaymentInterest = 0;
    let currentInterest = 0;
    debts.forEach(d => {
      if (d.interestRate > 0 && d.remainingAmount > 0) {
        const minPayment = Math.max(25, d.remainingAmount * 0.02); // 2% minimum
        minPaymentInterest += totalInterestPaid(d.remainingAmount, d.interestRate, minPayment);
        currentInterest += totalInterestPaid(d.remainingAmount, d.interestRate, d.monthlyPayment);
      }
    });
    return Math.max(0, minPaymentInterest - currentInterest);
  }, [debts]);

  // Streak calendar - last 12 weeks (84 days)
  const streakCalendar = useMemo(() => {
    const days: { date: string; active: boolean }[] = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      // Simple heuristic: active if within streak range or has payment
      const hasPayment = payments.some(p => p.date.slice(0, 10) === dateStr);
      const withinStreak = i < streakCount;
      days.push({ date: dateStr, active: hasPayment || withinStreak });
    }
    return days;
  }, [payments, streakCount]);

  const daysSinceStart = createdAt
    ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, t.textPrimary]}>Statistiken</Text>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, t.bgCard]} data-testid="stat-total-paid">
            <Text style={[styles.overviewValue, t.textPrimary]}>{formatCurrency(totalPaid)}</Text>
            <Text style={[styles.overviewLabel, t.textSecondary]}>Gesamt getilgt</Text>
          </View>
          <View style={[styles.overviewCard, t.bgCard]} data-testid="stat-progress">
            <Text style={[styles.overviewValue, { color: Colors.brand.primary }]}>{percentDone}%</Text>
            <Text style={[styles.overviewLabel, t.textSecondary]}>Fortschritt</Text>
          </View>
          <View style={[styles.overviewCard, t.bgCard]}>
            <Text style={[styles.overviewValue, t.textPrimary]}>{totalPaymentCount}</Text>
            <Text style={[styles.overviewLabel, t.textSecondary]}>Zahlungen</Text>
          </View>
          <View style={[styles.overviewCard, t.bgCard]}>
            <Text style={[styles.overviewValue, { color: Colors.brand.secondary }]}>{extraPayments}</Text>
            <Text style={[styles.overviewLabel, t.textSecondary]}>Extra-Zahlungen</Text>
          </View>
        </View>

        {/* Monthly Bar Chart */}
        <View style={[styles.chartCard, t.bgCard]} data-testid="monthly-chart">
          <Text style={[styles.chartTitle, t.textPrimary]}>Monatliche Tilgung</Text>
          {monthlyData.length > 0 ? (
            <View style={styles.chart}>
              {monthlyData.map(([month, amount]) => {
                const isCurrent = month === currentMonth;
                return (
                  <View key={month} style={styles.barWrap}>
                    <View style={styles.barContainer}>
                      {isCurrent ? (
                        <LinearGradient
                          colors={[Colors.brand.primary, Colors.brand.secondary]}
                          style={[styles.bar, { height: `${Math.max(10, (amount / maxPayment) * 100)}%` }]}
                        />
                      ) : (
                        <View style={[styles.bar, { height: `${Math.max(10, (amount / maxPayment) * 100)}%` }]} />
                      )}
                    </View>
                    <Text style={[styles.barLabel, t.textTertiary, isCurrent && styles.barLabelCurrent]}>
                      {month.split('-')[1]}/{month.split('-')[0].slice(2)}
                    </Text>
                    <Text style={[styles.barAmount, t.textSecondary]}>{formatCurrency(amount)}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.noData, t.textSecondary]}>Noch keine Zahlungen vorhanden</Text>
          )}
          {!hasPremium && monthlyData.length > 1 && (
            <View style={[styles.premiumOverlay, { backgroundColor: t.isDark ? 'rgba(8,14,28,0.85)' : 'rgba(244,246,250,0.85)' }]}>
              <Text style={[styles.premiumOverlayText, t.textSecondary]}>{'\uD83D\uDD12'} Voller Verlauf mit Premium</Text>
            </View>
          )}
        </View>

        {/* Streak Calendar */}
        <View style={[styles.streakCard, t.bgCard]} data-testid="streak-calendar">
          <View style={styles.streakHeader}>
            <Text style={[styles.chartTitle, t.textPrimary]}>Streak-Kalender</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>{'🔥'} {streakCount} Tage</Text>
            </View>
          </View>
          <View style={styles.calendarGrid}>
            {streakCalendar.slice(hasPremium ? 0 : -14).map((day, i) => (
              <View
                key={day.date}
                style={[
                  styles.calendarDot,
                  day.active ? styles.calendarDotActive : [styles.calendarDotInactive, { backgroundColor: t.colors.background.tertiary }],
                ]}
              />
            ))}
          </View>
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.calendarDotActive]} />
              <Text style={[styles.legendText, t.textTertiary]}>Aktiv</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.calendarDotInactive, { backgroundColor: t.colors.background.tertiary }]} />
              <Text style={[styles.legendText, t.textTertiary]}>Inaktiv</Text>
            </View>
          </View>
          {!hasPremium && (
            <Text style={[styles.premiumHint, t.textSecondary]}>Nur letzte 2 Wochen – volle 12 Wochen mit Premium</Text>
          )}
        </View>

        {/* Interest Savings */}
        {debts.some(d => d.interestRate > 0) && (
          <View style={[styles.savingsCard, t.bgCard]} data-testid="interest-savings">
            {hasPremium ? (
              <>
                <Text style={styles.savingsIcon}>{'💰'}</Text>
                <Text style={styles.savingsTitle}>Durch deinen Plan sparst du</Text>
                <Text style={styles.savingsAmount}>{formatCurrency(interestSavings)}</Text>
                <Text style={styles.savingsSubtitle}>an Zinsen (vs. nur Mindestzahlungen)</Text>
              </>
            ) : (
              <>
                <Text style={styles.savingsIcon}>{'\uD83D\uDD12'}</Text>
                <Text style={styles.savingsTitle}>Zins-Ersparnis</Text>
                <Text style={[styles.premiumHint, t.textSecondary]}>Premium Feature</Text>
                <TouchableOpacity
                  testID="stats-premium-cta"
                  style={styles.premiumBtn}
                  onPress={() => router.push('/paywall')}
                >
                  <Text style={styles.premiumBtnText}>Premium freischalten</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Activity */}
        <View style={[styles.activityCard, t.bgCard]}>
          <Text style={[styles.chartTitle, t.textPrimary]}>Aktivität</Text>
          <View style={styles.activityGrid}>
            <View style={styles.activityItem}>
              <Text style={styles.activityEmoji}>{'🔥'}</Text>
              <Text style={[styles.activityValue, t.textPrimary]}>{streakCount}</Text>
              <Text style={[styles.activityLabel, t.textSecondary]}>Tage Streak</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityEmoji}>{'\uD83D\uDCC5'}</Text>
              <Text style={[styles.activityValue, t.textPrimary]}>{daysSinceStart}</Text>
              <Text style={[styles.activityLabel, t.textSecondary]}>Tage dabei</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityEmoji}>🎯</Text>
              <Text style={[styles.activityValue, t.textPrimary]}>
                {debts.filter((d) => d.remainingAmount <= 0).length || '–'}
              </Text>
              <Text style={[styles.activityLabel, t.textSecondary]}>
                {debts.filter((d) => d.remainingAmount <= 0).length === 0
                  ? 'Deine erste getilgte Schuld kommt! Bleib dran.'
                  : 'Schulden getilgt'}
              </Text>
            </View>
          </View>
        </View>

        {/* Evening Reflection CTA - always visible, locked for free users */}
        <TouchableOpacity
          testID="evening-reflection-cta"
          style={[styles.reflectionCta, t.bgCard, !hasPremium && styles.reflectionCtaLocked]}
          onPress={() => hasPremium ? router.push('/evening-reflection') : router.push('/paywall')}
        >
          <Text style={styles.reflectionIcon}>{'🌙'}</Text>
          <View style={styles.reflectionTextWrap}>
            <Text style={[styles.reflectionTitle, t.textPrimary]}>Abend-Reflexion</Text>
            <Text style={[styles.reflectionDesc, t.textSecondary]}>
              {hasPremium ? 'Wie war dein Tag finanziell?' : 'Premium-Feature – Reflektiere deinen Tag'}
            </Text>
          </View>
          {hasPremium ? (
            <Text style={styles.reflectionArrow}>{'\u2192'}</Text>
          ) : (
            <View style={styles.reflectionLockBadge}>
              <Text style={styles.reflectionLockText}>{'\uD83D\uDD12'} Premium</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Privacy */}
        <Text style={[styles.privacy, t.textTertiary]}>
          {'\uD83D\uDD12'} Alle Daten werden nur lokal auf deinem Gerät gespeichert
        </Text>
      </ScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text.primary, marginTop: 16, marginBottom: 24 },

  // Overview
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  overviewCard: {
    width: '47%',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  overviewValue: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginBottom: 4, fontFamily: 'Nunito_900Black' },
  overviewLabel: { fontSize: 13, color: Colors.text.secondary },

  // Chart
  chartCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    position: 'relative',
    overflow: 'hidden',
  },
  chartTitle: { fontSize: 17, fontWeight: '600', color: Colors.text.primary, marginBottom: 16 },
  chart: { flexDirection: 'row', gap: 8, height: 160, alignItems: 'flex-end' },
  barWrap: { flex: 1, alignItems: 'center' },
  barContainer: { width: '80%', height: 120, justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: Colors.brand.primary, borderRadius: 4, minHeight: 8 },
  barLabel: { fontSize: 11, color: Colors.text.tertiary, marginTop: 4 },
  barLabelCurrent: { color: Colors.brand.primary, fontWeight: '600' },
  barAmount: { fontSize: 10, color: Colors.text.secondary },
  noData: { fontSize: 14, color: Colors.text.tertiary, textAlign: 'center', paddingVertical: 40 },
  premiumOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumOverlayText: { fontSize: 13, color: Colors.text.secondary },

  // Streak Calendar
  streakCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  streakBadge: {
    backgroundColor: Colors.brand.primaryDim,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  streakBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.brand.primary },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calendarDot: { width: 14, height: 14, borderRadius: 3 },
  calendarDotActive: { backgroundColor: Colors.brand.primary },
  calendarDotInactive: { backgroundColor: Colors.background.tertiary },
  calendarLegend: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, color: Colors.text.tertiary },
  premiumHint: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center', marginTop: 8 },

  // Interest Savings
  savingsCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    alignItems: 'center',
  },
  savingsIcon: { fontSize: 36, marginBottom: 8 },
  savingsTitle: { fontSize: 15, color: Colors.text.secondary, marginBottom: 4 },
  savingsAmount: { fontSize: 32, fontWeight: '800', color: Colors.brand.primary, marginBottom: 4, fontFamily: 'Nunito_900Black' },
  savingsSubtitle: { fontSize: 13, color: Colors.text.tertiary },
  premiumBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
  },
  premiumBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text.inverse },

  // Activity
  activityCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  activityGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  activityItem: { alignItems: 'center', flex: 1 },
  activityEmoji: { fontSize: 28, marginBottom: 4 },
  activityValue: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Nunito_900Black' },
  activityLabel: { fontSize: 12, color: Colors.text.secondary, textAlign: 'center' },

  // Evening Reflection
  reflectionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primaryDim,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    gap: 12,
  },
  reflectionIcon: { fontSize: 24 },
  reflectionTextWrap: { flex: 1 },
  reflectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  reflectionDesc: { fontSize: 13, color: Colors.text.secondary },
  reflectionArrow: { fontSize: 20, color: Colors.brand.primary },
  reflectionCtaLocked: { opacity: 0.85, borderColor: Colors.glass.stroke },
  reflectionLockBadge: {
    backgroundColor: Colors.brand.primaryDim,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reflectionLockText: { fontSize: 12, fontWeight: '600', color: Colors.brand.primary },

  privacy: { fontSize: 13, color: Colors.text.tertiary, textAlign: 'center', marginTop: 8 },
});
