// 한자 천간(十干)과 지지(十二支) → 오행 매핑
const heavenlyStems = {
  "甲": "목", "乙": "목",
  "丙": "화", "丁": "화",
  "戊": "토", "己": "토",
  "庚": "금", "辛": "금",
  "壬": "수", "癸": "수"
};

const earthlyBranches = {
  "子": "수", "丑": "토", "寅": "목", "卯": "목",
  "辰": "토", "巳": "화", "午": "화", "未": "토",
  "申": "금", "酉": "금", "戌": "토", "亥": "수"
};

// 오행 영문 변환
const elementMapEn = {
  "목": "Wood",
  "화": "Fire",
  "토": "Earth",
  "금": "Metal",
  "수": "Water"
};
// 오행 중문/일문 등 필요시 추가

// 한자 간지(예: "己卯")를 오행(천간, 지지)으로 분리
function ganjiToElements(ganji) {
  if (!ganji || ganji.length !== 2) return [];
  const [stem, branch] = ganji.split("");
  return [heavenlyStems[stem], earthlyBranches[branch]];
}

// 전체 사주(년/월/일주) → 오행 카운트
function sajuToElementCounts(saju) {
  // saju = {년주: "己卯", 월주: "乙丑", 일주: "庚午"}
  const counts = {"목":0, "화":0, "토":0, "금":0, "수":0};
  ["년주", "월주", "일주"].forEach(key => {
    if (saju[key]) {
      ganjiToElements(saju[key]).forEach(el => { if (el) counts[el]++; });
    }
  });
  return counts;
}

// 부족 오행 리턴 (ex: ["금", "수"])
function lackingElements(counts) {
  // 오행 중 0개인 것만 리턴
  return Object.keys(counts).filter(k => counts[k] === 0);
}

// 오행 부족 계산 통합 함수
function getLackingElements(saju) {
  const counts = sajuToElementCounts(saju);
  return lackingElements(counts);
}

// (추가) 오행 전체, 각국 언어 변환 함수 등
function elementToEnglish(ko) {
  return elementMapEn[ko] || ko;
}

