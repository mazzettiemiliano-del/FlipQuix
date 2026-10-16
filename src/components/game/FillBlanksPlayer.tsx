import React, { useState, useMemo } from 'react';
import { FillBlanksContent } from '../../types/quiz';
import { CheckCircle2, ChevronDown } from 'lucide-react';

interface FillBlanksPlayerProps {
  content: FillBlanksContent;
  imageUrl?: string;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
}

export const FillBlanksPlayer: React.FC<FillBlanksPlayerProps> = ({
  content,
  imageUrl,
  onAnswer,
  disabled = false
}) => {
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  // Shuffle correct word + distractors
  const shuffledChoices = useMemo(() => {
    const list = [content.blankWord, ...content.distractors];
    return [...list].sort(() => Math.random() - 0.5);
  }, [content]);

  const parts = useMemo(() => {
    // Split the text around the blank word
    const regex = new RegExp(`\\b${content.blankWord}\\b`, 'i');
    const match = content.originalText.match(regex);
    if (!match || match.index === undefined) {
      return [content.originalText, ''];
    }
    const before = content.originalText.slice(0, match.index);
    const after = content.originalText.slice(match.index + content.blankWord.length);
    return [before, after];
  }, [content]);

  const handleConfirm = () => {
    if (disabled || submitted || !selectedWord) return;
    setSubmitted(true);
    const isCorrect = selectedWord.trim().toLowerCase() === content.blankWord.trim().toLowerCase();
    onAnswer(isCorrect, { selectedWord });
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {imageUrl && (
        <div className="w-full max-h-60 rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-slate-950 flex items-center justify-center">
          <img src={imageUrl} alt="Immagine di supporto" className="max-h-60 w-auto object-contain" />
        </div>
      )}

      {/* Interactive Sentence Card */}
      <div className="p-8 rounded-3xl bg-slate-800/90 border-2 border-indigo-500/40 shadow-2xl text-center leading-relaxed">
        <span className="text-xl md:text-2xl font-semibold text-slate-200">
          {parts[0]}
        </span>

        {/* Blank slot */}
        <span className="inline-flex items-center mx-2 px-4 py-1.5 rounded-xl bg-amber-400/20 border-2 border-dashed border-amber-400 text-amber-300 font-extrabold text-xl md:text-2xl min-w-[120px] justify-center shadow-inner">
          {selectedWord ? selectedWord : '______'}
        </span>

        <span className="text-xl md:text-2xl font-semibold text-slate-200">
          {parts[1]}
        </span>
      </div>

      {/* Choice Chips / Dropdown Selection */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-400 block text-center">
          Scegli la parola corretta per completare la frase:
        </label>
        <div className="grid grid-cols-2 gap-3.5">
          {shuffledChoices.map((choice, idx) => {
            const isSelected = selectedWord === choice;
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled || submitted}
                onClick={() => setSelectedWord(choice)}
                className={`p-4 rounded-2xl font-bold text-lg md:text-xl transition-all shadow-md text-center ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-300 scale-102 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || submitted || !selectedWord}
        onClick={handleConfirm}
        className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-98"
      >
        <CheckCircle2 className="w-6 h-6" />
        {submitted ? 'Risposta Registrata' : 'Conferma Parola'}
      </button>
    </div>
  );
};
