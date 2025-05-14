
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const dob = req.body?.dob || req.query?.dob;
  const { purpose, gender, traits, lang } = req.body;
  const { analyzeSaju } = require('./sajuUtils');

  if (!dob) {
    return res.status(400).json({ error: 'Missing dob parameter.' });
  }

  const filePath = path.join(process.cwd(), 'saju_full_1900_2050.json');
  let sajuDB;
  try {
    sajuDB = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error("❌ JSON 파일 읽기 실패:", err);
    return res.status(500).json({ error: 'Failed to read saju JSON file.' });
  }

  const saju = sajuDB[dob];
  if (!saju) {
    return res.status(400).json({ error: 'Date not found in saju dataset.' });
  }

  const sajuChars = [...saju.년주, ...saju.월주, ...saju.일주];
  const { missing, excessive } = analyzeSaju(sajuChars);

  const baseRule = `Use only initials matching the missing element:
- Wood: G, K, C
- Fire: N, D, R, L, T
- Earth: M, B, F, P
- Metal: S, J, Z, Ch
- Water: H, I, E, O, U
Never use initials of the excessive element.`;

  const prompts = {
    en: `You're a Western name expert using Korean saju (Four Pillars) and sound-element theory.

Birthdate: ${dob}
Missing element: ${missing}
Excessive element: ${excessive}
Gender: ${gender}
Traits: ${traits}
Purpose: ${purpose}

Instructions:
- Generate 3 culturally appropriate English first names only.
- Do not include Korean names or last names.
${baseRule}
For each name, explain its meaning and how it aligns with the saju.`
  };

  const prompt = prompts[lang] || prompts.en;

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
    console.log("📦 GPT 응답:", JSON.stringify(data, null, 2));

    const resultText = data.choices?.[0]?.message?.content || "No result";
    console.log("📤 최종 결과:", resultText);

    res.status(200).json({ result: resultText });

  } catch (err) {
    console.error("❌ GPT 호출 에러:", err);
    res.status(500).json({ error: "GPT 호출 실패" });
  }
}
