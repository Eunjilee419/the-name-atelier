
// accurateSaju.js
// 정확한 간지 계산을 위한 오픈소스 기반 (sasin 라이브러리 필요)
// 설치: npm install sasin

const sasin = require('sasin');

// 날짜 예: '1991-08-10'
function getSajuFromDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return null;

  const saju = sasin.getSajuBySolar(dateString);
  if (!saju) return null;

  const { year, month, day } = saju;

  // 예: 신미 → ['신', '미']
  return [...year, ...month, ...day]; // 총 6글자
}

// 사용 예:
// const sajuChars = getSajuFromDate('1991-08-10');
// console.log(sajuChars); // ['신','미','병','신','임','자']

module.exports = { getSajuFromDate };
