import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Copy, Volume2, Search, X, Check, Languages, Trash2, History as HistoryIcon, Clock, Heart, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateText } from '../services/geminiService';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface HistoryItem {
  id: string;
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

interface FavoriteItem {
  id: string;
  lang: string;
  original: string;
  translated: string;
}

const LANGUAGES = [
  { name: 'Português', flag: '🇧🇷' },
  { name: 'English', flag: '🇺🇸' },
  { name: 'Spanish', flag: '🇪🇸' },
  { name: 'French', flag: '🇫🇷' },
  { name: 'German', flag: '🇩🇪' },
  { name: 'Italian', flag: '🇮🇹' },
  { name: 'Japanese', flag: '🇯🇵' },
  { name: 'Chinese', flag: '🇨🇳' },
];

interface TranslateScreenProps {
  defaultLanguage: string;
  isDarkMode: boolean;
}

export default function TranslateScreen({ defaultLanguage, isDarkMode }: TranslateScreenProps) {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState(defaultLanguage === 'Português (BR)' ? 'Português' : defaultLanguage);
  const [pickingLang, setPickingLang] = useState<'source' | 'target' | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setListeningError(null);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev.trim() + ' ' + transcript).trim());
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'network') {
          setListeningError('Serviço de voz indisponível no frame. Tente abrir o app em uma NOVA ABA para usar o microfone.');
        } else if (event.error === 'not-allowed') {
          setListeningError('Microfone bloqueado. Verifique as permissões do seu navegador.');
        } else if (event.error === 'no-speech') {
          setListeningError('Nenhuma voz detectada. Tente novamente.');
        } else {
          setListeningError(`Erro de voz: ${event.error}`);
        }
        setIsListening(false);
      };
    }

    const savedHistory = localStorage.getItem('translation_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    const savedFavs = localStorage.getItem('translation_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  const saveToHistory = (original: string, translated: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      original,
      translated,
      sourceLang,
      targetLang,
      timestamp: Date.now()
    };
    const updatedHistory = [newItem, ...history.slice(0, 49)]; // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('translation_history', JSON.stringify(updatedHistory));
  };

  const toggleFavorite = () => {
    const isAlreadyFav = favorites.some(f => f.original === inputText && f.translated === translatedText);
    let updated: FavoriteItem[];
    
    if (isAlreadyFav) {
      updated = favorites.filter(f => !(f.original === inputText && f.translated === translatedText));
    } else {
      const newFav: FavoriteItem = {
        id: Date.now().toString(),
        lang: targetLang,
        original: inputText,
        translated: translatedText
      };
      updated = [newFav, ...favorites];
    }
    
    setFavorites(updated);
    localStorage.setItem('translation_favorites', JSON.stringify(updated));
  };

  const isFavorited = favorites.some(f => f.original === inputText && f.translated === translatedText);

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('translation_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('translation_history');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setListeningError("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        setListeningError(null);
        // Map language names to BCP 47 tags
        const langMap: Record<string, string> = {
          'Português': 'pt-BR',
          'English': 'en-US',
          'Spanish': 'es-ES',
          'French': 'fr-FR',
          'German': 'de-DE',
          'Italian': 'it-IT',
          'Japanese': 'ja-JP',
          'Chinese': 'zh-CN'
        };
        recognitionRef.current.lang = langMap[sourceLang] || 'pt-BR';
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error("Speech start error:", err);
      setIsListening(false);
      // If error is because it's already started, just stop it
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    try {
      const result = await translateText(inputText, sourceLang, targetLang);
      setTranslatedText(result);
      saveToHistory(inputText, result);
    } catch (error) {
      console.error(error);
      setTranslatedText('Error in translation. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <div className="p-6 space-y-6 h-full relative">
      {/* Language Selector */}
      <section className={`flex items-center justify-between p-1.5 rounded-2xl border shadow-inner transition-colors ${
        isDarkMode ? 'bg-surface-card border-surface-border' : 'bg-indigo-50 border-indigo-100'
      }`}>
        <button 
          onClick={() => setPickingLang('source')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl shadow-lg border tracking-tight transition-all ${
            isDarkMode ? 'text-indigo-400 bg-surface border-surface-border' : 'text-indigo-600 bg-white border-indigo-200'
          }`}
        >
          {sourceLang}
        </button>
        <button 
          onClick={swapLanguages}
          className={`mx-3 p-2 transition-colors rounded-full ${
            isDarkMode ? 'text-text-muted hover:text-indigo-400 hover:bg-indigo-500/10' : 'text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 shadow-sm" />
        </button>
        <button 
          onClick={() => setPickingLang('target')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors text-center tracking-tight ${
            isDarkMode ? 'text-indigo-400 hover:bg-surface/50' : 'text-indigo-600 hover:bg-white/50'
          }`}
        >
          {targetLang}
        </button>
      </section>

      {/* Input Section */}
      <section className="space-y-4">
        <div className="relative group">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={`w-full min-h-[220px] p-6 text-xl border focus:ring-4 focus:ring-indigo-500/20 resize-none rounded-3xl shadow-2xl transition-all outline-none ${
              isDarkMode 
                ? 'bg-surface-card border-surface-border text-text-main placeholder-zinc-700' 
                : 'bg-white border-indigo-100 text-indigo-950 placeholder-indigo-200'
            }`}
            placeholder="Digite algo para traduzir..."
          />
          {inputText && (
            <button 
              onClick={() => setInputText('')}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <button 
            onClick={toggleListening}
            className={`absolute bottom-4 right-4 p-3 rounded-2xl border transition-all shadow-lg active:scale-95 ${
              isListening 
                ? 'bg-red-500 border-red-400 text-white animate-pulse' 
                : isDarkMode 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' 
                  : 'bg-white border-indigo-100 text-indigo-400 hover:text-indigo-600'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {listeningError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-12 right-0 bg-red-500 text-white text-[10px] font-bold py-2 px-4 rounded-xl shadow-lg z-50 flex items-center gap-2"
              >
                <span>{listeningError}</span>
                <button onClick={() => setListeningError(null)}>
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isTranslating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Traduzir</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Languages className="w-4 h-4 opacity-50" />
              </motion.div>
            </>
          )}
        </button>
      </section>

      {/* Results Section */}
      <AnimatePresence>
        {translatedText && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-2">Resultado</h3>
            <div className="bg-surface-card rounded-3xl p-6 min-h-[120px] border border-surface-border relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/40" />
              <p className="text-xl text-text-main leading-relaxed font-medium">
                {translatedText}
              </p>
              <div className="mt-8 flex items-center justify-end gap-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={toggleFavorite}
                  className={`p-2.5 bg-surface border border-surface-border rounded-xl shadow-sm transition-colors ${
                    isFavorited ? 'text-red-500' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => navigator.clipboard.writeText(translatedText)}
                  className="p-2.5 bg-surface border border-surface-border text-text-muted hover:text-text-main rounded-xl shadow-sm transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2.5 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-xl shadow-sm transition-colors">
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      
      {!translatedText && !isTranslating && history.length > 0 && (
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 pb-20"
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-text-muted">
              <HistoryIcon className="w-4 h-4" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Histórico Recente</h3>
            </div>
            <button 
              onClick={clearHistory}
              className="text-[10px] font-bold text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              Limpar tudo
            </button>
          </div>
          
          <div className="space-y-3">
            {history.map((item) => (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-5 rounded-2xl border flex flex-col gap-3 group transition-all relative overflow-hidden ${
                  isDarkMode 
                    ? 'bg-surface-card border-surface-border hover:border-zinc-700' 
                    : 'bg-white border-indigo-50 hover:border-indigo-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 opacity-40">
                    <span className="text-[10px] font-black uppercase tracking-tighter">{item.sourceLang}</span>
                    <ArrowLeftRight className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">{item.targetLang}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => navigator.clipboard.writeText(item.translated)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-indigo-50 text-indigo-300'
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => deleteHistoryItem(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-red-500/10 text-red-500/50 hover:text-red-500' : 'hover:bg-red-50 text-red-300 hover:text-red-500'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div 
                  className="cursor-pointer"
                  onClick={() => {
                    setSourceLang(item.sourceLang);
                    setTargetLang(item.targetLang);
                    setInputText(item.original);
                    setTranslatedText(item.translated);
                  }}
                >
                  <p className={`text-sm font-medium line-clamp-1 mb-1 ${isDarkMode ? 'text-text-muted' : 'text-indigo-400'}`}>
                    {item.original}
                  </p>
                  <p className={`text-base font-bold ${isDarkMode ? 'text-text-main' : 'text-indigo-950'}`}>
                    {item.translated}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-20 mt-1">
                   <Clock className="w-3 h-3" />
                   <span className="text-[9px] font-bold">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {!translatedText && !isTranslating && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 opacity-20">
          <Languages className="w-16 h-16 mb-2 text-text-main" />
          <p className="text-xs font-bold text-text-main uppercase tracking-widest">Traduza.AI</p>
        </div>
      )}

      {/* Language Picker Modal */}
      <AnimatePresence>
        {pickingLang && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`absolute inset-0 z-50 p-6 flex flex-col pt-12 transition-colors ${
              isDarkMode ? 'bg-surface' : 'bg-white'
            }`}
          >
            <header className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setPickingLang(null)}
                className={`p-2.5 rounded-xl transition-colors border ${
                  isDarkMode ? 'bg-surface-card border-surface-border hover:bg-surface text-text-muted' : 'bg-indigo-50 border-indigo-100 hover:bg-white text-indigo-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className={`text-2xl font-bold tracking-tighter ${isDarkMode ? 'text-text-main' : 'text-indigo-900'}`}>Selecionar Idioma</h1>
            </header>

            <div className="relative mb-6">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-text-muted' : 'text-indigo-300'}`} />
              <input 
                className={`w-full border rounded-2xl py-5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-indigo-500/20 shadow-xl transition-all outline-none ${
                  isDarkMode 
                    ? 'bg-surface-card border-surface-border text-text-main placeholder-zinc-700' 
                    : 'bg-white border-indigo-100 text-indigo-950 placeholder-indigo-200'
                }`}
                placeholder="Pesquisar..."
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 grid grid-cols-1 scrollbar-hide">
              {LANGUAGES.map((lang) => {
                const current = pickingLang === 'source' ? sourceLang : targetLang;
                const isSelected = current === lang.name;
                return (
                  <button 
                    key={lang.name}
                    onClick={() => {
                      if (pickingLang === 'source') setSourceLang(lang.name);
                      else setTargetLang(lang.name);
                      setPickingLang(null);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border group ${
                      isSelected 
                        ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                        : isDarkMode 
                          ? 'bg-surface-card border-surface-border hover:bg-surface hover:border-zinc-700 active:scale-[0.98]'
                          : 'bg-white border-indigo-50 hover:bg-indigo-100/50 hover:border-indigo-300 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl transition-all ${
                        isDarkMode ? 'bg-surface border-surface-border' : 'bg-indigo-50 border-indigo-100'
                      }`}>
                        {lang.flag}
                      </div>
                      <span className={`font-bold tracking-tight transition-colors ${
                        isSelected ? 'text-indigo-500' : isDarkMode ? 'text-text-muted' : 'text-indigo-900 group-hover:text-indigo-600'
                      }`}>
                        {lang.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className={`pt-8 text-center opacity-30 ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
                Global Lexicon
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

