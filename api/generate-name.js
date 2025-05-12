
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { dob } = req.body;
  const { analyzeSaju } = require('./sajuUtils');

  const filePath = path.join(process.cwd(), 'public', 'saju_full_1920_2030.json');
  const sajuDB = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const saju = sajuDB[dob];

  if (!saju) {
    return res.status(400).json({ error: 'Invalid date or out of supported range (1920–2030).' });
  }

  const sajuChars = [...saju.년주, ...saju.월주, ...saju.일주];
  const result = analyzeSaju(sajuChars);

  res.status(200).json({
    sajuChars,
    counts: result.counts,
    missing: result.missing,
    excessive: result.excessive
  });
}
