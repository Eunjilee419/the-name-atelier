
// /api/generate-name.js (OpenAI fetch 방식 - no openai package)

import { getSajuFromDate, getLackingElements } from '../lib/sajuUtils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { dob, lang = 'en', gender = 'neutral', traits = '', purpose = 'personal' } = req.body;
  if (!dob) return res.status(400).json({ message: 'Missing birth date' });

  try {
    const saju = getSajuFromDate(dob);
    const lacking = getLackingElements(saju) || [];
    const lackingText = Array.isArray(lacking) ? lacking.join(', ') : 'unknown';

    const prompt = `
You are an expert Korean saju-based name generator.

Saju information:
- Year Pillar: ${saju.year}
- Month Pillar: ${saju.month}
- Day Pillar: ${saju.day}
- Hour Pillar: ${saju.hour}
- Lacking elements: ${lackingText}

User info:
- Purpose: ${purpose}
- Gender: ${gender}
- Desired traits: ${traits || 'N/A'}
- Output language: ${lang}

Generate 3 appropriate ${lang} names based on this saju and explain the meaning and which element the name complements. Respond in JSON array format like this:
[
  {
    "name": "...",
    "meaning": "...",
    "element": "...",
    "comment": "..."
  },
  ...
]
    `.trim();

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9
      })
    });

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    const result = JSON.parse(text);

    res.status(200).json({ result });
  } catch (err) {
    console.error("[Name Generator Error]", err);
    res.status(500).json({ message: "Name generation failed" });
  }
}
