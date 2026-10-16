import React, { useState, useEffect } from 'react';
import { PuzzleContent } from '../../types/quiz';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

interface PuzzlePlayerProps {
  content: PuzzleContent;
  onAnswer: (isCorrect: boolean, payload?: any) => void;
  disabled?: boolean;
}

interface TileItem {
  id: number; // 0 to (gridSize*gridSize - 1)
  originalPos: number;
}

export const PuzzlePlayer: React.FC<PuzzlePlayerProps> = ({
  content,
  onAnswer,
  disabled = false
}) => {
  const size = content.gridSize || 2; // 2x2 = 4 tiles, or 3x3 = 9 tiles
  const totalTiles = size * size;

  const [bank, setBank] = useState<TileItem[]>([]);
  const [placedSlots, setPlacedSlots] = useState<(TileItem | null)[]>(
    Array(totalTiles).fill(null)
  );
  const [selectedBankTile, setSelectedBankTile] = useState<TileItem | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const tiles: TileItem[] = Array.from({ length: totalTiles }, (_, i) => ({
      id: i,
      originalPos: i
    }));
    // Shuffle tiles
    const shuffled = [...tiles].sort(() => Math.random() - 0.5);
    setBank(shuffled);
    setPlacedSlots(Array(totalTiles).fill(null));
    setSelectedBankTile(null);
  }, [content, totalTiles]);

  const handleBankTileClick = (tile: TileItem) => {
    if (disabled || submitted) return;
    // Find first empty slot in target grid and place it, or select it
    const emptyIndex = placedSlots.findIndex((s) => s === null);
    if (emptyIndex !== -1) {
      const nextSlots = [...placedSlots];
      nextSlots[emptyIndex] = tile;
      setPlacedSlots(nextSlots);
      setBank((prev) => prev.filter((t) => t.id !== tile.id));
      setSelectedBankTile(null);
    }
  };

  const handleSlotClick = (index: number) => {
    if (disabled || submitted) return;
    const tile = placedSlots[index];
    if (tile) {
      // Remove from slot and return to bank
      const nextSlots = [...placedSlots];
      nextSlots[index] = null;
      setPlacedSlots(nextSlots);
      setBank((prev) => [...prev, tile]);
    }
  };

  const handleReset = () => {
    if (disabled || submitted) return;
    const all = [...bank, ...placedSlots.filter((s): s is TileItem => s !== null)];
    setBank(all);
    setPlacedSlots(Array(totalTiles).fill(null));
  };

  const handleConfirm = () => {
    if (disabled || submitted || placedSlots.some((s) => s === null)) return;
    setSubmitted(true);

    const isCorrect = placedSlots.every((tile, idx) => tile && tile.originalPos === idx);
    onAnswer(isCorrect, { isCorrect });
  };

  const getTileStyle = (originalPos: number) => {
    const row = Math.floor(originalPos / size);
    const col = originalPos % size;
    const step = 100 / (size - 1 || 1);
    const posX = col * step;
    const posY = row * step;

    return {
      backgroundImage: `url(${content.imageUrl})`,
      backgroundSize: `${size * 100}% ${size * 100}%`,
      backgroundPosition: `${posX}% ${posY}%`
    };
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          Ricostruisci l'immagine nella griglia vuota a destra
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Disordered Bank Grid */}
        <div className="flex flex-col items-center gap-3 bg-slate-800/80 p-5 rounded-3xl border border-slate-700">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            1. Tessere in disordine (tocca per posizionare)
          </span>

          <div
            className="grid gap-2 p-2 bg-slate-900 rounded-2xl w-64 h-64 border border-slate-800"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`
            }}
          >
            {bank.map((tile) => (
              <button
                key={tile.id}
                type="button"
                disabled={disabled || submitted}
                onClick={() => handleBankTileClick(tile)}
                className="w-full h-full rounded-xl border border-white/20 shadow-md overflow-hidden hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
                style={getTileStyle(tile.originalPos)}
              >
                <span className="absolute bottom-1 right-1 bg-black/60 text-[10px] text-white px-1 rounded font-bold">
                  #{tile.id + 1}
                </span>
              </button>
            ))}
            {bank.length === 0 && (
              <div className="col-span-full row-span-full flex items-center justify-center text-xs text-emerald-400 font-semibold">
                Tutte le tessere inserite!
              </div>
            )}
          </div>
        </div>

        {/* Reconstruction Destination Grid */}
        <div className="flex flex-col items-center gap-3 bg-slate-800/80 p-5 rounded-3xl border border-slate-700">
          <div className="flex items-center justify-between w-full px-2">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              2. Griglia ricostruita
            </span>
            <button
              type="button"
              disabled={disabled || submitted}
              onClick={handleReset}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Svuota
            </button>
          </div>

          <div
            className="grid gap-2 p-2 bg-slate-950 rounded-2xl w-64 h-64 border-2 border-dashed border-indigo-500/40"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`
            }}
          >
            {placedSlots.map((tile, idx) => (
              <div
                key={idx}
                onClick={() => handleSlotClick(idx)}
                className={`w-full h-full rounded-xl border transition-all flex items-center justify-center ${
                  tile
                    ? 'border-indigo-400 cursor-pointer shadow-lg hover:ring-2 hover:ring-rose-500'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
                style={tile ? getTileStyle(tile.originalPos) : {}}
              >
                {!tile && <span className="text-xs font-black text-slate-700">{idx + 1}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || submitted || placedSlots.some((s) => s === null)}
        onClick={handleConfirm}
        className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-98"
      >
        <CheckCircle2 className="w-6 h-6" />
        {submitted ? 'Puzzle Inviato' : 'Conferma Ricostruzione'}
      </button>
    </div>
  );
};
