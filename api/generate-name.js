
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

    // 언어별 지시 보완
    let nameStyleInstruction = '';
    if (lang === 'en') {
      nameStyleInstruction = 'Generate 3 culturally appropriate modern English first names (not Korean romanizations).';
    } else if (lang === 'zh') {
      nameStyleInstruction = 'Generate 3 appropriate Chinese given names (no surname).';
    } else if (lang === 'ja') {
      nameStyleInstruction = 'Generate 3 appropriate Japanese given names (名前のみ, no surname).';
    } else {
      nameStyleInstruction = 'Generate 3 appropriate Korean names in native Hangul. For each Korean name, include the 한자 (Chinese characters), its meaning, and explain how it complements the saju.';
    }

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

${nameStyleInstruction}
For each name, explain its meaning and which element it complements.
Each result must include:
- name: the chosen name
- meaning: the meaning of the name itself (not the element)
- element: one of 木, 火, 土, 金, 水
- comment: how the name complements the lacking saju element
    `.trim();

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 800
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
