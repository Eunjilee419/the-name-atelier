
// sajuUtils.js

import sajuData from '../data/saju_full_1940_2030.json';

const elementMap = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '子': '水', '亥': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '辰': '土', '丑': '土', '未': '土', '戌': '土'
};

// 생년월일 → 사주 기둥 (year/month/day/hour) 반환
export function getSajuFromDate(dob) {
  const dateKey = dob.trim(); // yyyy-mm-dd
  const saju = sajuData[dateKey];
  if (!saju) throw new Error('Saju data not found for date: ' + dateKey);
  return saju; // e.g., { year: '甲子', month: '丙寅', day: '戊辰', hour: '庚午' }
}

// 부족한 오행 추출
export function getLackingElements(saju) {
  const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillars = [saju.year, saju.month, saju.day, saju.hour];

  for (const pillar of pillars) {
    for (const char of pillar) {
      const el = elementMap[char];
      if (el) counts[el]++;
    }
  }

  return Object.entries(counts)
    .filter(([_, count]) => count === 0)
    .map(([el]) => el);
}
