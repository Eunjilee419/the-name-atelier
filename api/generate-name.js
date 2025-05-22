const { getSajuFromDate, getLackingElements } = require('./sajuUtils.js');

const phoneticMap = {
  木: ['G', 'K', 'C'],
  火: ['N', 'D', 'R', 'L', 'T'],
  土: ['M', 'B', 'F', 'P'],
  金: ['S', 'J', 'Z', 'Ch'],
  水: ['H', 'I', 'E', 'O', 'U']
};

const prompts = {
  en: (letters, traits, gender, purpose) => `
Generate 3 unique English ${purpose === 'personal' ? 'given' : 'brand'} names for a ${gender}.
Each name MUST start with one of these letters ONLY: ${letters.join(', ')}.
Traits to reflect: "${traits}".
Respond ONLY in this format (one per line):
Name: Meaning
Do not include any other text.
If no suitable names, reply "No suitable names."
`,
  ko: (letters, traits, gender, purpose) => `
당신은 전문 작명가입니다.
아래 시작 알파벳(${letters.join(', ')})을 엄격히 사용해 한국식 ${purpose === 'personal' ? '이름' : '브랜드명'} 3개를 추천하세요.
"${traits}" 특성을 반영해야 합니다.
출력 형식은 반드시 아래처럼 한 줄에 하나씩, 이름: 의미 형태만 출력하세요.
적합한 이름이 없으면 "적합한 이름이 없습니다." 라고 출력하세요.
`,
  zh: (letters, traits, gender, purpose) => `
你是一名专业起名师。
请严格使用以下首字母(${letters.join(', ')})，为${purpose === 'personal' ? '中文名字' : '中文品牌名'}生成3个名字。
名字必须反映特征："${traits}"。
请仅按格式“名字: 寓意”逐行输出。
如果没有合适的名字，请输出“没有合适的名字”。
`,
  ja: (letters, traits, gender, purpose) => `
あなたはプロの名付け師です。
以下の頭文字(${letters.join(', ')})を厳密に使い、${purpose === 'personal' ? '人名' : 'ブランド名'}を3つ考えてください。
"${traits}"の特徴を反映してください。
出力は「名前: 意味」の形式で1行ずつ書いてください。
適切な名前がなければ「適切な名前がありません」と返してください。
`
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { dob, lang, gender, purpose, traits } = req.body;

    const saju = getSajuFromDate(dob);
    const lacking = getLackingElements(saju);

    if (!lacking.length) {
      return res.json({ result: [{
        name: '',
        element: '',
        meaning: '오행이 모두 균형이라 추천이 어렵습니다.'
      }]});
    }

    const allowedLetters = lacking.flatMap(e => phoneticMap[e] || []).filter(Boolean);

    if (allowedLetters.length === 0) {
      return res.json({ result: [{
        name: '',
        element: lacking.join(', '),
        meaning: '부족 오행에 해당하는 글자 매핑이 없습니다.'
      }]});
    }

    const promptFunc = prompts[lang] || prompts['en'];
    const prompt = promptFunc(allowedLetters, traits, gender, purpose);

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

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // 파싱 시 - Meaning: 등도 처리하도록 강화
    const result = lines.map(line => {
      let parts = line.split(/[-:] ?Meaning:? ?/i);
      if (parts.length < 2) parts = line.split(':');
      return {
        name: parts[0].trim(),
        meaning: parts.slice(1).join(':').trim(),
        element: lacking.map(e =>
          e === '木' ? 'Wood' :
          e === '火' ? 'Fire' :
          e === '土' ? 'Earth' :
          e === '金' ? 'Metal' :
          e === '水' ? 'Water' : e
        ).join(', ')
      };
    }).filter(item => item.name && item.meaning && item.name.toLowerCase() !== 'no suitable names' && item.name !== '적합한 이름이 없습니다' && item.name !== '没有合适的名字' && item.name !== '適切な名前がありません');

    if (result.length === 0) {
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
      }]});
    }

    res.status(200).json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

