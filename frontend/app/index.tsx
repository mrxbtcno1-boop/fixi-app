import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../src/store/useStore';
import { useTheme } from '../src/contexts/ThemeContext';

export default function Index() {
  const router = useRouter();
  const onboardingComplete = useAppStore(s => s.onboardingComplete);
  const hasHydrated = useAppStore(s => s._hasHydrated);
  const { colors } = useTheme();

  useEffect(() => {
    if (!hasHydrated) return;

    const timer = setTimeout(async () => {
      if (onboardingComplete) {
        router.replace('/(tabs)');
        return;
      }
      // New P1.5 flow: Welcome → Name → Onboarding
      const [seenWelcome, seenName] = await Promise.all([
        AsyncStorage.getItem('hasSeenWelcomeScreen'),
        AsyncStorage.getItem('hasSeenNameScreen'),
      ]);
      if (!seenWelcome) {
        router.replace('/welcome');
      } else if (!seenName) {
        router.replace('/onboarding-name');
      } else {
        // Name already collected → skip to step 3 (V1.3 – age screen)
        router.replace('/onboarding/step3');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [hasHydrated, onboardingComplete]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary }}>
      <ActivityIndicator size="large" color={colors.brand.primary} />
    </View>
  );
}
