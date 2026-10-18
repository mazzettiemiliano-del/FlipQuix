import React, { useState, useMemo } from 'react';
import { FillBlanksContent } from '../../types/quiz';
import { CheckCircle2 } from 'lucide-react';

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
  // Normalize blanks: support either content.blanks array or single blankWord
  const blanksList = useMemo(() => {
    if (content.blanks && content.blanks.length > 0) {
      return content.blanks;
    }
    return [
      {
        id: 'blank-1',
        correctWord: content.blankWord || '',
        distractors: content.distractors || []
      }
    ];
  }, [content]);

  // Selected word for each blank id
  const [selectedWords, setSelectedWords] = useState<Record<string, string>>({});
  const [activeBlankId, setActiveBlankId] = useState<string>(blanksList[0]?.id || 'blank-1');
  const [submitted, setSubmitted] = useState(false);

  const currentBlank = blanksList.find((b) => b.id === activeBlankId) || blanksList[0];

  const shuffledChoices = useMemo(() => {
    if (!currentBlank) return [];
    const list = [currentBlank.correctWord, ...(currentBlank.distractors || [])];
    return [...list].sort(() => Math.random() - 0.5);
  }, [currentBlank]);

  const handleSelectWord = (word: string) => {
    if (disabled || submitted) return;
    setSelectedWords((prev) => ({
      ...prev,
      [activeBlankId]: word
    }));

    // Automatically advance to next unfilled blank if any
    const nextUnfilled = blanksList.find((b) => !selectedWords[b.id] && b.id !== activeBlankId);
    if (nextUnfilled) {
      setActiveBlankId(nextUnfilled.id);
    }
  };

  const isComplete = blanksList.every((b) => selectedWords[b.id] && selectedWords[b.id].trim() !== '');

  const handleConfirm = () => {
    if (disabled || submitted || !isComplete) return;
    setSubmitted(true);

    const isAllCorrect = blanksList.every(
      (b) =>
        (selectedWords[b.id] || '').trim().toLowerCase() === b.correctWord.trim().toLowerCase()
    );

    onAnswer(isAllCorrect, { selectedWords });
  };

  // Split text by placeholders or render text with interactive blank slots
  const renderSentenceWithBlanks = () => {
    // If originalText contains [...] or similar, split by them
    const segments = content.originalText.split(/\[\.\.\.\]|\{\{|\}\}/g);

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 text-xl md:text-2xl font-semibold text-slate-100 leading-relaxed">
        {segments.map((seg, idx) => {
          const blankItem = blanksList[idx];
          const chosen = blankItem ? selectedWords[blankItem.id] : null;
          const isActive = blankItem?.id === activeBlankId;

          return (
            <React.Fragment key={idx}>
              <span>{seg}</span>
              {blankItem && (
                <button
                  type="button"
                  disabled={disabled || submitted}
                  onClick={() => setActiveBlankId(blankItem.id)}
                  className={`px-4 py-2 rounded-xl border-2 font-black transition-all cursor-pointer shadow-inner mx-1 ${
                    isActive
                      ? 'border-amber-400 bg-amber-500/30 text-amber-300 ring-4 ring-amber-400/40 scale-105'
                      : chosen
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-dashed border-slate-500 bg-slate-900 text-slate-400 hover:border-amber-400'
                  }`}
                >
                  {chosen || `[ Buco ${idx + 1} ]`}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {imageUrl && (
        <div className="w-full max-h-60 rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-slate-950 flex items-center justify-center">
          <img src={imageUrl} alt="Immagine di supporto" className="max-h-60 w-auto object-contain" />
        </div>
      )}

      {/* Interactive Sentence Card */}
      <div className="p-8 rounded-3xl bg-slate-800/90 border-2 border-indigo-500/40 shadow-2xl text-center">
        <p className="text-xs uppercase font-extrabold tracking-widest text-indigo-300 mb-4">
          Completa i buchi scegliendo le parole corrette:
        </p>
        {renderSentenceWithBlanks()}
      </div>

      {/* Choice Chips for Active Blank */}
      {currentBlank && (
        <div className="space-y-3 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>Scegli per: <strong className="text-amber-300">Buco ({blanksList.findIndex(b => b.id === currentBlank.id) + 1})</strong></span>
            <span className="text-emerald-400">{Object.keys(selectedWords).length} di {blanksList.length} completati</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {shuffledChoices.map((choice, idx) => {
              const isSelected = selectedWords[currentBlank.id] === choice;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || submitted}
                  onClick={() => handleSelectWord(choice)}
                  className={`p-3.5 rounded-2xl font-bold text-base md:text-lg transition-all shadow-md text-center cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-300 font-black scale-102'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={disabled || submitted || !isComplete}
        onClick={handleConfirm}
        className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-98 cursor-pointer"
      >
        <CheckCircle2 className="w-6 h-6" />
        {submitted ? 'Risposte Registrate' : 'Conferma Tutte le Risposte'}
      </button>
    </div>
  );
};
