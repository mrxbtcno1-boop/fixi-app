import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';
import { useAppStore } from '../store/useStore';

interface DashboardAccountBannerProps {
  onPress: () => void;
}

export const DashboardAccountBanner: React.FC<DashboardAccountBannerProps> = ({ onPress }) => {
  const shouldShowTrigger = useAppStore(s => s.shouldShowTrigger);
  const dismissDashboardBanner = useAppStore(s => s.dismissDashboardBanner);
  const userAccount = useAppStore(s => s.userAccount);

  // Don't show if account exists or trigger shouldn't be shown
  if (userAccount?.isAccountCreated || !shouldShowTrigger(5)) {
    return null;
  }

  const handleDismiss = () => {
    dismissDashboardBanner();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.fixiContainer}>
          <FoxMascot state="worried" size="tiny" animated={false} showSpeechBubble={false} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Ionicons name="warning" size={14} color={Colors.functional.warning} />
            <Text style={styles.title}>Dein Fortschritt ist nicht gesichert</Text>
          </View>
          <Text style={styles.subtitle}>
            Wenn du dein Handy verlierst, sind deine Daten weg.
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onPress}
          style={styles.actionBtn}
          testID="dashboard-banner-secure-btn"
        >
          <Text style={styles.actionText}>Sichern</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.brand.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        onPress={handleDismiss}
        style={styles.closeBtn}
        testID="dashboard-banner-close-btn"
      >
        <Ionicons name="close" size={18} color={Colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.functional.warning + '40',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingRight: Spacing.xl + Spacing.md,
  },
  fixiContainer: {
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.brand.primary + '20',
    borderRadius: BorderRadius.sm,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.primary,
    marginRight: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    padding: Spacing.xs,
  },
});

export default DashboardAccountBanner;
