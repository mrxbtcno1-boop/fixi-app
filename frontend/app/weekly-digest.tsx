import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import { FoxMascot } from '../src/components/FoxMascot';
import { formatCurrency } from '../src/utils/calculations';
import { AnimatedProgressBar } from '../src/components/AnimatedProgressBar';
import type { FixiState } from '../src/components/Fixi/FixiStates';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { useThemeOverrides } from '../src/contexts/ThemeContext';

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const start = new Date(now);
  start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function WeeklyDigestScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const debts = useAppStore((s) => s.debts);
  const payments = useAppStore((s) => s.payments);
  const streakCount = useAppStore((s) => s.streakCount);
  const badges = useAppStore((s) => s.badges);
  const onboardingTotalDebt = useAppStore((s) => s.onboardingTotalDebt);

  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekBounds(), []);

  const weeklyStats = useMemo(() => {
    const weekPayments = payments.filter((p) => {
      const d = new Date(p.date);
      return d >= weekStart && d <= weekEnd;
    });

    const totalPaidThisWeek = weekPayments.reduce((s, p) => s + p.amount, 0);
    const extraPayments = weekPayments.filter((p) => p.isExtra);
    const extraTotal = extraPayments.reduce((s, p) => s + p.amount, 0);
    const paymentCount = weekPayments.length;

    const totalDebt = debts.length > 0
      ? debts.reduce((s, d) => s + d.totalAmount, 0)
      : onboardingTotalDebt;
    const remaining = debts.length > 0
      ? debts.reduce((s, d) => s + d.remainingAmount, 0)
      : onboardingTotalDebt;
    const overallProgress = totalDebt > 0 ? ((totalDebt - remaining) / totalDebt) * 100 : 0;

    return {
      totalPaidThisWeek,
      extraTotal,
      paymentCount,
      extraCount: extraPayments.length,
      overallProgress,
      remaining,
      totalDebt,
    };
  }, [payments, debts, weekStart, weekEnd, onboardingTotalDebt]);

  const fixiComment = useMemo((): { text: string; state: FixiState } => {
    const { totalPaidThisWeek, extraCount, paymentCount } = weeklyStats;
    if (paymentCount === 0) {
      return { text: 'Diese Woche war ruhig. Naechste Woche packen wir es an!', state: 'coaching' };
    }
    if (extraCount > 0) {
      return { text: 'Extra-Zahlungen! Du bist richtig motiviert! Weiter so!', state: 'celebrating' };
    }
    if (totalPaidThisWeek > 200) {
      return { text: 'Wow, eine starke Woche! So kommst du schnell ans Ziel!', state: 'excited' };
    }
    return { text: 'Gute Arbeit diese Woche! Jede Zahlung zaehlt!', state: 'proud' };
  }, [weeklyStats]);

  const weekLabel = `${weekStart.getDate()}.${weekStart.getMonth() + 1}. - ${weekEnd.getDate()}.${weekEnd.getMonth() + 1}.${weekEnd.getFullYear()}`;

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} testID="digest-back-btn">
            <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, t.textPrimary]}>Wochen-Rueckblick</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={[styles.weekLabel, t.textTertiary]}>{weekLabel}</Text>

        {/* Fixi Comment */}
        <View style={styles.fixiSection}>
          <FoxMascot
            state={fixiComment.state}
            size="medium"
            speechBubble={fixiComment.text}
            animated={false}
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, t.bgCard]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.brand.primaryDim }]}>
              <Ionicons name="wallet" size={20} color={Colors.brand.primary} />
            </View>
            <Text style={[styles.statValue, t.textPrimary]}>{formatCurrency(weeklyStats.totalPaidThisWeek)}</Text>
            <Text style={[styles.statLabel, t.textTertiary]}>Bezahlt diese Woche</Text>
          </View>

          <View style={[styles.statCard, t.bgCard]}>
            <View style={[styles.statIcon, { backgroundColor: t.isDark ? '#1a3a2a' : '#e6f7ef' }]}>
              <Ionicons name="trending-up" size={20} color={Colors.functional.success} />
            </View>
            <Text style={[styles.statValue, t.textPrimary]}>{weeklyStats.paymentCount}</Text>
            <Text style={[styles.statLabel, t.textTertiary]}>Zahlungen</Text>
          </View>

          <View style={[styles.statCard, t.bgCard]}>
            <View style={[styles.statIcon, { backgroundColor: t.isDark ? '#3a2a1a' : '#fef3e6' }]}>
              <Ionicons name="flame" size={20} color="#FF6B35" />
            </View>
            <Text style={[styles.statValue, t.textPrimary]}>{streakCount} Tage</Text>
            <Text style={[styles.statLabel, t.textTertiary]}>Aktueller Streak</Text>
          </View>

          <View style={[styles.statCard, t.bgCard]}>
            <View style={[styles.statIcon, { backgroundColor: t.isDark ? '#2a1a3a' : '#f3e6fe' }]}>
              <Ionicons name="rocket" size={20} color="#A855F7" />
            </View>
            <Text style={[styles.statValue, t.textPrimary]}>{weeklyStats.extraCount}</Text>
            <Text style={[styles.statLabel, t.textTertiary]}>Extra-Zahlungen</Text>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.progressSection}>
          <Text style={[styles.sectionTitle, t.textPrimary]}>Gesamtfortschritt</Text>
          <View style={[styles.progressCard, t.bgCard]}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressPercent}>{weeklyStats.overallProgress.toFixed(1)}%</Text>
              <Text style={[styles.progressRemaining, t.textTertiary]}>
                Noch {formatCurrency(weeklyStats.remaining)}
              </Text>
            </View>
            <View style={[styles.progressBar, t.bgTertiary]}>
              <AnimatedProgressBar progress={weeklyStats.overallProgress} height={8} />
            </View>
          </View>
        </View>

        {/* Badges earned this week */}
        {badges.length > 0 && (
          <View style={styles.badgeSection}>
            <Text style={[styles.sectionTitle, t.textPrimary]}>Verdiente Badges</Text>
            <View style={styles.badgeRow}>
              {badges.slice(-3).map((b, i) => (
                <View key={i} style={styles.badgeChip}>
                  <Ionicons name="medal" size={14} color={Colors.brand.primary} />
                  <Text style={styles.badgeText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Motivation CTA */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.85}
          testID="digest-continue-btn"
        >
          <LinearGradient
            colors={[Colors.brand.primary, Colors.brand.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>Neue Woche, neues Ziel!</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.text.inverse} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text.primary },
  weekLabel: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  fixiSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  progressSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  progressCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  progressRemaining: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgeSection: {
    marginBottom: Spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand.primaryDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
