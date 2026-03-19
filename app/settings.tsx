import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import { getLevel } from '../src/utils/calculations';
import { FoxMascot } from '../src/components/FoxMascot';
import { cancelAllNotifications, setupAllNotifications, requestPermissionIfReady } from '../src/services/NotificationService';
import { restorePurchases } from '../src/services/PurchaseService';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { useTheme, useThemeOverrides } from '../src/contexts/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const streakCount = useAppStore(s => s.streakCount);
  const setUserName = useAppStore(s => s.setUserName);
  const { mode, setMode } = useTheme();
  const method = useAppStore(s => s.method);
  const setMethod = useAppStore(s => s.setMethod);
  const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
  const setNotifications = useAppStore(s => s.setNotifications);
  const isPremium = useAppStore(s => s.isPremium);
  const debts = useAppStore(s => s.debts);
  const onboardingTotalDebt = useAppStore(s => s.onboardingTotalDebt);

  const totalDebt = debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt;
  const remaining = debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
  const percentPaid = totalDebt > 0 ? ((totalDebt - remaining) / totalDebt) * 100 : 0;
  const level = getLevel(percentPaid);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [showMethodFixi, setShowMethodFixi] = useState(false);
  const [restoreFixi, setRestoreFixi] = useState<{ text: string; state: 'celebrating' | 'coaching' } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handleMethodChange = useCallback((m: 'snowball' | 'avalanche') => {
    setMethod(m);
    setShowMethodFixi(true);
    setTimeout(() => setShowMethodFixi(false), 3000);
  }, [setMethod]);

  const handleRestorePurchases = useCallback(async () => {
    setRestoring(true);
    setRestoreFixi(null);
    try {
      const success = await restorePurchases();
      if (success) {
        useAppStore.setState({ isPremium: true });
        setRestoreFixi({ text: 'Premium wiederhergestellt!', state: 'celebrating' });
      } else {
        setRestoreFixi({ text: 'Kein aktives Abo gefunden.', state: 'coaching' });
      }
    } catch {
      setRestoreFixi({ text: 'Kein aktives Abo gefunden.', state: 'coaching' });
    } finally {
      setRestoring(false);
      setTimeout(() => setRestoreFixi(null), 4000);
    }
  }, []);

  const handleNotificationToggle = useCallback(async (value: boolean) => {
    setNotifications(value);
    if (value) {
      const granted = await requestPermissionIfReady();
      if (granted) {
        await setupAllNotifications(userName, streakCount, '', '', '');
      } else {
        setNotifications(false);
      }
    } else {
      await cancelAllNotifications();
    }
  }, [setNotifications, userName, streakCount]);

  const handleDeleteAllData = useCallback(() => {
    Alert.alert(
      'Alle Daten löschen?',
      'Bist du sicher? ALLE deine Daten werden unwiderruflich geloescht – Schulden, Fortschritt, Badges, alles.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Letzte Warnung',
              'Diese Aktion kann NICHT rückgängig gemacht werden. Wirklich alles löschen?',
              [
                { text: 'Nein, behalten', style: 'cancel' },
                {
                  text: 'Ja, alles löschen',
                  style: 'destructive',
                  onPress: () => {
                    useAppStore.persist.clearStorage();
                    router.replace('/');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [router]);

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} testID="settings-back-btn">
            <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, t.textPrimary]}>Einstellungen</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Method change Fixi feedback */}
        {showMethodFixi && (
          <View style={styles.fixiFeedback}>
            <FoxMascot state="excited" size="small" speechBubble={`Alles klar, ich berechne deinen Plan mit der ${method === 'snowball' ? 'Schneeball' : 'Lawinen'}-Methode neu!`} animated={false} />
          </View>
        )}

        {/* Profil */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Profil</Text>
        <View style={[styles.card, t.bgCard]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, t.textPrimary]}>Name</Text>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  testID="settings-name-input"
                />
                <TouchableOpacity onPress={() => { setUserName(nameInput); setEditingName(false); }} testID="settings-save-name">
                  <Ionicons name="checkmark-circle" size={24} color={Colors.brand.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} style={styles.settingValueRow} testID="settings-edit-name">
                <Text style={[styles.settingValue, t.textSecondary]}>{userName || 'Nicht gesetzt'}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, t.textPrimary]}>Fixi Level</Text>
            <Text style={[styles.settingValue, t.textSecondary]}>{level.emoji} {level.name}</Text>
          </View>
        </View>

        {/* Tilgungsmethode */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Tilgungsmethode</Text>
        <View style={[styles.card, t.bgCard]}>
          <TouchableOpacity
            style={[styles.methodOption, method === 'snowball' && styles.methodActive]}
            onPress={() => handleMethodChange('snowball')}
            testID="settings-method-snowball"
          >
            <View style={[styles.radio, method === 'snowball' && styles.radioActive]}>
              {method === 'snowball' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodText}>
              <Text style={[styles.methodLabel, t.textPrimary]}>Schneeball</Text>
              <Text style={[styles.methodDesc, t.textSecondary]}>Kleinste Schuld zuerst tilgen</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodOption, method === 'avalanche' && styles.methodActive]}
            onPress={() => handleMethodChange('avalanche')}
            testID="settings-method-avalanche"
          >
            <View style={[styles.radio, method === 'avalanche' && styles.radioActive]}>
              {method === 'avalanche' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodText}>
              <Text style={[styles.methodLabel, t.textPrimary]}>Lawine</Text>
              <Text style={[styles.methodDesc, t.textSecondary]}>Hoechster Zinssatz zuerst tilgen</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Benachrichtigungen */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Benachrichtigungen</Text>
        <View style={[styles.card, t.bgCard]}>
          <SettingToggle label="Alle Benachrichtigungen" value={notificationsEnabled} onToggle={handleNotificationToggle} testID="settings-notif-all" />
          {notificationsEnabled && (
            <>
              <SettingToggle label="Morgen-Motivation" value={useAppStore.getState().notifMorning} onToggle={(v) => useAppStore.setState({ notifMorning: v })} testID="settings-notif-morning" />
              <SettingToggle label="Abend-Erinnerung" value={useAppStore.getState().notifEvening} onToggle={(v) => useAppStore.setState({ notifEvening: v })} testID="settings-notif-evening" />
              <SettingToggle label="Streak-Warnung" value={useAppStore.getState().notifStreak} onToggle={(v) => useAppStore.setState({ notifStreak: v })} testID="settings-notif-streak" />
              <SettingToggle label="Weekly Digest" value={useAppStore.getState().notifDigest} onToggle={(v) => useAppStore.setState({ notifDigest: v })} testID="settings-notif-digest" />
              <SettingToggle label="Faelligkeits-Reminder" value={useAppStore.getState().notifDueDate} onToggle={(v) => useAppStore.setState({ notifDueDate: v })} testID="settings-notif-due" />
            </>
          )}
        </View>

        {/* Darstellung */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Darstellung</Text>
        <View style={[styles.card, t.bgCard]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, t.textPrimary]}>Erscheinungsbild</Text>
          </View>
          <View style={styles.themeRow}>
            {(['dark', 'light', 'system'] as const).map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.themeOption, mode === opt && styles.themeOptionActive]}
                onPress={() => setMode(opt)}
                testID={`settings-theme-${opt}`}
              >
                <Ionicons
                  name={opt === 'dark' ? 'moon' : opt === 'light' ? 'sunny' : 'phone-portrait'}
                  size={16}
                  color={mode === opt ? '#0A0E1A' : Colors.text.secondary}
                />
                <Text style={[styles.themeOptionText, mode === opt && styles.themeOptionTextActive]}>
                  {opt === 'dark' ? 'Dunkel' : opt === 'light' ? 'Hell' : 'System'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, t.textPrimary]}>Währung</Text>
            <Text style={[styles.settingValue, t.textSecondary]}>EUR</Text>
          </View>
        </View>

        {/* Premium */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Premium</Text>
        <View style={[styles.card, t.bgCard]}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/paywall')} testID="settings-premium-btn">
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={[styles.linkLabel, t.textPrimary]}>{isPremium ? 'Premium verwalten' : 'Premium freischalten'}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={handleRestorePurchases}
            disabled={restoring}
            testID="settings-restore-btn"
          >
            <Ionicons name="refresh" size={18} color={Colors.text.secondary} />
            <Text style={[styles.linkLabel, t.textPrimary]}>{restoring ? 'Wird geladen...' : 'Käufe wiederherstellen'}</Text>
            {restoring ? (
              <ActivityIndicator size="small" color={Colors.brand.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Restore Fixi feedback */}
        {restoreFixi && (
          <View style={styles.fixiFeedback}>
            <FoxMascot state={restoreFixi.state} size="small" speechBubble={restoreFixi.text} animated={false} />
          </View>
        )}

        {/* Über Fixi */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Über Fixi</Text>
        <View style={[styles.card, t.bgCard]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, t.textPrimary]}>Version</Text>
            <Text style={[styles.settingValue, t.textSecondary]}>1.1.0</Text>
          </View>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/privacy-policy')} testID="settings-privacy-btn">
            <Ionicons name="document-text" size={18} color={Colors.text.secondary} />
            <Text style={[styles.linkLabel, t.textPrimary]}>Datenschutzerklaerung</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/terms')} testID="settings-terms-btn">
            <Ionicons name="newspaper" size={18} color={Colors.text.secondary} />
            <Text style={[styles.linkLabel, t.textPrimary]}>Nutzungsbedingungen</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => Alert.alert('Feedback', 'Danke für dein Interesse! Feedback-Funktion kommt bald.')} testID="settings-feedback-btn">
            <Ionicons name="chatbubble-ellipses" size={18} color={Colors.text.secondary} />
            <Text style={[styles.linkLabel, t.textPrimary]}>Feedback geben</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Daten */}
        <Text style={[styles.sectionTitle, t.textPrimary]}>Daten</Text>
        <View style={[styles.card, t.bgCard]}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAllData} testID="settings-delete-data-btn">
            <Ionicons name="trash" size={18} color={Colors.functional.error} />
            <Text style={styles.dangerLabel}>Alle Daten löschen</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </ScreenWrapper>
  );
}

function SettingToggle({ label, value, onToggle, testID }: { label: string; value: boolean; onToggle: (v: boolean) => void; testID: string }) {
  const t = useThemeOverrides();
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.settingLabel, t.textPrimary]}>{label}</Text>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.background.tertiary, true: Colors.brand.primaryDim }}
        thumbColor={value ? Colors.brand.primary : Colors.text.tertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text.primary },
  fixiFeedback: { alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.stroke,
  },
  settingLabel: { fontSize: 15, color: Colors.text.primary, flex: 1 },
  settingValue: { fontSize: 15, color: Colors.text.tertiary },
  settingValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    width: 120,
    height: 36,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text.primary,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.stroke,
  },
  methodActive: { backgroundColor: Colors.brand.primaryDim },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioActive: { borderColor: Colors.brand.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brand.primary },
  methodText: { flex: 1 },
  methodLabel: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  methodDesc: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.stroke,
    gap: 12,
  },
  linkLabel: { flex: 1, fontSize: 15, color: Colors.text.primary },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  dangerLabel: { fontSize: 15, color: Colors.functional.error, fontWeight: '600' },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.stroke,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  themeOptionTextActive: {
    color: '#0A0E1A',
    fontWeight: '600',
  },
});
