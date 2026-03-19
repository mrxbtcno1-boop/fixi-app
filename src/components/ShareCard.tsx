import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Share, Platform, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useAppStore } from '../store/useStore';
import { getLevel } from '../utils/calculations';
import { FoxMascot } from './FoxMascot';

type ShareVariant = 'journey' | 'streak' | 'level';

interface ShareCardProps {
  variant?: ShareVariant;
  visible: boolean;
  onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ variant = 'journey', visible, onClose }) => {
  const createdAt = useAppStore((s) => s.createdAt);
  const installDate = useAppStore((s) => s.installDate);
  const streakCount = useAppStore((s) => s.streakCount);
  const debts = useAppStore((s) => s.debts);
  const onboardingTotalDebt = useAppStore((s) => s.onboardingTotalDebt);

  const totalDebt = debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt;
  const remaining = debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
  const percentPaid = totalDebt > 0 ? ((totalDebt - remaining) / totalDebt) * 100 : 0;
  const level = getLevel(percentPaid);

  const startDate = createdAt || installDate;
  const daysSinceStart = startDate
    ? Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000))
    : 1;

  const getShareContent = useCallback((): { title: string; message: string; fixiState: any } => {
    switch (variant) {
      case 'streak':
        return {
          title: `${streakCount}-Tage Streak!`,
          message: `${streakCount}-Tage Streak mit Fixi! Jeden Tag einen Schritt naeher an der finanziellen Freiheit.\n\nfixi.app`,
          fixiState: 'celebrating',
        };
      case 'level':
        return {
          title: `Level Up: ${level.name}!`,
          message: `Neues Level erreicht: ${level.name}! ${level.emoji}\nMein Weg zur finanziellen Freiheit geht weiter mit Fixi.\n\nfixi.app`,
          fixiState: 'excited',
        };
      case 'journey':
      default:
        return {
          title: `${daysSinceStart} Tage mit Fixi!`,
          message: `Ich bin seit ${daysSinceStart} Tagen auf meinem Weg zur finanziellen Freiheit mit Fixi!\n\nfixi.app`,
          fixiState: 'proud',
        };
    }
  }, [variant, streakCount, level, daysSinceStart]);

  const handleShare = useCallback(async () => {
    const content = getShareContent();
    try {
      await Share.share({
        message: content.message,
        title: content.title,
      });
    } catch {}
    onClose();
  }, [getShareContent, onClose]);

  const content = getShareContent();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Close */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="share-card-close">
            <Ionicons name="close" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          {/* Preview Card */}
          <View style={styles.previewCard}>
            <LinearGradient
              colors={['#0F172A', '#1E293B']}
              style={styles.cardGradient}
            >
              {/* Fixi */}
              <View style={styles.fixiWrap}>
                <FoxMascot state={content.fixiState} size="medium" animated={false} showSpeechBubble={false} />
              </View>

              {/* Achievement Text */}
              {variant === 'journey' && (
                <Text style={styles.cardTitle}>
                  Ich bin seit {daysSinceStart} Tagen auf meinem Weg zur finanziellen Freiheit
                </Text>
              )}
              {variant === 'streak' && (
                <Text style={styles.cardTitle}>
                  {streakCount}-Tage Streak mit Fixi!
                </Text>
              )}
              {variant === 'level' && (
                <Text style={styles.cardTitle}>
                  Neues Level: {level.name}! {level.emoji}
                </Text>
              )}

              {/* Branding */}
              <View style={styles.branding}>
                <Text style={styles.brandingEmoji}>fixi</Text>
                <Text style={styles.brandingUrl}>fixi.app</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Variant Selector */}
          <View style={styles.variantRow}>
            {(['journey', 'streak', 'level'] as ShareVariant[]).map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.variantBtn, variant === v && styles.variantActive]}
                testID={`share-variant-${v}`}
              >
                <Ionicons
                  name={v === 'journey' ? 'footsteps' : v === 'streak' ? 'flame' : 'trophy'}
                  size={16}
                  color={variant === v ? Colors.brand.primary : Colors.text.tertiary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Share Button */}
          <TouchableOpacity onPress={handleShare} activeOpacity={0.85} testID="share-card-share-btn">
            <LinearGradient
              colors={[Colors.brand.primary, Colors.brand.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shareBtn}
            >
              <Ionicons name="share-social" size={18} color={Colors.text.inverse} />
              <Text style={styles.shareBtnText}>Teilen</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.stroke,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
    zIndex: 1,
  },
  previewCard: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  cardGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  fixiWrap: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  brandingEmoji: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  brandingUrl: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  variantRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  variantBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantActive: {
    backgroundColor: Colors.brand.primaryDim,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    minWidth: 200,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});

export default ShareCard;
