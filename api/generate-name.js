
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang } = req.body;
  const { analyzeSaju } = require('./sajuUtils');

  const filePath = path.join(process.cwd(), 'saju_full_1940_2030.json');
  const sajuDB = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const saju = sajuDB[dob];

  if (!saju) {
    return res.status(400).json({ error: 'Invalid date or out of supported range (1940–2030).' });
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
For each name, explain its meaning and how it aligns with the saju.`,

    ja: `あなたは韓国の四柱推命と音の五行に基づく日本語ネーミングの専門家です。

生年月日: ${dob}
不足している五行: ${missing}
過剰な五行: ${excessive}
性別: ${gender}
希望する特徴: ${traits}
目的: ${purpose}

指示:
- 純粋な日本式の名前を3つ提案してください。
- 各名前は漢字で表記し、意味と音の五行との関連を説明してください。
- 韓国風の名前や韓国語の読みは使用しないこと。
- 姓（名字）は含めず、名（下の名前）のみを提案してください。
${baseRule}`,

    zh: `你是一位结合韩式四柱命理与声音五行理论的中文命名专家。

出生日期: ${dob}
缺失五行: ${missing}
过盛五行: ${excessive}
性别: ${gender}
特质: ${traits}
用途: ${purpose}

说明:
- 请生成3个标准中文名字（仅名），避免使用姓氏。
- 每个名字需提供汉字、拼音、含义及五行音理逻辑。
- 禁止使用韩文或韩式风格的名字。
${baseRule}`
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
    const resultText = data.choices?.[0]?.message?.content || "No result";
    res.status(200).json({ result: resultText });
  } catch (err) {
    res.status(500).json({ error: "API Error" });
  }
}
