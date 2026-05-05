import React from 'react';
import { 
  ArrowLeft, 
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
  ArrowDown
} from 'lucide-react';

interface SettingsScreenProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  defaultLanguage: string;
}

export default function SettingsScreen({ isDarkMode, setIsDarkMode, defaultLanguage }: SettingsScreenProps) {
  return (
    <div className={`min-h-screen pb-10 transition-colors ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
      <div className="px-6 py-10 space-y-10 max-w-md mx-auto">
        {/* Profile Card / Title */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-surface-card rounded-[2rem] border border-surface-border flex items-center justify-center p-1 shadow-2xl mb-6">
            <div className="w-full h-full bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500">
              <Globe className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tighter">Configurações</h2>
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-center">Personalize sua experiência</p>
        </div>

        {/* Theme Settings */}
        <section className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Aparência</h3>
           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className={`w-full p-6 rounded-3xl border shadow-xl transition-all flex items-center justify-between group ${
               isDarkMode ? 'bg-surface-card border-surface-border hover:border-indigo-500/30' : 'bg-white border-indigo-100 hover:border-indigo-300'
             }`}
           >
             <div className="flex items-center gap-5">
               <div className={`w-12 h-12 border rounded-2xl flex items-center justify-center text-indigo-500 ${
                 isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-indigo-50 border-indigo-100'
               }`}>
                  {isDarkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
               </div>
               <div className="text-left">
                 <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Modo de Exibição</p>
                 <p className="font-bold tracking-tight">{isDarkMode ? 'Modo Escuro' : 'Modo Claro'}</p>
               </div>
             </div>
             {isDarkMode ? <ToggleRight className="w-8 h-8 text-indigo-500" /> : <ToggleLeft className="w-8 h-8 text-indigo-400" />}
           </button>
        </section>

        {/* Language Settings */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Idioma Padrão</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className={`p-6 rounded-3xl border shadow-xl transition-all flex items-center justify-between group cursor-pointer ${
              isDarkMode ? 'bg-surface-card border-surface-border hover:border-indigo-500/30' : 'bg-white border-indigo-100 hover:border-indigo-300'
            }`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 border rounded-2xl flex items-center justify-center text-indigo-500 ${
                  isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-indigo-50 border-indigo-100'
                }`}>
                  <Languages className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Saída</p>
                  <p className="font-bold tracking-tight">{defaultLanguage}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-indigo-500 transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
        </section>

        {/* Stats / Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`border p-6 rounded-3xl flex flex-col justify-between h-32 transition-colors ${
            isDarkMode ? 'bg-surface-card border-surface-border hover:bg-zinc-800' : 'bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50'
          }`}>
             <ArrowDown className="w-5 h-5 text-indigo-500" />
             <div>
               <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Backup</p>
               <p className="font-bold text-sm tracking-tight text-text-main">Ativado</p>
             </div>
          </div>
          <div className="bg-indigo-600 p-6 rounded-3xl flex flex-col justify-between h-32 shadow-xl shadow-indigo-900/20 group cursor-pointer">
             <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
               <ShieldCheck className="w-3 h-3 text-white" />
             </div>
             <div>
               <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Acesso</p>
               <p className="font-bold text-sm text-white tracking-tight uppercase">Premium</p>
             </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-6 pt-6 text-center">
          <button className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-bold text-sm hover:bg-indigo-500 transition-all shadow-xl active:scale-95 tracking-tight">
            Exportar Dados
          </button>
          
          <div className="flex flex-col items-center gap-3 opacity-20 hover:opacity-50 transition-opacity">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Protocolo Traduza v2.1.0</span>
            </div>
            <p className="text-[10px] font-mono tracking-tighter">SECURE • ENCRYPTED • GLOBAL</p>
          </div>
        </div>
      </div>
    </div>
  );
}

