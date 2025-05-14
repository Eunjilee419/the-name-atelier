
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
- Generate 3 culturally appropriate English first names only.
- Do not include Korean names or last names.
${baseRule}
For each name, explain its meaning and how it aligns with the saju.`,

    ko: `당신은 한국 사주(四柱命理)와 소리오행 이론에 기반한 작명 전문가입니다.

생년월일: ${dob}
부족한 오행: ${missing.join(", ")}
과한 오행: ${excessive}
성별: ${gender}
원하는 이미지나 성격: ${traits}
이름의 용도: ${purpose}

조건:
- 순수한 한국 이름 3개를 제안하세요.
- 성은 포함하지 말고 이름(한 글자 또는 두 글자 이름)만 추천하세요.
- 각 이름은 의미와 사주와의 연결 이유를 설명해주세요.
${baseRule}`,

    ja: `あなたは韓国の四柱推命と音の五行に基づく日本語ネーミングの専門家です。

生年月日: ${dob}
不足している五行: ${missing.join(", ")}
過剰な五行: ${excessive}
性別: ${gender}
希望する特徴: ${traits}
目的: ${purpose}

指示:
- 純粋な日本式の名前を3つ提案してください。
- 各名前は漢字で表記し、意味と音の五行との関連を説明してください。
- 姓（名字）は含めず、名（下の名前）のみを提案してください。
${baseRule}`,

    zh: `你是一位结合韩式四柱命理与声音五行理论的中文命名专家。

出生日期: ${dob}
缺失五行: ${missing.join(", ")}
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
    console.error("❌ GPT 호출 에러:", err);
    res.status(500).json({ error: "GPT 호출 실패" });
  }
}
