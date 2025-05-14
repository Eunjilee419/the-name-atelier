
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
- ONLY generate names for the missing elements listed above.
- DO NOT generate names for elements not listed above.
- For each missing element, generate ONE culturally appropriate English name.
- Each name MUST include:
  • Name
  • Meaning
  • Why it matches the saju based on its element
${baseRule}`,

    ko: `당신은 한국 사주(四柱命理)와 소리오행 이론에 기반한 작명 전문가입니다.

생년월일: ${dob}
부족한 오행: ${missing.join(", ")}
과한 오행: ${excessive}
성별: ${gender}
원하는 이미지나 성격: ${traits}
이름의 용도: ${purpose}

조건:
- 위에 제시된 부족한 오행 각각에 대해서만 이름을 생성하세요.
- 목록에 없는 오행에 대한 이름은 생성하지 마세요.
- 각 이름에 반드시 다음 포함:
  • 한글+한자 이름
  • 의미
  • 오행과의 연결성
${baseRule}`,

    ja: `あなたは韓国の四柱推命と音の五行に基づく日本語ネーミングの専門家です。

生年月日: ${dob}
不足している五行: ${missing.join(", ")}
過剰な五行: ${excessive}
性別: ${gender}
希望する特徴: ${traits}
目的: ${purpose}

指示:
- 上記の不足している五行に対してのみ名前を提案してください。
- 記載されていない五行の名前は生成しないこと。
- 各名前に必ず以下を含めてください：
  • 漢字表記の名前
  • 意味の説明
  • 五行との関連性
${baseRule}`,

    zh: `你是一位结合韩式四柱命理与声音五行理论的中文命名专家。

出生日期: ${dob}
缺失五行: ${missing.join(", ")}
过盛五行: ${excessive}
性别: ${gender}
特质: ${traits}
用途: ${purpose}

说明:
- 仅为缺失五行各生成一个名字。
- 不要为未列出的五行生成名字。
- 每个名字必须包含：
  • 中文名字（含汉字）
  • 含义解释
  • 与该五行的关系
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
