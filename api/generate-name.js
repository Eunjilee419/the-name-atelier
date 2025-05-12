
export default async function handler(req, res) {
  const { purpose, gender, dob, traits, lang } = req.body;

  const { getSajuFromDate } = require('./accurateSaju');
  const { analyzeSaju } = require('./sajuUtils');

  const sajuChars = getSajuFromDate(dob);
  const { missing, excessive, counts } = analyzeSaju(sajuChars);

  const prompt = `You're a naming expert using Korean saju (Four Pillars) and sound-element theory.

Birthdate: ${dob}
Missing element: ${missing}
Excessive element: ${excessive}
Gender: ${gender}
Traits: ${traits}
Purpose: ${purpose}

Rules:
- Use only initials matching the missing element:
  Wood: G, K, C | Fire: N, D, R, L, T | Earth: M, B, F, P | Metal: S, J, Z, Ch | Water: H, I, E, O, U
- Never use initials tied to the excessive element.
- For each name, include meaning and saju logic.`;

  // GPT 호출 없이 내부 값만 리턴
  res.status(200).json({
    sajuChars,
    counts,
    missing,
    excessive,
    prompt
  });
}
