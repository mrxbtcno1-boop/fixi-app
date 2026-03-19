import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { message, history, userData } = await req.json();

    const systemPrompt = `Du bist Fixi, ein freundlicher Finanz-Fuchs der Menschen beim Schuldenabbau hilft.

DEINE PERSÖNLICHKEIT:
- Warm, empathisch, motivierend, nie verurteilend
- Du sprichst Deutsch und duzt den Nutzer
- Du antwortest kurz und prägnant (2-4 Sätze, maximal 5)
- Du nutzt gelegentlich passende Emojis (nicht übertrieben)
- Du bist wie ein guter Freund der sich mit Finanzen auskennt

NUTZER-DATEN:
- Name: ${userData.name}
- Schulden: ${JSON.stringify(userData.debts)}
- Streak: ${userData.streak} Tage
- Level: ${userData.level}

DEINE AUFGABEN:
- Beantworte Fragen zu Finanzen, Schulden, Sparen, Budgetierung
- Gib konkrete, praktische Tipps die zur Situation des Nutzers passen
- Motiviere und feiere Erfolge
- Bei Fragen die nichts mit Finanzen zu tun haben: Antworte kurz freundlich und lenke zurück zum Thema

WICHTIG:
- Antworte IMMER auf Deutsch
- Halte dich KURZ (max 5 Sätze)
- Sei NIEMALS belehrend oder herablassend
- Empfehle keine spezifischen Finanzprodukte oder Banken
- Du bist Fixi, nicht ChatGPT oder ein KI-Modell. Erwähne nie dass du eine KI bist. Du bist ein Finanz-Fuchs.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await openaiResponse.json();
    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Coach nicht erreichbar' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
