// api/sajuUtils.js
const { Lunar } = require('lunar-javascript');

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

function getSajuFromDate(dob) {
  const [year, month, day] = dob.split('-').map(Number);
  const lunar = Lunar.fromYmd(year, month, day);

  return {
    year: lunar.getYearGanZhi(),
    month: lunar.getMonthGanZhi(),
    day: lunar.getDayGanZhi()
  };
}

function getLackingElements(saju) {
  const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillars = [saju.year, saju.month, saju.day];

  for (const pillar of pillars) {
    if (!pillar) continue;
    for (const char of pillar) {
      const el = elementMap[char];
      if (el) counts[el]++;
    }
  }

  return Object.entries(counts)
    .filter(([_, count]) => count === 0)
    .map(([el]) => el);
}

module.exports = { getSajuFromDate, getLackingElements };

