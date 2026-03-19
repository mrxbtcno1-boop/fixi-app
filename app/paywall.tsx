import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useThemeOverrides } from '../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { FoxMascot } from '../src/components/FoxMascot';
import { purchasePackage as purchasePkg, restorePurchases, getOfferings } from '../src/services/PurchaseService';
import { useAppStore } from '../src/store/useStore';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { trackEvent } from '../src/services/supabase';
import { PurchasesPackage } from 'react-native-purchases';

const ENTITLEMENT_ID = 'Fixi - Schuldenfrei mit Plan Pro';

const FEATURES = [
  { iconName: 'bulb-outline', title: 'KI-Sparplan von Fixi', subtitle: '"Ich finde wo du sparen kannst"' },
  { iconName: 'trending-up', title: 'Was-wäre-wenn Simulator', subtitle: '"Sieh wie viel schneller es gehen könnte"' },
  { iconName: 'trophy-outline', title: 'Volle Gamification', subtitle: '"Badges, Challenges, Level-Ups"' },
  { iconName: 'bar-chart-outline', title: 'Detaillierte Statistiken', subtitle: '"Dein Fortschritt, visualisiert"' },
  { iconName: 'calendar-outline', title: 'Wöchentliche Fortschritts-Berichte', subtitle: '"Dein Wochen-Rückblick, jeden Sonntag"' },
  { iconName: 'chatbubble-ellipses-outline', title: 'Unbegrenzter KI-Coach', subtitle: '"Frag Fixi alles, jederzeit"' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<'yearly' | 'monthly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [useStaticPrices, setUseStaticPrices] = useState(false);
  const setPremium = useAppStore(s => s.setPremium);
  const t = useThemeOverrides();
  const { isDark } = useTheme();
  const startTrial = useAppStore(s => s.startTrial);

  useEffect(() => {
    async function loadOfferings() {
      try {
        const pkgs = await getOfferings();
        if (pkgs.length > 0) {
          setPackages(pkgs);
        } else {
          setUseStaticPrices(true);
        }
      } catch {
        setUseStaticPrices(true);
      }
    }
    loadOfferings();
  }, []);

  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    trackEvent('paywall_viewed');
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleStartTrial = useCallback(async () => {
    setLoading(true);
    trackEvent('paywall_cta_clicked', { plan: selected });
    try {
      if (packages.length > 0) {
        const pkg = packages.find(p =>
          selected === 'yearly' ? p.packageType === 'ANNUAL' : p.packageType === 'MONTHLY'
        ) || packages.find(p =>
          p.product.identifier === (selected === 'yearly' ? 'com.fixi.premium.yearly' : 'com.fixi.premium.monthly')
        );
        if (pkg) {
          trackEvent('purchase_started', { plan: selected });
          const success = await purchasePkg(pkg);
          if (success) {
            trackEvent('purchase_completed', { plan: selected });
            setPremium(true);
            startTrial(selected);
            router.replace('/(tabs)');
          }
        } else {
          Alert.alert('Nicht verfügbar', 'Käufe sind aktuell nicht verfügbar. Bitte versuche es später erneut.', [{ text: 'OK' }]);
        }
      } else {
        Alert.alert('Nicht verfügbar', 'Käufe sind aktuell nicht verfügbar. Bitte versuche es später erneut.', [{ text: 'OK' }]);
      }
    } catch (error: any) {
      if (!error?.userCancelled) {
        trackEvent('purchase_failed', { error: error?.message || 'unknown' });
        Alert.alert('Fehler', 'Der Kauf konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
      }
    } finally {
      setLoading(false);
    }
  }, [selected, packages, startTrial, router, setPremium]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        setPremium(true);
        Alert.alert('Erfolg', 'Dein Premium-Abo wurde wiederhergestellt!', [{ text: 'Weiter', onPress: () => router.replace('/(tabs)') }]);
      } else {
        Alert.alert('Kein Abo gefunden', 'Es wurde kein aktives Abo gefunden.');
      }
    } catch (error: any) {
      Alert.alert('Fehler', error?.message || 'Käufe konnten nicht wiederhergestellt werden.');
    } finally {
      setRestoring(false);
    }
  }, [router, setPremium]);

  const handleSkip = () => router.replace('/(tabs)');

  const ctaPrice = selected === 'yearly' ? '39,99€/Jahr' : '6,99€/Monat';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <ScreenWrapper>
      <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? Colors.background.primary : '#FFFFFF' }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Fox Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.fixiContainer}>
            <FoxMascot
              state="excited"
              size="large"
              animated={true}
              showSpeechBubble={true}
              speechBubble="Ich bin bereit wenn du es bist!"
            />
          </Animated.View>

          {/* Features Section */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={[styles.featuresSection, t.bgCard, { borderRadius: BorderRadius.lg }]}>
            <Text style={[styles.sectionTitle, t.textPrimary]}>Was du mit Fixi Premium bekommst:</Text>
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(250 + index * 60).duration(350)}
              >
                <View style={[styles.featureRow, index < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: dividerColor }]}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons name={feature.iconName as any} size={22} color="#00D4AA" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, t.textPrimary]}>{feature.title}</Text>
                    <Text style={[styles.featureSubtitle, t.textSecondary]}>{feature.subtitle}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Plan Selection */}
          <View style={styles.plansSection}>
            {/* Yearly Plan */}
            <TouchableOpacity
              onPress={() => setSelected('yearly')}
              activeOpacity={0.8}
              testID="plan-yearly"
              style={[
                styles.planCard,
                {
                  borderWidth: 2,
                  borderColor: selected === 'yearly' ? '#00D4AA' : t.colors.glass.stroke,
                  backgroundColor: selected === 'yearly'
                    ? (isDark ? 'rgba(0,212,170,0.1)' : '#F0FDF9')
                    : t.colors.background.secondary,
                },
              ]}
            >
              {/* Best option badge */}
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>BELIEBTESTE OPTION</Text>
              </View>

              <View style={styles.planHeader}>
                <Text style={[styles.planName, t.textPrimary]}>Jährlich</Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.planPrice, t.textPrimary]}>39,99€/Jahr</Text>
                  <Text style={[styles.planPriceMonthly, t.textSecondary]}>= 3,33€/Monat</Text>
                </View>
              </View>

              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>Du sparst 52%</Text>
              </View>

              {selected === 'yearly' && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#00D4AA" />
                </View>
              )}
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              onPress={() => setSelected('monthly')}
              activeOpacity={0.8}
              testID="plan-monthly"
              style={[
                styles.planCard,
                styles.monthlyCard,
                t.bgCard,
                selected === 'monthly' && { borderColor: '#00D4AA', borderWidth: 2 },
              ]}
            >
              <View style={styles.monthlyInner}>
                <Text style={[styles.monthlyName, t.textPrimary]}>Monatlich</Text>
                <Text style={[styles.monthlyPrice, t.textSecondary]}>6,99€/Mon.</Text>
              </View>
              {selected === 'monthly' && (
                <View style={styles.checkmarkMonthly}>
                  <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* CTA Button */}
          <RNAnimated.View style={[styles.ctaContainer, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              onPress={handleStartTrial}
              disabled={loading}
              testID="start-trial-btn"
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#00D4AA', '#00A88A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.ctaBtn, loading && styles.btnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaBtnText}>7 Tage GRATIS testen</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </RNAnimated.View>

          <Text style={[styles.priceInfo, t.textSecondary]}>
            Dann {ctaPrice}. Jederzeit kündbar.
          </Text>

          <TouchableOpacity
            onPress={handleRestore}
            disabled={restoring}
            style={styles.restoreBtn}
            testID="restore-btn"
          >
            {restoring ? (
              <ActivityIndicator size="small" color={t.colors.text.tertiary} />
            ) : (
              <Text style={styles.restoreText}>Käufe wiederherstellen</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            testID="skip-btn"
          >
            <Text style={styles.skipText}>Erstmal ohne Premium weiter →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  fixiContainer: { alignItems: 'center', marginBottom: Spacing.md },

  // Features
  featuresSection: { marginBottom: Spacing.xl, padding: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: Spacing.sm, textAlign: 'center' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,212,170,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  featureSubtitle: { fontSize: 12, fontStyle: 'italic' },

  // Plans
  plansSection: { marginBottom: Spacing.lg },
  planCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  bestBadge: {
    backgroundColor: '#00D4AA',
    marginBottom: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bestBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  planName: { fontSize: 18, fontWeight: '700' },
  priceContainer: { alignItems: 'flex-end' },
  planPrice: { fontSize: 18, fontWeight: '700', fontFamily: 'Nunito_900Black' },
  planPriceMonthly: { fontSize: 12, marginTop: 2 },
  savingsBadge: {
    backgroundColor: '#00D4AA',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  savingsText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  checkmark: { position: 'absolute', top: Spacing.md, right: Spacing.md },
  monthlyCard: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthlyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  monthlyName: { fontSize: 16, fontWeight: '600' },
  monthlyPrice: { fontSize: 16, fontWeight: '600' },
  checkmarkMonthly: { marginLeft: Spacing.sm },

  // CTA
  ctaContainer: { marginBottom: Spacing.sm },
  ctaBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  btnDisabled: { opacity: 0.7 },
  ctaBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito_900Black',
  },
  priceInfo: { fontSize: 13, textAlign: 'center', marginBottom: Spacing.md },
  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  restoreText: { fontSize: 13, color: Colors.text.tertiary, textDecorationLine: 'underline' },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { fontSize: 14, color: Colors.text.tertiary },
});
