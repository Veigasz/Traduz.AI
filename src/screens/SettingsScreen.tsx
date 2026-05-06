import React, { useState } from 'react';
import { 
  Globe, 
  ChevronRight, 
  Sun,
  Moon,
  ToggleRight, 
  ToggleLeft,
  Bell, 
  Trash2,
  ShieldCheck,
  Languages,
  Volume2,
  Zap,
  Clock,
  HelpCircle,
  LogOut,
  ChevronDown,
  User
} from 'lucide-react';

interface SettingsScreenProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  defaultLanguage: string;
}

export default function SettingsScreen({ isDarkMode, setIsDarkMode, defaultLanguage }: SettingsScreenProps) {
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className={`min-h-screen pb-20 transition-colors ${isDarkMode ? 'bg-surface' : 'bg-surface'}`}>
      <div className="px-6 py-10 space-y-8 max-w-md mx-auto">
        
        {/* User Profile Section */}
        <section className={`p-6 rounded-[2.5rem] border transition-all flex items-center gap-5 ai-glow ${
          isDarkMode ? 'bg-surface-card border-white/5' : 'bg-surface-card border-slate-200'
        }`}>
          <div className="relative">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 border-indigo-500/30 ${isDarkMode ? 'bg-white/5' : 'bg-indigo-50'}`}>
              <User className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-surface rounded-full" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black tracking-tight">Gustavo Lima</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Membro Premium</p>
          </div>
          <button className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/5 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}>
            <ChevronDown className="w-5 h-5" />
          </button>
        </section>

        {/* Appearance Settings */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Preferências de Interface</h3>
          <div className={`p-4 rounded-[2.5rem] border ${isDarkMode ? 'bg-surface-card border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`flex p-1 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
              <button 
                onClick={() => setIsDarkMode(false)}
                className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-sm transition-all ${
                  !isDarkMode 
                    ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sun className={`w-4 h-4 ${!isDarkMode ? 'text-orange-500' : ''}`} />
                Modo Claro
              </button>
              <button 
                onClick={() => setIsDarkMode(true)}
                className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-sm transition-all ${
                  isDarkMode 
                    ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' 
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-white'
                }`}
              >
                <Moon className={`w-4 h-4 ${isDarkMode ? 'text-indigo-200' : ''}`} />
                Modo Dark
              </button>
            </div>
          </div>
        </div>

        {/* Other System Settings */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Personalização de Sistema</h3>
          <div className={`rounded-[2.5rem] border overflow-hidden ${isDarkMode ? 'bg-surface-card border-white/5' : 'bg-white border-slate-200'}`}>
            <button 
              className={`w-full p-6 transition-all flex items-center justify-between group border-b ${isDarkMode ? 'border-white/5 hover:bg-white/[0.02]' : 'border-slate-100 hover:bg-slate-50'}`}
              onClick={() => setNotifications(!notifications)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold tracking-tight text-sm">Notificações</p>
                  <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">Alertas e Dicas de IA</p>
                </div>
              </div>
              {notifications ? <ToggleRight className="w-8 h-8 text-indigo-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Translation Engine Settings */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Motor de Tradução</h3>
          <div className={`rounded-[2.5rem] border overflow-hidden ${isDarkMode ? 'bg-surface-card border-white/5' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold tracking-tight text-sm">Velocidade da Voz</p>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">{voiceSpeed.toFixed(1)}x Reprodução</p>
                  </div>
                </div>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1" 
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-indigo-500/20 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button 
              className={`w-full p-6 transition-all flex items-center justify-between group ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
              onClick={() => setAutoTranslate(!autoTranslate)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold tracking-tight text-sm">Auto-Traduzir</p>
                  <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">Processamento Instantâneo</p>
                </div>
              </div>
              {autoTranslate ? <ToggleRight className="w-8 h-8 text-indigo-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted ml-4">Dados e Segurança</h3>
          <div className="grid grid-cols-1 gap-3">
             <button className={`w-full p-5 rounded-3xl border flex items-center justify-between transition-all group ${
               isDarkMode ? 'bg-surface-card border-white/5 hover:bg-white/[0.02]' : 'bg-white border-slate-200 hover:bg-slate-50'
             }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">Limpar Histórico</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
             </button>

             <button className={`w-full p-5 rounded-3xl border flex items-center justify-between transition-all group ${
               isDarkMode ? 'bg-surface-card border-white/5 hover:bg-white/[0.02]' : 'bg-white border-slate-200 hover:bg-slate-50'
             }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">Suporte e Ajuda</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
             </button>

             <button className={`w-full p-5 rounded-3xl border flex items-center justify-between transition-all group ${
               isDarkMode ? 'bg-surface-card border-white/5 hover:bg-red-500/5' : 'bg-white border-slate-200 hover:bg-red-50'
             }`}>
                <div className="flex items-center gap-4 text-red-500">
                  <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-red-500/10' : 'bg-red-100'}`}>
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">Sair da Conta</span>
                </div>
             </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-10 pb-4 text-center space-y-4">
          <div className="flex flex-col items-center gap-2 opacity-30">
            <Languages className="w-6 h-6 text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Traduza.AI Neural Core v2.5.4</p>
          </div>
        </div>

      </div>
    </div>
  );
}

