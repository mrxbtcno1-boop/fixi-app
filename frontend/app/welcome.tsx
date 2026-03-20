import { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoxMascot } from '../src/components/FoxMascot';
import { trackEvent } from '../src/services/supabase';
import { useTheme } from '../src/contexts/ThemeContext';

const MINT = '#00D4AA';
const TYPING_TEXT = 'Endlich einen Plan. Endlich frei. 🦊';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [displayText, setDisplayText] = useState('');
  const bobbingAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.92)).current;

  const bg = isDark ? '#080E1C' : '#F4F6FA';
  const headlineColor = isDark ? '#F0F4FF' : '#0D1526';
  const statColor = isDark ? '#5A6882' : '#8A96A8';
  const bubbleBg = isDark ? 'rgba(0,212,170,0.12)' : '#E8FDF8';
  const bubbleBorder = isDark ? 'rgba(0,212,170,0.4)' : 'rgba(0,184,153,0.3)';

  // Fade in whole screen
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  // Bobbing animation for mascot
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobbingAnim, { toValue: -10, duration: 1300, useNativeDriver: true }),
        Animated.timing(bobbingAnim, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Typing effect for speech bubble
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayText(TYPING_TEXT.substring(0, i));
        if (i >= TYPING_TEXT.length) clearInterval(interval);
      }, 45);
      return () => clearInterval(interval);
    }, 600);
    return () => clearTimeout(timeout);
  }, []);

  // Button pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnScale, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 0.97, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleContinue = async () => {
    await AsyncStorage.setItem('hasSeenWelcomeScreen', 'true');
    trackEvent('welcome_screen_continue');
    router.replace('/onboarding-name');
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
          {/* Headline */}
          <View style={styles.textTop}>
            <Text style={[styles.headline, { color: headlineColor, fontFamily: 'Nunito_900Black' }]}>
              Schulden fühlen sich{'\n'}endlos an.
            </Text>
            <Text style={[styles.subHeadline, { color: MINT, fontFamily: 'Nunito_900Black' }]}>
              Fixi zeigt dir wann es vorbei ist.
            </Text>
          </View>

          {/* Mascot with bobbing */}
          <View style={styles.foxSection}>
            <Animated.View
              style={[
                styles.foxWrapper,
                { transform: [{ scale: 1.22 }, { translateY: bobbingAnim }] },
              ]}
            >
              <FoxMascot state="happy" size="large" animated={false} />
            </Animated.View>

            {/* Typing speech bubble */}
            {displayText.length > 0 && (
              <View
                style={[
                  styles.typingBubble,
                  { backgroundColor: bubbleBg, borderColor: bubbleBorder },
                ]}
              >
                <Text style={[styles.typingText, { fontFamily: 'Nunito_900Black', color: MINT }]}>
                  {displayText}
                </Text>
              </View>
            )}
          </View>

          {/* Stat text */}
          <Text style={[styles.stat, { color: statColor, fontFamily: 'Inter_500Medium' }]}>
            5,67 Mio. Deutsche haben Schulden.{'\n'}Du machst heute den ersten Schritt.
          </Text>
        </Animated.View>

        {/* CTA */}
        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              testID="welcome-continue-btn"
              onPress={handleContinue}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#00D4AA', '#00B896']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btn}
              >
                <Text style={[styles.btnText, { fontFamily: 'Nunito_900Black' }]}>
                  Meinen Plan erstellen
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 40 },
  textTop: { alignItems: 'center', marginBottom: 8 },
  headline: {
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  subHeadline: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
    color: '#00D4AA',
  },
  foxSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  foxWrapper: { alignItems: 'center', justifyContent: 'center' },
  typingBubble: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    maxWidth: 280,
  },
  typingText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  stat: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingBottom: 16,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },
  btn: {
    height: 58,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  btnText: { fontSize: 18, color: '#0A0E1A' },
});
