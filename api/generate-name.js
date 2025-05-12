
export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang } = req.body;

  const prompts = {
    en: `You are a Korean saju-based naming expert. The user only provides their date of birth and desired traits.

Step 1: Analyze the user's saju (Four Pillars) based on their birthdate: ${dob}.
- Determine which element is missing or weak.
- Determine if any element is excessive.

Step 2: Based on that, generate 3 English name ideas that:
- Start with a letter corresponding to the missing element:
  Wood: G, K, C
  Fire: N, D, R, L, T
  Earth: M, B, F, P
  Metal: S, J, Z, Ch
  Water: H, I, E, O, U
- Strictly avoid names starting with letters related to the excessive element. No exceptions.
- Use the traits, purpose, and gender below to reflect the desired tone and meaning.

Traits: ${traits}
Gender: ${gender}
Purpose: ${purpose}`,

    ja: `あなたは韓国の四柱推命と音の五行に基づく名付けの専門家です。

ステップ1：生年月日 ${dob} に基づき、ユーザーの四柱を分析してください。
- 不足または弱い五行を特定してください。
- 過剰な五行があれば、それも特定してください。

ステップ2：その分析をもとに、次の条件で日本の名前を3つ提案してください：
- 不足している五行に対応するローマ字で始めること
- 過剰な五行に対応する頭文字で始まる名前は絶対に含めないこと
- ユーザーの希望する特徴、性別、目的に合う名前であること

特徴: ${traits}
性別: ${gender}
目的: ${purpose}`,

    ko: `당신은 한국 사주 이론과 소리오행에 기반한 작명 전문가입니다.

1단계: 사용자 생년월일 ${dob} 를 바탕으로 사주를 분석해주세요.
- 부족하거나 약한 오행을 찾고,
- 과잉된 오행이 있다면 그것도 파악합니다.

2단계: 이를 바탕으로 다음 조건에 따라 이름을 지어주세요:
- 부족한 오행에 해당하는 자음으로 시작해야 합니다.
  목(木): ㄱ, ㅋ / 화(火): ㄴ, ㄷ, ㄹ, ㅌ / 토(土): ㅁ, ㅂ, ㅍ / 금(金): ㅅ, ㅈ, ㅊ / 수(水): ㅇ, ㅎ
- 과잉된 오행 자음은 절대 포함하지 마세요. 예외 없이 제거하세요.
- 사용자 성별, 용도, 원하는 이미지/특성도 반영해주세요.

특성: ${traits}
성별: ${gender}
이름 용도: ${purpose}`,

    zh: `你是一位根据四柱命理与声音五行进行命名的专家。

第一步：请根据出生日期 ${dob} 分析用户的四柱结构。
- 判断哪种五行元素不足或较弱。
- 同时判断是否存在某个过剩元素。

第二步：在此基础上推荐3个中文名字：
- 名字需以代表不足五行的字母开头：
  木: G, K, C / 火: N, D, R, L, T / 土: M, B, F, P / 金: S, J, Z, Ch / 水: H, I, E, O, U
- 不得使用任何以过剩五行字母开头的名字。必须完全排除。
- 名字要符合用户的性别、用途及所希望的特质

特质: ${traits}
性别: ${gender}
用途: ${purpose}`
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
