# Fixi App – Product Requirements Document

## Original Problem Statement
"Schulden-Tracker & Motivations-App" – Eine mobile Finanz-App die Nutzern hilft, ihre Schulden zu visualisieren, ein konkretes Freiheitsdatum zu berechnen, und durch Gamification & KI-Coaching motiviert zu bleiben.

## App Version
- Current: v1.3.0 (Build 17)
- Platform: Expo (React Native) – iOS + Android + Web

## Target Users
- Deutsche Smartphone-Nutzer mit Konsumschulden (18-45 Jahre)
- Gefühle: überfordert, schambesetzt, aber bereit für Veränderung

## Design System (LOCKED)
- **Primary:** #00D4AA (Mint), **Dark BG:** #080E1C, **Gold:** #FFB800
- **Fonts:** Nunito_900Black (Headlines + CTAs + Sprechblasen), Inter_500Medium (Body)
- **NO:** Syne_800ExtraBold (removed from _layout.tsx), Lila/Violett in CTA-Gradient
- **Fox Mascot:** 6 Charaktere (base, happy, celebrating, empathy, coaching, proud)
- Sprechblasen IMMER mit 🦊 am Ende

## Core Architecture
```
/app/frontend/
├── app/
│   ├── (tabs)/           # Dashboard, Schulden, Stats, Achievements, Profil
│   ├── onboarding/       # step1-7 (V1.3 Flow)
│   ├── onboarding-name.tsx
│   ├── ai-coach.tsx      # KI-Chat mit fox-coaching Header + Avatar
│   ├── welcome.tsx       # Welcome + fox-celebrating
│   ├── paywall.tsx       # RevenueCat IAP
│   ├── face-id.tsx       # Biometric Lock
│   └── _layout.tsx       # Font Loading (Syne REMOVED)
├── assets/images/        # 6 Fox PNGs + App Icons
└── src/
    ├── components/
    │   └── FoxMascot.tsx  # Platform-conditional shadow (web: filter drop-shadow)
    └── contexts/
        └── ThemeContext.tsx  # Dark/Light mode (default: Dark)
```

## 3rd Party Integrations (DO NOT TOUCH RevenueCat)
- **Supabase:** Analytics + Edge Functions + GPT-4o-mini AI Coach
- **RevenueCat:** IAPs (react-native-purchases) – HANDS OFF
- **Expo:** expo-router, expo-font, expo-local-authentication
- **Fonts:** @expo-google-fonts/nunito, @expo-google-fonts/inter

## What's Been Implemented (Chronological)

### V1.0-1.2: Foundation
- Full debt tracker (add/edit/delete debts)
- Avalanche & Snowball payoff calculation
- Dashboard with progress visualization
- Stats, Achievements, Streaks
- Gamification system (Level, Badges, XP)
- Profile & Settings (Dark/Light mode toggle)
- Face-ID biometric lock
- RevenueCat Paywall integration

### V1.3: Onboarding Overhaul (Completed 2025)
- 7-step emotional onboarding flow
- Fox Mascot integration (SVG → 3D Logo → 6-character PNG set)
- Emotional state mapping to fox character states
- Animated speech bubbles with 🦊 auto-append
- Dark mode default with premium UX

### V1.3.1: Brand Polish Sprint (2026-03-19)
- **P0 FoxMascot Bug FIXED:** Replaced box-shadow polyfill with CSS filter drop-shadow() on web (follows PNG transparency shape). Native shadow props preserved for iOS.
- **Syne Font Cleanup:** Removed Syne_800ExtraBold from _layout.tsx (was loaded but never used → bundle size reduction)
- **Paywall CTA Text Color:** Fixed #FFFFFF → #0A0E1A (dark) per design system
- **Paywall Fonts:** section title → Nunito_900Black; feature rows → Inter_500Medium / Inter_400Regular
- **Profile Screen:** Title + card titles → Nunito_900Black for brand consistency
- **AI Coach Header Upgrade:** fox-coaching.png in header + as chat avatar (creative improvement)
- **AI Coach Welcome Message:** Emotionaler, direkter Einstieg
- **Full Quality Check:** All screens verified in Dark Mode

### V1.3.3: Share-Card + Golden Crown Shimmer (2026-03-19)
- **Share-Card (step7):** captureRef auf dem Haupt-Content-View, `Teilen 🦊` Outlined-Button (Mint-Border, transparent BG), `expo-sharing` für nativen iOS-Share-Dialog, Web-Fallback via `navigator.share()`, "Fixi · Schuldenfrei mit KI-Plan" Branding im captured Image
- **Golden Crown Shimmer (step7):** `overflow: 'hidden'` Window (76×52px) über Krone des Fuchses, LinearGradient Sweep-Animation (transparent → Gold → Weiß → Gold → transparent), `Animated.loop` mit 750ms Sweep + 2.8s Pause – Pokémon-Shiny-Effekt
- **Packages:** react-native-view-shot@4.0.3, expo-sharing@55.0.14 installiert

### V1.3.4: Light Mode Full Audit + Fixes (2026-03-19)
- **step3 fix:** Age Cards `backgroundColor` jetzt theme-adaptive (dark: `rgba(20,25,41,0.85)` / light: `#FFFFFF`), "Jahre" Label nutzt `t.colors.text.tertiary`
- **step4 fix:** EmotionChip `backgroundColor` theme-adaptive (light: `#F0F4FF`), `borderColor` theme-adaptive, `categoryTitle` nutzt `t.colors.text.tertiary`, `affirmationBanner` background theme-adaptive, `affirmationText` nutzt `t.colors.text.secondary`
- **FixiFullscreenMoment fix:** `useThemeOverrides` integriert, Gradient jetzt theme-adaptive (dark: `rgba(10,14,26,0.97)` / light: `rgba(244,246,250,0.98)`), `title` und `subtitle` Textfarben dynamisch
- **Streak Shield Placeholder:** `/src/components/StreakShieldModal.tsx` erstellt mit vollständiger Architektur-Dokumentation (Trigger, IAP Setup, UX Spec, AsyncStorage Keys, Edge Cases)
- **Build-Status:** yarn expo export ✅, alle Screens im Light + Dark Mode verifiziert
- **Push-Notifications (P1):** `NotificationService.ts` vollständig neu geschrieben mit allen Exports. Freedom-Day-Notification ("Heute wärst du schuldenfrei. 🦊") + 30-Tage-Reminder. Permission-Request nach Face-ID in `face-id.tsx`. Rescheduling-Logik bei Schulden-Änderung. expo-notifications Plugin in app.json konfiguriert.
- **step5.tsx Visual Upgrade (P2):** Stagger-Animationen auf Cards (300/480/660ms delays), Akzentstreifen in Brand-Farben, Icon-Circles, Social-Proof-Badge ("Über 50.000 Nutzer") in Gold-Tint.
- **step6.tsx Visual Upgrade (P2):** Privacy-Trust-Badge als echte Pill (Mint-Border, Lock-Icon in Mini-Circle, volle Mint-Farbe), direkt unter Section-Title vor Schulden-Eingabe. Fokus-basierte Border-Farben auf allen Inputs.
- **EAS Build Vorbereitung (P2):** Version 1.3.0, BuildNumber 17, CFBundleDevelopmentRegion: "de", CFBundleLocalizations: ["de"], NSUserNotificationUsageDescription für iOS Notifications.
- **Build-Status:** yarn expo export --platform web ✅ Exit 0, alle 33 Routen gebundelt, keine TypeScript-Fehler.

### Onboarding Screen Upgrade V1.3.2 (2026-03-19)
- **step3.tsx (Alter-Auswahl):** Kompaktere Cards (paddingVertical 16), Emoji 32px, Nunito_900Black 19px, Mint-Border + Tint, Press-Animation (scale 0.97) via Animated.spring
- **step4.tsx (Emotionen):** Staggered Chip Fade-In (40ms delay), farbkodierte Kategorie-Akzentlinien, Bounce-Animation bei Selektion, Glassmorphism Affirmations-Banner

## Roadmap

### P1 – NEXT (nach Build)
- **Streak Shield:** Microtransaction um einen Streak zu retten (RevenueCat IAP, €0.99)
  - Emergency-Modal wenn Streak bricht, Loss-Aversion-Psychologie
  - Timer-Element für Dringlichkeit

### P2
- **Accountability Partner Mode:** Social accountability Feature (Premium)

### P3
- **B2B Employee Wellness:** Corporate licensing adaptation
