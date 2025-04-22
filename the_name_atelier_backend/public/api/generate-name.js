
export default async function handler(req, res) {
  const { purpose, gender, dob, traits } = req.body;

  const prompt = `
    You are a naming expert working for a brand called 'The Name Atelier'.\n
    Generate 3 name suggestions based on:\n
    - Purpose: ${purpose}\n
    - Gender: ${gender}\n
    - Date of Birth: ${dob}\n
    - Desired traits: ${traits}\n
    For each name, include: name, meaning, emotional impression, and why it fits.`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + process.env.OPENAI_API_KEY
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  const data = await openaiRes.json();
  const resultText = data.choices?.[0]?.message?.content || "No result";
  res.status(200).json({ result: resultText });
}
