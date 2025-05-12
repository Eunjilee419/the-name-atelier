
export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang } = req.body;

  const { getSajuFromDate } = require('./accurateSaju');
  const { analyzeSaju } = require('./sajuUtils');

  const sajuChars = getSajuFromDate(dob);
  const { missing, excessive } = analyzeSaju(sajuChars);

  const prompts = {
    en: `You're a naming expert using Korean saju (Four Pillars) and sound-element theory.

Birthdate: ${dob}
Missing element: ${missing}
Excessive element: ${excessive}
Gender: ${gender}
Traits: ${traits}
Purpose: ${purpose}

Rules:
- Use only initials matching the missing element:
  Wood: G, K, C | Fire: N, D, R, L, T | Earth: M, B, F, P | Metal: S, J, Z, Ch | Water: H, I, E, O, U
- Never use initials tied to the excessive element.
- For each name, include meaning and saju logic.`
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
