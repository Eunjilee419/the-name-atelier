const { getSajuFromDate, getLackingElements } = require('./sajuUtils.js');

const phoneticMap = {
  '木': ['G', 'K', 'C'],
  '火': ['N', 'D', 'R', 'L', 'T'],
  '土': ['M', 'B', 'F', 'P'],
  '金': ['S', 'J', 'Z', 'Ch'],
  '水': ['H', 'I', 'E', 'O', 'U']
};

const prompts = {
  en: (letters, traits, gender, purpose) => `
You are an expert baby/brand name generator.
Generate exactly 3 unique English ${purpose === 'personal' ? 'given' : 'brand'} names for a ${gender}, each using ONLY these starting letters: ${letters.join(', ')}.
Each name MUST be a typical native English name (never Korean/Chinese/Japanese or mixed).
Respond ONLY in this strict format (one line per name):

Name: meaning

Do not include any other text, headings, or formatting.
If no names are possible, return nothing.
Desired traits: "${traits}"
`,
  ko: (letters, traits, gender, purpose) => `
당신은 전문 작명가입니다.
아래 시작 알파벳(${letters.join(', ')})만 사용해서 한국식 ${purpose === 'personal' ? '이름' : '브랜드명'} 3개를 추천하세요.
이름은 반드시 전형적인 한국 이름(예: 지훈, 민서, 하늘 등)이어야 하며, 영어식, 일본식, 중국식, 합성(Seo Yoon, Hiroshi 등) 금지.
각 이름 옆에 "${traits}"(이/가 드러나는 뜻풀이/설명)도 반드시 한국어로 1줄만 써주세요.
반드시 아래 형식으로만 출력하세요(한 줄에 이름: 의미):

이름: 의미

불가능하면 아무것도 출력하지 마세요.
`,
  zh: (letters, traits, gender, purpose) => `
你是一名专业起名师。
请只用以下首字母(${letters.join(', ')})，为${gender === 'male' ? '男性' : gender === 'female' ? '女性' : '中性'}${purpose === 'personal' ? '取三个中文名字' : '生成三个中文品牌名'}。
名字必须是正统中文名（不要出现韩/日/英式名字或混合名）。
每个名字后面用中文写一句体现“${traits}”的寓意。
只允许以下格式（每行一名）：名字:寓意
如无可用姓名，请什么都不要输出。
`,
  ja: (letters, traits, gender, purpose) => `
あなたはプロの名付け師です。
以下の頭文字(${letters.join(', ')})で始まる日本語の${purpose === 'personal' ? '人名' : 'ブランド名'}を3つ考えてください。
必ず典型的な日本人の名前にしてください。
韓国・中国・英語式・混合名は禁止。
名前の後に、「${traits}」が伝わる意味を日本語で1文だけ書いてください。
必ず下記フォーマットのみ使用：

名前:意味

該当がなければ何も返さないでください。
`
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { dob, lang, gender, purpose, traits } = req.body;

    // 1. 사주 계산
    const saju = getSajuFromDate(dob);

    // 2. 부족 오행 계산
    const lacking = getLackingElements(saju);
    if (!lacking.length) {
      return res.json({ result: [{ name: '', element: '', meaning: '오행이 모두 균형입니다. 추가 추천이 어렵습니다.' }] });
    }

    // 3. 오행 알파벳 변환
    const allowedLetters = lacking.flatMap(e => phoneticMap[e]).filter(Boolean);

    // 4. GPT 프롬프트 생성
    const prompt = prompts[lang](allowedLetters, traits, gender, purpose);

    // 5. OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    // 6. 결과 파싱
    const lines = text.split('\n').map(x => x.trim()).filter(x => /^[^\s:：-]+[:：-]\s?[^:]+/.test(x));
    const result = lines.map(line => {
      const [name, ...meaningArr] = line.split(/[:：-]/);
      return {
        name: name.trim(),
        element: lacking.map(e =>
          e === '木' ? 'Wood' :
          e === '火' ? 'Fire' :
          e === '土' ? 'Earth' :
          e === '金' ? 'Metal' :
          e === '水' ? 'Water' : e
        ).join(', '),
        meaning: meaningArr.join(':').trim()
      };
    }).filter(item => item.name && item.meaning);

    if (!result.length) {
      return res.json({ result: [{
        name: '',
        element: lacking.map(e =>
          e === '木' ? 'Wood' :
          e === '火' ? 'Fire' :
          e === '土' ? 'Earth' :
          e === '金' ? 'Metal' :
          e === '水' ? 'Water' : e
        ).join(', '),
        meaning: '조건에 맞는 이름이 없습니다.'
      }] });
    }

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
