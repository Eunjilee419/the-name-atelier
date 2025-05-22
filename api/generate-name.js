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
Generate 3 unique English ${purpose === 'personal' ? 'given' : 'brand'} names for a ${gender}.  
Preferably start with these letters: ${letters.join(', ')}.  
Include meanings that reflect traits: "${traits}".  
Respond in format: Name: meaning  
You can use other letters if needed.  
If none, return nothing.
`
  // ko, zh, ja도 필요시 비슷하게 완화 가능
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { dob, lang, gender, purpose, traits } = req.body;

    console.log('Input DOB:', dob);
    const saju = getSajuFromDate(dob);
    console.log('Saju:', saju);

    const lacking = getLackingElements(saju);
    console.log('Lacking Elements:', lacking);

    if (!lacking.length) {
      return res.json({ result: [{ name: '', element: '', meaning: '오행 모두 균형, 추천 어려움' }] });
    }

    const allowedLetters = lacking.flatMap(e => phoneticMap[e]).filter(Boolean);
    console.log('Allowed Letters:', allowedLetters);

    const prompt = prompts[lang](allowedLetters, traits, gender, purpose);
    console.log('Prompt:', prompt);

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
    console.log('API Response Text:', text);

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

    console.log('Parsed Result:', result);

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
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

