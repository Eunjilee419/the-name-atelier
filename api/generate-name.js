
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

  const missingStr = missing.join(", ");
  const missingLine = `Missing elements: ${missingStr}`;
  const instructions = `ONLY generate names for these missing elements: ${missingStr}.
Repeat: DO NOT include names for any elements other than ${missingStr}.
Example: If missing = Water, Metal → return only Water, Metal names.`;

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
${missingLine}
Excessive element: ${excessive}
Gender: ${gender}
Traits: ${traits}
Purpose: ${purpose}

${instructions}

For each missing element, generate ONE culturally appropriate English given name.
Each name MUST include:
- Name
- Meaning
- Why it matches the saju based on its element
${baseRule}`,

    ko: `당신은 한국 사주(四柱命理)와 소리오행 이론에 기반한 작명 전문가입니다.

생년월일: ${dob}
부족한 오행: ${missingStr}
과한 오행: ${excessive}
성별: ${gender}
원하는 이미지나 성격: ${traits}
이름의 용도: ${purpose}

조건:
- 반드시 부족한 오행(${missingStr}) 각각에 대해서만 이름을 생성하세요.
- 다른 오행에 대한 이름은 절대 포함하지 마세요.
예: 수, 금이 부족하면 수, 금 이름만 추천
각 이름에는 반드시 아래 포함:
- 이름(한글/한자)
- 의미
- 오행과의 관계
${baseRule}`,

    ja: `あなたは韓国の四柱推命と音の五行に基づく日本語ネーミングの専門家です。

生年月日: ${dob}
不足している五行: ${missingStr}
過剰な五行: ${excessive}
性別: ${gender}
希望する特徴: ${traits}
目的: ${purpose}

指示:
- ${missingStr} に対してのみ名前を提案してください。
- 記載されていない五行の名前は絶対に生成しないこと。
例：水と金が不足 → 水と金の名前のみ
以下を必ず含む：
- 名前（漢字）
- 意味
- 五行との関係性
${baseRule}`,

    zh: `你是一位结合韩式四柱命理与声音五行理论的中文命名专家。

出生日期: ${dob}
缺失五行: ${missingStr}
过盛五行: ${excessive}
性别: ${gender}
特质: ${traits}
用途: ${purpose}

说明:
- 仅为缺失五行 (${missingStr}) 各生成一个名字。
- 不要为未列出的五行生成任何名字。
例：缺水和金 → 仅返回水和金名字
每个名字必须包含：
- 中文名字（含汉字）
- 含义解释
- 与该五行的关系
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
