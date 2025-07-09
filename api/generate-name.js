const fetch = require('node-fetch');

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

function generateNamePrompt(saju, lang) {
  const lacking = getLackingElements(saju);
  const prompts = {
    ko: `아래 사주 정보를 참고해 이름 3개를 추천해 주세요. 
    부족한 오행은 '${lacking.join(",")}' 입니다. 
    이름에는 부족한 오행을 보완하는 한자(음)이나 의미가 들어가야 합니다.
    결과는 '이름: 의미' 형식으로 3개만, 각 10자 이내로 제시하세요.`,
    en: `Suggest 3 names based on the following saju (Four Pillars) information.
    The lacking elements are '${lacking.map(elementToEnglish).join(", ")}'.
    Each name should reinforce the missing elements with sound or meaning.
    Please provide 3 names with short explanations, each within 15 characters.`,
    zh: `请根据以下八字信息推荐3个名字。
    缺失的五行为：${lacking.join("、")}。
    名字需补足缺失五行的字或含义。每个名字请附简短解释，15字以内。`,
    ja: `下記の四柱推命情報をもとに、3つの名前を提案してください。
    不足している五行は「${lacking.join("、")}」です。
    不足五行を補う漢字または意味を含めてください。各名前は簡単な説明付きで15文字以内で。`
  };
  return prompts[lang] || prompts["en"];
}

// === 사주 DB 불러오기 ===
const sajuFull = require('./saju_full_1940_2030.json');

// === GPT API 연동 (환경변수 방식) ===
async function callGptNameApi(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400
    })
  });

  const data = await response.json();

  // "이름: 설명" 형식 파싱
  return data.choices[0].message.content
    .split("\n")
    .map(line => line.trim())
    .filter(line => line)
    .map(line => {
      const [name, ...rest] = line.split(":");
      return {
        name: name ? name.trim() : "",
        meaning: rest.length > 0 ? rest.join(":").trim() : ""
      };
    });
}

// === 메인 API 핸들러 ===
export default async function handler(req, res) {
  try {
    // dob 또는 birth 둘 다 지원
    const { dob, birth, lang } = req.body;
    const birthday = dob || birth;
    if (!birthday) {
      return res.status(400).json({error: "생년월일(birthday) 파라미터가 필요합니다."});
    }

    // 1. 사주 정보 추출
    const userSaju = sajuFull[birthday];
    if (!userSaju) {
      return res.status(404).json({error: "해당 생년월일 사주 정보 없음"});
    }

    // 2. 부족 오행 계산
    const lacking = getLackingElements(userSaju);

    // 3. 언어별 프롬프트 생성
    const prompt = generateNamePrompt(userSaju, lang);

    // 4. GPT API 호출 (실제 이름 추천 결과 받기)
    const names = await callGptNameApi(prompt);

    // 5. 결과 반환
    return res.status(200).json({
      names,
      lacking,
      saju: userSaju
    });
  } catch (err) {
    return res.status(500).json({error: "서버 오류", detail: err.message});
  }
}

