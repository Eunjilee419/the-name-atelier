
// /api/generate-name.js (OpenAI fetch 방식 - no openai package)

import { getSajuFromDate, getLackingElements } from '../lib/sajuUtils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { dob, lang = 'en', gender = 'neutral', traits = '', purpose = 'personal' } = req.body;
  if (!dob) return res.status(400).json({ message: 'Missing birth date' });

  try {
const phoneticMap = {"木": ["G", "K", "C"], "火": ["N", "D", "R", "L", "T"], "土": ["M", "B", "F", "P"], "金": ["S", "J", "Z", "Ch"], "水": ["H", "I", "E", "O", "U"]};

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
For each name, explain:
1. The meaning of the name itself
2. Which saju element it complements and why

${purpose === 'brand' ? `If the purpose is 'brand', generate 3 creative and culturally appropriate brand names (not personal names) in the specified language. Each name must:
- Reflect the lacking saju element(s)
- Be easy to pronounce
- Sound unique and memorable
- Include a meaning
- Explain how it relates to the saju

Respond only with a valid JSON array like this:
[
  {
    "name": "...",
    "meaning": "...",
    "element": "...",
    "comment": "..."
  }
]
` : `Each result must be a JSON object with:
- name: the chosen name
- meaning: the meaning of the name itself (not related to saju)
- element: one of 木, 火, 土, 金, 水
- comment: how the name complements the lacking saju element

Respond only with a valid JSON array.`}
  {
    "name": "...",
    "meaning": "...",
    "element": "...",
    "comment": "..."
  }
]

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
      
    const letterLimits = lacking.map(e => `- ${e}: ${phoneticMap[e].join(', ')}`).join('\n');
    const letterRule = `\nYou must generate names that start with the following letters based on the lacking saju elements:\n${letterLimits}\nUse only these starting letters. Do not guess or modify.`;

    const promptWithLetters = `${prompt}\n${letterRule}`;

    body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: promptWithLetters }],
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
