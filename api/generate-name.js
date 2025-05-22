// generate-name.js
const { getSajuFromDate, getLackingElements } = require('./sajuUtils.js');

// 오행별 알파벳 규칙
const phoneticMap = {
  '木': ['G', 'K', 'C'],
  '火': ['N', 'D', 'R', 'L', 'T'],
  '土': ['M', 'B', 'F', 'P'],
  '金': ['S', 'J', 'Z', 'Ch'],
  '水': ['H', 'I', 'E', 'O', 'U']
};

// 언어별 프롬프트
const prompts = {
  en: (letters, traits, gender, purpose) => `
You are an expert baby/brand name generator.
Generate exactly 3 unique English ${purpose === 'personal' ? 'given' : 'brand'} names for a ${gender}, each using ONLY these starting letters: ${letters.join(', ')}.
Each name MUST be a typical native English name (never Korean/Chinese/Japanese or mixed).
Respond ONLY in this strict format (one line per name):

Name: meaning

Do not include any other text, headings, or formatting.
Do not return "Name" or "Short meaning" lines.
If no names are possible, return nothing.
Desired traits: "${traits}"
`,
  // 이하 ko, zh, ja는 동일 (위 코드 참고)
  ko: (letters, traits, gender, purpose) => `...`,
  zh: (letters, traits, gender, purpose) => `...`,
  ja: (letters, traits, gender, purpose) => `...`
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { dob, lang, gender, purpose, traits } = req.body;

    // 1. 사주 추출
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

    // 5. OpenAI API 호출 (서버 환경)
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

    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

