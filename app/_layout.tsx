import { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { Nunito_900Black } from '@expo-google-fonts/nunito';
import { useAppStore } from '../src/store/useStore';
import { initRevenueCat, checkPremiumStatus } from '../src/services/PurchaseService';
import { ThemeProvider, useTheme, getCurrentThemeColors } from '../src/contexts/ThemeContext';
import { NotificationPermissionDialog } from '../src/components/NotificationPermissionDialog';

// Map fontWeight to the correct Inter font family variant
const INTER_WEIGHT_MAP: Record<string, string> = {
  'normal': 'Inter_400Regular',
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  'bold': 'Inter_700Bold',
  '700': 'Inter_700Bold',
  '800': 'Inter_700Bold',
};

// Export Syne font name for use in headline styles
export const SYNE_BOLD = 'Syne_800ExtraBold';
export const NUNITO_BLACK = 'Nunito_900Black';

// Dark-mode text color hex → theme text property mapping
const DARK_TEXT_COLOR_MAP: Record<string, 'primary' | 'secondary' | 'tertiary' | 'inverse'> = {
  // Old dark token values (from static Colors object)
  '#FFFFFF': 'primary',
  '#ffffff': 'primary',
  '#8892B0': 'secondary',
  '#8892b0': 'secondary',
  '#64748B': 'tertiary',
  '#64748b': 'tertiary',
  '#0A0E1A': 'inverse',
  '#0a0e1a': 'inverse',
  // New dark token values (from updated ThemeContext)
  '#F0F4FF': 'primary',
  '#f0f4ff': 'primary',
  '#8A9BBE': 'secondary',
  '#8a9bbe': 'secondary',
  '#5A6882': 'tertiary',
  '#5a6882': 'tertiary',
  '#080E1C': 'inverse',
  '#080e1c': 'inverse',
};

// Patch Text.render to inject correct Inter font + remap hardcoded dark colors to current theme
const originalTextRender = (Text as any).render;
if (originalTextRender) {
  (Text as any).render = function(props: any, ref: any) {
    const flatStyle = StyleSheet.flatten(props.style) || {};
    const patches: Record<string, string> = {};

    // Font mapping
    if (!flatStyle.fontFamily) {
      const weight = String(flatStyle.fontWeight || '400');
      patches.fontFamily = INTER_WEIGHT_MAP[weight] || 'Inter_400Regular';
    }

    // Color remapping: replace hardcoded dark-mode text colors with current theme colors
    if (flatStyle.color && DARK_TEXT_COLOR_MAP[flatStyle.color]) {
      const themeKey = DARK_TEXT_COLOR_MAP[flatStyle.color];
      const currentColors = getCurrentThemeColors();
      patches.color = currentColors.text[themeKey];
    }

    if (Object.keys(patches).length > 0) {
      return originalTextRender.call(this, {
        ...props,
        style: [props.style, patches],
      }, ref);
    }
    return originalTextRender.call(this, props, ref);
  };
}

// Patch TextInput.render similarly
const originalTextInputRender = (TextInput as any).render;
if (originalTextInputRender) {
  (TextInput as any).render = function(props: any, ref: any) {
    const flatStyle = StyleSheet.flatten(props.style) || {};
    const patches: Record<string, string> = {};

    if (!flatStyle.fontFamily) {
      const weight = String(flatStyle.fontWeight || '400');
      patches.fontFamily = INTER_WEIGHT_MAP[weight] || 'Inter_400Regular';
    }

    if (flatStyle.color && DARK_TEXT_COLOR_MAP[flatStyle.color]) {
      const themeKey = DARK_TEXT_COLOR_MAP[flatStyle.color];
      const currentColors = getCurrentThemeColors();
      patches.color = currentColors.text[themeKey];
    }

    if (Object.keys(patches).length > 0) {
      return originalTextInputRender.call(this, {
        ...props,
        style: [props.style, patches],
      }, ref);
    }
    return originalTextInputRender.call(this, props, ref);
  };
}

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const updateStreak = useAppStore(s => s.updateStreak);
  const initAnonymousUser = useAppStore(s => s.initAnonymousUser);
  const setPremium = useAppStore(s => s.setPremium);
  const { isDark, colors } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Syne_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    async function init() {
      try { initAnonymousUser(); } catch {}
      try { updateStreak(); } catch {}
      try {
        await initRevenueCat();
        const premium = await checkPremiumStatus();
        if (premium) setPremium(true);
      } catch {}
    }
    init();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding-name" />
        <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="interest-pain" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="add-debt" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="record-payment" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="simulator" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ai-coach" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="evening-reflection" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="weekly-digest" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="terms" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <NotificationPermissionDialog />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
