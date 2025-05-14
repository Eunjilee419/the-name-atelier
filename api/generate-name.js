
// /api/generate-name.js

import { getSajuFromDate, getLackingElements } from '../lib/sajuUtils.js';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { dob, lang = 'en', gender = 'neutral', traits = '', purpose = 'personal' } = req.body;
  if (!dob) return res.status(400).json({ message: 'Missing birth date' });

  try {
    const saju = getSajuFromDate(dob);
    const lacking = getLackingElements(saju);

    const prompt = `
You are an expert Korean saju-based name generator.

Saju information:
- Year Pillar: ${saju.year}
- Month Pillar: ${saju.month}
- Day Pillar: ${saju.day}
- Hour Pillar: ${saju.hour}
- Lacking elements: ${lacking.join(', ')}

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
    `;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9
    });

    const text = chat.choices?.[0]?.message?.content?.trim();
    const result = JSON.parse(text);

    res.status(200).json({ result });
  } catch (err) {
    console.error('[Name Generator Error]', err);
    res.status(500).json({ message: 'Name generation failed' });
  }
}
