import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Copy, Volume2, Search, X, Check, Languages, Trash2, History as HistoryIcon, Clock, Heart, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateText, TranslationMode } from '../services/geminiService';

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
  { name: 'Auto', flag: '✨' },
  { name: 'Português', flag: '🇧🇷' },
  { name: 'English', flag: '🇺🇸' },
  { name: 'Spanish', flag: '🇪🇸' },
  { name: 'French', flag: '🇫🇷' },
  { name: 'German', flag: '🇩🇪' },
  { name: 'Italian', flag: '🇮🇹' },
  { name: 'Japanese', flag: '🇯🇵' },
  { name: 'Chinese', flag: '🇨🇳' },
  { name: 'Russian', flag: '🇷🇺' },
  { name: 'Arabic', flag: '🇸🇦' },
  { name: 'Hindi', flag: '🇮🇳' },
  { name: 'Hebrew', flag: '🇮🇱' },
  { name: 'Latin', flag: '🏛️' },
  { name: 'Turkish', flag: '🇹🇷' },
  { name: 'Dutch', flag: '🇳🇱' },
  { name: 'Korean', flag: '🇰🇷' },
  { name: 'Greek', flag: '🇬🇷' },
  { name: 'Thai', flag: '🇹🇭' },
  { name: 'Swedish', flag: '🇸🇪' },
  { name: 'Portuguese (Portugal)', flag: '🇵🇹' }
];

const MODES: TranslationMode[] = ['Standard', 'Formal', 'Casual', 'Literal'];

const VOICE_LANG_MAP: Record<string, string> = {
  'Português': 'pt-BR',
  'English': 'en-US',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Italian': 'it-IT',
  'Japanese': 'ja-JP',
  'Chinese': 'zh-CN',
  'Russian': 'ru-RU',
  'Arabic': 'ar-SA',
  'Hindi': 'hi-IN',
  'Hebrew': 'he-IL',
  'Turkish': 'tr-TR',
  'Dutch': 'nl-NL',
  'Korean': 'ko-KR',
  'Greek': 'el-GR',
  'Thai': 'th-TH',
  'Swedish': 'sv-SE'
};

const RECOGNITION_LANG_MAP: Record<string, string> = {
  'Português': 'pt-BR',
  'English': 'en-US',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Italian': 'it-IT',
  'Japanese': 'ja-JP',
  'Chinese': 'zh-CN'
};

interface TranslateScreenProps {
  defaultLanguage: string;
  isDarkMode: boolean;
}

export default function TranslateScreen({ defaultLanguage, isDarkMode }: TranslateScreenProps) {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLang, setSourceLang] = useState('Auto');
  const [targetLang, setTargetLang] = useState(defaultLanguage === 'Português (BR)' ? 'Português' : defaultLanguage);
  const [pickingLang, setPickingLang] = useState<'source' | 'target' | null>(null);
  const [langSearch, setLangSearch] = useState('');
  const [translationMode, setTranslationMode] = useState<TranslationMode>('Standard');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [detectedLangBadge, setDetectedLangBadge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  const filteredLanguages = React.useMemo(() => {
    return LANGUAGES.filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase()));
  }, [langSearch]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleTranslate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, sourceLang, targetLang, translationMode]);

  useEffect(() => {
    if (copyFeedback) {
      const timer = setTimeout(() => setCopyFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyFeedback]);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

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

  useEffect(() => {
    if (!inputText.trim() || !isOnline) {
      setSuggestions([]);
      if (!inputText.trim()) setTranslatedText('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsGeneratingSuggestions(true);
      try {
        const prompt = `Based on the text "${inputText}" in ${sourceLang}, suggest 3-4 related words or common short phrases someone might want to use next for language learning. Return ONLY the suggestions separated by commas, no other text. Example: hello, how are you, nice to meet you`;
        const result = await translateText(prompt, 'Assistant', 'Suggestions');
        if (result && result.text) {
          const fetchedSuggestions = result.text.split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(s => s.length > 0 && s.toLowerCase() !== inputText.toLowerCase());
          setSuggestions(fetchedSuggestions);
        }
      } catch (e) {
        console.error("Failed to fetch suggestions", e);
      } finally {
        setIsGeneratingSuggestions(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [inputText, sourceLang, isOnline]);

  const saveToHistory = (original: string, translated: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      original,
      translated,
      sourceLang,
      targetLang,
      timestamp: Date.now()
    };
    const updatedHistory = [newItem, ...history.slice(0, 49)];
    setHistory(updatedHistory);
    
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        localStorage.setItem('translation_history', JSON.stringify(updatedHistory));
      });
    } else {
      localStorage.setItem('translation_history', JSON.stringify(updatedHistory));
    }
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
    
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        localStorage.setItem('translation_favorites', JSON.stringify(updated));
      });
    } else {
      localStorage.setItem('translation_favorites', JSON.stringify(updated));
    }
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
        recognitionRef.current.lang = RECOGNITION_LANG_MAP[sourceLang] || 'pt-BR';
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error("Speech start error:", err);
      setIsListening(false);
      // If error is because it's already started, just stop it
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const handleTranslate = React.useCallback(async () => {
    if (!inputText.trim()) return;
    
    // Check Cache first (Offline mode preparation)
    const cacheKey = `tr_cache_${sourceLang}_${targetLang}_${translationMode}_${inputText.trim().toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setTranslatedText(cached);
      setIsFromCache(true);
      setError(null);
      saveToHistory(inputText, cached);
      return;
    }

    if (!isOnline) {
      setListeningError("Você está offline e esta frase não está no cache.");
      return;
    }

    setIsTranslating(true);
    setIsFromCache(false);
    setError(null);
    setDetectedLangBadge(null);
    
    try {
      const result = await translateText(inputText, sourceLang, targetLang, translationMode);
      setTranslatedText(result.text);
      if (result.detectedLanguage) {
        setDetectedLangBadge(result.detectedLanguage);
      }
      
      // Save to offline cache
      localStorage.setItem(cacheKey, result.text);
      
      saveToHistory(inputText, result.text);
    } catch (err: any) {
      console.error(err);
      setError("Falha na tradução. Verifique sua conexão.");
    } finally {
      setIsTranslating(false);
    }
  }, [inputText, sourceLang, targetLang, translationMode, isOnline, history]);

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopyFeedback(true);
  };

  const clearInput = () => {
    setInputText('');
    setTranslatedText('');
    setDetectedLangBadge(null);
    setError(null);
  };

  const speak = React.useCallback((text: string, langName: string) => {
    if (!text || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = VOICE_LANG_MAP[langName] || 'pt-BR';
    window.speechSynthesis.speak(utterance);
  }, []);

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <div className="p-6 space-y-6 h-full relative">
      {/* Translation Modes Selector */}
      <section className="flex gap-1.5 p-1 rounded-2xl bg-surface-card border border-surface-border overflow-x-auto scrollbar-hide flex-nowrap">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setTranslationMode(m)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              translationMode === m 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-transparent border-transparent text-text-muted hover:text-text-main'
            }`}
          >
            {m}
          </button>
        ))}
      </section>

      {/* Language Selector */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <h2 className={`text-xs font-black uppercase tracking-widest text-text-muted`}>
              Modo Tradução
            </h2>
          </div>
        </div>

        <div 
          aria-label="Seleção de Idiomas"
          className={`flex items-center justify-between p-1.5 rounded-2xl border shadow-inner transition-colors bg-surface-card border-surface-border`}>
        <button 
          onClick={() => setPickingLang('source')}
          aria-label={`Idioma de origem: ${sourceLang}`}
          className={`flex-1 py-3 text-sm font-bold rounded-xl shadow-lg border tracking-tight transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-primary bg-surface border-surface-border ai-glow`}
        >
          {sourceLang}
        </button>
        <button 
          onClick={swapLanguages}
          aria-label="Inverter Idiomas"
          className={`mx-3 p-2 transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-text-muted hover:text-primary hover:bg-surface-card`}
        >
          <ArrowLeftRight className="w-5 h-5 opacity-70" />
        </button>
        <button 
          onClick={() => setPickingLang('target')}
          aria-label={`Idioma de destino: ${targetLang}`}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors text-center tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-primary hover:bg-surface-card`}
        >
          {targetLang}
        </button>
      </div>
    </section>

      {/* Input Section */}
      <motion.section 
        key="translate-mode"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <div className="relative group">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, 5000))}
            className={`w-full min-h-[220px] p-8 text-xl border focus:ring-4 focus:ring-primary/20 resize-none rounded-[2.5rem] shadow-2xl transition-all outline-none bg-surface-card border-surface-border text-text-main placeholder-text-muted/30`}
            placeholder="Introduza o texto a processar..."
            aria-label="Texto de origem"
          />
          
          {sourceLang === 'Auto' && detectedLangBadge && (
            <div className="absolute top-4 left-8 px-2 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg">
              Detectado: {detectedLangBadge}
            </div>
          )}

          <div className={`absolute bottom-6 left-8 text-[10px] font-bold tracking-widest pointer-events-none opacity-40 text-text-muted`}>
            {inputText.length} / 5000
          </div>

          {inputText && (
            <div className="absolute top-6 right-6 flex items-center gap-1">
              <button 
                onClick={() => speak(inputText, sourceLang === 'Auto' ? 'English' : sourceLang)}
                aria-label="Ouvir texto original"
                className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface transition-colors"
              >
                <Volume2 className="w-5 h-5 opacity-40" />
              </button>
              <button 
                onClick={clearInput}
                aria-label="Limpar texto"
                className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5 opacity-40" />
              </button>
            </div>
          )}
          
          <button 
            onClick={toggleListening}
            aria-label={isListening ? "Parar reconhecimento de voz" : "Iniciar reconhecimento de voz"}
            className={`absolute bottom-6 right-6 p-4 rounded-3xl border transition-all shadow-2xl active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isListening 
                ? 'bg-red-500 border-red-400 text-white animate-pulse font-medium' 
                : 'bg-surface border-surface-border text-text-muted hover:text-primary'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5 shadow-inner" /> : <Mic className="w-5 h-5 opacity-80" />}
          </button>

          <AnimatePresence>
            {listeningError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-12 right-0 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-3 px-6 rounded-2xl shadow-2xl z-50 flex items-center gap-2"
              >
                <span>{listeningError}</span>
                <button onClick={() => setListeningError(null)}>
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggestions Box */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap gap-2 px-2"
            >
              <div className="flex items-center gap-1.5 mr-2 pt-1">
                <Search className={`w-3.5 h-3.5 text-primary`} />
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-text-muted`}>Synapse</span>
              </div>
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(sug)}
                  className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all active:scale-95 bg-surface-card border-surface-border text-text-muted hover:text-text-main hover:border-primary/50 shadow-sm`}
                >
                  {sug}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold py-3 px-6 rounded-2xl animate-shake">
            {error}
          </div>
        )}

        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className={`w-full font-black uppercase text-[12px] tracking-[0.3em] py-6 rounded-3xl shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden ${
            !isOnline 
              ? 'bg-surface-card text-text-muted opacity-50 cursor-not-allowed' 
              : 'bg-primary text-white hover:opacity-90 shadow-primary/40 ai-glow'
          }`}
          title="Ctrl+Enter para traduzir"
        >
          {!isOnline && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
          {isTranslating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{isOnline ? 'Processar Tradução' : 'Traduzir (Modo Local)'}</span>
              <Languages className="w-4 h-4 opacity-40 group-hover:rotate-12 transition-transform" />
            </>
          )}
        </button>
      </motion.section>

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
            <div className="bg-surface-card rounded-3xl p-6 min-h-[120px] border border-surface-border relative group overflow-hidden ai-border-glow shadow-2xl">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              
              {isFromCache && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-surface border border-surface-border rounded-lg backdrop-blur-md">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Offline Cache</span>
                </div>
              )}

              <p className="text-xl text-text-main leading-relaxed font-medium">
                {translatedText}
              </p>
              <div className="mt-8 flex items-center justify-end gap-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={toggleFavorite}
                  aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  className={`p-2.5 bg-surface border border-surface-border rounded-xl shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isFavorited ? 'text-red-500' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleCopy}
                  aria-label="Copiar tradução"
                  className={`p-2.5 bg-surface border border-surface-border transition-all flex items-center gap-2 rounded-xl shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    copyFeedback ? 'text-green-500 border-green-500/30 bg-green-500/5' : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {copyFeedback ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copyFeedback && <span className="text-[10px] font-black uppercase">Copiado!</span>}
                </button>
                <button 
                  onClick={() => speak(translatedText, targetLang)}
                  aria-label="Ouvir tradução"
                  className={`p-2.5 bg-surface border border-surface-border rounded-xl shadow-sm transition-colors hover:text-text-main focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isDarkMode ? 'text-text-muted hover:bg-zinc-800' : 'text-indigo-400 hover:bg-indigo-50'
                  }`}
                >
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
            <div className="flex items-center gap-2 text-indigo-600">
              <HistoryIcon className="w-4 h-4" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Histórico Recente</h3>
            </div>
            <button 
              onClick={clearHistory}
              className="text-[10px] font-bold text-red-600 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              Limpar tudo
            </button>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {history.map((item, index) => (
                <motion.div 
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 rounded-[2rem] border flex flex-col gap-4 group transition-all relative overflow-hidden shadow-sm hover:shadow-2xl ${
                    isDarkMode 
                      ? 'bg-surface-card border-surface-border hover:border-primary/30 backdrop-blur-sm shadow-black/20' 
                      : 'bg-white border-slate-200 hover:border-primary/30 shadow-indigo-100/20'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                         <span>{LANGUAGES.find(l => l.name === item.sourceLang)?.flag}</span>
                         <span>{item.sourceLang}</span>
                       </div>
                       <ArrowLeftRight className="w-3.5 h-3.5 text-primary opacity-40" />
                       <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                         <span>{LANGUAGES.find(l => l.name === item.targetLang)?.flag}</span>
                         <span>{item.targetLang}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(item.translated);
                          setCopyFeedback(true);
                        }}
                        className={`p-2.5 rounded-xl transition-colors ${
                          isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-indigo-50 text-indigo-300'
                        }`}
                        title="Copiar Tradução"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className={`p-2.5 rounded-xl transition-colors ${
                          isDarkMode ? 'hover:bg-red-500/10 text-red-500/50 hover:text-red-500' : 'hover:bg-red-50 text-red-300 hover:text-red-500'
                        }`}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    className="cursor-pointer space-y-2"
                    onClick={() => {
                      setSourceLang(item.sourceLang);
                      setTargetLang(item.targetLang);
                      setInputText(item.original);
                      setTranslatedText(item.translated);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <p className={`text-[13px] font-medium line-clamp-2 opacity-50`}>
                      {item.original}
                    </p>
                    <p className={`text-xl font-black tracking-tighter leading-tight ${isDarkMode ? 'text-text-main' : 'text-indigo-950'}`}>
                      {item.translated}
                    </p>
                  </div>
  
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-surface-border/50">
                    <div className="flex items-center gap-1.5 opacity-30">
                       <Clock className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <button 
                      onClick={() => speak(item.translated, item.targetLang)}
                      className="p-1 px-3 flex items-center gap-2 rounded-xl text-primary bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/10"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Listen</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                className={`w-full border rounded-2xl py-5 pl-12 pr-4 text-sm focus:ring-4 focus:ring-indigo-500/20 shadow-xl transition-all outline-none ${
                  isDarkMode 
                    ? 'bg-surface-card border-surface-border text-text-main placeholder-zinc-700' 
                    : 'bg-white border-indigo-100 text-indigo-950 placeholder-indigo-200'
                }`}
                placeholder="Pesquisar..."
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 grid grid-cols-1 scrollbar-hide pb-10">
              {filteredLanguages.map((lang) => {
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

