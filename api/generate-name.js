// const fetch = require('node-fetch');

// === 오행 매핑 ===
const heavenlyStems = {
  "甲": "목", "乙": "목",
  "丙": "화", "丁": "화",
  "戊": "토", "己": "토",
  "庚": "금", "辛": "금",
  "壬": "수", "癸": "수"
};

const earthlyBranches = {
  "子": "수", "丑": "토", "寅": "목", "卯": "목",
  "辰": "토", "巳": "화", "午": "화", "未": "토",
  "申": "금", "酉": "금", "戌": "토", "亥": "수"
};

const elementMapEn = {
  "목": "Wood", "화": "Fire", "토": "Earth", "금": "Metal", "수": "Water"
};

function ganjiToElements(ganji) {
  if (!ganji || ganji.length !== 2) return [];
  const [stem, branch] = ganji.split("");
  return [heavenlyStems[stem], earthlyBranches[branch]];
}

function sajuToElementCounts(saju) {
  const counts = {"목":0, "화":0, "토":0, "금":0, "수":0};
  ["년주", "월주", "일주"].forEach(key => {
    if (saju[key]) {
      ganjiToElements(saju[key]).forEach(el => { if (el) counts[el]++; });
    }
  });
  return counts;
}

function lackingElements(counts) {
  return Object.keys(counts).filter(k => counts[k] === 0);
}

function getLackingElements(saju) {
  const counts = sajuToElementCounts(saju);
  return lackingElements(counts);
}

function elementToEnglish(ko) {
  return elementMapEn[ko] || ko;
}

// ✅ 여기 수정됨 (형식 강제)
function generateNamePrompt(saju, lang) {
  const lacking = getLackingElements(saju);

  const prompts = {
    ko: `아래 사주 정보를 참고해 이름 3개를 추천해 주세요.
부족한 오행은 '${lacking.join(",")}' 입니다.

반드시 아래 형식으로만 출력하세요. 다른 문장 절대 금지:

이름 | 오행 | 의미
이름 | 오행 | 의미
이름 | 오행 | 의미

오행은 반드시 하나만 선택: 목, 화, 토, 금, 수`,

    en: `You must follow the exact format below. Do not add any extra text.

Name | Element | Meaning
Name | Element | Meaning
Name | Element | Meaning

Rules:
- Use ONLY real English names (no Korean romanization)
- Element must be exactly one of: Wood, Fire, Earth, Metal, Water
- Each meaning must be under 10 words

Lacking elements: ${lacking.map(elementToEnglish).join(", ")}`,

    zh: `请严格按照以下格式输出，不要添加任何额外内容：

名字 | 五行 | 含义
名字 | 五行 | 含义
名字 | 五行 | 含义

缺失五行：${lacking.join("、")}`,

    ja: `必ず以下の形式で出力してください。余計な文章は禁止：

名前 | 五行 | 意味
名前 | 五行 | 意味
名前 | 五行 | 意味

不足五行：${lacking.join("、")}`
  };

  return prompts[lang] || prompts["en"];
}

const sajuFull = require('./saju_full_1940_2030.json');

async function callGptNameApi(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150
    })
  });

  const data = await response.json();

  return data.choices[0].message.content
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.includes("|")) // ✅ 형식 아닌 줄 제거
    .map(line => {
      const parts = line.split("|").map(v => v.trim());

      if (parts.length !== 3) return null;

      const [name, element, meaning] = parts;

      return {
        name,
        element,
        meaning
      };
    })
    .filter(v => v !== null);
}

module.exports = async function handler(req, res) {
  try {
    const { dob, birth, lang } = req.body;
    const birthday = dob || birth;

    if (!birthday) {
      return res.status(400).json({ error: "생년월일(birthday) 파라미터가 필요합니다." });
    }

    const userSaju = sajuFull[birthday];
    if (!userSaju) {
      return res.status(404).json({ error: "해당 생년월일 사주 정보 없음" });
    }

    const lacking = getLackingElements(userSaju);
    const prompt = generateNamePrompt(userSaju, lang);
    const names = await callGptNameApi(prompt);

    return res.status(200).json({
      result: names,
      lacking,
      saju: userSaju
    });

  } catch (err) {
    return res.status(500).json({ error: "서버 오류", detail: err.message });
  }
};
