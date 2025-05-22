const { getSajuFromDate, getLackingElements } = require('./sajuUtils.js');

async function test() {
  try {
    const dob = '1991-08-10';
    const saju = getSajuFromDate(dob);
    console.log('사주:', saju);

    const lacking = getLackingElements(saju);
    console.log('부족 오행:', lacking);
  } catch (e) {
    console.error('에러 발생:', e);
  }
}

test();
