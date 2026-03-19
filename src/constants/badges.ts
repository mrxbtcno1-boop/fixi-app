export interface BadgeDef {
  key: string;
  name: string;
  emoji: string;
  desc: string;
  hint: string; // Shown when locked
  category: 'progress' | 'streak' | 'action' | 'hidden';
  fixiSpeech: string;
}

export const ALL_BADGES: BadgeDef[] = [
  // FORTSCHRITTS-BADGES
  { key: 'first_payment', name: 'Erste Zahlung', emoji: '\uD83C\uDF1F', desc: 'Erste Tilgung eingetragen', hint: 'Trage deine erste Zahlung ein', category: 'progress', fixiSpeech: 'Der wichtigste Schritt ist getan!' },
  { key: '1k_paid', name: '€1.000 Club', emoji: '💪', desc: '1.000€ zurückgezahlt', hint: 'Tilge insgesamt 1.000€', category: 'progress', fixiSpeech: 'Vierstellig getilgt – Wahnsinn!' },
  { key: '5k_paid', name: '€5.000 geschafft', emoji: '\uD83C\uDFC5', desc: '5.000€ zurückgezahlt', hint: 'Tilge insgesamt 5.000€', category: 'progress', fixiSpeech: 'Fünftausend! Du bist nicht aufzuhalten!' },
  { key: '10k_paid', name: 'Fünfstellig getilgt', emoji: '🔥', desc: '10.000€ zurückgezahlt', hint: 'Tilge insgesamt 10.000€', category: 'progress', fixiSpeech: 'ZEHN. TAUSEND. EURO. Legende!' },
  { key: 'first_debt_cleared', name: 'Schuld erledigt!', emoji: '\uD83D\uDCA5', desc: 'Erste Schuld komplett getilgt', hint: 'Tilge eine Schuld komplett', category: 'progress', fixiSpeech: 'Eine Schuld weniger auf der Liste!' },
  { key: 'halftime', name: 'Halftime!', emoji: '🎯', desc: '50% Gesamtfortschritt', hint: 'Erreiche 50% Gesamtfortschritt', category: 'progress', fixiSpeech: 'Die Hälfte ist geschafft – weiter so!' },
  { key: 'ninety_percent', name: 'Fast geschafft!', emoji: '\u26A1', desc: '90% Gesamtfortschritt', hint: 'Erreiche 90% Gesamtfortschritt', category: 'progress', fixiSpeech: 'Noch 10% – das Ziel ist in Sichtweite!' },
  { key: 'debt_free', name: 'SCHULDENFREI', emoji: '🏆', desc: '100% geschafft!', hint: 'Tilge alle Schulden', category: 'progress', fixiSpeech: 'DU HAST ES GESCHAFFT! SCHULDENFREI!' },

  // STREAK-BADGES
  { key: '7_day_streak', name: 'Eine Woche!', emoji: '🔥', desc: '7 Tage in Folge aktiv', hint: 'Sei 7 Tage am Stück aktiv', category: 'streak', fixiSpeech: 'Eine ganze Woche dabei!' },
  { key: '30_day_streak', name: 'Monatskönig', emoji: '\uD83D\uDC51', desc: '30 Tage in Folge aktiv', hint: 'Sei 30 Tage am Stück aktiv', category: 'streak', fixiSpeech: 'Ein ganzer Monat – Respekt!' },
  { key: '60_day_streak', name: 'Unaufhaltbar', emoji: '\uD83D\uDC8E', desc: '60 Tage in Folge aktiv', hint: 'Sei 60 Tage am Stück aktiv', category: 'streak', fixiSpeech: 'Zwei Monate nonstop! Unglaublich!' },
  { key: '100_day_streak', name: 'Dreistellig', emoji: '\uD83C\uDF1F', desc: '100 Tage in Folge aktiv', hint: 'Sei 100 Tage am Stück aktiv', category: 'streak', fixiSpeech: 'DREISTELLIG! Du bist ein Vorbild!' },
  { key: '365_day_streak', name: 'Jahres-Legende', emoji: '🦊', desc: '365 Tage in Folge aktiv', hint: 'Sei ein ganzes Jahr am Stück aktiv', category: 'streak', fixiSpeech: 'EIN GANZES JAHR! Du bist eine Legende!' },

  // AKTIONS-BADGES
  { key: 'sprint_king', name: 'Über-Performer', emoji: '🚀', desc: 'Erste Extra-Zahlung geleistet', hint: 'Leiste eine Extra-Zahlung', category: 'action', fixiSpeech: 'Extra-Meile – so geht das!' },
  { key: 'simulator_used', name: 'Stratege', emoji: '\uD83E\uDDE0', desc: 'Simulator einmal genutzt', hint: 'Nutze den Simulator', category: 'action', fixiSpeech: 'Wissen ist Macht! Guter Stratege!' },
  { key: 'coach_used', name: 'Fixis Freund', emoji: '🦊', desc: 'KI-Coach einmal genutzt', hint: 'Frag Fixi um Rat', category: 'action', fixiSpeech: 'Schön, dass du mit mir redest!' },
  { key: 'challenge_done', name: 'Challenge accepted', emoji: '🎯', desc: 'Erste Challenge abgeschlossen', hint: 'Schließe eine Monats-Challenge ab', category: 'action', fixiSpeech: 'Challenge gemeistert!' },
  { key: 'no_new_debt_30', name: 'Clean Month', emoji: '✨', desc: '30 Tage keine neue Schuld', hint: '30 Tage ohne neue Schuld', category: 'action', fixiSpeech: 'Ein sauberer Monat – weiter so!' },
  { key: 'no_new_debt_90', name: 'Disziplin-Meister', emoji: '\uD83C\uDFC5', desc: '90 Tage keine neue Schuld', hint: '90 Tage ohne neue Schuld', category: 'action', fixiSpeech: 'Drei Monate Disziplin – Wahnsinn!' },
  { key: 'debt_destroyer', name: 'Schulden-Vernichter', emoji: '\uD83D\uDCA3', desc: 'Eine Schuld als getilgt markiert', hint: 'Markiere eine Schuld als getilgt', category: 'action', fixiSpeech: 'BOOM! Schuld vernichtet!' },
  { key: 'first_step', name: 'Erster Schritt', emoji: '\uD83D\uDC63', desc: 'Onboarding abgeschlossen', hint: 'Starte mit Fixi', category: 'action', fixiSpeech: 'Willkommen bei Fixi!' },

  // VERSTECKTE BADGES
  { key: 'night_owl', name: 'Nachtaktiv', emoji: '\uD83E\uDD89', desc: 'App nach Mitternacht genutzt', hint: '???', category: 'hidden', fixiSpeech: 'Um diese Uhrzeit? Hardcore!' },
  { key: 'early_bird', name: 'Frühaufsteher', emoji: '\uD83D\uDC26', desc: 'App vor 6 Uhr genutzt', hint: '???', category: 'hidden', fixiSpeech: 'Der frühe Vogel fängt den Wurm!' },
  { key: 'speed_demon', name: 'Speed-Zahler', emoji: '\u26A1', desc: '3 Zahlungen an einem Tag', hint: '???', category: 'hidden', fixiSpeech: 'Drei auf einmal? Wow!' },
  { key: 'comeback_kid', name: 'Comeback Kid', emoji: '💪', desc: 'Nach 7+ Tagen Inaktivität zurück', hint: '???', category: 'hidden', fixiSpeech: 'Willkommen zurück! Schön dich zu sehen!' },
];

export function getBadgesByCategory(category: BadgeDef['category']): BadgeDef[] {
  return ALL_BADGES.filter(b => b.category === category);
}

export function getBadgeDef(key: string): BadgeDef | undefined {
  return ALL_BADGES.find(b => b.key === key);
}

// Monthly challenges
export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  unit: string;
  fixi_hint: string;
}

export const MONTHLY_CHALLENGES: Challenge[] = [
  { id: 'extra_100', title: 'Finde 100€ Extra', description: 'Finde diesen Monat 100€ extra für deine Schulden', targetAmount: 100, unit: '€', fixi_hint: 'Noch {remaining}€! Das ist ein Abend weniger Essen bestellen!' },
  { id: 'no_impulse_7', title: '7 Tage kein Impulskauf', description: '7 Tage ohne unnötige Einkäufe', targetAmount: 7, unit: 'Tage', fixi_hint: 'Noch {remaining} Tage! Du schaffst das!' },
  { id: 'cancel_abo', title: 'Kündige 1 Abo', description: 'Kündige ein Abo das du nicht brauchst', targetAmount: 1, unit: 'Abo', fixi_hint: 'Schau mal durch deine Abos – welches nutzt du kaum?' },
  { id: 'extra_payments_3', title: '3 Extra-Zahlungen', description: 'Mach 3 Extra-Zahlungen diesen Monat', targetAmount: 3, unit: 'Zahlungen', fixi_hint: 'Noch {remaining} Extra-Zahlungen! Jede zählt!' },
  { id: 'simulator_5x', title: 'Simulator 5x nutzen', description: 'Nutze den Simulator 5 Mal', targetAmount: 5, unit: 'Mal', fixi_hint: 'Noch {remaining} Mal den Simulator öffnen!' },
  { id: 'close_debt', title: 'Eine Schuld abschließen', description: 'Schließe eine Schuld komplett ab', targetAmount: 1, unit: 'Schuld', fixi_hint: 'Welche Schuld ist am nächsten dran?' },
];

export function getCurrentChallenge(): Challenge {
  const month = new Date().getMonth();
  return MONTHLY_CHALLENGES[month % MONTHLY_CHALLENGES.length];
}
