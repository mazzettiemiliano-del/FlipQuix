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

  const [draggedTile, setDraggedTile] = useState<TileItem | null>(null);

  const handleDragStart = (e: React.DragEvent, tile: TileItem) => {
    if (disabled || submitted) return;
    setDraggedTile(tile);
    e.dataTransfer.setData('text/plain', String(tile.id));
  };

  const handleDropOnSlot = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disabled || submitted || !draggedTile) return;

    // Place dragged tile into slot
    const nextSlots = [...placedSlots];
    const prevTileInSlot = nextSlots[index];
    nextSlots[index] = draggedTile;
    setPlacedSlots(nextSlots);

    // Remove from bank and return previous tile if any
    setBank((prev) => {
      const filtered = prev.filter((t) => t.id !== draggedTile.id);
      return prevTileInSlot ? [...filtered, prevTileInSlot] : filtered;
    });
    setDraggedTile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          Trascina o tocca le tessere per ricostruire l'immagine
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Disordered Bank Grid */}
        <div className="flex flex-col items-center gap-3 bg-slate-800/80 p-5 rounded-3xl border border-slate-700">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            1. Tessere in disordine (Trascina o tocca)
          </span>

          <div
            className="grid gap-2 p-2 bg-slate-900 rounded-2xl w-64 h-64 border border-slate-800"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`
            }}
          >
            {bank.map((tile) => (
              <div
                key={tile.id}
                draggable={!disabled && !submitted}
                onDragStart={(e) => handleDragStart(e, tile)}
                onClick={() => handleBankTileClick(tile)}
                className="w-full h-full rounded-xl border border-white/20 shadow-md overflow-hidden hover:scale-105 active:scale-95 transition-transform cursor-grab active:cursor-grabbing relative"
                style={getTileStyle(tile.originalPos)}
              />
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
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSlot(e, idx)}
                onClick={() => handleSlotClick(idx)}
                className={`w-full h-full rounded-xl border transition-all flex items-center justify-center ${
                  tile
                    ? 'border-indigo-400 cursor-pointer shadow-lg hover:ring-2 hover:ring-rose-500'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
                style={tile ? getTileStyle(tile.originalPos) : {}}
              />
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
