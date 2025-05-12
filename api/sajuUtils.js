
// sajuUtils.js

const heavenlyStems = {
  갑: 'Wood', 을: 'Wood',
  병: 'Fire', 정: 'Fire',
  무: 'Earth', 기: 'Earth',
  경: 'Metal', 신: 'Metal',
  임: 'Water', 계: 'Water'
};

const earthlyBranches = {
  자: 'Water', 축: 'Earth', 인: 'Wood', 묘: 'Wood',
  진: 'Earth', 사: 'Fire', 오: 'Fire',
  미: 'Earth', 신: 'Metal', 유: 'Metal',
  술: 'Earth', 해: 'Water'
};

const elementList = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

function countElements(saju) {
  const counts = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };

  saju.forEach(char => {
    if (heavenlyStems[char]) {
      counts[heavenlyStems[char]]++;
    } else if (earthlyBranches[char]) {
      counts[earthlyBranches[char]]++;
    }
  });

  return counts;
}

function getElementBalance(counts) {
  const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
  const missing = sorted[0][0];
  const excessive = sorted[4][1] - sorted[3][1] > 1 ? sorted[4][0] : null;
  return { missing, excessive };
}

// 예시: 병술, 갑오, 기미 → ['병', '술', '갑', '오', '기', '미']
function analyzeSaju(sajuChars) {
  const counts = countElements(sajuChars);
  const { missing, excessive } = getElementBalance(counts);
  return { counts, missing, excessive };
}

module.exports = { analyzeSaju };
