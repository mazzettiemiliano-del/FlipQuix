import React, { useState, useMemo } from 'react';
import { MemoryMatchContent } from '../../types/quiz';
import { Check, Sparkles } from 'lucide-react';

interface MemoryMatchPlayerProps {
  content: MemoryMatchContent;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
}

const MATCH_COLORS = [
  'border-emerald-400 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400',
  'border-sky-400 bg-sky-500/20 text-sky-300 ring-2 ring-sky-400',
  'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400',
  'border-purple-400 bg-purple-500/20 text-purple-300 ring-2 ring-purple-400',
];

export const MemoryMatchPlayer: React.FC<MemoryMatchPlayerProps> = ({
  content,
  onAnswer,
  disabled = false
}) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ imageId: string; textId: string }[]>([]);

  const pairsKey = (content.pairs || []).map((p) => p.id).join('-');

  // Shuffle order of images and texts deterministically once per pair set
  const shuffledImages = useMemo(() => {
    return [...(content.pairs || [])].sort((a, b) => {
      const codeA = (a.id.charCodeAt(0) * 19 + a.text.length * 7) % 31;
      const codeB = (b.id.charCodeAt(0) * 19 + b.text.length * 7) % 31;
      return codeA - codeB || a.id.localeCompare(b.id);
    });
  }, [pairsKey]);

  const shuffledTexts = useMemo(() => {
    return [...(content.pairs || [])].sort((a, b) => {
      const codeA = (a.text.charCodeAt(0) * 23 + a.id.length * 11) % 31;
      const codeB = (b.text.charCodeAt(0) * 23 + b.id.length * 11) % 31;
      return codeA - codeB || a.id.localeCompare(b.id);
    });
  }, [pairsKey]);

  const handleImageClick = (id: string) => {
    if (disabled || matches.some((m) => m.imageId === id)) return;
    setSelectedImageId(id);

    if (selectedTextId) {
      applyPair(id, selectedTextId);
    }
  };

  const handleTextClick = (id: string) => {
    if (disabled || matches.some((m) => m.textId === id)) return;
    setSelectedTextId(id);

    if (selectedImageId) {
      applyPair(selectedImageId, id);
    }
  };

  const applyPair = (imgId: string, txtId: string) => {
    const newMatches = [...matches, { imageId: imgId, textId: txtId }];
    setMatches(newMatches);
    setSelectedImageId(null);
    setSelectedTextId(null);

    // If all 4 matched, verify!
    if (newMatches.length === content.pairs.length) {
      const allCorrect = newMatches.every((m) => m.imageId === m.textId);
      onAnswer(allCorrect, { matches: newMatches });
    }
  };

  const getMatchIndex = (id: string, type: 'image' | 'text') => {
    return matches.findIndex((m) => (type === 'image' ? m.imageId === id : m.textId === id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          Tocca o trascina per associare ogni immagine al testo corrispondente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images Column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-slate-400 text-center uppercase">1. Immagini</h4>
          <div className="grid grid-cols-2 gap-3">
            {shuffledImages.map((pair) => {
              const matchIdx = getMatchIndex(pair.id, 'image');
              const isMatched = matchIdx !== -1;
              const isSelected = selectedImageId === pair.id;

              return (
                <div
                  key={pair.id}
                  onClick={() => handleImageClick(pair.id)}
                  className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 aspect-video flex items-center justify-center bg-slate-800 ${
                    isMatched
                      ? MATCH_COLORS[matchIdx % MATCH_COLORS.length]
                      : isSelected
                      ? 'border-indigo-400 ring-4 ring-indigo-500/50 scale-105'
                      : 'border-slate-700 hover:border-slate-500 hover:scale-102'
                  }`}
                >
                  <img
                    src={pair.image}
                    alt="Memory"
                    className="w-full h-full object-cover"
                  />
                  {isMatched && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Texts Column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-slate-400 text-center uppercase">2. Testi</h4>
          <div className="grid grid-cols-2 gap-3">
            {shuffledTexts.map((pair) => {
              const matchIdx = getMatchIndex(pair.id, 'text');
              const isMatched = matchIdx !== -1;
              const isSelected = selectedTextId === pair.id;

              return (
                <button
                  key={pair.id}
                  disabled={disabled || isMatched}
                  onClick={() => handleTextClick(pair.id)}
                  className={`p-4 rounded-2xl font-bold text-base md:text-lg border-2 text-center transition-all aspect-video flex items-center justify-center shadow-lg ${
                    isMatched
                      ? MATCH_COLORS[matchIdx % MATCH_COLORS.length]
                      : isSelected
                      ? 'border-indigo-400 ring-4 ring-indigo-500/50 scale-105 bg-indigo-600 text-white'
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-white'
                  }`}
                >
                  <span className="line-clamp-2">{pair.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        Associazioni completate: {matches.length} di {content.pairs.length}
      </div>
    </div>
  );
};
