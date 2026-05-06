import React, { useState, useEffect } from 'react';
import { Search, Heart, Star, Languages as LangIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FavoriteItem {
  id: string;
  lang: string;
  original: string;
  translated: string;
}

interface FavoritesScreenProps {
  defaultLanguage: string;
  onSetDefaultLanguage: (lang: string) => void;
  isDarkMode: boolean;
}

export default function FavoritesScreen({ defaultLanguage, onSetDefaultLanguage, isDarkMode }: FavoritesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  
  const languages = [
    'Português (BR)', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Japonês', 
    'Chinês', 'Italiano', 'Coreano', 'Russo', 'Árabe', 'Holandês'
  ];

  useEffect(() => {
    const saved = localStorage.getItem('translation_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('translation_favorites', JSON.stringify(updated));
  };

  const filteredLanguages = languages.filter(lang => 
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 h-full">
      <header>
        <h2 className={`text-3xl font-black tracking-tighter text-text-main`}>Favoritos</h2>
        <p className="text-xs font-bold text-text-muted mt-2 uppercase tracking-[0.2em]">Idiomas & Traduções</p>
      </header>

      {/* Language Search & Selection */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
            <Star className="w-3 h-3 text-indigo-500 fill-indigo-500" />
            Escolher Idioma Padrão
          </h3>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className={`w-5 h-5 text-primary opacity-50`} />
          </div>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-4 focus:ring-primary/20 shadow-xl transition-all outline-none bg-surface-card border-surface-border text-text-main placeholder-text-muted/30`}
            placeholder="Pesquisar idioma..."
          />
        </div>

        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 scrollbar-hide">
          {filteredLanguages.map((lang) => {
            const isDefault = lang === defaultLanguage;
            return (
              <button
                key={lang}
                onClick={() => onSetDefaultLanguage(lang)}
                aria-label={`Definir ${lang} como idioma padrão`}
                aria-pressed={isDefault}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isDefault 
                    ? 'bg-primary border-primary text-white shadow-primary/20' 
                    : 'bg-surface-card border-surface-border text-text-main hover:border-primary/50 focus-visible:ring-offset-surface' 
                }`}
              >
                <LangIcon className="w-4 h-4 opacity-70" />
                {lang}
                {isDefault && <Star className="w-3 h-3 fill-white" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Saved Phrases */}
      <section className="space-y-4 pb-12">
        <div className="flex items-center justify-between">
           <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">Traduções Salvas</h3>
           {favorites.length > 0 && <span className="text-[10px] font-bold text-indigo-500" aria-label={`${favorites.length} itens salvos`}>{favorites.length} itens</span>}
        </div>
        
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className={`p-10 text-center border-2 border-dashed rounded-[2.5rem] border-surface-border text-text-muted opacity-50`}>
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhuma tradução salva</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {favorites.map((item) => (
                <motion.div 
                  key={item.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`border p-6 rounded-3xl shadow-xl transition-all group relative overflow-hidden bg-surface-card border-surface-border hover:border-indigo-500/30`}
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-all" />
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{item.lang}</span>
                    <button 
                      onClick={() => removeFavorite(item.id)}
                      aria-label={`Remover tradução de ${item.original}`}
                      className="text-red-500 hover:scale-110 transition-transform p-2 bg-red-500/10 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className={`text-xl font-bold tracking-tight leading-tight mb-3 text-text-main`}>{item.original}</h4>
                  <p className={`text-sm font-medium text-text-muted`}>{item.translated}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
}

