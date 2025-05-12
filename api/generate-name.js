export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang, element } = req.body;

  const prompts = {
    en: `You are a naming expert using Korean saju (Four Pillars) and sound-element theory (소리오행).
Based on the user's birthdate, purpose, gender, traits, and their missing or excessive element, suggest 3 English or Japanese name ideas.

Each name must:
1. Start with a letter that matches the needed element:
   - Wood: G, K, C
   - Fire: N, D, R, L, T
   - Earth: M, B, F, P
   - Metal: S, J, Z, Ch
   - Water: H, I, E, O, U
2. Avoid initials that correspond to excessive elements.
3. Fit the user's desired traits.
4. For each name, explain its meaning, sound-element logic, and saju balance.`,

    ja: `あなたは「The Name Atelier」のネーミング専門家です。四柱推命（Saju）と音の五行理論（소리오행）に基づき、ユーザーの生年月日・希望の特徴・不足または過剰な五行要素に応じて、3つの日本風の名前を提案してください。

各名前について以下を守ってください：
1. 以下の対応表に基づき、必要な五行に合うローマ字で始まる名前にしてください：
   - 木: G, K, C
   - 火: N, D, R, L, T
   - 土: M, B, F, P
   - 金: S, J, Z, Ch
   - 水: H, I, E, O, U
2. 過剰な五行に対応する頭文字は避けてください。
3. 各名前について、意味、音の五行の説明、四柱とのバランスを簡潔に述べてください。`,

    ko: `당신은 'The Name Atelier'의 작명 전문가입니다. 사주(四柱)와 소리오행 이론에 따라 사용자에게 어울리는 한국 이름 3가지를 제안하세요.

각 이름은 다음 조건을 만족해야 합니다:
1. 부족한 오행을 보완하는 자음으로 시작해야 합니다:
   - 목(木): ㄱ, ㅋ (G, K, C)
   - 화(火): ㄴ, ㄷ, ㄹ, ㅌ (N, D, R, L, T)
   - 토(土): ㅁ, ㅂ, ㅍ (M, B, F, P)
   - 금(金): ㅅ, ㅈ, ㅊ (S, J, Z, Ch)
   - 수(水): ㅇ, ㅎ (H, I, E, O, U)
2. 과잉된 오행에 해당하는 자음은 피해야 합니다.
3. 의미 있고 발음이 자연스러운 이름으로 구성하세요.
4. 각 이름에 대해 의미, 소리오행에 맞는 이유, 사주 보완 효과를 설명하세요.`,

    zh: `你是“The Name Atelier”的命名专家。请基于四柱八字（Saju）和声音五行（소리오행）理论，为用户推荐3个中文名字。

每个名字需满足：
1. 首字母需对应缺失的五行：
   - 木: G, K, C
   - 火: N, D, R, L, T
   - 土: M, B, F, P
   - 金: S, J, Z, Ch
   - 水: H, I, E, O, U
2. 避免使用代表过剩五行的首字母。
3. 名字要符合用户期望的特质与性格。
4. 每个名字需解释：含义、声音五行合理性、如何补足八字。`
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
