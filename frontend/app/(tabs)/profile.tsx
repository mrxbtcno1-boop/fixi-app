import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { useAppStore } from '../../src/store/useStore';
import { useRouter } from 'expo-router';
import { getFixiLevel } from '../../src/components/Fixi/FixiAccessories';
import { ShareCard } from '../../src/components/ShareCard';
import { cancelAllNotifications, setupAllNotifications, requestPermissionIfReady } from '../../src/services/NotificationService';
import { ScreenWrapper } from '../../src/components/ScreenWrapper';
import { useThemeOverrides } from '../../src/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FoxMascot } from '../../src/components/FoxMascot';

const AVATAR_GRADIENTS: [string, string][] = [
  ['#00D4AA', '#00A88A'],
  ['#5B9CF6', '#3B7FE0'],
  ['#FFB800', '#E5A500'],
  ['#FF6B6B', '#E05555'],
  ['#A855F7', '#8B33E8'],
  ['#0D1526', '#1A2540'],
];

export default function ProfileScreen() {
  const router = useRouter();
  const t = useThemeOverrides();
  const userName = useAppStore((s) => s.userName);
  const setUserName = useAppStore((s) => s.setUserName);
  const selectedAvatar = useAppStore((s) => s.selectedAvatar);
  const setAvatar = useAppStore((s) => s.setAvatar);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotifications = useAppStore((s) => s.setNotifications);
  const method = useAppStore((s) => s.method);
  const setMethod = useAppStore((s) => s.setMethod);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const isPremium = useAppStore((s) => s.isPremium);
  const isTrialActive = useAppStore((s) => s.isTrialActive);
  const streakCount = useAppStore((s) => s.streakCount);
  const getTrialDay = useAppStore((s) => s.getTrialDay);
  const trialStartDate = useAppStore((s) => s.trialStartDate);

  const debts = useAppStore((s) => s.debts);
  const onboardingTotalDebt = useAppStore((s) => s.onboardingTotalDebt);

  const totalDebt = debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt;
  const remaining = debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
  const percentPaid = totalDebt > 0 ? ((totalDebt - remaining) / totalDebt) * 100 : 0;
  const fixiLevel = getFixiLevel(percentPaid);

  // Correct premium check: paid premium (no trial) OR active trial
  const hasPremiumAccess = (isPremium && !trialStartDate) || (trialStartDate !== null && isTrialActive());

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Avatar initial
  const avatarInitial = userName ? userName.trim().charAt(0).toUpperCase() : null;
  const currentGradient = AVATAR_GRADIENTS[Math.min(selectedAvatar ?? 0, AVATAR_GRADIENTS.length - 1)];

  const handleSaveName = () => {
    setUserName(nameInput);
    setEditingName(false);
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    if (value) {
      const granted = await requestPermissionIfReady();
      if (granted) {
        await setupAllNotifications(userName, streakCount, '', '', '');
      } else {
        Alert.alert('Benachrichtigungen', 'Bitte erlaube Benachrichtigungen in deinen Geräte-Einstellungen.');
        setNotifications(false);
      }
    } else {
      await cancelAllNotifications();
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Daten zurücksetzen?',
      'Alle deine Daten werden gelöscht. Das kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zurücksetzen',
          style: 'destructive',
          onPress: () => {
            resetOnboarding();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
        <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, t.textPrimary]}>Profil</Text>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            testID="profile-settings-btn"
            style={styles.settingsGear}
          >
            <Ionicons name="settings-outline" size={22} color={t.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Avatar – Initial-System */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={currentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            {avatarInitial ? (
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            ) : (
              <FoxMascot state="happy" size="tiny" animated={false} />
            )}
          </LinearGradient>
          <TouchableOpacity
            testID="avatar-change-btn"
            onPress={() => setShowColorPicker(true)}
            style={styles.avatarChangeLink}
          >
            <Text style={styles.avatarChangeLinkText}>Avatar ändern</Text>
          </TouchableOpacity>
        </View>

        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowColorPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowColorPicker(false)}
          >
            <View style={[styles.colorSheet, t.bgCard]}>
              <Text style={[styles.colorSheetTitle, t.textPrimary]}>Farbe wählen</Text>
              <View style={styles.colorGrid}>
                {AVATAR_GRADIENTS.map((grad, i) => (
                  <TouchableOpacity
                    key={i}
                    testID={`color-option-${i}`}
                    onPress={() => { setAvatar(i); setShowColorPicker(false); }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={grad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.colorOption,
                        (selectedAvatar ?? 0) === i && styles.colorOptionSelected,
                      ]}
                    >
                      {(selectedAvatar ?? 0) === i && (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Name */}
        <View style={[styles.card, t.bgCard]}>
          <Text style={[styles.cardTitle, t.textPrimary]}>Name</Text>
          {editingName ? (
            <View style={styles.nameRow}>
              <TextInput
                testID="name-input"
                style={[styles.nameInput, { backgroundColor: t.colors.background.tertiary, color: t.colors.text.primary, borderColor: t.colors.glass.stroke }]}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Dein Name"
                placeholderTextColor={t.colors.text.tertiary}
              />
              <TouchableOpacity testID="save-name-btn" onPress={handleSaveName} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity testID="edit-name-btn" onPress={() => setEditingName(true)}>
              <Text style={[styles.nameDisplay, t.textSecondary]}>{userName || 'Name hinzufügen...'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <View style={[styles.card, t.bgCard]}>
          <Text style={[styles.cardTitle, t.textPrimary]}>Einstellungen</Text>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, t.textPrimary]}>Benachrichtigungen</Text>
            <Switch
              testID="notifications-switch"
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: Colors.background.tertiary, true: Colors.brand.primaryDim }}
              thumbColor={notificationsEnabled ? Colors.brand.primary : Colors.text.tertiary}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, t.textPrimary]}>Tilgungsmethode</Text>
            <View style={[styles.methodToggle, t.bgTertiary]}>
              <TouchableOpacity
                testID="profile-method-snowball"
                style={[styles.methodBtn, method === 'snowball' && styles.methodActive, method === 'snowball' && { backgroundColor: t.colors.background.secondary }]}
                onPress={() => setMethod('snowball')}
              >
                <Text style={[styles.methodText, method === 'snowball' ? t.textPrimary : t.textTertiary]}>Schneeball</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="profile-method-avalanche"
                style={[styles.methodBtn, method === 'avalanche' && styles.methodActive, method === 'avalanche' && { backgroundColor: t.colors.background.secondary }]}
                onPress={() => setMethod('avalanche')}
              >
                <Text style={[styles.methodText, method === 'avalanche' ? t.textPrimary : t.textTertiary]}>Lawine</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Premium */}
        <View style={[styles.card, t.bgCard]}>
          <Text style={[styles.cardTitle, t.textPrimary]}>Abonnement</Text>
          <View style={styles.premiumStatusRow}>
            {isPremium && trialStartDate && isTrialActive() ? (
              <>
                <Ionicons name="time-outline" size={16} color="#FFB800" />
                <Text style={[styles.premiumStatus, t.textSecondary, { marginLeft: 6 }]}>
                  Premium Trial – Tag {getTrialDay()}/7
                </Text>
              </>
            ) : isPremium ? (
              <>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={[styles.premiumStatus, { color: '#00D4AA', marginLeft: 6 }]}>
                  Premium aktiv
                </Text>
              </>
            ) : (
              <Text style={[styles.premiumStatus, t.textSecondary]}>Free Version</Text>
            )}
          </View>
          {!isPremium && (
            <TouchableOpacity testID="upgrade-btn" onPress={() => router.push('/paywall')} style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Auf Premium upgraden</Text>
            </TouchableOpacity>
          )}
          {isPremium && trialStartDate && isTrialActive() && (
            <Text style={[styles.premiumStatus, { fontSize: 13, color: Colors.text.tertiary, marginTop: 4 }]}>
              Noch {7 - getTrialDay() + 1} Tage kostenlos testen
            </Text>
          )}
        </View>

        {/* Privacy */}
        <View style={[styles.card, t.bgCard]}>
          <Text style={[styles.cardTitle, t.textPrimary]}>{'\uD83D\uDD12'} Datenschutz & Sicherheit</Text>
          <Text style={[styles.privacyText, t.textSecondary]}>
            Deine Daten bleiben privat auf deinem Ger{'ä'}t. Wir haben keinen Zugriff auf deine Finanzdaten.
            Nur der KI-Coach kommuniziert mit einem Server {'–'} deine Nachrichten werden verschl{'ü'}sselt {'ü'}bertragen.
          </Text>
        </View>

        {/* Quick Links */}
        <View style={[styles.card, t.bgCard]}>
          <Text style={[styles.cardTitle, t.textPrimary]}>Mehr</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => hasPremiumAccess ? router.push('/weekly-digest') : router.push('/paywall')}
            testID="profile-weekly-digest-btn"
          >
            <View style={[styles.linkIcon, t.bgTertiary]}>
              <Ionicons name="calendar" size={18} color={Colors.brand.primary} />
            </View>
            <Text style={[styles.linkLabel, t.textPrimary]}>Wochen-Rückblick</Text>
            {hasPremiumAccess ? (
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            ) : (
              <View style={styles.premiumLockBadge}>
                <Ionicons name="lock-closed" size={13} color="#FEFEFF" />
                <Text style={styles.premiumLockLabel}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => setShowShareCard(true)}
            testID="profile-share-btn"
          >
            <View style={[styles.linkIcon, t.bgTertiary]}>
              <Ionicons name="share-social" size={18} color="#A855F7" />
            </View>
            <Text style={[styles.linkLabel, t.textPrimary]}>Fortschritt teilen</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Reset */}
        <TouchableOpacity testID="reset-btn" onPress={handleReset} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Alle Daten zur{'ü'}cksetzen</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{'\u00A9'} 2026 Fixi App v1.3.4</Text>
      </ScrollView>

      {/* Share Card Modal */}
      <ShareCard
        visible={showShareCard}
        onClose={() => setShowShareCard(false)}
      />
    </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
  title: { fontSize: 28, fontFamily: 'Nunito_900Black', color: Colors.text.primary },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  settingsGear: {
    padding: 8,
  },
  avatarSection: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Nunito_900Black' },
  avatarChangeLink: { paddingVertical: 4, paddingHorizontal: 12 },
  avatarChangeLinkText: { fontSize: 14, color: '#00D4AA', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  colorSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  colorSheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  colorOption: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  colorOptionSelected: { borderWidth: 3, borderColor: '#FFFFFF' },
  premiumStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  cardTitle: { fontSize: 17, fontFamily: 'Nunito_900Black', color: Colors.text.primary, marginBottom: 12 },
  nameRow: { flexDirection: 'row', gap: 8 },
  nameInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    color: Colors.text.primary,
    fontSize: 16,
  },
  saveBtn: { backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.md, paddingHorizontal: 16, justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text.inverse },
  nameDisplay: { fontSize: 16, color: Colors.text.secondary },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: { fontSize: 15, color: Colors.text.primary },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  methodBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.sm },
  methodActive: { backgroundColor: Colors.background.secondary },
  methodText: { fontSize: 13, color: Colors.text.tertiary },
  methodTextActive: { color: Colors.text.primary, fontWeight: '600' },
  premiumStatus: { fontSize: 16, color: Colors.text.secondary },
  upgradeBtn: {
    backgroundColor: Colors.brand.primaryDim,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  upgradeBtnText: { fontSize: 15, fontWeight: '600', color: Colors.brand.primary },
  privacyText: { fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
  resetBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  resetBtnText: { fontSize: 15, color: Colors.functional.error },
  version: { textAlign: 'center', fontSize: 13, color: Colors.text.tertiary, marginTop: 8, marginBottom: 24 },
  premiumLockBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.brand.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumLockLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FEFEFF',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.stroke,
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
});
