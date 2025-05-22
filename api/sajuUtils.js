// sajuUtils.js
// 브라우저에서 <script src="/data/lunar.js">로 lunar.js가 로드되어 있다고 가정

// 1. 천간/지지 → 오행 변환표
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

// 2. 생년월일(YYYY-MM-DD) → 사주 간지 변환
function getSajuFromDate(dob) {
  // dob = 'YYYY-MM-DD'
  const [year, month, day] = dob.split('-').map(Number);

  // Lunar는 month 1~12, day 1~31
  const lunar = Lunar.fromYmd(year, month, day);

  return {
    year: lunar.getYearGanZhi(),   // 년주 (ex: 丙戌)
    month: lunar.getMonthGanZhi(), // 월주
    day: lunar.getDayGanZhi(),     // 일주
    // 시주 필요하면: lunar.getTimeGanZhi()
  };
}

// 3. 부족한 오행 추출
function getLackingElements(saju) {
  // saju = { year: '丙戌', month: '甲午', day: '己未' ... }
  const counts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const pillars = [saju.year, saju.month, saju.day];

  for (const pillar of pillars) {
    if (!pillar) continue;
    for (const char of pillar) {
      const el = elementMap[char];
      if (el) counts[el]++;
    }
  }

  // 0개인 오행만 추출
  return Object.entries(counts)
    .filter(([_, count]) => count === 0)
    .map(([el]) => el);
}

// --- 내보내기 (Node, ES6, 브라우저 환경 모두 지원)
if (typeof module !== "undefined") {
  module.exports = { getSajuFromDate, getLackingElements };
}
window.getSajuFromDate = getSajuFromDate;
window.getLackingElements = getLackingElements;
