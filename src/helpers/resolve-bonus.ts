// Pure resolution of bonus-question answers to the concrete <select> values to
// set. Kept free of any browser interaction so it can be unit-tested. Multiple
// questions may share the same option list (group winners, the 48-team
// questions), so each answer group must be matched to its OWN question text.

export interface BonusSelectLike {
  name: string;
  options: { value: string; text: string }[];
}

export interface BonusQuestionLike {
  question: string;
  selects: BonusSelectLike[];
}

export interface ResolvedBonusSelection {
  selectName: string;
  value: string;
  question: string;
  answer: string;
}

export function resolveBonusSelections(
  questions: BonusQuestionLike[],
  bets: string[],
): ResolvedBonusSelection[] {
  // Group answers by their question text, preserving the original text.
  const groups: { question: string; answers: string[] }[] = [];
  const byKey = new Map<string, { question: string; answers: string[] }>();
  for (const arg of bets) {
    const eqIdx = arg.lastIndexOf('=');
    if (eqIdx === -1) throw new Error(`Invalid bonus bet '${arg}'. Use format: "Question text=Answer"`);
    const question = arg.slice(0, eqIdx).trim();
    const answer = arg.slice(eqIdx + 1).trim();
    if (!question || !answer) throw new Error(`Invalid bonus bet '${arg}'. Both question and answer required.`);
    const key = question.toLowerCase();
    let group = byKey.get(key);
    if (!group) {
      group = { question, answers: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.answers.push(answer);
  }

  const resolved: ResolvedBonusSelection[] = [];
  for (const { question, answers } of groups) {
    const q = questions.find((qq) => qq.question.toLowerCase() === question.toLowerCase());
    if (!q) {
      const available = questions.map((qq) => qq.question).join(', ');
      throw new Error(`No bonus question found matching: "${question}". Available: ${available}`);
    }
    if (answers.length > q.selects.length) {
      throw new Error(`Too many answers for "${q.question}": got ${answers.length}, max ${q.selects.length}`);
    }
    for (let i = 0; i < answers.length; i++) {
      const option = q.selects[i].options.find((o) => o.text.toLowerCase() === answers[i].toLowerCase());
      if (!option) {
        const available = q.selects[i].options.map((o) => o.text).join(', ');
        throw new Error(`No option "${answers[i]}" for question "${q.question}". Available: ${available}`);
      }
      resolved.push({
        selectName: q.selects[i].name,
        value: option.value,
        question: q.question,
        answer: option.text,
      });
    }
  }
  return resolved;
}
