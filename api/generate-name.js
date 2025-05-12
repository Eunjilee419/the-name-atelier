export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang, element, excessElement } = req.body;

  const prompts = {
    en: `You are a naming expert using Korean saju (Four Pillars) and sound-element theory (소리오행).
Generate 3 English name suggestions for the user with the following information:

- Date of Birth: ${dob}
- Gender: ${gender}
- Purpose: ${purpose}
- Desired traits: ${traits}
- Missing element: ${element}
- Excessive element: ${excessElement}

Names must be authentic English names (not romanized Korean names).

Each name must:
1. Start with a letter that matches the needed element:
   - Wood: G, K, C
   - Fire: N, D, R, L, T
   - Earth: M, B, F, P
   - Metal: S, J, Z, Ch
   - Water: H, I, E, O, U
Strict rule: Do NOT use any name starting with letters that correspond to the excessive element (${excessElement}). No exceptions.

2. Avoid initials that correspond to the excessive element (${excessElement}).
3. Fit the user's desired traits.
4. For each name, explain its meaning, sound-element logic, and saju balance.`,

    ja: `あなたは「The Name Atelier」のネーミング専門家です。四柱推命（Saju）と音の五行理論（소리오행）に基づき、以下の情報を持つユーザーのために、日本語の名前を3つ提案してください。

- 生年月日: ${dob}
- 性別: ${gender}
- 目的: ${purpose}
- 希望する印象・特徴: ${traits}
- 不足している五行: ${element}

名前は本物の日本語の名前（英語の音訳ではない）でなければなりません。

各名前について：
1. 以下に対応するローマ字の頭文字を使用してください：
   - 木: G, K, C
   - 火: N, D, R, L, T
   - 土: M, B, F, P
   - 金: S, J, Z, Ch
   - 水: H, I, E, O, U
厳格なルール：過剰な五行に対応する頭文字で始まる名前は絶対に使用しないでください。例外はありません。

2. 過剰な五行に対応する頭文字は避けてください。
3. 名前の意味、音の五行の関連性、四柱とのバランスを説明してください。`,

    ko: `당신은 'The Name Atelier'의 작명 전문가입니다. 다음 정보를 바탕으로 한국 이름 3가지를 제안해주세요:

- 생년월일: ${dob}
- 성별: ${gender}
- 이름 용도: ${purpose}
- 원하는 이미지/특성: ${traits}
- 부족한 오행: ${element}

조건:
1. 부족한 오행을 보완하는 자음으로 시작하세요:
   - 목(木): ㄱ, ㅋ (G, K, C)
   - 화(火): ㄴ, ㄷ, ㄹ, ㅌ (N, D, R, L, T)
   - 토(土): ㅁ, ㅂ, ㅍ (M, B, F, P)
   - 금(金): ㅅ, ㅈ, ㅊ (S, J, Z, Ch)
   - 수(水): ㅇ, ㅎ (H, I, E, O, U)
엄격한 규칙: 과잉된 오행 자음으로 시작하는 이름은 절대 추천하지 마세요. 예외 없음.

2. 과잉된 오행 자음은 피하세요.
3. 이름의 의미, 소리오행 근거, 사주 보완 효과를 설명하세요.`,

    zh: `你是“The Name Atelier”的命名专家。请根据以下信息，结合四柱八字（Saju）与声音五行（소리오행），推荐3个中文名字：

- 出生日期: ${dob}
- 性别: ${gender}
- 用途: ${purpose}
- 希望的特质: ${traits}
- 缺失的五行: ${element}

要求：
1. 名字的首字母需对应所需五行：
   - 木: G, K, C
   - 火: N, D, R, L, T
   - 土: M, B, F, P
   - 金: S, J, Z, Ch
   - 水: H, I, E, O, U
严格规定：绝不能使用以过剩五行对应字母开头的名字。没有任何例外。

2. 避免使用代表过剩五行的首字母。
3. 请解释每个名字的含义、声音五行逻辑与八字的平衡关系。`
  };

  const prompt = prompts[lang] || prompts["en"];

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
