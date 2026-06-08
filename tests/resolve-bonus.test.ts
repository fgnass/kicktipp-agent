import { describe, it, expect } from 'vitest';
import { resolveBonusSelections, BonusQuestionLike } from '../src/helpers/resolve-bonus.js';

const sel = (name: string, opts: [string, string][]) => ({
  name,
  options: opts.map(([value, text]) => ({ value, text })),
});

const QUESTIONS: BonusQuestionLike[] = [
  { question: 'Wer gewinnt die Gruppe A?', selects: [sel('gA', [['1', 'Mexiko'], ['2', 'Südafrika'], ['3', 'Südkorea'], ['4', 'Tschechien']])] },
  { question: 'Wer gewinnt die Gruppe B?', selects: [sel('gB', [['5', 'Bosnien-Herzegowina'], ['6', 'Kanada'], ['7', 'Katar'], ['8', 'Schweiz']])] },
  {
    question: 'Wer erreicht das Halbfinale?',
    selects: [
      sel('sf1', [['10', 'Spanien'], ['11', 'Frankreich'], ['12', 'Brasilien'], ['13', 'England']]),
      sel('sf2', [['10', 'Spanien'], ['11', 'Frankreich'], ['12', 'Brasilien'], ['13', 'England']]),
    ],
  },
];

describe('resolveBonusSelections', () => {
  it('matches each question to its own option list when batched together', () => {
    // The previous bug assigned e.g. "Schweiz" (group B) to group A.
    const out = resolveBonusSelections(QUESTIONS, [
      'Wer gewinnt die Gruppe A?=Mexiko',
      'Wer gewinnt die Gruppe B?=Schweiz',
    ]);
    expect(out).toEqual([
      { selectName: 'gA', value: '1', question: 'Wer gewinnt die Gruppe A?', answer: 'Mexiko' },
      { selectName: 'gB', value: '8', question: 'Wer gewinnt die Gruppe B?', answer: 'Schweiz' },
    ]);
  });

  it('fills multiple selects of one question in order', () => {
    const out = resolveBonusSelections(QUESTIONS, [
      'Wer erreicht das Halbfinale?=Spanien',
      'Wer erreicht das Halbfinale?=England',
    ]);
    expect(out).toEqual([
      { selectName: 'sf1', value: '10', question: 'Wer erreicht das Halbfinale?', answer: 'Spanien' },
      { selectName: 'sf2', value: '13', question: 'Wer erreicht das Halbfinale?', answer: 'England' },
    ]);
  });

  it('is case-insensitive on question and answer text', () => {
    const out = resolveBonusSelections(QUESTIONS, ['wer gewinnt die gruppe a?=mexiko']);
    expect(out[0].value).toBe('1');
  });

  it('throws on an unknown question', () => {
    expect(() => resolveBonusSelections(QUESTIONS, ['Unknown?=Mexiko'])).toThrow(/No bonus question/);
  });

  it('throws on an unknown option', () => {
    expect(() => resolveBonusSelections(QUESTIONS, ['Wer gewinnt die Gruppe A?=Italien'])).toThrow(/No option/);
  });

  it('throws when given more answers than the question has selects', () => {
    expect(() =>
      resolveBonusSelections(QUESTIONS, [
        'Wer gewinnt die Gruppe A?=Mexiko',
        'Wer gewinnt die Gruppe A?=Südafrika',
      ]),
    ).toThrow(/Too many answers/);
  });
});
