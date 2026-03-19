import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Colors, Spacing, BorderRadius } from '../src/constants/theme';
import { useAppStore } from '../src/store/useStore';
import { useTheme, useThemeOverrides } from '../src/contexts/ThemeContext';
import { ScreenWrapper } from '../src/components/ScreenWrapper';
import { SUPABASE_ANON_KEY } from '../src/services/supabase';
import { trackEvent } from '../src/services/supabase';
import { getRateLimitInfo, incrementMessageCount } from '../src/services/CoachRateLimit';
import { checkPremiumStatus } from '../src/services/PurchaseService';
import { monthsToPayoff } from '../src/utils/calculations';

const SUPABASE_COACH_URL = 'https://dzrtpbbztgixdawjfhbz.supabase.co/functions/v1/coach-chat';
const CHAT_STORAGE_KEY = 'fixi_chat_history';
const MAX_STORED_MESSAGES = 50;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const QUICK_ACTIONS = [
  'Wo kann ich sparen?',
  'Motivier mich!',
  'Erkläre Schneeball-Methode',
  'Tipps für Extra-Einkommen',
  'Wie bin ich im Vergleich?',
];

const OFFLINE_RESPONSES: Record<string, string> = {
  'Wo kann ich sparen?': 'Schau dir deine monatlichen Ausgaben an: Abos, Essengehen, Impulskäufe. Oft kann man 10-20% einsparen, wenn man bewusster konsumiert. Tipp: Führ eine Woche lang ein Ausgaben-Tagebuch!',
  'Motivier mich!': 'Hey, du hast den wichtigsten Schritt schon gemacht: Du hast angefangen! Jede einzelne Zahlung bringt dich näher an dein Ziel. Du schaffst das! 💪',
  'Erkläre Schneeball-Methode': 'Bei der Schneeball-Methode zahlst du zuerst die kleinste Schuld ab. Sobald die weg ist, nimmst du die frei gewordene Rate und legst sie auf die nächste drauf. Wie ein Schneeball der immer größer wird!',
  'Tipps für Extra-Einkommen': 'Ein paar Ideen: Verkauf ungenutzter Sachen online, Freelancing in deinem Fachgebiet, Nachhilfe geben, oder kleine Aufträge auf Plattformen wie Fiverr. Jeder Extra-Euro zählt!',
  'Wie bin ich im Vergleich?': 'Wusstest du, dass der durchschnittliche Deutsche ca. 8.000€ Konsumschulden hat? Allein die Tatsache, dass du aktiv an deinen Schulden arbeitest, stellt dich besser da als die meisten. Weiter so!',
};

async function sendToCoach(
  userMessage: string,
  chatHistory: ChatMessage[],
  userData: { name: string; debts: any[]; streak: number; level: string }
): Promise<string> {
  const response = await fetch(SUPABASE_COACH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      message: userMessage,
      history: chatHistory.slice(-10),
      userData,
    }),
  });

  if (!response.ok) throw new Error('Coach nicht erreichbar');
  const data = await response.json();
  return data.reply;
}

export default function AiCoachScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ introMode?: string }>();
  const introMode = params.introMode === 'true';
  const userName = useAppStore(s => s.userName);
  const t = useThemeOverrides();
  const insets = useSafeAreaInsets();
  const debts = useAppStore(s => s.debts);
  const streakCount = useAppStore(s => s.streakCount);
  const isPremium = useAppStore(s => s.isPremium);
  const onboardingTotalDebt = useAppStore(s => s.onboardingTotalDebt);

  const totalDebt = debts.length > 0 ? debts.reduce((s, d) => s + d.totalAmount, 0) : onboardingTotalDebt;
  const remaining = debts.length > 0 ? debts.reduce((s, d) => s + d.remainingAmount, 0) : onboardingTotalDebt;
  const percentPaid = totalDebt > 0 ? ((totalDebt - remaining) / totalDebt) * 100 : 0;
  const levelName = percentPaid >= 75 ? 'Fixi Legende' : percentPaid >= 50 ? 'Fixi Held' : percentPaid >= 25 ? 'Fixi Krieger' : 'Fixi Anfänger';

  // Calculate "X months earlier" for intro message
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const weightedRate = debts.length > 0 && remaining > 0
    ? debts.reduce((s, d) => s + d.interestRate * d.remainingAmount, 0) / remaining
    : 0;
  const currentMonths = monthsToPayoff(remaining, weightedRate, totalMonthly);
  const extraMonths = totalMonthly > 0
    ? Math.max(0, currentMonths - monthsToPayoff(remaining, weightedRate, totalMonthly * 1.2))
    : 0;
  const introName = userName ? `${userName}, ` : '';
  const introMessage = `${introName}ich hab deinen Plan analysiert. Du könntest ${Math.round(extraMonths)} Monate früher fertig sein – willst du wissen wie?`;

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingMsgs, setRemainingMsgs] = useState(10);
  const [limitReached, setLimitReached] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) return;
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [isLoading]);

  useEffect(() => {
    trackEvent('coach_opened');
    if (introMode) {
      // P1.1 – Auto-Open: Show personalized intro message
      setMessages([{
        id: 'intro',
        role: 'assistant',
        content: introMessage,
      }]);
      trackEvent('coach_intro_shown');
    } else {
      loadChatHistory();
    }
    checkLimits();
  }, []);

  const checkLimits = async () => {
    const premium = isPremium || await checkPremiumStatus();
    setIsPremiumUser(premium);
    if (!premium) {
      const info = await getRateLimitInfo();
      setRemainingMsgs(info.remaining);
      setLimitReached(info.limitReached);
    }
  };

  const loadChatHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed.displayMessages || []);
        setChatHistory(parsed.chatHistory || []);
      } else {
        addWelcomeMessage();
      }
    } catch {
      addWelcomeMessage();
    }
  };

  const addWelcomeMessage = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hey ${userName || 'du'}! 🦊 Ich bin dein persönlicher Finanz-Coach. Frag mich alles rund um Schulden, Sparen und Finanzen – oder nutze eine Quick-Action unten!`,
    }]);
  };

  const saveChatHistory = async (displayMsgs: DisplayMessage[], history: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
        displayMessages: displayMsgs.slice(-MAX_STORED_MESSAGES),
        chatHistory: history.slice(-MAX_STORED_MESSAGES),
      }));
    } catch {}
  };

  const clearChat = useCallback(async () => {
    await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
    setChatHistory([]);
    setMessages([]);
    addWelcomeMessage();
  }, [userName]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Rate limit check for free users
    if (!isPremiumUser) {
      if (limitReached) {
        trackEvent('coach_limit_reached');
        return;
      }
    }

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    trackEvent('coach_message_sent');

    // Increment rate limit for free users
    if (!isPremiumUser) {
      const info = await incrementMessageCount();
      setRemainingMsgs(info.remaining);
      if (info.remaining <= 2 && info.remaining > 0) {
        trackEvent('coach_limit_warning', { remaining: info.remaining });
      }
      if (info.limitReached) {
        setLimitReached(true);
      }
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const localResp = OFFLINE_RESPONSES[text.trim()];
      const offlineMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: localResp || 'Du bist offline. Verbinde dich mit dem Internet um Fixi alles fragen zu können. 📡',
      };
      const allMsgs = [...updatedMessages, offlineMsg];
      setMessages(allMsgs);
      setIsLoading(false);
      await saveChatHistory(allMsgs, chatHistory);
      return;
    }

    try {
      const userData = {
        name: userName || 'Nutzer',
        debts: debts.map(d => ({ name: d.name, amount: d.totalAmount, remaining: d.remainingAmount, rate: d.monthlyPayment })),
        streak: streakCount,
        level: levelName,
      };
      const response = await sendToCoach(text.trim(), chatHistory, userData);
      const assistantMsg: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
      };
      const newHistory: ChatMessage[] = [
        ...chatHistory,
        { role: 'user' as const, content: text.trim() },
        { role: 'assistant' as const, content: response },
      ];
      const allMsgs = [...updatedMessages, assistantMsg];
      setMessages(allMsgs);
      setChatHistory(newHistory);
      await saveChatHistory(allMsgs, newHistory);
    } catch {
      const errorMsg: DisplayMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Hmm, ich kann gerade nicht nachdenken 🤔 Prüfe deine Internetverbindung und versuch es nochmal.',
        isError: true,
      };
      setMessages([...updatedMessages, errorMsg]);
      await saveChatHistory([...updatedMessages, errorMsg], chatHistory);
    } finally {
      setIsLoading(false);
    }
  }, [messages, chatHistory, isLoading, userName, debts, streakCount, levelName, isPremiumUser, limitReached]);

  const handleRetry = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      const filtered = messages.filter(m => !m.isError);
      setMessages(filtered);
      await sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  const userInitial = (userName || 'D')[0].toUpperCase();

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubbleWrap, isUser ? styles.userWrap : styles.assistantWrap]}>
        {!isUser && (
          <View style={styles.fixiAvatar} testID="fixi-avatar">
            <Text style={styles.fixiAvatarText}>🦊</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : [styles.assistantBubble, { backgroundColor: t.isDark ? '#1A2540' : '#E8FDF8' }], item.isError && styles.errorBubble]}>
          <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : { color: t.isDark ? '#F0F4FF' : '#0D1526' }]}>{item.content}</Text>
          {item.isError && (
            <TouchableOpacity onPress={handleRetry} style={styles.retryBtn} testID="retry-btn">
              <Ionicons name="refresh" size={14} color={Colors.brand.primary} />
              <Text style={styles.retryText}>Nochmal versuchen</Text>
            </TouchableOpacity>
          )}
        </View>
        {isUser && (
          <View style={styles.userAvatar} testID="user-avatar">
            <Text style={styles.userAvatarText}>{userInitial}</Text>
          </View>
        )}
      </View>
    );
  };

  const TypingIndicator = () => (
    <View style={[styles.messageBubbleWrap, styles.assistantWrap]}>
      <View style={styles.fixiAvatar}><Text style={styles.fixiAvatarText}>🦊</Text></View>
      <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]} />
        ))}
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <SafeAreaView style={[styles.safe, t.bg]} edges={['top']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={[styles.header, t.borderBottom]} testID="coach-header">
            <TouchableOpacity onPress={() => router.back()} testID="coach-back-btn">
              <Ionicons name="arrow-back" size={24} color={t.colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, t.textPrimary]}>Fixi Coach 🦊</Text>
              <Text style={[styles.headerSub, t.textSecondary]}>Dein persönlicher Finanzberater</Text>
            </View>
            <TouchableOpacity onPress={clearChat} testID="clear-chat-btn">
              <Ionicons name="trash-outline" size={22} color={t.colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={
              isLoading ? <TypingIndicator /> :
              (introMode && messages.length === 1) ? (
                <TouchableOpacity
                  testID="coach-intro-yes-btn"
                  style={styles.introYesBtn}
                  onPress={() => sendMessage('Ja, zeig mir wie ich früher fertig sein kann!')}
                >
                  <Text style={styles.introYesBtnText}>Ja, zeig mir!</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0A0E1A" />
                </TouchableOpacity>
              ) : null
            }
            style={styles.chatList}
          />

          {/* Rate Limit Warning */}
          {!isPremiumUser && !limitReached && remainingMsgs <= 3 && (
            <View style={styles.limitWarning}>
              <Text style={styles.limitWarningText}>Noch {remainingMsgs} kostenlose Nachrichten heute</Text>
            </View>
          )}

          {/* Rate Limit Reached */}
          {!isPremiumUser && limitReached ? (
            <View style={[styles.limitReachedBox, t.bgCard]}>
              <Text style={[styles.limitReachedTitle, t.textPrimary]}>Du hast dein tägliches Limit erreicht.</Text>
              <Text style={[styles.limitReachedSub, t.textSecondary]}>Morgen hast du wieder 10 Nachrichten.</Text>
              <TouchableOpacity
                style={styles.limitUpgradeBtn}
                onPress={() => {
                  trackEvent('coach_limit_upgrade_clicked');
                  router.push('/paywall');
                }}
                testID="coach-upgrade-btn"
              >
                <Ionicons name="star" size={16} color="#0A0E1A" />
                <Text style={styles.limitUpgradeBtnText}>Premium freischalten – Unbegrenzt chatten</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Quick Actions */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickActionsBar}
                contentContainerStyle={styles.quickActionsContent}
              >
                {QUICK_ACTIONS.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickActionPill, { backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderColor: t.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]}
                    onPress={() => sendMessage(item)}
                    disabled={isLoading}
                    testID={`quick-action-${index}`}
                  >
                    <Text style={[styles.quickActionText, { color: t.colors.text.primary }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Input Bar */}
              <View style={[styles.inputBar, t.borderTop, { paddingBottom: insets.bottom + 8 }]} testID="coach-input-bar">
                <TextInput
                  style={[styles.textInput, t.bgCard, t.border, { color: t.colors.text.primary }]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Frag Fixi etwas..."
                  placeholderTextColor={t.colors.text.tertiary}
                  editable={!isLoading}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={() => sendMessage(inputText)}
                  blurOnSubmit
                  testID="coach-text-input"
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
                  onPress={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                  testID="coach-send-btn"
                >
                  <Ionicons name="send" size={20} color={inputText.trim() && !isLoading ? '#0A0E1A' : Colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background.primary },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.glass.stroke,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text.primary },
  headerSub: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  chatList: { flex: 1 },
  chatContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 8 },
  messageBubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, maxWidth: '85%' },
  userWrap: { alignSelf: 'flex-end' },
  assistantWrap: { alignSelf: 'flex-start' },
  fixiAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.background.tertiary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  fixiAvatarText: { fontSize: 16 },
  userAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  userAvatarText: { fontSize: 14, fontWeight: '600', color: '#0A0E1A' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%', flexShrink: 1 },
  assistantBubble: { backgroundColor: '#1A1F36' },
  userBubble: { backgroundColor: '#00D4AA' },
  errorBubble: { borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)' },
  bubbleText: { fontSize: 15, color: Colors.text.primary, lineHeight: 22 },
  userBubbleText: { color: 'rgba(255,255,255,1)' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  retryText: { fontSize: 13, color: Colors.brand.primary, fontWeight: '500' },
  typingBubble: { flexDirection: 'row', gap: 4, paddingVertical: 14, paddingHorizontal: 16 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.text.tertiary },
  limitWarning: { paddingVertical: 6, alignItems: 'center', backgroundColor: 'rgba(255,190,0,0.1)' },
  limitWarningText: { fontSize: 13, color: '#FFD700', fontWeight: '500' },
  limitReachedBox: {
    paddingHorizontal: Spacing.md, paddingVertical: 20, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.glass.stroke,
  },
  limitReachedTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, textAlign: 'center' },
  limitReachedSub: { fontSize: 14, color: Colors.text.secondary, marginTop: 4, textAlign: 'center' },
  limitUpgradeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.brand.primary, borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 14, marginTop: 16,
  },
  limitUpgradeBtnText: { fontSize: 14, fontWeight: '600', color: '#0A0E1A' },
  quickActionsBar: { maxHeight: 64, borderTopWidth: 1, borderTopColor: Colors.glass.stroke },
  quickActionsContent: { paddingHorizontal: Spacing.md, paddingVertical: 10, alignItems: 'center', gap: 8 },
  quickActionPill: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  quickActionText: { fontSize: 14, color: '#FFFFFF', flexShrink: 0 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: Colors.glass.stroke, gap: 8,
  },
  textInput: {
    flex: 1, backgroundColor: Colors.background.secondary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    color: Colors.text.primary, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.glass.stroke,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.background.tertiary },
  // Intro mode button (P1.1)
  introYesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: Colors.brand.primary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 38,
    marginTop: 8,
    marginBottom: 16,
  },
  introYesBtnText: { fontSize: 15, fontWeight: '600', color: '#0A0E1A' },
});
