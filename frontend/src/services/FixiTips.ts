export interface FixiTip {
  text: string;
  category: 'saving' | 'mindset';
}

export const FIXI_TIPS: FixiTip[] = [
  { text: 'Bevor du was kaufst, warte 24 Stunden. 70% der Impulskäufe passieren dann nicht.', category: 'saving' },
  { text: 'Abo-Check: Welche Subscriptions nutzt du wirklich? Die anderen? Weg damit.', category: 'saving' },
  { text: 'Meal Prep spart ca. €150/Monat gegenüber Essen bestellen.', category: 'saving' },
  { text: 'Trink Leitungswasser statt Flaschen. €200/Jahr gespart. Ernsthaft.', category: 'saving' },
  { text: 'Cashback-Apps nutzen beim Einkaufen. Ist geschenktes Geld.', category: 'saving' },
  { text: 'Stromvertrag checken. 5 Minuten Aufwand, oft €300/Jahr Ersparnis.', category: 'saving' },
  { text: 'No-Spend-Days: Pick einen Tag pro Woche wo du nix ausgibst.', category: 'saving' },
  { text: 'Secondhand ist nicht uncool. Secondhand ist smart.', category: 'saving' },
  { text: 'Verhandel deinen Handyvertrag. Die meisten senken den Preis wenn du kündigst.', category: 'saving' },
  { text: 'Wenn du es dir nicht zweimal leisten kannst, kannst du es dir nicht leisten.', category: 'saving' },
  { text: 'Schulden sind keine Schande. Nicht handeln wäre eine.', category: 'mindset' },
  { text: 'Du bist nicht deine Schulden. Du bist die Person die sie abbezahlt.', category: 'mindset' },
  { text: 'Jeder Euro den du tilgst ist eine Investition in deine Freiheit.', category: 'mindset' },
  { text: 'Vergleich dich nicht mit anderen. Vergleich dich mit dir von vor einem Monat.', category: 'mindset' },
  { text: 'Perfektion ist nicht das Ziel. Konstanz ist das Ziel.', category: 'mindset' },
  { text: 'Kleine Schritte schlagen große Pläne. Jeden Tag.', category: 'mindset' },
  { text: 'Dein Nettovermögen definiert nicht deinen Selbstwert.', category: 'mindset' },
  { text: 'Die beste Zeit einen Baum zu pflanzen war vor 20 Jahren. Die zweitbeste ist jetzt.', category: 'mindset' },
];

export function getDailyTip(): FixiTip {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return FIXI_TIPS[dayOfYear % FIXI_TIPS.length];
}
