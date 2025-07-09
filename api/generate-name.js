// saju: {년주, 월주, 일주} (모두 한자)
// lang: "ko" | "en" | "zh" | "ja"
function generateNamePrompt(saju, lang) {
  const lacking = getLackingElements(saju);
  let prompt = "";

  // 언어별 안내문
  const prompts = {
    ko: `아래 사주 정보를 참고해 이름 3개를 추천해 주세요. 
    부족한 오행은 '${lacking.map(x=>x).join(",")}' 입니다. 
    이름에는 부족한 오행을 보완하는 한자(음)이나 의미가 들어가야 합니다.
    결과는 '이름: 의미' 형식으로 3개만, 각 10자 이내로 제시하세요. (예시: '서현: 밝게 빛나는 지혜')`,

    en: `Suggest 3 names based on the following saju (Four Pillars) information.
    The lacking elements are '${lacking.map(elementToEnglish).join(", ")}'.
    Each name should reinforce the missing elements with sound or meaning.
    Please provide 3 names with short explanations, each within 15 characters.`,

    zh: `请根据以下八字信息推荐3个名字。
    缺失的五行为：${lacking.map(x=>x).join("、")}。
    名字需补足缺失五行的字或含义。每个名字请附简短解释，15字以内。`,

    ja: `下記の四柱推命情報をもとに、3つの名前を提案してください。
    不足している五行は「${lacking.map(x=>x).join("、")}」です。
    不足五行を補う漢字または意味を含めてください。各名前は簡単な説明付きで15文字以内で。`
  };

  prompt = prompts[lang] || prompts["en"];
  return prompt;
}

