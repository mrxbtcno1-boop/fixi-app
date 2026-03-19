import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';

interface SoftDowngradeProps {
  visible: boolean;
  onDismiss: () => void;
}

export const SoftDowngrade: React.FC<SoftDowngradeProps> = ({ visible, onDismiss }) => {
  const router = useRouter();

  const handleGetPremium = () => {
    onDismiss();
    router.push('/paywall');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
          {/* Fixi */}
          <Animated.View entering={FadeInUp.delay(100).duration(500)}>
            <FoxMascot 
              state="sad" 
              size="large" 
              animated={true}
              showSpeechBubble={true}
              speechBubble="Hey... dein Premium ist ausgelaufen. Aber weißt du was? Ich bin trotzdem hier. Nur halt ein bisschen eingeschränkt... 🦊"
            />
          </Animated.View>

          {/* What you keep */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Was du behältst:</Text>
            <View style={styles.item}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.functional.success} />
              <Text style={styles.itemText}>Dein Fortschritt: SAFE</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.functional.success} />
              <Text style={styles.itemText}>Schulden tracken: GEHT</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.functional.success} />
              <Text style={styles.itemText}>Basis-Fortschritt: GEHT</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.functional.success} />
              <Text style={styles.itemText}>Fixi Motivation: GEHT</Text>
            </View>
          </Animated.View>

          {/* What you lose */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.section}>
            <View style={styles.item}>
              <Ionicons name="lock-closed" size={20} color={Colors.text.tertiary} />
              <Text style={styles.itemTextLocked}>KI-Coach: GESPERRT</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="lock-closed" size={20} color={Colors.text.tertiary} />
              <Text style={styles.itemTextLocked}>Simulator: GESPERRT</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="lock-closed" size={20} color={Colors.text.tertiary} />
              <Text style={styles.itemTextLocked}>Volle Gamification: GESPERRT</Text>
            </View>
            <View style={styles.item}>
              <Ionicons name="lock-closed" size={20} color={Colors.text.tertiary} />
              <Text style={styles.itemTextLocked}>Detaillierte Stats: GESPERRT</Text>
            </View>
          </Animated.View>

          {/* Buttons */}
          <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.buttons}>
            <TouchableOpacity onPress={handleGetPremium} activeOpacity={0.8} testID="downgrade-get-premium">
              <LinearGradient
                colors={[Colors.brand.primary, Colors.brand.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumBtn}
              >
                <Text style={styles.premiumBtnText}>Doch noch Premium holen?</Text>
                <Text style={styles.premiumBtnSparkle}>✨</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onDismiss} 
              style={styles.dismissBtn}
              testID="downgrade-dismiss"
            >
              <Text style={styles.dismissText}>Okay, weiter ohne Premium →</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  section: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  itemText: {
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  itemTextLocked: {
    fontSize: 15,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  buttons: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  premiumBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  premiumBtnSparkle: {
    fontSize: 18,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dismissText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
});

export default SoftDowngrade;
