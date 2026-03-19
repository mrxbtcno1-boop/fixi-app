import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { trackEvent } from '../services/supabase';
import { useAppStore } from '../store/useStore';

const NOTIF_ASKED_KEY = 'fixi_notification_dialog_shown';

export function NotificationPermissionDialog() {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();
  const onboardingComplete = useAppStore(s => s.onboardingComplete);
  const userName = useAppStore(s => s.userName);
  const streakCount = useAppStore(s => s.streakCount);

  useEffect(() => {
    if (!onboardingComplete) return;

    const check = async () => {
      const asked = await AsyncStorage.getItem(NOTIF_ASKED_KEY);
      if (asked !== 'true') {
        setTimeout(() => setVisible(true), 3000);
      }
    };
    check();
  }, [onboardingComplete]);

  const handleAccept = useCallback(async () => {
    setVisible(false);
    await AsyncStorage.setItem(NOTIF_ASKED_KEY, 'true');
    trackEvent('notification_permission_granted');
    if (Platform.OS !== 'web') {
      try {
        const { requestPermissionIfReady, setupAllNotifications } = await import('../services/NotificationService');
        const granted = await requestPermissionIfReady();
        if (granted) {
          await setupAllNotifications(userName || '', streakCount, '', '', '');
        }
      } catch {}
    }
  }, [userName, streakCount]);

  const handleDismiss = useCallback(async () => {
    setVisible(false);
    await AsyncStorage.setItem(NOTIF_ASKED_KEY, 'true');
    trackEvent('notification_permission_dismissed');
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.dialog, { backgroundColor: colors.background.secondary, borderColor: colors.glass.stroke }]}>
        <Text style={styles.emoji}>{'\uD83E\uDD8A'}</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Soll Fixi dich t{'\u00E4'}glich daran erinnern deine Fortschritte einzutragen?
        </Text>
        <Text style={[styles.sub, { color: colors.text.secondary }]}>
          Du kannst das jederzeit in den Einstellungen {'\u00E4'}ndern.
        </Text>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={handleAccept}
          testID="notif-accept-btn"
          activeOpacity={0.8}
        >
          <Ionicons name="notifications" size={18} color="#0A0E1A" />
          <Text style={styles.acceptText}>Ja, erinnere mich</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={handleDismiss}
          testID="notif-dismiss-btn"
          activeOpacity={0.8}
        >
          <Text style={[styles.dismissText, { color: colors.text.tertiary }]}>Sp{'\u00E4'}ter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 99999,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8, lineHeight: 26 },
  sub: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 12,
  },
  acceptText: { fontSize: 16, fontWeight: '700', color: '#0A0E1A' },
  dismissBtn: { paddingVertical: 8 },
  dismissText: { fontSize: 15, fontWeight: '500' },
});
