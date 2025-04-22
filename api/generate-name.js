
export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang } = req.body;

  const prompts = {
    en: `You are a naming expert working for 'The Name Atelier'. Generate 3 name suggestions based on:\n- Purpose: ${purpose}\n- Gender: ${gender}\n- Date of Birth: ${dob}\n- Desired traits: ${traits}\nExplain each name (meaning, emotional impression, reason).`,
    ko: `'The Name Atelier'의 작명 전문가로서 아래 정보에 기반해 이름 3개를 추천해주세요:\n- 이름 용도: ${purpose}\n- 성별: ${gender}\n- 생년월일: ${dob}\n- 원하는 이미지/특성: ${traits}\n각 이름에 대해 의미, 감성 인상, 이유를 설명해주세요.`,
    zh: `你是“The Name Atelier”的命名专家。请根据以下信息推荐3个名字：\n- 用途: ${purpose}\n- 性别: ${gender}\n- 出生日期: ${dob}\n- 希望的特质: ${traits}\n请解释每个名字的含义、情感印象和适合的理由。`,
    ja: `あなたは「The Name Atelier」のネーミング専門家です。以下の情報をもとに、名前を3つ提案してください。\n- 目的: ${purpose}\n- 性別: ${gender}\n- 生年月日: ${dob}\n- 希望する印象・特徴: ${traits}\nそれぞれの名前について、意味・印象・適している理由を説明してください。`
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

  } catch (e) {
    res.status(500).json({ error: "Something went wrong", details: e.message });
  }
}
