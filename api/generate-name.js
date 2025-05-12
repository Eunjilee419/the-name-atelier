
export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang } = req.body;

  const { getSajuFromDate } = require('./accurateSaju');
  const { analyzeSaju } = require('./sajuUtils');

  const sajuChars = getSajuFromDate(dob);
  const { missing, excessive } = analyzeSaju(sajuChars);

  const prompts = {
    en: `You are a Korean saju-based naming expert.

The user was born on: ${dob}
Your job is to analyze their saju, then generate English names that match.

Missing element: ${missing}
Excessive element: ${excessive}

Traits: ${traits}
Gender: ${gender}
Purpose: ${purpose}

Rules:
1. Only use names starting with a letter matching the missing element:
   - Wood: G, K, C
   - Fire: N, D, R, L, T
   - Earth: M, B, F, P
   - Metal: S, J, Z, Ch
   - Water: H, I, E, O, U
2. Never use names starting with letters of the excessive element. No exceptions.
3. Each name must include meaning + how it reflects saju + sound-element logic.`
  };

  const prompt = prompts[lang] || prompts["en"];

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();
    const resultText = data.choices?.[0]?.message?.content || "No result";
    res.status(200).json({ result: resultText });
  } catch (err) {
    res.status(500).json({ error: "API Error" });
  }
}
