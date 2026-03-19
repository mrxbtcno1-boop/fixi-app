import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore, Debt } from '../../src/store/useStore';
import { useTheme, useThemeOverrides } from '../../src/contexts/ThemeContext';
import { formatCurrency, monthsToPayoff, monthsToYearsMonths, formatDateDE, calculateFreedomDate } from '../../src/utils/calculations';
import { FoxMascot } from '../../src/components/FoxMascot';
import { AnimatedProgressBar } from '../../src/components/AnimatedProgressBar';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';

const ICON_MAP: Record<string, string> = {
  card: '💳',
  bank: '🏦',
  car: '🚗',
  person: '👤',
  shopping: '🛍️',
  document: '📋',
};

function getStatusColor(percentOpen: number): string {
  if (percentOpen > 75) return '#FF6B6B'; // red
  if (percentOpen > 25) return '#FFA500'; // orange
  return '#00D4AA'; // green
}

function DebtCard({ debt, onPress, isRecommended }: { debt: Debt; onPress: () => void; isRecommended: boolean }) {
  const t = useThemeOverrides();
  const percentPaid = debt.totalAmount > 0 ? ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100 : 0;
  const percentOpen = 100 - percentPaid;
  const statusColor = getStatusColor(percentOpen);
  const months = monthsToPayoff(debt.remainingAmount, debt.interestRate, debt.monthlyPayment);
  const { years, months: m } = monthsToYearsMonths(months);
  const timeText = months >= 9999 ? 'Nie' : years > 0 ? `${years}J ${m}M` : `${m} Mon.`;
  const iconEmoji = ICON_MAP[debt.icon] || '📋';

  // Interest calculation
  const totalInterest = months < 9999 && debt.interestRate > 0
    ? Math.max(0, (debt.monthlyPayment * months) - debt.remainingAmount)
    : 0;

  // Due date display - show full date
  const dueDateText = debt.dueDay > 0
    ? `Fällig am ${String(debt.dueDay).padStart(2, '0')}. jeden Monat`
    : '';

  return (
    <TouchableOpacity testID={`debt-card-${debt.id}`} style={[styles.debtCard, t.bgCard, isRecommended && styles.debtCardRecommended]} onPress={onPress} activeOpacity={0.7}>
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Priorisiert</Text>
        </View>
      )}
      <View style={styles.debtHeader}>
        <View style={styles.debtIconWrap}>
          <Text style={styles.debtIcon}>{iconEmoji}</Text>
        </View>
        <View style={styles.debtHeaderText}>
          <Text style={[styles.debtName, t.textPrimary]} numberOfLines={1}>{debt.name}</Text>
          <Text style={[styles.debtMeta, t.textSecondary]} numberOfLines={1}>
            {debt.interestRate > 0 ? `${debt.interestRate}% Zinsen` : 'Zinsfrei'} · {formatCurrency(debt.monthlyPayment)}/Mon.
          </Text>
        </View>
        <View style={styles.debtRight}>
          <Text style={[styles.debtAmount, { color: statusColor }]}>{formatCurrency(debt.remainingAmount)}</Text>
          <Text style={styles.debtOf}>von {formatCurrency(debt.totalAmount)}</Text>
        </View>
      </View>
      <AnimatedProgressBar progress={percentPaid} height={8} colors={[statusColor, statusColor]} />
      <View style={styles.debtFooter}>
        <Text style={[styles.debtFooterText, { color: statusColor, fontWeight: '600' }]}>{Math.round(percentPaid)}% getilgt</Text>
        <Text style={styles.debtFooterText}>{'≈'} {timeText}</Text>
        {dueDateText ? <Text style={styles.debtFooterText} numberOfLines={1}>{dueDateText}</Text> : null}
      </View>
      {totalInterest > 0 && (
        <Text style={styles.interestText}>Gesamtzinsen: {formatCurrency(totalInterest)}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function DebtsScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const debts = useAppStore((s) => s.debts);
  const payments = useAppStore((s) => s.payments);
  const method = useAppStore((s) => s.method);
  const setMethod = useAppStore((s) => s.setMethod);
  const onboardingMonthlyPayment = useAppStore((s) => s.onboardingMonthlyPayment);

  const sortedDebts = useMemo(() => {
    if (method === 'avalanche') {
      return [...debts].sort((a, b) => b.interestRate - a.interestRate);
    }
    return [...debts].sort((a, b) => a.remainingAmount - b.remainingAmount);
  }, [debts, method]);

  const totalRemaining = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.totalAmount, 0);
  const totalPaid = totalOriginal - totalRemaining;
  const overallPercent = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;
  const totalMonthlyPayments = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const totalPaymentsMade = payments.reduce((s, p) => s + p.amount, 0);

  // Total interest across all debts
  const totalInterestAll = useMemo(() => {
    return debts.reduce((sum, d) => {
      if (d.interestRate <= 0 || d.monthlyPayment <= 0) return sum;
      const m = monthsToPayoff(d.remainingAmount, d.interestRate, d.monthlyPayment);
      if (m >= 9999) return sum;
      return sum + Math.max(0, (d.monthlyPayment * m) - d.remainingAmount);
    }, 0);
  }, [debts]);

  // Calculate overall freedom date
  const freedomDate = useMemo(() => {
    if (debts.length === 0 || totalMonthlyPayments <= 0) return null;
    return calculateFreedomDate(totalRemaining, 0, totalMonthlyPayments);
  }, [totalRemaining, totalMonthlyPayments, debts.length]);

  // First debt in sorted list is recommended
  const recommendedId = sortedDebts.length > 0 ? sortedDebts[0].id : null;

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, t.textPrimary]}>Schulden-Manager</Text>
        <TouchableOpacity testID="add-debt-btn" onPress={() => router.push('/debt-type')} style={styles.addBtn}>
          <Ionicons name="add" size={28} color={Colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {debts.length > 0 && (
        <View style={[styles.summaryCard, t.bgCard]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.summaryLabel, t.textTertiary]}>Gesamt verbleibend</Text>
              <Text style={[styles.summaryValue, t.textPrimary]}>{formatCurrency(totalRemaining)}</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={[styles.summaryPercent, { color: overallPercent >= 50 ? '#00D4AA' : overallPercent >= 25 ? '#FFA500' : '#FF6B6B' }]}>
                {overallPercent}%
              </Text>
              <Text style={[styles.summaryLabel, t.textTertiary]}>getilgt</Text>
            </View>
          </View>

          {/* Overall progress bar */}
          <View style={[styles.overallProgressBar, t.bgTertiary]}>
            <View style={[styles.overallProgressFill, {
              width: `${overallPercent}%`,
              backgroundColor: overallPercent >= 50 ? '#00D4AA' : overallPercent >= 25 ? '#FFA500' : '#FF6B6B',
            }]} />
          </View>

          {/* Freedom date */}
          {freedomDate && (
            <Text style={styles.freedomDate} data-testid="freedom-date">
              Schuldenfrei am: {formatDateDE(freedomDate)}
            </Text>
          )}

          {/* Payments stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, t.textPrimary]}>{debts.length}</Text>
              <Text style={[styles.statLabel, t.textTertiary]}>Schulden</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, t.textPrimary]}>{formatCurrency(totalMonthlyPayments)}</Text>
              <Text style={[styles.statLabel, t.textTertiary]}>mtl. Raten</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, t.textPrimary]}>{formatCurrency(totalPaymentsMade)}</Text>
              <Text style={[styles.statLabel, t.textTertiary]}>gezahlt</Text>
            </View>
          </View>

          {totalInterestAll > 0 && (
            <Text style={styles.totalInterestText}>
              Gesamtzinsen aller Schulden: {formatCurrency(totalInterestAll)}
            </Text>
          )}

          {/* Method Toggle */}
          <View style={[styles.methodToggle, t.bgTertiary]}>
            <TouchableOpacity
              testID="method-snowball"
              style={[styles.methodBtn, method === 'snowball' && [styles.methodActive, t.bgCard]]}
              onPress={() => setMethod('snowball')}
            >
              <Text style={[styles.methodText, method === 'snowball' ? t.textPrimary : t.textTertiary]}>
                {'\u2744\uFE0F'} Schneeball
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="method-avalanche"
              style={[styles.methodBtn, method === 'avalanche' && [styles.methodActive, t.bgCard]]}
              onPress={() => setMethod('avalanche')}
            >
              <Text style={[styles.methodText, method === 'avalanche' ? t.textPrimary : t.textTertiary]}>
                {'\uD83C\uDF0A'} Lawine
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.methodHint, t.textSecondary]}>
            {method === 'snowball'
              ? 'Kleinste Schuld zuerst – schnelle Erfolge!'
              : 'Höchster Zinssatz zuerst – spart am meisten!'}
          </Text>
        </View>
      )}

      <FlatList
        data={sortedDebts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DebtCard
            debt={item}
            onPress={() => router.push(`/add-debt?id=${item.id}`)}
            isRecommended={item.id === recommendedId}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FoxMascot
              state="coaching"
              size="large"
              speechBubble="Trag deine erste Schuld ein &#8211; dann legen wir los!"
            />
            <Text style={[styles.emptyTitle, t.textPrimary]}>Keine Schulden eingetragen</Text>
            <Text style={[styles.emptyText, t.textSecondary]}>
              {'Trage deine Schulden ein, um deinen\npersönlichen Tilgungsplan zu starten.'}
            </Text>
            <TouchableOpacity testID="add-first-debt-btn" onPress={() => router.push('/debt-type')} activeOpacity={0.8} style={styles.addFirstBtn}>
              <Text style={styles.addFirstBtnText}>Erste Schuld eintragen</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text.primary },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  summaryLabel: { fontSize: 13, color: Colors.text.tertiary },
  summaryValue: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, marginTop: 2 },
  summaryRight: { alignItems: 'flex-end' },
  summaryPercent: { fontSize: 28, fontWeight: '800' },
  overallProgressBar: {
    height: 8,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  overallProgressFill: { height: '100%', borderRadius: 4 },
  freedomDate: { fontSize: 13, color: Colors.brand.primary, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14, paddingTop: 4 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  statLabel: { fontSize: 11, color: Colors.text.tertiary, marginTop: 2 },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  methodBtn: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.sm, alignItems: 'center' },
  methodActive: { backgroundColor: Colors.background.secondary },
  methodText: { fontSize: 14, color: Colors.text.tertiary },
  methodTextActive: { color: Colors.text.primary, fontWeight: '600' },
  methodHint: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'center', marginTop: 6 },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  debtCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  debtCardRecommended: {
    borderColor: Colors.brand.primary,
    borderWidth: 1.5,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: { fontSize: 10, fontWeight: '700', color: Colors.text.inverse },
  debtHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  debtIconWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  debtIcon: { fontSize: 28 },
  debtHeaderText: { flex: 1 },
  debtName: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  debtMeta: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  debtRight: { alignItems: 'flex-end', flexShrink: 0 },
  debtAmount: { fontSize: 16, fontWeight: '700' },
  debtOf: { fontSize: 12, color: Colors.text.tertiary },
  debtProgressBar: {
    height: 6,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  debtProgressFill: { height: '100%', borderRadius: 3 },
  debtFooter: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  debtFooterText: { fontSize: 13, color: Colors.text.tertiary },
  interestText: { fontSize: 12, color: '#FF6B6B', fontWeight: '600', marginTop: 6 },
  totalInterestText: { fontSize: 13, color: '#FF6B6B', fontWeight: '600', textAlign: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.glass.stroke },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.text.primary, marginBottom: 8 },
  emptyText: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  addFirstBtn: {
    marginTop: 24,
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  addFirstBtnText: { fontSize: 16, fontWeight: '600', color: Colors.text.inverse },
});
