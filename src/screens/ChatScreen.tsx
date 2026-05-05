import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Languages, 
  ArrowLeftRight, 
  History, 
  X, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Copy, 
  Clock,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatAssistant } from '../services/geminiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  feedback?: 'positive' | 'negative' | null;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

interface ChatScreenProps {
  isDarkMode: boolean;
}

export default function ChatScreen({ isDarkMode }: ChatScreenProps) {
  const [chatLang, setChatLang] = useState('Português');
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Como posso ajudar você com suas traduções hoje? Sinta-se à vontade para enviar um texto ou usar o microfone.',
      sender: 'bot',
      timestamp: '09:41 AM'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chat_sessions_records');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load chat sessions', e);
      }
    }
  }, []);

  // Save current session to sessions list
  useEffect(() => {
    if (messages.length > 1) {
      const updatedSessions = [...sessions];
      const sessionIndex = updatedSessions.findIndex(s => s.id === currentSessionId);
      
      const firstUserMsg = messages.find(m => m.sender === 'user')?.text || 'Nova Conversa';
      const title = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg;

      const newSession: ChatSession = {
        id: currentSessionId,
        title: title,
        messages,
        timestamp: Date.now()
      };

      if (sessionIndex >= 0) {
        updatedSessions[sessionIndex] = newSession;
      } else {
        updatedSessions.unshift(newSession);
      }
      
      const limitedSessions = updatedSessions.slice(0, 50); // Keep last 50
      setSessions(limitedSessions);
      localStorage.setItem('chat_sessions_records', JSON.stringify(limitedSessions));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }]
      }));
      
      const response = await chatAssistant(input, history, chatLang);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    setMessages([
      {
        id: '1',
        text: 'Olá! Sou o Traduza.AI. Em que posso ajudar nesta nova conversa?',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setShowHistory(false);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('chat_sessions_records', JSON.stringify(updated));
    if (currentSessionId === id) {
      startNewChat();
    }
  };

  const copySession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    const text = session.messages.map(m => `${m.sender === 'user' ? 'Você' : 'AI'}: ${m.text}`).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const handleFeedback = (messageId: string, type: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        // Toggle if clicking same feedback
        const newFeedback = msg.feedback === type ? null : type;
        return { ...msg, feedback: newFeedback };
      }
      return msg;
    }));
  };

  return (
    <div className={`flex flex-col h-full transition-colors relative ${isDarkMode ? 'bg-zinc-950/50' : 'bg-indigo-50/20'}`}>
      {/* Header with History Toggle */}
      <div 
        role="region" 
        aria-label="Controles do Chat"
        className={`p-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5 bg-zinc-950/50' : 'border-indigo-100 bg-white/50'} backdrop-blur-md sticky top-0 z-20`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Ver histórico de conversas"
            aria-expanded={showHistory}
            className={`p-2 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDarkMode ? 'hover:bg-zinc-900 text-zinc-400' : 'hover:bg-indigo-50 text-indigo-400'}`}
          >
            <History className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-indigo-400'}`}>Chat History</span>
            <span className={`text-[10px] font-bold opacity-50 ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>{sessions.length} sessões</span>
          </div>
        </div>
        <button 
          onClick={startNewChat}
          aria-label="Iniciar nova conversa"
          className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* History Sidebar/Overlay */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className={`absolute top-0 left-0 h-full w-4/5 max-w-[280px] z-[101] p-6 flex flex-col shadow-2xl border-r ${
                isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-indigo-100'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>Conversas</h3>
                <button onClick={() => setShowHistory(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-indigo-50'}`}>
                  <X className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-indigo-400'}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                    <MessageSquare className="w-12 h-12 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma conversa recente</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <motion.div 
                      layout
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                        currentSessionId === session.id 
                          ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                          : isDarkMode 
                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' 
                            : 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-200'
                      }`}
                    >
                      <p className={`text-xs font-bold truncate pr-14 ${
                        currentSessionId === session.id 
                          ? 'text-indigo-500' 
                          : isDarkMode ? 'text-white' : 'text-indigo-900'
                      }`}>
                        {session.title}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-2 opacity-30">
                         <Clock className="w-3 h-3" />
                         <span className="text-[9px] font-bold">
                          {new Date(session.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                         </span>
                      </div>

                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => copySession(e, session)}
                          className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-indigo-100 text-indigo-400'}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => deleteSession(e, session.id)}
                          className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-red-500/10 text-red-500/50' : 'hover:bg-red-50 text-red-400'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              
              <div className="pt-6 border-t border-zinc-900/10 mt-auto">
                <button 
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Novo Chat
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Date Divider */}
      <div className="flex justify-center my-6">
        <span className={`px-4 py-1.5 border text-[10px] font-black rounded-full uppercase tracking-[0.2em] leading-none ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-indigo-100 text-indigo-400'
        }`}>
          Hoje
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-8 pb-40 scrollbar-hide">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className={`text-[10px] font-bold mb-1.5 px-3 uppercase tracking-widest ${
              isDarkMode ? 'text-zinc-600' : 'text-indigo-300'
            }`}>
              {msg.sender === 'user' ? 'Você' : 'Traduza.AI'}
            </span>
            <div 
              className={`max-w-[85%] px-6 py-5 rounded-3xl shadow-xl transition-all hover:scale-[1.01] relative group ${
                msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-900/10' 
                : isDarkMode 
                  ? 'bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800 shadow-black/20'
                  : 'bg-white text-indigo-950 rounded-tl-none border border-indigo-100 shadow-indigo-200/20'
              }`}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
              
              <div className="flex items-center justify-between mt-3">
                {msg.sender === 'bot' && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleFeedback(msg.id, 'positive')}
                      className={`p-1.5 rounded-lg transition-all ${
                        msg.feedback === 'positive' 
                          ? 'bg-green-500/10 text-green-500' 
                          : isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-indigo-200 hover:text-indigo-400'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleFeedback(msg.id, 'negative')}
                      className={`p-1.5 rounded-lg transition-all ${
                        msg.feedback === 'negative' 
                          ? 'bg-red-500/10 text-red-500' 
                          : isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-indigo-200 hover:text-indigo-400'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                
                <div className={`text-[10px] font-mono tracking-tighter text-right opacity-70 ml-auto ${
                  msg.sender === 'user' ? 'text-indigo-100' : isDarkMode ? 'text-zinc-500' : 'text-indigo-300'
                }`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex flex-col items-start">
            <span className={`text-[10px] font-bold mb-1.5 px-3 uppercase tracking-widest ${
              isDarkMode ? 'text-zinc-600' : 'text-indigo-300'
            }`}>Traduza.AI</span>
            <div className={`px-6 py-5 rounded-3xl rounded-tl-none border shadow-xl ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-indigo-100'
            }`}>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Overlay */}
      <div className={`absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t via-transparent ${
        isDarkMode ? 'from-zinc-950/90' : 'from-indigo-50/90'
      }`}>
        <div className="max-w-md mx-auto space-y-4">
          {/* Quick Lang Switcher */}
          <div className={`flex items-center justify-center gap-2 backdrop-blur-xl p-1 rounded-full border shadow-2xl w-fit mx-auto scale-90 ${
            isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-indigo-100'
          }`}>
            <button 
              onClick={() => setChatLang('Português')}
              className={`px-5 py-2 text-[10px] font-bold rounded-full transition-all ${
                chatLang === 'Português' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-indigo-300 hover:text-indigo-600'
              }`}
            >
              Português
            </button>
            <button 
              onClick={() => setChatLang(chatLang === 'Português' ? 'Inglês' : 'Português')}
              className={`p-1.5 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-zinc-800 text-zinc-600' : 'hover:bg-indigo-50 text-indigo-300'
              }`}
            >
              <ArrowLeftRight className="w-3 h-3" />
            </button>
            <button 
              onClick={() => setChatLang('Inglês')}
              className={`px-5 py-2 text-[10px] font-bold rounded-full transition-all ${
                chatLang === 'Inglês' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-indigo-300 hover:text-indigo-600'
              }`}
            >
              Inglês
            </button>
          </div>

          {/* Actual Input */}
          <div className={`flex items-center gap-2 p-2 rounded-[2.5rem] border transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 ${
            isDarkMode 
              ? 'bg-zinc-900 border-zinc-800 shadow-2xl shadow-black/40 focus-within:border-indigo-500/50' 
              : 'bg-white border-indigo-100 shadow-2xl shadow-indigo-200/50 focus-within:border-indigo-400'
          }`}>
            <button 
              aria-label="Opções de Idioma"
              className={`p-4 transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDarkMode ? 'text-zinc-500 hover:text-indigo-400' : 'text-indigo-300 hover:text-indigo-600'}`}>
              <Languages className="w-5 h-5" />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite aqui..." 
              aria-label="Mensagem do chat"
              className={`flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium outline-none ${
                isDarkMode ? 'text-white placeholder-zinc-700' : 'text-indigo-950 placeholder-indigo-200'
              }`}
            />
            <button 
              onClick={handleSend}
              aria-label="Enviar mensagem"
              className="p-4 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-900/20 hover:bg-indigo-500 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
