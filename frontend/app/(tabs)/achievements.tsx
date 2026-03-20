import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { getLevel } from '../../src/utils/calculations';
import { FoxMascot } from '../../src/components/FoxMascot';
import { getFixiLevel, FIXI_LEVELS } from '../../src/components/Fixi/FixiAccessories';
import { BadgeUnlockModal } from '../../src/components/BadgeUnlockModal';
import { ALL_BADGES, getBadgesByCategory, getCurrentChallenge } from '../../src/constants/badges';
import type { BadgeDef } from '../../src/constants/badges';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { trackEvent } from '../../src/services/supabase';
import { useThemeOverrides, useTheme } from '../../src/contexts/ThemeContext';

type BadgeCategory = 'all' | 'progress' | 'streak' | 'action' | 'hidden';

export default function AchievementsScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const { isDark } = useTheme();
  const badges = useAppStore((s) => s.badges);
  const debts = useAppStore((s) => s.debts);
  const streakCount = useAppStore((s) => s.streakCount);
  const onboardingTotalDebt = useAppStore((s) => s.onboardingTotalDebt);
  const isPremium = useAppStore((s) => s.isPremium);
  const isTrialActive = useAppStore((s) => s.isTrialActive);
  const payments = useAppStore((s) => s.payments);

  const hasPremium = isPremium || (isTrialActive() && useAppStore.getState().trialStartDate !== null);

  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('all');
  const [unlockBadge, setUnlockBadge] = useState<string | null>(null);
  const [seenBadges, setSeenBadges] = useState<Set<string>>(new Set());

  const totalDebt = debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt;
  const remaining = debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
  const percentPaid = totalDebt > 0 ? ((totalDebt - remaining) / totalDebt) * 100 : 0;
  const currentLevel = getLevel(percentPaid);
  const fixiLevel = getFixiLevel(percentPaid);
  const earnedCount = badges.length;
  const totalBadges = ALL_BADGES.length;

  // Check for new badges to celebrate
  useEffect(() => {
    trackEvent('achievements_viewed');
    const newBadge = badges.find(b => !seenBadges.has(b) && b !== 'first_step');
    if (newBadge && ALL_BADGES.find(bd => bd.key === newBadge)) {
      setUnlockBadge(newBadge);
      setSeenBadges(prev => new Set([...prev, newBadge]));
    }
  }, [badges]);

  // Filter badges
  const filteredBadges = useMemo(() => {
    if (activeCategory === 'all') return ALL_BADGES;
    return getBadgesByCategory(activeCategory);
  }, [activeCategory]);

  // Monthly challenge
  const challenge = getCurrentChallenge();
  const challengeProgress = useMemo(() => {
    if (challenge.id === 'extra_100') {
      const thisMonth = new Date().getMonth();
      const monthPayments = payments.filter(p => new Date(p.date).getMonth() === thisMonth && p.isExtra);
      return Math.min(challenge.targetAmount, monthPayments.reduce((s, p) => s + p.amount, 0));
    }
    if (challenge.id === 'extra_payments_3') {
      const thisMonth = new Date().getMonth();
      return payments.filter(p => new Date(p.date).getMonth() === thisMonth && p.isExtra).length;
    }
    return 0;
  }, [payments, challenge]);

  const categories: { key: BadgeCategory; label: string; count: number }[] = [
    { key: 'all', label: 'Alle', count: totalBadges },
    { key: 'progress', label: 'Fortschritt', count: getBadgesByCategory('progress').length },
    { key: 'streak', label: 'Streaks', count: getBadgesByCategory('streak').length },
    { key: 'action', label: 'Aktionen', count: getBadgesByCategory('action').length },
    { key: 'hidden', label: 'Versteckt', count: getBadgesByCategory('hidden').length },
  ];

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, t.textPrimary]}>Erfolge</Text>

        {/* Level Display – Hero mit Evolution Fox */}
        <View style={[styles.levelCard, t.bgCard]} data-testid="level-card">
          <FoxMascot
            state="motivated"
            size="large"
            showSpeechBubble={false}
            percentPaid={percentPaid}
            evolutionImage={fixiLevel.evolutionImage}
          />
          <Text style={[styles.levelLabel, t.textSecondary]}>Level {fixiLevel.level}</Text>
          <Text style={[styles.levelName, t.textPrimary]}>{fixiLevel.name}</Text>
          <Text style={[styles.levelAccessory, t.textSecondary]}>{fixiLevel.accessoryLabel}</Text>
          <View style={styles.levelBar}>
            <LinearGradient
              colors={[Colors.brand.primary, Colors.brand.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.levelBarFill, { width: `${Math.min(100, percentPaid)}%` }]}
            />
          </View>
          <Text style={[styles.levelPercent, t.textSecondary]}>{Math.round(percentPaid)}% getilgt</Text>
          {currentLevel.level < 6 && (
            <Text style={[styles.levelNext, t.textTertiary]}>
              Nächstes Level: {currentLevel.max}%
            </Text>
          )}
        </View>

        {/* Fixi Evolution */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Fixi Evolution</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evolutionScroll}>
          {FIXI_LEVELS.map((l) => {
            const isActive = fixiLevel.level >= l.level;
            const isCurrent = fixiLevel.level === l.level;
            return (
              <View key={l.level} style={[styles.evoItem, t.bgCard, isCurrent && styles.evoItemCurrent, !isActive && styles.evoItemLocked]}>
                <View style={styles.evoImageWrap}>
                  <Image
                    source={l.evolutionImage}
                    style={styles.evoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.evoName, isActive && styles.evoNameActive, isActive && t.textPrimary]}>{l.name}</Text>
                <Text style={[styles.evoRange, t.textTertiary]}>{l.minPercent}-{l.maxPercent}%</Text>
                {isCurrent && <View style={styles.currentDot} />}
              </View>
            );
          })}
        </ScrollView>

        {/* Stats Bar */}
        <View style={[styles.statsBar, t.bgCard]} data-testid="badge-stats">
          <View style={styles.statItem}>
            <Text style={[styles.statValue, t.textPrimary]}>{earnedCount}</Text>
            <Text style={[styles.statLabel, t.textSecondary]}>Badges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, t.textPrimary]}>{streakCount}</Text>
            <Text style={[styles.statLabel, t.textSecondary]}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, t.textPrimary]}>Lv.{fixiLevel.level}</Text>
            <Text style={[styles.statLabel, t.textSecondary]}>Level</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, t.textPrimary]}>{Math.round(percentPaid)}%</Text>
            <Text style={[styles.statLabel, t.textSecondary]}>Getilgt</Text>
          </View>
        </View>

        {/* Monthly Challenge */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Monats-Challenge</Text>
        <View style={[styles.challengeCard, t.bgCard, !hasPremium && styles.challengeCardLocked]} data-testid="monthly-challenge">
          <Text style={[styles.challengeTitle, t.textPrimary]}>{challenge.title}</Text>
          <Text style={[styles.challengeDesc, t.textSecondary]}>{challenge.description}</Text>
          {hasPremium ? (
            <>
              <View style={[styles.challengeProgressBar, t.bgTertiary]}>
                <View style={[styles.challengeProgressFill, {
                  width: `${Math.min(100, (challengeProgress / challenge.targetAmount) * 100)}%`
                }]} />
              </View>
              <Text style={[styles.challengeProgressText, t.textPrimary]}>
                {challengeProgress}/{challenge.targetAmount} {challenge.unit}
              </Text>
              <View style={styles.challengeFixiRow}>
                <FoxMascot state="motivated" size="small" showSpeechBubble={false} />
                <Text style={[styles.challengeHint, t.textSecondary]}>
                  {challenge.fixi_hint.replace('{remaining}', String(Math.max(0, challenge.targetAmount - challengeProgress)))}
                </Text>
              </View>
              <Text style={styles.challengeReward}>Belohnung: "Challenge Champion" Badge</Text>
            </>
          ) : (
            <View style={styles.challengeLockedOverlay}>
              <FoxMascot state="sad" size="small" speechBubble="Mit Premium könntest du hier mitmachen..." />
              <TouchableOpacity
                testID="challenge-premium-cta"
                style={styles.challengePremiumBtn}
                onPress={() => router.push('/paywall')}
              >
                <Text style={styles.challengePremiumText}>Premium freischalten</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Badge Category Filter */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Badge-Sammlung ({earnedCount}/{totalBadges})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              testID={`badge-filter-${cat.key}`}
              style={[styles.filterBtn, { backgroundColor: t.colors.background.secondary, borderColor: t.colors.glass.stroke }, activeCategory === cat.key && styles.filterBtnActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Text style={[styles.filterText, t.textTertiary, activeCategory === cat.key && styles.filterTextActive]}>
                {cat.label} ({cat.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Badge Grid */}
        <View style={styles.badgeGrid}>
          {filteredBadges.map((b, index) => {
            const earned = badges.includes(b.key);
            const isNew = earned && !seenBadges.has(b.key);
            const isPremiumLocked = !hasPremium && index >= 5;
            const isUnlocked = earned && !isPremiumLocked;
            const isLocked = !earned || isPremiumLocked;
            return (
              <TouchableOpacity
                key={b.key}
                testID={`badge-${b.key}`}
                style={[
                  styles.badgeCard,
                  t.bgCard,
                  isUnlocked && styles.badgeEarned,
                  isUnlocked && {
                    ...(Platform.OS === 'web'
                      ? { boxShadow: '0 0 0 2px rgba(0,212,170,0.4)' }
                      : { shadowColor: '#00D4AA', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 }),
                  },
                  isNew && !isPremiumLocked && styles.badgeNew,
                  isLocked && {
                    borderStyle: 'dashed',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                    opacity: 0.75,
                  },
                ]}
                onPress={isPremiumLocked ? () => router.push('/paywall') : (earned ? () => setUnlockBadge(b.key) : undefined)}
                activeOpacity={isPremiumLocked ? 0.7 : (earned ? 0.7 : 1)}
              >
                {isNew && !isPremiumLocked && <View style={styles.newDot}><Text style={styles.newDotText}>NEU</Text></View>}

                {isLocked ? (
                  <>
                    <Ionicons name="lock-closed" size={28} color={t.colors.text.tertiary} style={{ marginBottom: 6 }} />
                    <Text style={[styles.badgeName, t.textPrimary]} numberOfLines={1}>
                      {isPremiumLocked ? 'Premium' : (b.category === 'hidden' ? '???' : b.name)}
                    </Text>
                    <Text style={styles.badgeHint} numberOfLines={2}>
                      {isPremiumLocked ? 'Mit Premium freischalten' : 'Noch gesperrt'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                    <Text style={[styles.badgeName, t.textPrimary]} numberOfLines={1}>{b.name}</Text>
                    <Text style={styles.badgeHint} numberOfLines={2}>{b.desc}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Premium upsell footer for free users */}
        {!hasPremium && (
          <TouchableOpacity
            testID="badges-premium-footer-cta"
            style={styles.badgesPremiumFooter}
            onPress={() => router.push('/paywall')}
          >
            <FoxMascot state="motivated" size="small" showSpeechBubble={false} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.badgesPremiumTitle, t.textPrimary]}>Alle {totalBadges} Badges freischalten</Text>
              <Text style={[styles.badgesPremiumSubtitle, t.textSecondary]}>Sammle alle Badges mit Fixi Premium</Text>
            </View>
            <Text style={styles.badgesPremiumArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Badge Unlock Modal */}
      <BadgeUnlockModal
        visible={!!unlockBadge}
        badgeKey={unlockBadge || ''}
        onDismiss={() => setUnlockBadge(null)}
      />
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text.primary, marginTop: 16, marginBottom: 20 },

  // Level Card
  levelCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    marginBottom: 24,
  },
  levelLabel: { fontSize: 13, color: Colors.text.tertiary, marginTop: 8 },
  levelName: { fontSize: 24, fontWeight: '800', color: Colors.text.primary },
  levelAccessory: { fontSize: 14, color: Colors.brand.primary, marginBottom: 16 },
  levelBar: { width: '100%', height: 8, backgroundColor: Colors.background.tertiary, borderRadius: 4, overflow: 'hidden' },
  levelBarFill: { height: '100%', borderRadius: 4 },
  levelPercent: { fontSize: 14, color: Colors.text.secondary, marginTop: 8 },
  levelNext: { fontSize: 12, color: Colors.text.tertiary, marginTop: 4 },

  // Evolution
  sectionTitle: { fontSize: 20, fontWeight: '600', color: Colors.text.primary, marginBottom: 12 },
  evolutionScroll: { marginBottom: 24 },
  evoItem: {
    width: 100,
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  evoItemCurrent: { borderColor: Colors.brand.primary },
  evoItemLocked: { opacity: 0.4 },
  evoImageWrap: {
    width: 72,
    height: 72,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evoImage: {
    width: 72,
    height: 72,
    backgroundColor: 'transparent',
  },
  evoName: { fontSize: 10, color: Colors.text.tertiary, marginTop: 6, textAlign: 'center' },
  evoNameActive: { color: Colors.text.primary, fontWeight: '600' },
  evoRange: { fontSize: 9, color: Colors.text.tertiary },
  currentDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand.primary,
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.text.primary, fontFamily: 'Nunito_900Black' },
  statLabel: { fontSize: 11, color: Colors.text.tertiary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.glass.stroke, marginVertical: 4 },

  // Challenge
  challengeCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  challengeCardLocked: { opacity: 0.7 },
  challengeTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 },
  challengeDesc: { fontSize: 13, color: Colors.text.secondary, marginBottom: 12 },
  challengeProgressBar: { height: 10, backgroundColor: Colors.background.tertiary, borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  challengeProgressFill: { height: '100%', backgroundColor: Colors.brand.primary, borderRadius: 5 },
  challengeProgressText: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 10 },
  challengeFixiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  challengeHint: { fontSize: 13, color: Colors.text.secondary, flex: 1 },
  challengeReward: { fontSize: 12, color: Colors.brand.primary, fontWeight: '600' },
  challengeLockedOverlay: { alignItems: 'center', paddingVertical: 10 },
  challengePremiumBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
  },
  challengePremiumText: { fontSize: 14, fontWeight: '600', color: Colors.text.inverse },

  // Filter
  filterScroll: { marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  filterBtnActive: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primaryDim },
  filterText: { fontSize: 13, color: Colors.text.tertiary },
  filterTextActive: { color: Colors.brand.primary, fontWeight: '600' },

  // Badge Grid
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '47%',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    position: 'relative',
  },
  badgeEarned: { borderColor: Colors.brand.primary, backgroundColor: Colors.brand.primaryDim },
  badgeNew: { borderColor: '#FFD700', borderWidth: 2 },
  newDot: {
    position: 'absolute',
    top: -6,
    right: 8,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newDotText: { fontSize: 9, fontWeight: '800', color: '#000' },
  badgeEmoji: { fontSize: 36, marginBottom: 6 },
  badgeLocked: { opacity: 0.25 },
  badgeName: { fontSize: 13, fontWeight: '600', color: Colors.text.primary, textAlign: 'center' },
  badgeNameLocked: { color: Colors.text.tertiary },
  badgeHint: { fontSize: 11, color: Colors.text.tertiary, textAlign: 'center', marginTop: 2 },
  badgePremiumLocked: {
    opacity: 0.5,
    borderColor: Colors.glass.stroke,
    borderStyle: 'dashed',
  },
  premiumLockIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  premiumLockIconText: { fontSize: 12 },
  badgesPremiumFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primaryDim,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    gap: 12,
  },
  badgesPremiumTitle: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  badgesPremiumSubtitle: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  badgesPremiumArrow: { fontSize: 20, color: Colors.brand.primary },
});
