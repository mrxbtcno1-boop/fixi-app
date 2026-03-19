import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, BounceIn } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';

interface AccountSuccessProps {
  visible: boolean;
  onDismiss: () => void;
}

export const AccountSuccess: React.FC<AccountSuccessProps> = ({ visible, onDismiss }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Confetti background effect - simplified */}
          <View style={styles.confettiContainer}>
            {['✨', '🎉', '⭐', '🦊'].map((emoji, i) => (
              <Animated.Text 
                key={i}
                entering={FadeIn.delay(i * 100).duration(500)}
                style={[styles.confetti, { left: `${15 + i * 20}%`, top: `${10 + (i % 2) * 10}%` }]}
              >
                {emoji}
              </Animated.Text>
            ))}
          </View>

          {/* Fixi celebrating */}
          <Animated.View entering={BounceIn.delay(200).duration(600)} style={styles.fixiContainer}>
            <FoxMascot 
              state="celebrating" 
              size="large" 
              animated={true}
              showSpeechBubble={true}
              speechBubble="Perfekt! Dein Fortschritt ist jetzt gesichert! 🔒🦊"
            />
          </Animated.View>

          {/* Success checklist */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.checklist}>
            <View style={styles.checkItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
              </View>
              <Text style={styles.checkText}>Daten gesichert</Text>
            </View>
            <View style={styles.checkItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
              </View>
              <Text style={styles.checkText}>Geräte-Sync möglich</Text>
            </View>
            <View style={styles.checkItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
              </View>
              <Text style={styles.checkText}>Fortschritt geht nie verloren</Text>
            </View>
          </Animated.View>

          {/* Continue button */}
          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.buttonContainer}>
            <TouchableOpacity onPress={onDismiss} activeOpacity={0.8} testID="account-success-continue-btn">
              <LinearGradient
                colors={[Colors.brand.primary, Colors.brand.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueBtn}
              >
                <Text style={styles.continueBtnText}>Weiter zur App</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.text.inverse} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
    alignItems: 'center',
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  confetti: {
    position: 'absolute',
    fontSize: 24,
  },
  fixiContainer: {
    marginBottom: Spacing.xl,
  },
  checklist: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.functional.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});

export default AccountSuccess;
