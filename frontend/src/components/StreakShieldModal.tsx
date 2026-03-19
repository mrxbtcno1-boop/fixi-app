/**
 * StreakShieldModal – Microtransaction to save a broken streak
 *
 * ─── TRIGGER ───────────────────────────────────────────────────────────────────
 * Show this modal when the user opens the app and their streak was broken
 * (i.e. last activity > 24h ago). Check via AsyncStorage key '@fixi:last_activity'.
 *
 * ─── PSYCHOLOGY (Loss Aversion) ────────────────────────────────────────────────
 * The streak represents the user's progress identity. Losing it creates genuine
 * psychological pain. The Shield is the cure, not just a purchase.
 * - Fox state: "empathy" – not "celebrating" (avoid tone-deaf energy)
 * - Copy: "Einmal passiert. Muss nicht bleiben." (not "BUY NOW!")
 * - Timer element: "Angebot endet in 23:47 min" – real 24h window, real urgency
 *
 * ─── IAP via RevenueCat ────────────────────────────────────────────────────────
 * Product type: Consumable (one-time, not subscription)
 * Product ID: 'streak_shield_099' (configure in RevenueCat dashboard)
 * Price: €0.99 / $0.99 – below psychological friction threshold
 * Use: Purchases.purchasePackage() from react-native-purchases
 * On success: call store.extendStreak() or store.setStreakShieldUsed()
 *
 * ─── UI SPEC ───────────────────────────────────────────────────────────────────
 * - Bottom Sheet modal (not fullscreen – feels less invasive)
 * - Fox mascot (empathy state) at top
 * - Headline: "Dein Streak ist gerade gebrochen."
 * - Sub: "Einmal passiert. Muss nicht bleiben."
 * - Countdown timer: "Angebot endet in HH:MM:SS" (24h window from moment of break)
 * - CTA: "Streak retten – 0,99 €" (primary Mint gradient)
 * - Secondary: "Nein danke" (text link, low visual weight)
 * - Background: theme-adaptive (dark/light mode)
 *
 * ─── ASYNC STORAGE KEYS ────────────────────────────────────────────────────────
 * '@fixi:streak_shield_offer_shown_at'  – ISO timestamp of last offer shown
 * '@fixi:streak_shield_used_count'      – total number of shields used (analytics)
 *
 * ─── WHEN NOT TO SHOW ──────────────────────────────────────────────────────────
 * - If streak was 0 before break (no streak to save)
 * - If user already used a shield in the last 7 days (prevent abuse)
 * - If user is Premium (consider giving 1 free shield/month as premium perk)
 *
 * ─── NEXT SPRINT TO-DO ─────────────────────────────────────────────────────────
 * 1. Implement RevenueCat consumable IAP purchase flow
 * 2. Build the UI with FoxMascot + countdown timer + CTA
 * 3. Integrate trigger into HomeScreen useEffect (check streak on app open)
 * 4. Track analytics: shield_shown, shield_purchased, shield_dismissed
 */

// TODO: Implement this component in the next Streak Shield sprint.
// Placeholder exists to document architecture decisions and unblock future dev.

export {};
