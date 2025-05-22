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
Generate exactly 3 unique English ${purpose === 'personal' ? 'given' : 'brand'} names for a ${gender}, each preferably starting with these letters: ${letters.join(', ')}.
Include meanings that reflect traits: "${traits}".
Respond ONLY in the following format (one per line):
Name: Meaning
Do not include headings or extra text.
If no suitable names, respond with nothing.
`,
  ko: (letters, traits, gender, purpose) => `
당신은 전문 작명가입니다.
아래 시작 알파벳(${letters.join(', ')})를 우선 사용해 한국식 ${purpose === 'personal' ? '이름' : '브랜드명'} 3개를 추천하세요.
이름은 반드시 전형적인 한국 이름이어야 하며, 영어식, 일본식, 중국식, 합성명은 금지합니다.
각 이름 옆에 "${traits}"를 표현하는 한 줄 뜻풀이도 한국어로 써주세요.
아래 형식으로만 출력하세요(한 줄에 이름: 의미):
이름: 의미
불가능하면 아무것도 출력하지 마세요.
`,
  zh: (letters, traits, gender, purpose) => `
你是一名专业起名师。
请优先使用以下首字母(${letters.join(', ')})，为${gender === 'male' ? '男性' : gender === 'female' ? '女性' : '中性'}${purpose === 'personal' ? '取三个中文名字' : '生成三个中文品牌名'}。
名字必须是正统中文名（不要出现韩/日/英式名字或混合名）。
每个名字后用一句话中文表达“${traits}”的寓意。
只允许以下格式（每行一名）：名字: 寓意
如无合适姓名，请不要输出任何内容。
`,
  ja: (letters, traits, gender, purpose) => `
あなたはプロの名付け師です。
以下の頭文字(${letters.join(', ')})を優先して使い、${purpose === 'personal' ? '人名' : 'ブランド名'}を3つ考えてください。
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

    const saju = getSajuFromDate(dob);
    const lacking = getLackingElements(saju);

    if (!lacking.length) {
      return res.json({ result: [{ name: '', element: '', meaning: '오행이 모두 균형입니다. 추가 추천이 어렵습니다.' }] });
    }

    const allowedLetters = lacking.flatMap(e => phoneticMap[e]).filter(Boolean);

    const prompt = prompts[lang](allowedLetters, traits, gender, purpose);

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

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.includes(':'));

    const result = lines.map(line => {
      const [name, ...meaningParts] = line.split(':');
      return {
        name: name.trim(),
        element: lacking.map(e =>
          e === '木' ? 'Wood' :
          e === '火' ? 'Fire' :
          e === '土' ? 'Earth' :
          e === '金' ? 'Metal' :
          e === '水' ? 'Water' : e
        ).join(', '),
        meaning: meaningParts.join(':').trim()
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

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


