
// generate-name.js (Vercel API Function)

import { getSajuFromDate, getLackingElements } from '../../sajuUtils';
import nameDB from '../../nameData';

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
        name.lang === lang
      );
    });

    const shuffled = candidates.sort(() => 0.5 - Math.random());
    const top3 = shuffled.slice(0, 3);

    res.status(200).json({ result: top3 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Name generation failed' });
  }
}
