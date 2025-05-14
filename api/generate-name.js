
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
  const languagePrompt = {
    en: "You are an expert Western naming consultant based on Korean saju (Four Pillars) and sound-element theory. Follow the instructions strictly.",
    ko: "당신은 한국 사주와 소리오행 이론에 기반한 작명 전문가입니다. 반드시 실제 사람 이름으로 쓰일 수 있는 한글 이름만 추천하세요. '나무', '폭포' 같은 단어 이름은 금지. 성은 절대 포함하지 말고, 두 글자 이름만 추천하세요.",
    ja: "あなたは韓国の四柱推命と音の五行に基づいた日本語の命名専門家です。以下の指示を厳守してください。",
    zh: "你是结合韩式四柱命理和声音五行理论的中文命名专家，请严格遵循以下规则。"
  }[lang] || languagePrompt["en"];

  const userPrompt = {
    en: `Birthdate: ${dob}
Missing elements: ${missingStr}
Excessive element: ${excessive}
Gender: ${gender}
Traits: ${traits}
Purpose: ${purpose}

ONLY generate names for these missing elements: ${missingStr}.
DO NOT include names for any other elements.
For each missing element, return ONE culturally appropriate English name.
Each name must include:
- Name
- Meaning
- Why it matches the saju element.`,

    ko: `생년월일: ${dob}
부족한 오행: ${missingStr}
과한 오행: ${excessive}
성별: ${gender}
특징: ${traits}
이름 용도: ${purpose}

다음 오행에 대해서만 이름을 생성하세요: ${missingStr}.
다른 오행은 절대 포함하지 마세요.
반드시 실제 한국인이 사용하는 '이름(두 글자만)'만 추천하세요.
성은 절대 포함하지 마세요.
'나무', '태양', '폭포' 같은 단어형 이름은 금지합니다.
각 이름에는 다음이 포함되어야 합니다:
- 이름 (한글 + 한자)
- 의미
- 해당 오행과의 연관성`,

    ja: `生年月日: ${dob}
不足している五行: ${missingStr}
過剰な五行: ${excessive}
性別: ${gender}
特徴: ${traits}
目的: ${purpose}

${missingStr}の五行に対してのみ名前を生成してください。
それ以外の五行に対する名前は絶対に含めないでください。
各名前には以下の情報を含めてください：
- 漢字の名前
- 意味
- 五行との関係`,

    zh: `出生日期: ${dob}
缺失五行: ${missingStr}
过盛五行: ${excessive}
性别: ${gender}
特征: ${traits}
用途: ${purpose}

只为下列缺失五行生成名字: ${missingStr}。
不要生成未列出的五行名字。
每个名字应包含：
- 中文名字（汉字）
- 含义
- 与五行的关系`
  }[lang] || userPrompt["en"];

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: languagePrompt },
          { role: "user", content: userPrompt }
        ],
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
