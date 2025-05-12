
// localSajuConverter.js
// ⚠️ 완전 독립형 사주력 계산기 (천간/지지) for 1924~2043
const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 60갑자 배열
const sixtyGanji = [];
for (let i = 0; i < 60; i++) {
  const stem = heavenlyStems[i % 10];
  const branch = earthlyBranches[i % 12];
  sixtyGanji.push(stem + branch);
}

// 년주 (간지): 1924년이 갑자년 기준
function getYearGanji(year) {
  const baseYear = 1924;
  const offset = (year - baseYear + 60) % 60;
  return sixtyGanji[offset];
}

// 월주 (간지): 단순 달별 간지 (※ 절입 기준 미적용, 단순 목적으로 사용)
function getMonthGanji(yearStemIndex, monthIndex) {
  const base = (yearStemIndex * 2) % 10; // 천간 계산
  const monthStem = heavenlyStems[(base + monthIndex) % 10];
  const monthBranch = earthlyBranches[(monthIndex + 1) % 12];
  return monthStem + monthBranch;
}

// 일주 (간지): 1984-01-01 = 갑자일 기준 (60갑자 시작일)
function getDayGanji(dateStr) {
  const baseDate = new Date('1984-01-01');
  const targetDate = new Date(dateStr);
  const offsetDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  return sixtyGanji[(offsetDays + 60 * 100) % 60];
}

// 전체 사주 반환
function getSajuFromDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0~11
  const yearGanji = getYearGanji(year);
  const yearStemIndex = sixtyGanji.findIndex(g => g === yearGanji) % 10;
  const monthGanji = getMonthGanji(yearStemIndex, month);
  const dayGanji = getDayGanji(dateStr);

  return [...yearGanji, ...monthGanji, ...dayGanji]; // 총 6자
}

module.exports = { getSajuFromDate };
