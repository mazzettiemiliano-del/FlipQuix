import React, { useState } from 'react';
import { Search, Globe, Link as LinkIcon, X, Check, Image as ImageIcon } from 'lucide-react';
import { CURATED_LIBRARY, searchWebImages, WebImage } from '../utils/imageSearch';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (url: string) => void;
  currentImage?: string;
}

const CATEGORIES = ['Tutte', 'Storia', 'Scienze', 'Geografia', 'Arte', 'Animali', 'Matematica'] as const;

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  currentImage
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'url'>('search');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');
  const [customUrl, setCustomUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);

  if (!isOpen) return null;

  const images: WebImage[] = searchWebImages(query, selectedCategory);

  const handleSelect = (url: string) => {
    onSelectImage(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Inserisci Immagine</h3>
              <p className="text-xs text-slate-400">Modalità stile Google Documenti: cerca dal web o inserisci link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 pt-3 bg-slate-950/30 gap-4">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'search'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Cerca nel Web
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'url'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Incolla Link / URL
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'search' ? (
            <>
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cerca immagini (es. Napoleone, Sistema Solare, Leone, Colosseo)..."
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of Results */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
                {images.map((img) => {
                  const isCurrent = previewImage === img.url;
                  return (
                    <div
                      key={img.id}
                      onClick={() => setPreviewImage(img.url)}
                      onDoubleClick={() => handleSelect(img.url)}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 bg-slate-800 ${
                        isCurrent
                          ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.02]'
                          : 'border-slate-700/70 hover:border-slate-500 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="aspect-video w-full overflow-hidden bg-slate-900">
                        <img
                          src={img.url}
                          alt={img.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2.5 bg-slate-900/90 flex flex-col justify-between">
                        <p className="text-xs font-semibold text-white line-clamp-1">{img.title}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5">{img.category}</span>
                      </div>
                      {isCurrent && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                <LinkIcon className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-white">Inserisci l'URL di un'immagine</h4>
              <p className="text-xs text-slate-400">
                Incolla il link diretto di qualsiasi immagine online (JPEG, PNG, WebP)
              </p>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setPreviewImage(e.target.value);
                }}
                placeholder="https://example.com/immagine.jpg"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {previewImage && (
                <div className="mt-4 p-2 bg-slate-800 rounded-xl border border-slate-700 max-w-xs mx-auto">
                  <p className="text-xs text-slate-400 mb-2">Anteprima:</p>
                  <img
                    src={previewImage}
                    alt="Anteprima URL"
                    onError={() => setPreviewImage(null)}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {previewImage ? (
              <span className="text-emerald-400 font-medium">Immagine selezionata</span>
            ) : (
              'Scegli un\'immagine per confermare'
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Annulla
            </button>
            <button
              disabled={!previewImage}
              onClick={() => previewImage && handleSelect(previewImage)}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-md shadow-indigo-600/30"
            >
              Inserisci Immagine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
