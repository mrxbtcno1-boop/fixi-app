import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';
import { getDashboardMotivation, FixiContext } from '../services/FixiContextEngine';
import { getDailyTip } from '../services/FixiTips';
import { useAppStore } from '../store/useStore';
import { formatCurrency, calculateFreedomDate, formatDateDE } from '../utils/calculations';
import { useThemeOverrides } from '../contexts/ThemeContext';

interface Props {
  recentQuotes: string[];
  onQuoteShown: (text: string) => void;
}

export function FixiDailyCard({ recentQuotes, onQuoteShown }: Props) {
  const t = useThemeOverrides();
  const debts = useAppStore(s => s.debts);
  const payments = useAppStore(s => s.payments);
  const streak = useAppStore(s => s.streakCount);
  const emotion = useAppStore(s => s.onboardingEmotion);
  const lastActiveDate = useAppStore(s => s.lastActiveDate);
  const onboardingTotalDebt = useAppStore(s => s.onboardingTotalDebt);
  const onboardingMonthlyPayment = useAppStore(s => s.onboardingMonthlyPayment);

  const totalDebt = debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt;
  const remaining = debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const progress = totalDebt > 0 ? ((totalDebt - remaining) / totalDebt) * 100 : 0;
  const lastPayment = payments.length > 0 ? payments[payments.length - 1].amount : 0;
  const freedomDate = calculateFreedomDate(remaining, 0, onboardingMonthlyPayment);

  const daysSinceLastVisit = (() => {
    if (!lastActiveDate) return 0;
    const last = new Date(lastActiveDate);
    const now = new Date();
    return Math.floor((now.getTime() - last.getTime()) / 86400000);
  })();

  const ctx: FixiContext = {
    progress,
    streak,
    emotion,
    totalPaid,
    restbetrag: remaining,
    gesamtbetrag: totalDebt,
    debtCount: debts.length,
    daysSinceLastVisit,
    lastPaymentAmount: lastPayment,
    freedomDate: formatDateDE(freedomDate),
  };

  const [quote, setQuote] = useState(() => getDashboardMotivation(ctx, recentQuotes));
  const tip = getDailyTip();

  useEffect(() => {
    onQuoteShown(quote.text);
  }, [quote.text]);

  const refreshQuote = useCallback(() => {
    const newQuote = getDashboardMotivation(ctx, [...recentQuotes, quote.text]);
    setQuote(newQuote);
  }, [ctx, recentQuotes, quote.text]);

  return (
    <View style={styles.cardOuter}>
      <View style={[styles.cardInner, t.bgCard, { borderWidth: 1.5, borderColor: '#00D4AA' }]}>
          <View style={styles.header}>
            <Text style={styles.headerIcon}>{"\uD83E\uDD8A"}</Text>
            <Text style={[styles.headerText, t.textPrimary]}>Fixi sagt...</Text>
          </View>

          <View style={styles.quoteRow}>
            <FoxMascot state={quote.state} size="small" showSpeechBubble={false} animated={true} />
            <Text style={[styles.quoteText, t.textPrimary]}>"{quote.text}"</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: t.colors.glass.stroke }]} />

          <View style={styles.tipSection}>
            <Text style={styles.tipLabel}>{"\uD83D\uDCA1"} Tipp des Tages:</Text>
            <Text style={[styles.tipText, t.textSecondary]}>"{tip.text}"</Text>
          </View>

          <TouchableOpacity style={[styles.refreshBtn, t.bg]} onPress={refreshQuote} activeOpacity={0.7}>
            <Text style={[styles.refreshText, t.textSecondary]}>Neuer Spruch {"\uD83D\uDD04"}</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginVertical: 12,
  },
  cardInner: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl - 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  headerIcon: {
    fontSize: 18,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_900Black',
    color: Colors.text.primary,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quoteText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.glass.stroke,
    marginVertical: 12,
  },
  tipSection: {
    marginBottom: 12,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.primary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  refreshBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
  },
  refreshText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
