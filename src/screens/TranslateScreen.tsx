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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Interactive Learning Mode State
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [challenge, setChallenge] = useState<{ original: string; expected: string } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<'correct' | 'incorrect' | 'checking' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  const recognitionRef = useRef<any>(null);

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
    if (!inputText.trim() || isLearningMode || !isOnline) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsGeneratingSuggestions(true);
      try {
        const prompt = `Based on the text "${inputText}" in ${sourceLang}, suggest 3-4 related words or common short phrases someone might want to use next for language learning. Return ONLY the suggestions separated by commas, no other text. Example: hello, how are you, nice to meet you`;
        const result = await translateText(prompt, 'Assistant', 'Suggestions');
        if (result) {
          const fetchedSuggestions = result.split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(s => s.length > 0 && s.toLowerCase() !== inputText.toLowerCase());
          setSuggestions(fetchedSuggestions);
        }
      } catch (e) {
        console.error("Failed to fetch suggestions", e);
      } finally {
        setIsGeneratingSuggestions(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [inputText, sourceLang, isLearningMode, isOnline]);

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
    
    // Check Cache first (Offline mode preparation)
    const cacheKey = `tr_cache_${sourceLang}_${targetLang}_${inputText.trim().toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setTranslatedText(cached);
      setIsFromCache(true);
      saveToHistory(inputText, cached);
      return;
    }

    if (!isOnline) {
      setListeningError("Você está offline e esta frase não está no cache.");
      return;
    }

    setIsTranslating(true);
    setIsFromCache(false);
    try {
      const result = await translateText(inputText, sourceLang, targetLang);
      setTranslatedText(result);
      
      // Save to offline cache
      localStorage.setItem(cacheKey, result);
      
      saveToHistory(inputText, result);
    } catch (error) {
      console.error(error);
      setTranslatedText('Erro na tradução. Tente novamente.');
    } finally {
      setIsTranslating(false);
    }
  };

  const speak = (text: string) => {
    if (!text || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
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
    
    utterance.lang = langMap[targetLang] || 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (isLearningMode) resetLearningMode();
  };

  const startLearningMode = () => {
    setIsLearningMode(true);
    generateChallenge();
  };

  const resetLearningMode = () => {
    setChallenge(null);
    setUserAnswer('');
    setEvaluation(null);
    setFeedback(null);
    generateChallenge();
  };

  const generateChallenge = () => {
    const defaultPhrases = [
      "Hello, how are you?",
      "Where is the nearest station?",
      "I would like a coffee, please.",
      "What time is it?",
      "Beautiful day, isn't it?",
      "I am learning a new language.",
      "Could you help me?",
      "Thank you very much."
    ];

    // Try to pick from history if it matches the current source language
    const relevantHistory = history.filter(h => h.sourceLang === sourceLang);
    const pool = relevantHistory.length > 0 ? relevantHistory.map(h => h.original) : defaultPhrases;
    
    const randomPhrase = pool[Math.floor(Math.random() * pool.length)];
    
    setChallenge({
      original: randomPhrase,
      expected: '' // We will evaluate dynamically
    });
    setUserAnswer('');
    setEvaluation(null);
    setFeedback(null);
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim() || !challenge) return;
    
    setEvaluation('checking');
    try {
      // Use AI to check if the translation is reasonably correct
      const prompt = `System: You are a language teacher helper. 
      Challenge: Translate "${challenge.original}" from ${sourceLang} to ${targetLang}.
      Student's Answer: "${userAnswer}".
      Is this answer correct or a very close alternative? 
      Respond ONLY with "CORRECT" or "INCORRECT" followed by the ideal translation. 
      Format: CORRECT|Ideal text OR INCORRECT|Ideal text`;
      
      const response = await translateText(prompt, 'System', 'Evaluation');
      const parts = response.split('|');
      const status = parts[0]?.trim();
      const ideal = parts[1]?.trim();

      if (status === 'CORRECT') {
        setEvaluation('correct');
        setScore(prev => prev + 10);
        setStreak(prev => prev + 1);
        setFeedback("Excelente! Você acertou.");
      } else {
        setEvaluation('incorrect');
        setStreak(0);
        setFeedback(`Não foi dessa vez. O ideal seria: "${ideal || ''}"`);
      }
    } catch (error) {
      console.error(error);
      setEvaluation(null);
      setFeedback("Erro ao avaliar. Tente novamente.");
    }
  };

  return (
    <div className="p-6 space-y-6 h-full relative">
      {/* Language Selector */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-indigo-300'}`}>
            {isLearningMode ? 'Modo de Aprendizado' : 'Modo Tradução'}
          </h2>
          <button 
            onClick={() => {
              if (isLearningMode) {
                setIsLearningMode(false);
              } else {
                startLearningMode();
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm flex items-center gap-2 ${
              isLearningMode 
                ? 'bg-indigo-600 text-white shadow-indigo-600/20' 
                : isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isLearningMode ? 'bg-white animate-pulse' : 'bg-current'}`} />
            {isLearningMode ? 'Desativar Treino' : 'Ativar Treino'}
          </button>
        </div>

        <div 
          aria-label="Seleção de Idiomas"
          className={`flex items-center justify-between p-1.5 rounded-2xl border shadow-inner transition-colors ${
          isDarkMode ? 'bg-surface-card border-white/5' : 'bg-indigo-50 border-indigo-100'
        }`}>
        <button 
          onClick={() => setPickingLang('source')}
          aria-label={`Idioma de origem: ${sourceLang}`}
          className={`flex-1 py-3 text-sm font-bold rounded-xl shadow-lg border tracking-tight transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isDarkMode ? 'text-indigo-400 bg-surface border-white/5 ai-glow' : 'text-indigo-600 bg-white border-indigo-200'
          }`}
        >
          {sourceLang}
        </button>
        <button 
          onClick={swapLanguages}
          aria-label="Inverter Idiomas"
          className={`mx-3 p-2 transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isDarkMode ? 'text-text-muted hover:text-indigo-400 hover:bg-white/5' : 'text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 opacity-50" />
        </button>
        <button 
          onClick={() => setPickingLang('target')}
          aria-label={`Idioma de destino: ${targetLang}`}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors text-center tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isDarkMode ? 'text-indigo-400 hover:bg-white/5' : 'text-indigo-600 hover:bg-white/50'
          }`}
        >
          {targetLang}
        </button>
      </div>
    </section>

      {/* Input Section */}
      <AnimatePresence mode="wait">
        {!isLearningMode ? (
          <motion.section 
            key="translate-mode"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={`w-full min-h-[220px] p-8 text-xl border focus:ring-4 focus:ring-indigo-500/20 resize-none rounded-[2.5rem] shadow-2xl transition-all outline-none ${
                  isDarkMode 
                    ? 'bg-surface-card border-white/5 text-text-main placeholder-zinc-800' 
                    : 'bg-white border-indigo-100 text-indigo-950 placeholder-indigo-200'
                }`}
                placeholder="Introduza o texto a processar..."
              />
              {inputText && (
                <button 
                  onClick={() => setInputText('')}
                  aria-label="Limpar texto"
                  className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <X className="w-5 h-5 opacity-40" />
                </button>
              )}
              
              <button 
                onClick={toggleListening}
                aria-label={isListening ? "Parar reconhecimento de voz" : "Iniciar reconhecimento de voz"}
                className={`absolute bottom-6 right-6 p-4 rounded-3xl border transition-all shadow-[0_15px_35px_rgba(0,0,0,0.3)] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isListening 
                    ? 'bg-red-500 border-red-400 text-white animate-pulse font-medium' 
                    : isDarkMode 
                      ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' 
                      : 'bg-white border-indigo-100 text-indigo-400 hover:text-indigo-600'
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
                    <Search className={`w-3.5 h-3.5 ${isDarkMode ? 'text-zinc-600' : 'text-indigo-300'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-700' : 'text-indigo-200'}`}>Synapse</span>
                  </div>
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(sug)}
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all active:scale-95 ${
                        isDarkMode 
                          ? 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:border-white/20' 
                          : 'bg-white border-indigo-50 text-indigo-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className={`w-full font-black uppercase text-[12px] tracking-[0.3em] py-6 rounded-3xl shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden ${
                !isOnline 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/40 ai-glow'
              }`}
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
        ) : (
          <motion.section 
            key="learning-mode"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Learning Dashboard */}
            <div className={`p-4 rounded-2xl flex items-center justify-between border ${
              isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-indigo-100 shadow-sm'
            }`}>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Pontuação</span>
                  <span className="text-lg font-black text-indigo-500">{score}</span>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Sequência</span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-orange-500">{streak}</span>
                    {streak > 0 && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={resetLearningMode}
                  className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Challenge Card */}
            <div className={`p-8 rounded-3xl border relative overflow-hidden transition-all ${
              isDarkMode ? 'bg-surface-card border-surface-border' : 'bg-white border-indigo-100 shadow-2xl'
            }`}>
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 block mb-4">Traduza para {targetLang}</span>
              <h2 className="text-2xl font-bold tracking-tight text-text-main mb-8">
                "{challenge?.original}"
              </h2>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={evaluation !== null && evaluation !== 'checking'}
                    placeholder="Sua tradução..."
                    className={`w-full p-5 rounded-2xl border bg-transparent font-medium focus:ring-4 outline-none transition-all ${
                      evaluation === 'correct' 
                        ? 'border-green-500/50 ring-green-500/10 text-green-500' 
                        : evaluation === 'incorrect'
                          ? 'border-red-500/50 ring-red-500/10 text-red-500'
                          : isDarkMode ? 'border-zinc-800 text-white focus:ring-indigo-500/20' : 'border-indigo-100 text-indigo-950 focus:ring-indigo-500/20'
                    }`}
                  />
                  {evaluation && evaluation !== 'checking' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {evaluation === 'correct' ? <Check className="w-6 h-6 text-green-500" /> : <X className="w-6 h-6 text-red-500" />}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {feedback && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-[11px] font-bold px-2 ${
                        evaluation === 'correct' ? 'text-green-500' : 'text-red-400'
                      }`}
                    >
                      {feedback}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-2">
                  {evaluation === null || evaluation === 'checking' ? (
                    <button 
                      onClick={checkAnswer}
                      disabled={!userAnswer.trim() || evaluation === 'checking'}
                      className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {evaluation === 'checking' ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>Verificar Resposta</span>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={resetLearningMode}
                      className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Próximo Desafio</span>
                      <ArrowLeftRight className="w-4 h-4 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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
              
              {isFromCache && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-zinc-800/50 rounded-lg backdrop-blur-md border border-white/5">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Offline Cache</span>
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
                  onClick={() => navigator.clipboard.writeText(translatedText)}
                  aria-label="Copiar tradução"
                  className="p-2.5 bg-surface border border-surface-border text-text-muted hover:text-text-main rounded-xl shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => speak(translatedText)}
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

