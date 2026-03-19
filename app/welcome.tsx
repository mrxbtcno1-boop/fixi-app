import { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoxMascot } from '../src/components/FoxMascot';
import { trackEvent } from '../src/services/supabase';
import { useTheme } from '../src/contexts/ThemeContext';

const MINT = '#00D4AA';
const MINT_LIGHT = '#00B899';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 800,
    useNativeDriver: true,
  }).start();

  const handleContinue = async () => {
    await AsyncStorage.setItem('hasSeenWelcomeScreen', 'true');
    trackEvent('welcome_screen_continue');
    router.replace('/onboarding-name');
  };

  const bg = isDark ? '#080E1C' : '#F4F6FA';
  const headlineColor = isDark ? '#FFFFFF' : '#0D1526';
  const accentColor = isDark ? MINT : MINT_LIGHT;
  const statColor = isDark ? '#6B7280' : '#8A96A8';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          {/* Emotionaler Einstieg – oben */}
          <View style={styles.textTop}>
            <Text style={[styles.headline, { color: headlineColor }]}>
              Schulden fühlen sich endlos an.
            </Text>
            <Text style={[styles.subHeadline, { color: accentColor }]}>
              Fixi zeigt dir wann es vorbei ist.
            </Text>
          </View>

          {/* Fuchs zentriert */}
          <View style={styles.foxWrap}>
            <FoxMascot state="coaching" size="large" />
          </View>

          {/* Statistik-Text unten */}
          <Text style={[styles.stat, { color: statColor }]}>
            5,67 Millionen Deutsche haben Schulden.{'\n'}Du machst heute den ersten Schritt.
          </Text>

        </Animated.View>

        {/* CTA Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            testID="welcome-continue-btn"
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[MINT, '#00B896']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Meinen Plan erstellen</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingTop: 48, paddingBottom: 24 },
  textTop: { alignItems: 'center' },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Syne_800ExtraBold',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  subHeadline: {
    fontSize: 22,
    fontWeight: '600',
    color: MINT,
    textAlign: 'center',
    lineHeight: 30,
  },
  foxWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  stat: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 },
  btn: {
    height: 56,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 17, fontWeight: '700', color: '#0A0E1A' },
});
