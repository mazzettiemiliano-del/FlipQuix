import React, { useState, useEffect } from 'react';
import { MathChallengeContent } from '../../types/quiz';
import { generateMathProblems, MathProblem } from '../../utils/mathGenerator';
import { CheckCircle2, Calculator } from 'lucide-react';

interface MathChallengePlayerProps {
  content: MathChallengeContent;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
}

export const MathChallengePlayer: React.FC<MathChallengePlayerProps> = ({
  content,
  onAnswer,
  disabled = false
}) => {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // If problems were pre-generated in content, use them; otherwise generate dynamically
    if (content.generatedProblems && content.generatedProblems.length > 0) {
      setProblems(content.generatedProblems);
      setAnswers(Array(content.generatedProblems.length).fill(''));
    } else {
      const proms = generateMathProblems(
        content.operators,
        content.numberOfOperations,
        content.digitRange,
        content.allowCarryOrRemainder
      );
      setProblems(proms);
      setAnswers(Array(proms.length).fill(''));
    }
  }, [content]);

  const handleAnswerChange = (index: number, val: string) => {
    if (disabled || submitted) return;
    const next = [...answers];
    next[index] = val;
    setAnswers(next);
  };

  const handleConfirm = () => {
    if (disabled || submitted || answers.some((a) => a.trim() === '')) return;
    setSubmitted(true);

    const isAllCorrect = problems.every((p, idx) => {
      const num = parseInt(answers[idx].trim(), 10);
      return !isNaN(num) && num === p.answer;
    });

    onAnswer(isAllCorrect, { userAnswers: answers, problems });
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Calculator className="w-4 h-4" />
          Risolvi le seguenti operazioni matematiche:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {problems.map((prob, index) => {
          const isDone = answers[index]?.trim() !== '';

          return (
            <div
              key={index}
              className="p-5 bg-slate-800/90 border-2 border-slate-700 rounded-2xl shadow-xl flex items-center justify-between gap-4"
            >
              <div className="text-2xl md:text-3xl font-black text-amber-300 font-mono tracking-wider">
                {prob.equation} =
              </div>

              <input
                type="number"
                disabled={disabled || submitted}
                value={answers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="?"
                className="w-24 text-center text-2xl font-black py-2.5 px-3 rounded-xl bg-slate-900 border-2 border-indigo-500/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600 font-mono"
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled || submitted || answers.some((a) => a.trim() === '')}
        onClick={handleConfirm}
        className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-98"
      >
        <CheckCircle2 className="w-6 h-6" />
        {submitted ? 'Risultati Inviati' : 'Conferma Risultati'}
      </button>
    </div>
  );
};
