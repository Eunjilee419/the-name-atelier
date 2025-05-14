
// generate-name.js (Vercel API Function)

import { getSajuFromDate, getLackingElements } from '../lib/sajuUtils.js';
import nameDB from '../data/nameData.js';

const elementComments = {
  '木': {
    ko: '목(木)은 성장과 시작을 의미합니다. 이 이름은 당신의 사주에 부족한 나무의 기운을 보완합니다.',
    en: 'Wood (木) represents growth and new beginnings. This name complements your lacking wood energy.',
    zh: '木象征成长与开始，这个名字有助于补充你命理中缺失的木元素。',
    ja: '木は成長や始まりを意味します。この名前はあなたの四柱で不足している木のエネルギーを補います。'
  },
  '火': {
    ko: '화(火)는 열정과 활력을 상징합니다. 이 이름은 사주의 부족한 불의 기운을 채워줍니다.',
    en: 'Fire (火) symbolizes passion and vitality. This name boosts your missing fire energy.',
    zh: '火代表热情与活力，这个名字补足你命理中的火元素。',
    ja: '火は情熱や活力を象徴します。この名前は不足する火のエネルギーを補います。'
  },
  '土': {
    ko: '토(土)는 중심과 안정감을 뜻합니다. 이 이름은 부족한 흙의 기운을 채워줍니다.',
    en: 'Earth (土) represents stability and balance. This name supports your missing earth element.',
    zh: '土象征稳定与中心，这个名字帮助你补足土元素。',
    ja: '土は安定と中心を意味します。この名前は土の不足を補うためのものです。'
  },
  '金': {
    ko: '금(金)은 절제와 강인함을 의미합니다. 이 이름은 사주의 금 기운을 보완합니다.',
    en: 'Metal (金) stands for discipline and strength. This name adds needed metal energy to your saju.',
    zh: '金代表纪律与坚强，这个名字补充你命理中的金元素。',
    ja: '金は節度と強さを表します。この名前は金のエネルギーを補います。'
  },
  '水': {
    ko: '수(水)는 지혜와 유연함을 뜻합니다. 이 이름은 부족한 물의 기운을 채워줍니다.',
    en: 'Water (水) represents wisdom and adaptability. This name completes your water element.',
    zh: '水象征智慧与灵活，这个名字帮助你补足命中的水元素。',
    ja: '水は知恵と柔軟性を象徴します。この名前は水のエネルギーを補います。'
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { dob, lang = 'en', gender = 'neutral', traits = '', purpose = 'personal' } = req.body;
  if (!dob) return res.status(400).json({ message: 'Missing birth date' });

  try {
    const saju = getSajuFromDate(dob);
    const lacking = getLackingElements(saju);

    const candidates = nameDB.filter(name => {
      return (
        (!gender || name.gender === 'neutral' || name.gender === gender) &&
        (!purpose || name.purpose === purpose) &&
        lacking.includes(name.element) &&
        (
          name.lang === lang ||
          ((lang === 'zh' || lang === 'ja') && name.lang === 'ko') // fallback
        )
      );
    });

    const shuffled = candidates.sort(() => 0.5 - Math.random());
    const topResults = shuffled.slice(0, 3).map(name => ({
      ...name,
      comment: elementComments[name.element]?.[lang] || ""
    }));

    res.status(200).json({ result: topResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Name generation failed' });
  }
}
