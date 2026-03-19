import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';
import { useAppStore } from '../store/useStore';
import type { FixiState } from './Fixi/FixiStates';

type TriggerType = 2 | 3 | 4 | 6;

interface TriggerContent {
  title: string;
  subtitle: string;
  fixiSpeech: string;
  fixiState: FixiState;
  ctaText: string;
  icon: string;
}

const TRIGGER_CONTENT: Record<TriggerType, TriggerContent> = {
  2: {
    title: 'Erste Zahlung geschafft!',
    subtitle: 'Dein Fortschritt ist noch nicht gesichert. Erstelle ein Konto, damit nichts verloren geht.',
    fixiSpeech: 'Super Start! Lass uns deinen Fortschritt sichern!',
    fixiState: 'celebrating',
    ctaText: 'Fortschritt sichern',
    icon: 'shield-checkmark',
  },
  3: {
    title: '10% geschafft!',
    subtitle: 'Ein toller Meilenstein! Sichere deinen Fortschritt mit einem kostenlosen Konto.',
    fixiSpeech: 'Wow, 10%! Das muss gesichert werden!',
    fixiState: 'excited',
    ctaText: 'Konto erstellen',
    icon: 'trophy',
  },
  4: {
    title: '7-Tage Streak!',
    subtitle: 'Du bist seit 7 Tagen dabei! Erstelle ein Konto, damit dein Streak nie verloren geht.',
    fixiSpeech: '7 Tage am Stueck! Du bist unglaublich!',
    fixiState: 'proud',
    ctaText: 'Streak sichern',
    icon: 'flame',
  },
  6: {
    title: 'Willkommen bei Premium!',
    subtitle: 'Erstelle ein Konto, um dein Premium-Abo auf allen Geräten zu nutzen.',
    fixiSpeech: 'Premium freigeschaltet! Jetzt noch das Konto sichern!',
    fixiState: 'celebrating',
    ctaText: 'Konto verknuepfen',
    icon: 'star',
  },
};

interface AccountTriggerModalProps {
  visible: boolean;
  triggerId: TriggerType;
  onDismiss: () => void;
}

export const AccountTriggerModal: React.FC<AccountTriggerModalProps> = ({
  visible,
  triggerId,
  onDismiss,
}) => {
  const router = useRouter();
  const recordTriggerShown = useAppStore(s => s.recordTriggerShown);
  const recordTriggerDismissed = useAppStore(s => s.recordTriggerDismissed);

  const content = TRIGGER_CONTENT[triggerId];

  useEffect(() => {
    if (visible) {
      recordTriggerShown(triggerId);
    }
  }, [visible, triggerId]);

  const handleCTA = () => {
    onDismiss();
    router.push('/account-creation');
  };

  const handleLater = () => {
    recordTriggerDismissed(triggerId);
    onDismiss();
  };

  if (!content) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={handleLater}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <TouchableOpacity
            onPress={handleLater}
            style={styles.closeBtn}
            testID="trigger-modal-close"
          >
            <Ionicons name="close" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          {/* Fixi */}
          <View style={styles.fixiWrap}>
            <FoxMascot
              state={content.fixiState}
              size="medium"
              speechBubble={content.fixiSpeech}
              animated={false}
            />
          </View>

          {/* Icon badge */}
          <View style={styles.iconBadge}>
            <Ionicons name={content.icon as any} size={20} color={Colors.brand.primary} />
          </View>

          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleCTA}
            activeOpacity={0.85}
            testID="trigger-modal-cta"
          >
            <LinearGradient
              colors={[Colors.brand.primary, Colors.brand.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaBtn}
            >
              <Ionicons name={content.icon as any} size={18} color={Colors.text.inverse} />
              <Text style={styles.ctaText}>{content.ctaText}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Later */}
          <TouchableOpacity
            onPress={handleLater}
            style={styles.laterBtn}
            testID="trigger-modal-later"
          >
            <Text style={styles.laterText}>Spaeter</Text>
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
  fixiWrap: {
    marginBottom: Spacing.md,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    minWidth: 240,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  laterBtn: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  laterText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
});

export default AccountTriggerModal;
