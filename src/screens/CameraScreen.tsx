import React, { useRef, useEffect, useState } from 'react';
import { Zap, RefreshCcw, Upload, Loader2, X } from 'lucide-react';
import { translateImage } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface CameraScreenProps {
  isDarkMode: boolean;
}

export default function CameraScreen({ isDarkMode }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isTranslating) return;

    setIsTranslating(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      try {
        const translation = await translateImage(base64Image, 'Portuguese');
        setResult(translation);
      } catch (err) {
        console.error(err);
        setResult("Erro ao traduzir. Tente novamente.");
      } finally {
        setIsTranslating(false);
      }
    }
  };

  return (
    <div className={`flex flex-col items-center px-6 h-full flex-1 transition-colors relative overflow-hidden ${
      isDarkMode ? 'bg-zinc-950' : 'bg-indigo-50/20'
    }`}>
      {/* Flash Effect */}
      <AnimatePresence>
        {flash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[100] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Instructional Header */}
      <div className="w-full max-w-md mb-8 text-center mt-6 z-10">
        <p className={`text-2xl font-bold tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>Câmera em tempo real</p>
        <p className={`text-xs px-4 uppercase tracking-[0.2em] font-bold ${
          isDarkMode ? 'text-zinc-500' : 'text-indigo-400'
        }`}>
          Visão Inteligente Traduza.AI
        </p>
      </div>

      <div className={`relative w-full aspect-[3/4] max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl group border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-indigo-100'
      }`}>
        {/* Real Camera Feed */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          className={`w-full h-full object-cover transition-opacity ${
            isDarkMode ? 'grayscale' : 'grayscale-0'
          } ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {!isStreaming && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-red-500 font-bold text-sm mb-4">{error}</p>
            <button 
              onClick={startCamera}
              className="px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning Animation */}
        {isStreaming && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full border-[2rem] border-zinc-950/20" />
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20"
            />
          </div>
        )}

        {/* Translation Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`absolute inset-x-6 bottom-6 p-6 rounded-3xl backdrop-blur-2xl border shadow-2xl z-50 ${
                isDarkMode ? 'bg-zinc-900/90 border-zinc-700 text-white' : 'bg-white/90 border-indigo-100 text-indigo-950'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Tradução Detectada</span>
                <button onClick={() => setResult(null)} className="p-1 hover:bg-black/5 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-lg font-bold leading-tight">{result}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-10 w-full max-w-md flex flex-col items-center gap-8 pb-10 z-10">
        <div className="flex items-center justify-center gap-10">
          <button className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-lg active:scale-90 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'bg-white border-indigo-100 text-indigo-400 hover:bg-indigo-50'
          }`}>
            <Zap className="w-5 h-5" />
          </button>
          
          <button 
            onClick={captureFrame}
            disabled={!isStreaming || isTranslating}
            className={`w-24 h-24 rounded-full p-2 shadow-2xl active:scale-95 transition-all border group relative ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-indigo-100'
            } ${isTranslating ? 'opacity-50' : ''}`}
          >
            <div className={`w-full h-full rounded-full border-4 flex items-center justify-center transition-colors ${
              isDarkMode ? 'border-zinc-800 group-hover:border-indigo-500/50' : 'border-indigo-50 group-hover:border-indigo-200'
            }`}>
              <div className={`w-16 h-16 rounded-full bg-indigo-600 shadow-xl shadow-indigo-500/30 group-active:scale-90 transition-transform flex items-center justify-center`}>
                {isTranslating && <Loader2 className="w-8 h-8 text-white animate-spin" />}
              </div>
            </div>
          </button>

          <button 
            onClick={() => {
              stopCamera();
              startCamera();
            }}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-lg active:scale-90 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'bg-white border-indigo-100 text-indigo-400 hover:bg-indigo-50'
            }`}
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>

        <button className={`flex items-center justify-center gap-3 py-5 px-12 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 shadow-xl group border ${
           isDarkMode 
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800' 
            : 'bg-white border-indigo-100 text-indigo-900 hover:bg-indigo-50 shadow-indigo-200/50'
        }`}>
          <Upload className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          Inserir Foto
        </button>
      </div>
    </div>
  );
}
