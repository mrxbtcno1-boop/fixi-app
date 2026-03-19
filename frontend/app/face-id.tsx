import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Spacing, BorderRadius } from '../src/constants/theme';
import { FoxMascot } from '../src/components/FoxMascot';
import { useThemeOverrides } from '../src/contexts/ThemeContext';

import {
  requestNotificationPermissions,
  scheduleDebtFreeNotifications,
  KEY_PLANNED_FREEDOM_DATE,
} from '../src/services/NotificationService';

const TRUST_ITEMS = [
  {
    icon: 'lock-closed-outline' as const,
    text: 'Nur du kannst deine Daten sehen',
  },
  {
    icon: 'phone-portrait-outline' as const,
    text: 'Alles lokal auf deinem Gerät gespeichert',
  },
  {
    icon: 'cloud-offline-outline' as const,
    text: 'Keine Cloud, kein Account, keine Weitergabe',
  },
];

export default function FaceIdScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const [checking, setChecking] = useState(true);
  const [biometricType, setBiometricType] = useState<'face' | 'finger'>('face');

  // Entrance stagger anims
  const foxAnim   = useRef(new Animated.Value(0)).current;
  const circleAnim = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const trustAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  // Pulse on icon circle
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkBiometrics();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const startStaggerIn = () => {
    const fade = (anim: Animated.Value, delay: number) =>
      Animated.timing(anim, { toValue: 1, duration: 420, delay, useNativeDriver: true });
    Animated.parallel([
      fade(foxAnim, 0),
      fade(circleAnim, 160),
      fade(headlineAnim, 300),
      fade(trustAnim, 460),
      fade(footerAnim, 580),
    ]).start(() => startPulse());
  };

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        router.replace('/paywall');
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      setBiometricType(hasFaceId ? 'face' : 'finger');
      setChecking(false);
      startStaggerIn();
    } catch {
      router.replace('/paywall');
    }
  };

  const handleActivate = async () => {
    try {
      const biometricLabel = biometricType === 'face' ? 'Face ID aktivieren' : 'Fingerabdruck aktivieren';
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: biometricLabel,
        cancelLabel: 'Abbrechen',
      });
      await AsyncStorage.setItem('faceIdEnabled', result.success ? 'true' : 'false');
    } catch {
      await AsyncStorage.setItem('faceIdEnabled', 'false');
    }
    await _requestAndScheduleNotifications();
    router.replace('/paywall');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('faceIdEnabled', 'false');
    await _requestAndScheduleNotifications();
    router.replace('/paywall');
  };

  // Request notification permission + schedule freedom day notifications
  const _requestAndScheduleNotifications = async () => {
    try {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
      const storedDate = await AsyncStorage.getItem(KEY_PLANNED_FREEDOM_DATE);
      if (storedDate) {
        await scheduleDebtFreeNotifications(new Date(storedDate));
      }
    } catch (e) {
      console.warn('[Fixi] Notification setup error:', e);
    }
  };

  if (checking) {
    return (
      <View style={[styles.loader, t.bg]}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  const biometricLabel = biometricType === 'face' ? 'Face ID' : 'Fingerabdruck';
  const iconName: React.ComponentProps<typeof Ionicons>['name'] =
    biometricType === 'face' ? 'scan-outline' : 'finger-print-outline';
  const speechBubble = biometricType === 'face'
    ? 'Deine Daten gehören dir. Ich pass auf. 🦊'
    : 'Niemand außer dir kommt hier rein. 🦊';

  return (
    <View style={[styles.container, t.bg]}>
      <SafeAreaView style={styles.safe}>
        {/* Fox – first element to appear */}
        <Animated.View style={[styles.foxWrap, { opacity: foxAnim }]}>
          <FoxMascot
            state="coaching"
            size="medium"
            speechBubble={speechBubble}
          />
        </Animated.View>

        <View style={styles.content}>
          {/* Biometric icon with pulse glow */}
          <Animated.View
            style={[
              styles.iconCircle,
              { transform: [{ scale: pulseAnim }], opacity: circleAnim },
            ]}
          >
            <LinearGradient
              colors={['rgba(0,212,170,0.18)', 'rgba(0,212,170,0.06)']}
              style={styles.iconCircleInner}
            >
              <Ionicons name={iconName} size={52} color="#00D4AA" />
            </LinearGradient>
          </Animated.View>

          {/* Headline */}
          <Animated.Text
            style={[styles.headline, t.textPrimary, { opacity: headlineAnim }]}
          >
            Deine Finanzen.{'\n'}Nur für dich.
          </Animated.Text>
          <Animated.Text
            style={[styles.subtext, t.textSecondary, { opacity: headlineAnim }]}
          >
            {biometricLabel} schützt deinen Zugang –{'\n'}schnell, sicher, privat.
          </Animated.Text>

          {/* 3 Trust rows */}
          <Animated.View style={[styles.trustCard, { opacity: trustAnim, backgroundColor: t.isDark ? 'rgba(0,212,170,0.06)' : 'rgba(0,212,170,0.04)', borderColor: t.isDark ? 'rgba(0,212,170,0.15)' : 'rgba(0,212,170,0.2)' }]}>
            {TRUST_ITEMS.map((item, i) => (
              <View key={i} style={[styles.trustRow, i < TRUST_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={styles.trustIconWrap}>
                  <Ionicons name={item.icon} size={14} color="#00D4AA" />
                </View>
                <Text style={[styles.trustText, t.textSecondary]}>{item.text}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* CTAs */}
        <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
          <TouchableOpacity
            testID="face-id-activate-btn"
            onPress={handleActivate}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00D4AA', '#00A88A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activateBtn}
            >
              <Ionicons name={iconName} size={20} color="#0A0E1A" style={{ marginRight: 10 }} />
              <Text style={[styles.activateBtnText, { fontFamily: 'Nunito_900Black' }]}>
                {biometricLabel} aktivieren
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            testID="face-id-skip-btn"
            onPress={handleSkip}
            style={styles.skipBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipBtnText, t.textTertiary, { fontFamily: 'Inter_400Regular' }]}>
              Jetzt nicht
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  safe: { flex: 1 },
  foxWrap: {
    alignItems: 'center',
    paddingTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: 'rgba(0,212,170,0.3)',
    overflow: 'hidden',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  iconCircleInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 30,
    fontFamily: 'Nunito_900Black',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtext: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 23,
  },
  trustCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  trustIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,212,170,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    paddingTop: 8,
    gap: 12,
  },
  activateBtn: {
    height: 58,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  activateBtnText: { fontSize: 17, color: '#0A0E1A' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { fontSize: 15 },
});
