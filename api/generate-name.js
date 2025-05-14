
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
  const { counts, missing, excessive } = analyzeSaju(sajuChars);

  const baseRule = `Use only initials matching the missing elements:
- Wood: G, K, C
- Fire: N, D, R, L, T
- Earth: M, B, F, P
- Metal: S, J, Z, Ch
- Water: H, I, E, O, U
Never use initials of the excessive element.`;

  const prompts = {
    en: `You're a Western name expert using Korean saju (Four Pillars) and sound-element theory.

Birthdate: ${dob}
Missing elements: ${missing.join(", ")}
Excessive element: ${excessive}
Gender: ${gender}
Traits: ${traits}
Purpose: ${purpose}

Instructions:
- Generate exactly one culturally appropriate English given name for each missing element. Do NOT use Korean, Chinese, or Japanese names, or romanized versions.
- Each name must follow the sound-element initial rules.
${baseRule}
For each name, explain its meaning and how it aligns with the saju.`,

    ko: `당신은 한국 사주(四柱命理)와 소리오행 이론에 기반한 한국어 작명 전문가입니다.

생년월일: ${dob}
부족한 오행: ${missing.join(", ")}
과한 오행: ${excessive}
성별: ${gender}
원하는 이미지나 성격: ${traits}
이름의 용도: ${purpose}

조건:
- 부족한 오행 각각에 대해 순수한 한국식 이름을 하나씩 추천하세요.
- 반드시 한글 이름만 생성하세요. 영어식, 중국식, 일본식 이름은 사용 금지입니다.
${baseRule}`,

    ja: `あなたは韓国の四柱推命と音の五行に基づく日本語ネーミングの専門家です。

生年月日: ${dob}
不足している五行: ${missing.join(", ")}
過剰な五行: ${excessive}
性別: ${gender}
希望する特徴: ${traits}
目的: ${purpose}

指示:
- 不足している五行ごとに、文化的に正しい日本人の名前を1つずつ提案してください。
- 中国語・韓国語・英語の名前は使用しないでください。
${baseRule}`,

    zh: `你是一位结合韩式四柱命理与声音五行理论的中文命名专家。

出生日期: ${dob}
缺失五行: ${missing.join(", ")}
过盛五行: ${excessive}
性别: ${gender}
特质: ${traits}
用途: ${purpose}

说明:
- 请为每个缺失的五行各生成一个文化上合适的中文名字。
- 禁止使用韩文、日本文、英文名字或拼音风格的名字。
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
    console.error("❌ GPT 호출 에러:", err);
    res.status(500).json({ error: "GPT 호출 실패" });
  }
}
