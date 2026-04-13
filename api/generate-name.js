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

부족한 오행: ${lacking.join(",")}

오행별 초성 규칙:
목: ㄱ,ㅋ
화: ㄴ,ㄷ,ㄹ,ㅌ
토: ㅁ,ㅂ,ㅍ
금: ㅅ,ㅈ,ㅊ
수: ㅇ,ㅎ

규칙:
- 반드시 부족한 오행에 해당하는 초성으로 시작해야 합니다
- 실제 사람 이름처럼 자연스러워야 합니다
- 설명형 단어 금지
- 자연물 이름 금지

출력 형식:
이름 | 오행 | 의미
이름 | 오행 | 의미
이름 | 오행 | 의미`,

    en: `Generate 3 names based on the saju.

Lacking elements: ${lacking.map(elementToEnglish).join(", ")}

Element to initial letter mapping:
Wood: G, K
Fire: N, D, R, T
Earth: M, B, P
Metal: S, J, C
Water: O, H

Rules:
- Each name MUST start with a letter matching the lacking elements
- Use ONLY real human or brand names
- Do not use nature words or object names
- Do not create literal meaning-based words
- Names must sound natural in English

Output format:
Name | Element | Meaning
Name | Element | Meaning
Name | Element | Meaning`,

    zh: `请根据以下八字信息生成3个中文名字：

缺失五行：${lacking.join("、")}

五行汉字参考：
木：林, 森, 柏, 桐, 梓, 荣, 栋
火：炎, 灿, 炫, 烨, 煜, 晶, 晨
土：坤, 城, 均, 培, 基, 岳, 峰
金：锋, 铭, 钧, 鑫, 铎, 锐, 钟
水：涵, 洋, 泽, 润, 浩, 清, 海

规则：
- 名字必须为2或3个汉字
- 每个名字必须包含至少一个缺失五行的汉字
- 名字必须自然，像真实中文人名
- 禁止拼音、英文
- 禁止纯描述性词语组合

输出格式：
名字 | 五行 | 含义
名字 | 五行 | 含义
名字 | 五行 | 含义`,

    ja: `以下の四柱推命情報に基づいて、日本人の名前を3つ生成してください。

不足五行：${lacking.join("、")}

五行の参考漢字（必ず使用）：
木：樹, 桐, 梓, 榛
火：灯, 明, 晴, 昭
土：城, 均, 基, 岳
金：鋭, 銘, 鉄, 銀
水：海, 涼, 湊, 潤, 澄

ルール（必ず守ること）：
- 名前は日本人の名前として自然であること（例：悠真、陽菜、翔太）
- 名前は2〜3文字の漢字で構成する
- 少なくとも1つは不足五行の漢字を含める
- 「五行」は1つだけ記載する（不足五行のみ）
- 自然物の単純な名前は禁止（例：海、森、森林、海洋）
- 中国人の名前のような形式は禁止
- 説明文は禁止（短く簡潔に）

出力形式（厳守）：
名前 | 五行 | 意味
名前 | 五行 | 意味
名前 | 五行 | 意味`

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
