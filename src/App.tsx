import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  Languages, 
  Camera, 
  Star, 
  Settings, 
  Mic, 
  User,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import TranslateScreen from './screens/TranslateScreen';
import CameraScreen from './screens/CameraScreen';
import ChatScreen from './screens/ChatScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';

type Screen = 'chat' | 'translate' | 'camera' | 'favorites' | 'settings';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('translate');
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState('Português (BR)');

  if (showPrivacy) {
    return (
      <div className={`flex flex-col h-screen w-full items-center justify-center text-center p-6 ${isDarkMode ? 'bg-surface text-white' : 'bg-white text-zinc-900'}`}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${isDarkMode ? 'bg-surface-card border-white/5' : 'bg-zinc-50 border-zinc-200'} border p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center max-w-sm relative overflow-hidden ai-glow`}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-indigo-500/50" />
          
          <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-400 mb-10 shadow-inner border border-white/5 mesh-gradient">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 10, scale: 1.1 }}
              transition={{ repeat: Infinity, duration: 4, repeatType: 'reverse', ease: "easeInOut" }}
            >
              <ShieldCheck className="w-12 h-12" />
            </motion.div>
          </div>
          
          <h2 className="text-4xl font-black tracking-tighter mb-6 bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">Privacidade Traduza.AI</h2>
          
          <p className="text-text-muted text-sm leading-relaxed mb-12 px-2 font-medium">
            O Traduza.AI requer acesso inteligente para processar e traduzir conteúdos em tempo real. Seus dados são protegidos e usados apenas para melhorar sua experiência.
          </p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={() => setShowPrivacy(false)}
              className="w-full bg-white/5 border border-white/10 text-text-muted font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl hover:bg-white/10 transition-all"
            >
              Diretrizes de Uso
            </button>
            <button 
              onClick={() => setShowPrivacy(false)}
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-95 transition-all tracking-tight hover:bg-indigo-500"
            >
              Aceitar e Começar
            </button>
          </div>
        </motion.div>
        
        <footer className="mt-12 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3 text-text-muted">© 2026 TRADUZA.AI</p>
           <div className="flex gap-6 justify-center text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60">
              <button className="hover:text-indigo-400">Privacidade</button>
              <button className="hover:text-indigo-400">Termos</button>
           </div>
        </footer>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'chat': return <ChatScreen isDarkMode={isDarkMode} />;
      case 'translate': return <TranslateScreen defaultLanguage={defaultLanguage} isDarkMode={isDarkMode} />;
      case 'camera': return <CameraScreen isDarkMode={isDarkMode} />;
      case 'favorites': return (
        <FavoritesScreen 
          defaultLanguage={defaultLanguage} 
          onSetDefaultLanguage={setDefaultLanguage} 
          isDarkMode={isDarkMode}
        />
      );
      case 'settings': return (
        <SettingsScreen 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          defaultLanguage={defaultLanguage} 
        />
      );
      default: return <TranslateScreen defaultLanguage={defaultLanguage} isDarkMode={isDarkMode} />;
    }
  };

  const navItems = [
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'translate', icon: Languages, label: 'Traduzir' },
    { id: 'camera', icon: Camera, label: 'Câmera' },
    { id: 'favorites', icon: Star, label: 'Favoritos' },
    { id: 'settings', icon: Settings, label: 'Opções' },
  ];

  return (
    <div className={`flex flex-col h-screen w-full max-w-4xl mx-auto relative overflow-hidden transition-all duration-700 bg-surface text-text-main shadow-2xl ${
      !isDarkMode ? 'light shadow-indigo-100/50' : ''
    }`}>
      {/* Header */}
      <header className={`px-6 py-5 flex items-center justify-between z-20 glass ${
        isDarkMode ? 'shadow-[0_1px_0_rgba(255,255,255,0.03)]' : 'shadow-[0_1px_0_rgba(99,102,241,0.05)]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-[0_8px_20px_rgba(79,70,229,0.4)]">
            <Languages className="text-white w-5 h-5" />
          </div>
          <h1 className={`text-2xl font-black tracking-tighter bg-gradient-to-br ${isDarkMode ? 'from-white to-white/40' : 'from-indigo-950 to-indigo-950/60'} bg-clip-text text-transparent`}>Traduza.AI</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            aria-label="Ativar Comando de Voz"
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            isDarkMode ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white focus-visible:ring-offset-zinc-950 hover:bg-white/10' : 'bg-indigo-50 border-indigo-200 text-indigo-500 hover:text-indigo-700 focus-visible:ring-offset-white'
          }`}>
            <Mic className="w-4 h-4" />
          </button>
          <button 
            aria-label="Meu Perfil"
            className={`w-10 h-10 rounded-full border flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
             isDarkMode ? 'bg-white/5 border-white/10 text-zinc-400 focus-visible:ring-offset-zinc-950 hover:bg-white/10' : 'bg-indigo-50 border-indigo-200 text-indigo-500 focus-visible:ring-offset-white'
          }`}>
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main 
        id="main-content"
        className={`flex-1 overflow-y-auto relative scrollbar-hide mesh-gradient ${isDarkMode ? 'bg-surface/50' : 'bg-zinc-50/30'}`}
      >
        <AnimatePresence mode="wait text-indigo-400">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="h-full focus:outline-none"
            tabIndex={-1}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav 
        aria-label="Navegação Central"
        className={`px-8 py-4 flex items-center justify-around z-50 transition-all border-t ${
        isDarkMode 
          ? 'bg-surface/80 backdrop-blur-2xl border-white/5' 
          : 'bg-white/80 backdrop-blur-2xl border-indigo-100'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id as Screen)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-2 py-1 px-4 rounded-2xl transition-all duration-300 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                isDarkMode ? 'focus-visible:ring-offset-zinc-950' : 'focus-visible:ring-offset-white'
              } ${
                isActive 
                  ? isDarkMode ? 'text-white' : 'text-indigo-600' 
                  : isDarkMode 
                    ? 'text-zinc-500 hover:text-zinc-300' 
                    : 'text-indigo-200 hover:text-indigo-500'
              }`}
            >
              <div className={`p-2.5 rounded-2xl transition-all duration-500 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.4)] scale-110' 
                  : isDarkMode 
                    ? 'group-hover:bg-white/5 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]' 
                    : 'group-hover:bg-indigo-50/80'
              }`}>
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'} ${!isActive && isDarkMode ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]' : ''}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                isActive ? 'opacity-100 translate-y-0' : 'opacity-0 scale-90 translate-y-1 group-hover:opacity-40 group-hover:translate-y-0'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-2 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
