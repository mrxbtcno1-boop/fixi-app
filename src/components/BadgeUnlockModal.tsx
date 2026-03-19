import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';
import { getBadgeDef } from '../constants/badges';

interface Props {
  visible: boolean;
  badgeKey: string;
  onDismiss: () => void;
}

export function BadgeUnlockModal({ visible, badgeKey, onDismiss }: Props) {
  const badge = getBadgeDef(badgeKey);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: false }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
            Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
          ])
        ),
      ]).start();
    }
  }, [visible]);

  if (!badge) return null;

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Fixi celebrating */}
          <FoxMascot state="celebrating" size="medium" showSpeechBubble={false} />

          {/* Badge icon with bounce */}
          <Animated.View style={[styles.badgeCircle, { transform: [{ scale: scaleAnim }] }]}>
            <Animated.View style={[styles.badgeGlow, { opacity: glowOpacity }]} />
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
          </Animated.View>

          <Text style={styles.newBadgeLabel}>NEUES BADGE!</Text>
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.badgeDesc}>{badge.desc}</Text>

          {/* Fixi speech */}
          <View style={styles.fixiSpeechBubble}>
            <Text style={styles.fixiSpeechText}>{badge.fixiSpeech}</Text>
          </View>

          <TouchableOpacity
            testID="badge-dismiss-btn"
            style={styles.dismissBtn}
            onPress={onDismiss}
          >
            <Text style={styles.dismissText}>Weiter {'\u2192'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  badgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background.secondary,
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
    position: 'relative',
  },
  badgeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: '#FFD700',
  },
  badgeEmoji: { fontSize: 48, zIndex: 1 },
  newBadgeLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  fixiSpeechBubble: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  fixiSpeechText: {
    fontSize: 15,
    color: Colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dismissBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
});
