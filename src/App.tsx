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
      <div className={`flex flex-col h-screen w-full items-center justify-center text-center p-6 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} border p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm relative overflow-hidden`}
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500/20" />
          
          <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 mb-8 shadow-inner border border-zinc-800">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
            >
              <ShieldCheck className="w-12 h-12" />
            </motion.div>
          </div>
          
          <h2 className="text-3xl font-black tracking-tighter mb-4 text-white border-[#f4f4f5]">Privacidade e Controle</h2>
          
          <p className="text-zinc-500 text-sm leading-relaxed mb-10 px-4 font-medium">
            Para que o Traduza.AI funcione corretamente, precisamos da sua permissão para acessar o conteúdo das páginas web. Isso nos permite traduzir textos diretamente no seu navegador.
          </p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={() => setShowPrivacy(false)}
              className="w-full border border-zinc-700 text-zinc-300 font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-colors tracking-tight"
            >
              Ler Diretrizes
            </button>
            <button 
              onClick={() => setShowPrivacy(false)}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-900/20 active:scale-95 transition-all tracking-tight"
            >
              Aceitar
            </button>
          </div>
        </motion.div>
        
        <footer className="mt-12 opacity-20 hover:opacity-40 transition-opacity">
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-zinc-400">© 2026 TRADUZA.AI Technologies</p>
           <div className="flex gap-4 justify-center text-[10px] font-bold text-indigo-400">
              <button className="hover:underline">Privacidade</button>
              <button className="hover:underline">Termos</button>
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
    { id: 'translate', icon: Languages, label: 'Tradução' },
    { id: 'camera', icon: Camera, label: 'Câmera' },
    { id: 'favorites', icon: Star, label: 'Favoritos' },
    { id: 'settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className={`flex flex-col h-screen w-full max-w-4xl mx-auto relative overflow-hidden transition-all duration-300 ${
      isDarkMode 
        ? 'bg-zinc-950 text-zinc-100 shadow-2xl' 
        : 'bg-white text-indigo-950 shadow-2xl shadow-indigo-100'
    } ${!isDarkMode ? 'light' : ''}`}>
      {/* Header */}
      <header className={`px-6 py-4 flex items-center justify-between backdrop-blur-md border-b z-20 ${
        isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/80 border-indigo-100'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Languages className="text-white w-5 h-5" />
          </div>
          <h1 className={`text-xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>Traduza.AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
            isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' : 'bg-indigo-50 border-indigo-200 text-indigo-500 hover:text-indigo-700'
          }`}>
            <Mic className="w-4 h-4" />
          </button>
          <button className={`w-9 h-9 rounded-full border flex items-center justify-center overflow-hidden p-0.5 ${
             isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-indigo-50 border-indigo-200'
          }`}>
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk89C_TOq92N0fpBfb4aSojdkGeNOHPZ0T0OXocgiJrIb7H6mhHjjrC7ValGczPrjnDiR7bgFk1knTe87eHXuo3WrtEUFYeHuk7vq7d-CJxdDQ1hFREuWfpwTYJOgCqUxyLOl444JGc4m6-hHNYtUkY1wLBBNEKXsc9ON8vkyU-KUWpWgn7432R23_AhdmHrmKdxr2yaZCVxto9gxj8kvqSGBYfDGUm5u8JOAG0Pdhnep-6ADMzhVokUhGEvw3Lwtxmn-7jbGU4xo" 
              alt="User"
              className={`w-full h-full rounded-full object-cover transition-opacity ${isDarkMode ? 'grayscale opacity-80' : 'opacity-100'}`}
            />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto relative scrollbar-hide ${isDarkMode ? 'bg-zinc-950/20' : 'bg-zinc-50/30'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className={`px-6 py-3 flex items-center justify-around z-50 border-t transition-all ${
        isDarkMode 
          ? 'bg-zinc-900 border-zinc-800' 
          : 'bg-white border-indigo-100 shadow-[0_-10px_40px_rgba(165,180,252,0.1)]'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id as Screen)}
              className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all duration-300 group relative ${
                isActive 
                  ? 'text-indigo-600' 
                  : isDarkMode 
                    ? 'text-zinc-500 hover:text-zinc-300' 
                    : 'text-indigo-200 hover:text-indigo-500'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-indigo-600/10 scale-110 shadow-lg shadow-indigo-600/5' : 'group-hover:bg-indigo-50/50'
              }`}>
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'opacity-100' : 'opacity-0 scale-90'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
