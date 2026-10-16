import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, Palette, Square, Circle, Minus, Brush, Check } from 'lucide-react';

interface DrawingCanvasProps {
  onSaveDrawing: (dataUrl: string) => void;
  disabled?: boolean;
  initialData?: string;
  height?: number;
}

const COLORS = [
  '#ffffff', // White
  '#0f172a', // Slate black
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899'  // Pink
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onSaveDrawing,
  disabled = false,
  initialData,
  height = 360
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'line' | 'rect' | 'circle'>('brush');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshot = useRef<ImageData | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background with dark canvas tone
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }
  }, [initialData]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), imgData]);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveToHistory();
    const pos = getCoordinates(e);
    startPos.current = pos;
    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    setIsDrawing(true);
    setHasDrawn(true);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = tool === 'eraser' ? '#1e293b' : color;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getCoordinates(e);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    } else if (snapshot.current) {
      // Restore previous state for shapes
      ctx.putImageData(snapshot.current, 0, 0);
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        const w = currentPos.x - startPos.current.x;
        const h = currentPos.y - startPos.current.y;
        ctx.strokeRect(startPos.current.x, startPos.current.y, w, h);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(currentPos.x - startPos.current.x, 2) +
          Math.pow(currentPos.y - startPos.current.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.current.x, startPos.current.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveDrawing(dataUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(previous, 0, 0);
    triggerAutoSave();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveToHistory();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    triggerAutoSave();
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xl mx-auto">
      {/* Canvas Toolset */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl">
        {/* Tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTool('brush')}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              tool === 'brush' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700'
            }`}
            title="Pennello a mano libera"
          >
            <Brush className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              tool === 'eraser' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-700'
            }`}
            title="Gomma"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={() => setTool('line')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
            title="Linea retta"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('rect')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
            title="Rettangolo"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('circle')}
            className={`p-2 rounded-xl transition-all ${
              tool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'
            }`}
            title="Cerchio"
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 px-2">
          <span className="text-[11px] text-slate-400">Tratto:</span>
          {[2, 5, 10, 16].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setBrushSize(size)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                brushSize === size ? 'bg-indigo-500/30 ring-1 ring-indigo-500' : 'hover:bg-slate-700'
              }`}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: `${Math.max(4, size * 0.8)}px`, height: `${Math.max(4, size * 0.8)}px` }}
              />
            </button>
          ))}
        </div>

        {/* Undo & Clear */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={history.length === 0}
            onClick={undo}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl disabled:opacity-30 transition-colors"
            title="Annulla ultimo tratto"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            Pulisci
          </button>
        </div>
      </div>

      {/* Color Palette */}
      <div className="flex items-center justify-center gap-2 p-2 bg-slate-800/60 rounded-xl border border-slate-700/60">
        <Palette className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setColor(c);
              if (tool === 'eraser') setTool('brush');
            }}
            className={`w-7 h-7 rounded-full transition-transform ${
              color === c && tool !== 'eraser'
                ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-md'
                : 'hover:scale-110 opacity-90'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Main Drawing Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-850 touch-none">
        <canvas
          ref={canvasRef}
          width={640}
          height={height}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="w-full h-auto cursor-crosshair block bg-slate-900"
        />

        {savedSuccess && (
          <div className="absolute top-3 right-3 bg-emerald-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            Tracciato salvato
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        Disegna sul riquadro. Allo scadere del tempo tutti vedranno il tuo disegno e voteranno con le stelle!
      </p>
    </div>
  );
};
