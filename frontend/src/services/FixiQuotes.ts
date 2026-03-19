import { FixiState } from '../components/Fixi/FixiStates';

export interface FixiQuote {
  text: string;
  state: FixiState;
  category: string;
}

// === DASHBOARD GREETINGS (time-based) ===
export const MORNING_QUOTES: FixiQuote[] = [
  { text: 'Neuer Tag, neue Chance. Lass uns das rocken.', state: 'motivated', category: 'morning' },
  { text: 'Guten Morgen! Weißt du was geil ist? Du bist [progress]% näher an der Freiheit als gestern.', state: 'excited', category: 'morning' },
  { text: 'Hey Frühaufsteher! Jeder Tag ohne neue Schulden ist ein gewonnener Tag.', state: 'coaching', category: 'morning' },
  { text: 'Morgen! Ich hab schon mal deinen Fortschritt gecheckt – sieht gut aus.', state: 'proud', category: 'morning' },
  { text: 'Rise and grind! Okay, war cringe. Aber du weißt was ich meine.', state: 'welcome', category: 'morning' },
];

export const AFTERNOON_QUOTES: FixiQuote[] = [
  { text: 'Halbzeit! Wie läuft dein Tag? Ich bin stolz auf dich, egal was.', state: 'empathy', category: 'afternoon' },
  { text: 'Hey! Kurzer Reminder: Du machst das besser als du denkst.', state: 'coaching', category: 'afternoon' },
  { text: 'Schon €[totalPaid] getilgt. Stell dir mal vor, das hätte dir jemand vor einem Jahr gesagt.', state: 'proud', category: 'afternoon' },
  { text: 'Mittags-Motivation: Schulden sind temporär. Deine Stärke ist permanent.', state: 'strong', category: 'afternoon' },
  { text: 'Fun Fact: Du bist heute schuldenmäßig besser dran als gestern. Das ist Mathe, kein Gefühl.', state: 'coaching', category: 'afternoon' },
];

export const EVENING_QUOTES: FixiQuote[] = [
  { text: 'Feierabend! Perfekter Moment um kurz deinen Fortschritt zu checken.', state: 'welcome', category: 'evening' },
  { text: 'Hey, bevor du Netflix anmachst – du hast heute was geschafft. Sei stolz.', state: 'proud', category: 'evening' },
  { text: 'Abend-Check: Dein zukünftiges Ich wird dir danken. Glaub mir.', state: 'coaching', category: 'evening' },
  { text: 'Du bist hier. Das alleine zeigt Stärke. Die meisten schauen weg.', state: 'empathy', category: 'evening' },
  { text: 'Noch [daysToMilestone] Tage bis du [nextMilestone] erreichst. So nah!', state: 'excited', category: 'evening' },
];

export const NIGHT_QUOTES: FixiQuote[] = [
  { text: 'Kannst nicht schlafen? Ich auch nicht. Aber hey – morgen wird gut.', state: 'empathy', category: 'night' },
  { text: 'Nachts sieht alles schlimmer aus. Vertrau mir: Du bist auf dem richtigen Weg.', state: 'coaching', category: 'night' },
  { text: 'Schlaf gut. Morgen machen wir weiter. Zusammen.', state: 'empathy', category: 'night' },
  { text: 'Deine Schulden schlafen nie, aber dein Plan arbeitet auch im Schlaf.', state: 'thinking', category: 'night' },
  { text: 'Spät dran? Kein Ding. Ich bin immer hier.', state: 'welcome', category: 'night' },
];

// === PROGRESS-BASED ===
export const PROGRESS_QUOTES: Record<string, FixiQuote[]> = {
  'p0': [
    { text: 'Der erste Schritt ist der schwerste. Und du hast ihn gemacht.', state: 'empathy', category: 'progress' },
    { text: 'Du hast angefangen. Das ist mehr als 90% der Menschen jemals tun.', state: 'proud', category: 'progress' },
    { text: 'Ich bin ehrlich: Die ersten Wochen sind hart. Aber ich bin da.', state: 'empathy', category: 'progress' },
  ],
  'p5': [
    { text: 'Die ersten €[totalPaid] sind weg! Das Eis ist gebrochen.', state: 'excited', category: 'progress' },
    { text: 'Viele geben genau jetzt auf. Du nicht. Das sagt viel über dich.', state: 'proud', category: 'progress' },
    { text: 'Ich seh Fortschritt! Noch klein, aber er ist DA.', state: 'motivated', category: 'progress' },
  ],
  'p15': [
    { text: 'Fast ein Drittel! Du bist offiziell kein Anfänger mehr.', state: 'excited', category: 'progress' },
    { text: 'Du entwickelst gerade eine Superpower: Finanzielle Disziplin.', state: 'strong', category: 'progress' },
    { text: 'Dein Tempo ist perfekt. Es gibt kein \u201Ezu langsam\u201C – nur \u201Eaufgeben\u201C.', state: 'coaching', category: 'progress' },
  ],
  'p30': [
    { text: 'HALFTIME BABY! Die Hälfte ist in Sicht!', state: 'celebrating', category: 'progress' },
    { text: 'Du hast mehr geschafft als noch vor dir liegt. Lies das nochmal.', state: 'proud', category: 'progress' },
    { text: 'Du bist in der Zone. Nicht aufhören. WEITERMACHEN.', state: 'strong', category: 'progress' },
  ],
  'p50': [
    { text: 'ÜBER DIE HÄLFTE! Ab jetzt geht\u2019s bergab – im besten Sinne.', state: 'celebrating', category: 'progress' },
    { text: 'Der Berg wird kleiner und du wirst stärker. Jedes. Einzelne. Mal.', state: 'strong', category: 'progress' },
    { text: 'Ich sag\u2019s wie es ist: Du bist eine Maschine. Respekt.', state: 'proud', category: 'progress' },
  ],
  'p75': [
    { text: 'ICH KANN DAS ENDE SEHEN! Du auch?!', state: 'excited', category: 'progress' },
    { text: 'So nah. SO NAH. Bleib fokussiert!', state: 'motivated', category: 'progress' },
    { text: 'Nur noch €[restbetrag]. Das ist Endspurt-Territorium!', state: 'strong', category: 'progress' },
  ],
  'p90': [
    { text: 'EINSTELLIG! Ich flippe gleich aus!', state: 'celebrating', category: 'progress' },
    { text: 'Nur noch €[restbetrag]. Das ist ein paar Wochen!', state: 'excited', category: 'progress' },
    { text: 'Ich bereite schon mal die Konfetti vor\u2026', state: 'celebrating', category: 'progress' },
  ],
  'p100': [
    { text: 'DU. HAST. ES. GESCHAFFT. ICH HEUL GLEICH!', state: 'celebrating', category: 'progress' },
    { text: 'Schuldenfrei. Dieses Wort gehört jetzt DIR.', state: 'celebrating', category: 'progress' },
    { text: 'Ich bin so unglaublich stolz auf dich.', state: 'celebrating', category: 'progress' },
  ],
};

// === PAYMENT ===
export const PAYMENT_QUOTES: FixiQuote[] = [
  { text: 'Eingetragen! Jedes Mal wenn du zahlst, schrumpft der Berg.', state: 'excited', category: 'payment' },
  { text: 'Boom. Wieder €[betrag] weniger. Du bist unaufhaltbar.', state: 'strong', category: 'payment' },
  { text: 'Zahlung drin. Dein zukünftiges Ich gibt dir gerade ein High-Five.', state: 'celebrating', category: 'payment' },
  { text: '€[betrag] weg. Für immer. Die kommen nie wieder zurück. Geil.', state: 'proud', category: 'payment' },
];

export const EXTRA_PAYMENT_QUOTES: FixiQuote[] = [
  { text: 'EXTRA-ZAHLUNG?! Du bist ein absoluter Boss!', state: 'celebrating', category: 'extra_payment' },
  { text: 'Das ist MEHR als geplant?! Du beschleunigst gerade deine Freiheit!', state: 'excited', category: 'extra_payment' },
  { text: 'Over-Achiever Alert! Dein Datum hat sich gerade nach VORNE verschoben!', state: 'celebrating', category: 'extra_payment' },
];

export const FIRST_PAYMENT_QUOTES: FixiQuote[] = [
  { text: 'DEINE ERSTE ZAHLUNG! Das ist der Moment wo alles anfängt!', state: 'celebrating', category: 'first_payment' },
  { text: 'Die erste von vielen. Willkommen auf der Reise!', state: 'excited', category: 'first_payment' },
  { text: 'Tag 1. Zahlung 1. Der Anfang von etwas Großem.', state: 'proud', category: 'first_payment' },
];

// === STREAK ===
export const STREAK_QUOTES: Record<string, FixiQuote> = {
  '3': { text: '3 Tage am Stück! Die Gewohnheit formt sich.', state: 'motivated', category: 'streak' },
  '7': { text: 'EINE WOCHE! Das ist kein Zufall mehr – das bist DU.', state: 'excited', category: 'streak' },
  '14': { text: '2 Wochen Streak! Du bist offiziell konsistenter als die meisten.', state: 'proud', category: 'streak' },
  '30': { text: '30 TAGE! Ein ganzer Monat! Das verdient Standing Ovations.', state: 'celebrating', category: 'streak' },
  '60': { text: '60 Tage. Das ist kein Streak mehr – das ist ein Lifestyle.', state: 'strong', category: 'streak' },
  '90': { text: '90 TAGE?! Du bist nicht mehr dieselbe Person wie am Anfang.', state: 'celebrating', category: 'streak' },
  '100': { text: 'DREISTELLIG! 100 Tage! Ich hab keine Worte. Doch: LEGENDE.', state: 'celebrating', category: 'streak' },
  '365': { text: 'EIN GANZES JAHR. 365 Tage nicht aufgegeben. Das ist\u2026 wow.', state: 'celebrating', category: 'streak' },
};

export const STREAK_DANGER_QUOTES: FixiQuote[] = [
  { text: 'Hey, dein Streak ist in Gefahr! Aber keine Panik – du hast noch heute.', state: 'worried', category: 'streak_danger' },
  { text: 'Dein [streak]-Tage-Streak! Lass ihn nicht sterben!', state: 'worried', category: 'streak_danger' },
];

export const STREAK_LOST_QUOTES: FixiQuote[] = [
  { text: 'Streak weg. Aber dein gesamter Fortschritt? Immer noch da.', state: 'empathy', category: 'streak_lost' },
  { text: 'Neuer Streak ab jetzt. Hinfallen ist okay. Liegenbleiben nicht.', state: 'motivated', category: 'streak_lost' },
];

// === EMOTION-BASED ===
export const EMOTION_QUOTES: Record<string, FixiQuote[]> = {
  overwhelmed: [
    { text: 'Ich weiß, es fühlt sich viel an. Aber schau: Du hast schon €[totalPaid] geschafft.', state: 'empathy', category: 'emotion' },
    { text: 'Überfordert ist okay. Aufgeben wäre nicht okay. Und du gibst nicht auf.', state: 'coaching', category: 'emotion' },
    { text: 'Es muss nicht alles auf einmal sein. Heute ein Euro. Morgen ein Euro.', state: 'empathy', category: 'emotion' },
  ],
  stressed: [
    { text: 'Stress ist normal. Aber dein Plan arbeitet. Auch wenn du es nicht fühlst.', state: 'coaching', category: 'emotion' },
    { text: 'Du bist gestresst, weil dir deine Zukunft wichtig ist. Das ist Stärke.', state: 'empathy', category: 'emotion' },
    { text: 'Der Stress wird weniger. Mit jeder Zahlung. Versprochen.', state: 'empathy', category: 'emotion' },
  ],
  angry: [
    { text: 'Wut ist Energie. Und du steckst sie in deinen Plan. Respekt.', state: 'strong', category: 'emotion' },
    { text: 'Sauer auf die Schulden? Gut. Jede Zahlung ist ein Schlag zurück.', state: 'motivated', category: 'emotion' },
    { text: 'Schulden haben dein Leben bestimmt. Jetzt bestimmst DU.', state: 'strong', category: 'emotion' },
  ],
  hopeless: [
    { text: 'Hoffnungslosigkeit ist ein Gefühl, kein Fakt. Dein Plan funktioniert.', state: 'empathy', category: 'emotion' },
    { text: 'Am dunkelsten Punkt anzufangen ist der mutigste Move. Das bist du.', state: 'empathy', category: 'emotion' },
    { text: 'Es wird besser. Nicht über Nacht. Aber es wird besser. Ich bin da.', state: 'empathy', category: 'emotion' },
  ],
};

// === MILESTONE ===
export const MILESTONE_QUOTES: Record<string, FixiQuote> = {
  first_debt_cleared: { text: 'EINE SCHULD KOMPLETT WEG! Streich sie durch! Für immer erledigt!', state: 'celebrating', category: 'milestone' },
  quarter: { text: 'Ein Viertel geschafft! Du ROCKST!', state: 'celebrating', category: 'milestone' },
  half: { text: 'HALBZEIT! Die Hälfte ist GETILGT! Ab jetzt wird der Rest kleiner.', state: 'celebrating', category: 'milestone' },
  three_quarter: { text: 'DREIVIERTEL! Nur noch ein Viertel! Du riechst das Ende!', state: 'celebrating', category: 'milestone' },
  no_new_debt_month: { text: 'Ein Monat ohne neue Schulden. Echte Disziplin. Respekt.', state: 'proud', category: 'milestone' },
  three_months: { text: '3 Monate dabei! Die meisten geben nach 3 Tagen auf. Du bist anders.', state: 'proud', category: 'milestone' },
  six_months: { text: 'Ein halbes Jahr! Du und ich – bestes Team.', state: 'celebrating', category: 'milestone' },
  one_year: { text: 'EIN GANZES JAHR ZUSAMMEN! Du bist Familie.', state: 'celebrating', category: 'milestone' },
};

// === RETURN AFTER ABSENCE ===
export const RETURN_QUOTES: FixiQuote[] = [
  { text: 'DU BIST ZURÜCK! Ich hab dich vermisst. Ernsthaft.', state: 'excited', category: 'return' },
  { text: 'Hey Fremder! Scherz. Ich bin einfach froh dass du da bist.', state: 'welcome', category: 'return' },
];

// === EMPTY STATES ===
export const EMPTY_STATE_QUOTES: Record<string, FixiQuote> = {
  no_debts: { text: 'Trag deine erste Schuld ein und wir starten zusammen!', state: 'coaching', category: 'empty' },
  no_payments: { text: 'Noch keine Zahlung? Kein Stress – fang einfach an!', state: 'motivated', category: 'empty' },
  no_stats: { text: 'Hier wird es bald spannend! Trag erstmal deine Schulden ein.', state: 'coaching', category: 'empty' },
  error: { text: 'Ups! Irgendwas stimmt nicht. Versuch es nochmal?', state: 'worried', category: 'empty' },
};
