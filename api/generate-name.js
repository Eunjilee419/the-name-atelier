
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const dob = req.body?.dob || req.query?.dob;
  const { analyzeSaju } = require('./sajuUtils');

  if (!dob) {
    return res.status(400).json({ error: 'Missing dob parameter.' });
  }

  const filePath = path.join(process.cwd(), 'public', 'saju_full_1920_2030.json');

  let sajuDB;
  try {
    sajuDB = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read saju JSON file.' });
  }

  const saju = sajuDB[dob];
  if (!saju) {
    return res.status(400).json({ error: 'Date not found in saju dataset.' });
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
