import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';
import { useAppStore } from '../store/useStore';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  featureName: string;
  description: string;
  children: React.ReactNode;
}

export function PremiumGate({ featureName, description, children }: Props) {
  const isPremium = useAppStore(s => s.isPremium);
  const isTrialActive = useAppStore(s => s.isTrialActive);
  const router = useRouter();

  if (isPremium || isTrialActive()) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.lockedOverlay}>
        <FoxMascot state="excited" size="large" speechBubble={`Mit Fixi Premium bekommst du ${featureName}!`} />
        <Text style={styles.title}>{featureName}</Text>
        <Text style={styles.desc}>{description}</Text>
        <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.8}>
          <LinearGradient
            colors={[Colors.brand.primary, Colors.brand.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Fixi Premium freischalten</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  lockedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    marginTop: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
});
