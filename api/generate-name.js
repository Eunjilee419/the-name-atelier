
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang } = req.body;

  const { analyzeSaju } = require('./sajuUtils');

  const filePath = path.join(process.cwd(), 'public', 'saju_full_1920_2030.json');
  const sajuDB = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const saju = sajuDB[dob];
  if (!saju) {
    return res.status(400).json({ error: 'Invalid date or out of supported range (1920–2030).' });
  }

  const sajuChars = [...saju.년주, ...saju.월주, ...saju.일주];
  const { missing, excessive } = analyzeSaju(sajuChars);

  const prompt = `You're a naming expert using Korean saju (Four Pillars) and sound-element theory.

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
- For each name, include meaning and saju logic.`;

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
