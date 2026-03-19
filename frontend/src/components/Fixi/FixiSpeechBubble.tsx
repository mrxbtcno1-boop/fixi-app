import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import { useThemeOverrides } from '../../contexts/ThemeContext';

interface Props {
  text: string;
  animated?: boolean;
  maxWidth?: number;
}

export function FixiSpeechBubble({ text, animated = true, maxWidth = 220 }: Props) {
  const t = useThemeOverrides();
  const [displayText, setDisplayText] = useState(animated ? '' : text);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!animated) {
      setDisplayText(text);
      return;
    }
    setDisplayText('');
    indexRef.current = 0;

    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current <= text.length) {
        setDisplayText(text.substring(0, indexRef.current));
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 25);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, animated]);

  return (
    <View style={[styles.container, { maxWidth }]}>
      <View style={[styles.bubble, { backgroundColor: t.isDark ? Colors.background.secondary : '#E8F5F0', borderColor: t.isDark ? Colors.glass.stroke : '#D0E8E0' }]}>
        <Text style={[styles.text, { color: t.isDark ? '#FFFFFF' : '#1A1F36' }]}>{displayText}</Text>
      </View>
      <View style={[styles.arrow, { borderTopColor: t.isDark ? Colors.background.secondary : '#E8F5F0' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  text: {
    fontSize: 13,
    color: Colors.text.primary,
    lineHeight: 18,
    textAlign: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.background.secondary,
    marginTop: -1,
  },
});
