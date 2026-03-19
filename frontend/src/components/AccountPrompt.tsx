import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { FoxMascot } from './FoxMascot';
import type { FixiState } from './Fixi/FixiStates';
import { useAppStore } from '../store/useStore';

interface AccountPromptProps {
  visible: boolean;
  triggerId: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  subtitle: string;
  fixiState: FixiState;
  fixiSpeech: string;
  buttonText: string;
  checkboxText: string;
  dismissText: string;
  onDismiss: () => void;
  onSuccess: () => void;
}

export const AccountPrompt: React.FC<AccountPromptProps> = ({
  visible,
  triggerId,
  title,
  subtitle,
  fixiState,
  fixiSpeech,
  buttonText,
  checkboxText,
  dismissText,
  onDismiss,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const createAccount = useAppStore(s => s.createAccount);
  const setMarketingOptInStore = useAppStore(s => s.setMarketingOptIn);
  const recordTriggerDismissed = useAppStore(s => s.recordTriggerDismissed);
  const recordTriggerConverted = useAppStore(s => s.recordTriggerConverted);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!email.trim()) {
      setError('Bitte gib deine E-Mail ein');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Bitte gib eine gültige E-Mail ein');
      return;
    }

    // Only require password for triggers that show password field (trigger 6 - premium)
    if (triggerId === 6 && password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }

    setLoading(true);
    
    try {
      // Create account locally
      createAccount(email, 'email', undefined);
      setMarketingOptInStore(marketingOptIn);
      recordTriggerConverted(triggerId);
      
      // Simulate brief delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
    } catch (err) {
      setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    recordTriggerDismissed(triggerId);
    onDismiss();
  };

  // Check if we need password field (only for premium trigger)
  const showPasswordField = triggerId === 6;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Fixi */}
          <View style={styles.fixiContainer}>
            <FoxMascot 
              state={fixiState} 
              size="medium" 
              animated={true}
              showSpeechBubble={true}
              speechBubble={fixiSpeech}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-Mail Adresse"
              placeholderTextColor={Colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="account-email-input"
            />
          </View>

          {/* Password Input (only for premium trigger) */}
          {showPasswordField && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Passwort erstellen"
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                testID="account-password-input"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={Colors.text.tertiary} 
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Error Message */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Marketing Opt-In */}
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setMarketingOptIn(!marketingOptIn)}
            testID="marketing-optin-checkbox"
          >
            <View style={[styles.checkbox, marketingOptIn && styles.checkboxChecked]}>
              {marketingOptIn && <Ionicons name="checkmark" size={14} color={Colors.text.inverse} />}
            </View>
            <Text style={styles.checkboxText}>{checkboxText}</Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            {'🔒 Deine Daten sind sicher. Wir verkaufen nichts. Versprochen.'}
          </Text>

          {/* Submit Button */}
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            testID="account-submit-btn"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.brand.primary, Colors.brand.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.submitBtn, loading && styles.btnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <Text style={styles.submitBtnText}>{buttonText}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity 
            onPress={handleDismiss}
            style={styles.dismissBtn}
            testID="account-dismiss-btn"
          >
            <Text style={styles.dismissText}>{dismissText}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  fixiContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    width: '100%',
    height: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  error: {
    color: Colors.functional.error,
    fontSize: 13,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.text.tertiary,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  privacyNote: {
    fontSize: 12,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 280,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  dismissBtn: {
    paddingVertical: Spacing.md,
  },
  dismissText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textDecorationLine: 'underline',
  },
});

export default AccountPrompt;
