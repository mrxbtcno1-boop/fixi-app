import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  background: { primary: string; secondary: string; tertiary: string };
  brand: { primary: string; primaryDim: string; secondary: string; secondaryDim: string };
  functional: { success: string; warning: string; error: string; info: string };
  text: { primary: string; secondary: string; tertiary: string; inverse: string };
  glass: { stroke: string; fill: string };
}

const DARK: ThemeColors = {
  background: { primary: '#080E1C', secondary: '#0D1526', tertiary: '#1A2540' },
  text: { primary: '#F0F4FF', secondary: '#8A9BBE', tertiary: '#5A6882', inverse: '#080E1C' },
  brand: { primary: '#00D4AA', primaryDim: 'rgba(0, 212, 170, 0.2)', secondary: '#7B61FF', secondaryDim: 'rgba(123, 97, 255, 0.2)' },
  functional: { success: '#00D4AA', warning: '#FFB06B', error: '#FF6B6B', info: '#6B9FFF' },
  glass: { stroke: 'rgba(255, 255, 255, 0.06)', fill: 'rgba(13, 21, 38, 0.85)' },
};

const LIGHT: ThemeColors = {
  background: { primary: '#F4F6FA', secondary: '#FFFFFF', tertiary: '#E8ECF2' },
  text: { primary: '#0D1526', secondary: '#5A6478', tertiary: '#8A96A8', inverse: '#FFFFFF' },
  brand: { primary: '#00B899', primaryDim: 'rgba(0, 184, 153, 0.15)', secondary: '#6C5CE7', secondaryDim: 'rgba(108, 92, 231, 0.15)' },
  functional: { success: '#00B899', warning: '#E17055', error: '#E05555', info: '#0984E3' },
  glass: { stroke: 'rgba(0, 0, 0, 0.08)', fill: 'rgba(255, 255, 255, 0.9)' },
};

interface ThemeContextType {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DARK,
  mode: 'dark',
  isDark: true,
  setMode: () => {},
});

const THEME_KEY = 'fixi_theme_mode';

// Global theme reference for Text.render color patch (set by ThemeProvider)
let _currentThemeColors: ThemeColors = DARK;

export function getCurrentThemeColors(): ThemeColors {
  return _currentThemeColors;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(stored => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode);
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme !== 'light');
  const colors = isDark ? DARK : LIGHT;
  _currentThemeColors = colors;

  return (
    <ThemeContext.Provider value={{ colors, mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeOverrides() {
  const { colors, isDark } = useContext(ThemeContext);
  return {
    bg: { backgroundColor: colors.background.primary },
    bgCard: { backgroundColor: colors.background.secondary, borderColor: colors.glass.stroke },
    bgCardGlass: isDark
      ? { backgroundColor: 'rgba(13,21,38,0.85)', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 }
      : { backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1 },
    gold: isDark ? '#FFB800' : '#E5A500',
    bgTertiary: { backgroundColor: colors.background.tertiary },
    textPrimary: { color: colors.text.primary },
    textSecondary: { color: colors.text.secondary },
    textTertiary: { color: colors.text.tertiary },
    textInverse: { color: colors.text.inverse },
    border: { borderColor: colors.glass.stroke },
    borderBottom: { borderBottomColor: colors.glass.stroke },
    borderTop: { borderTopColor: colors.glass.stroke },
    glass: { backgroundColor: colors.glass.fill, borderColor: colors.glass.stroke },
    isDark,
    colors,
  };
}
