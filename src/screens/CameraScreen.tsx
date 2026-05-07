import React, { useRef, useEffect, useState } from 'react';
import { Zap, RefreshCcw, Upload, Loader2, X, Plus, Minus } from 'lucide-react';
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
  const [flashOn, setFlashOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [hasTorch, setHasTorch] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);

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

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;

        if (capabilities.torch) setHasTorch(true);
        if (capabilities.zoom) {
          setHasZoom(true);
          setMinZoom(capabilities.zoom.min || 1);
          setMaxZoom(capabilities.zoom.max || 1);
          setZoom(capabilities.zoom.min || 1);
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  useEffect(() => {
    applyConstraints();
  }, [zoom, flashOn]);

  const applyConstraints = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
      try {
        const constraints: any = {};
        if (hasZoom) constraints.zoom = zoom;
        if (hasTorch) constraints.torch = flashOn;
        
        if (Object.keys(constraints).length > 0) {
          await track.applyConstraints({ advanced: [constraints] } as any);
        }
      } catch (e) {
        console.error("Error applying constraints:", e);
      }
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
    <div className={`flex flex-col items-center h-screen w-full transition-colors relative overflow-hidden bg-black`}>
      {/* Instructional Header */}
      <div className="w-full max-w-md px-6 text-center mt-10 z-20 absolute top-0 pointer-events-none">
        <p className={`text-2xl font-black tracking-tighter mb-2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>Visão em tempo real</p>
        <p className={`text-[10px] px-4 uppercase tracking-[0.3em] font-black text-indigo-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
          Inteligência Traduza.AI
        </p>
      </div>

      <div className={`absolute inset-0 w-full h-full z-10 overflow-hidden`}>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-700 ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Zoom Control Overlay */}
        {hasZoom && isStreaming && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 bg-black/30 backdrop-blur-md p-3 rounded-full z-30">
            <button onClick={() => setZoom(prev => Math.min(maxZoom, prev + 0.1))} className="text-white p-1 hover:bg-white/20 rounded-full transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <div className="h-32 w-1 relative group">
              <input 
                type="range"
                min={minZoom}
                max={maxZoom}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-32 -rotate-90 appearance-none bg-indigo-500/30 rounded-full accent-indigo-500 cursor-pointer"
              />
            </div>
            <button onClick={() => setZoom(prev => Math.max(minZoom, prev - 0.1))} className="text-white p-1 hover:bg-white/20 rounded-full transition-colors">
              <Minus className="w-4 h-4" />
            </button>
          </div>
        )}

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
          <div className="absolute inset-0 pointer-events-none z-20">
            <motion.div 
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 w-full h-1 bg-primary/80 shadow-[0_0_20px_rgba(79,70,229,0.8)]"
            />
            <div className="absolute inset-0 border-[2rem] border-black/10" />
          </div>
        )}

        {/* Floating Action Hint */}
        {isStreaming && !result && !isTranslating && (
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10"
            >
              <p className="text-white text-[10px] font-black uppercase tracking-widest">Toque no botão para traduzir</p>
            </motion.div>
          </div>
        )}

        {/* Translation Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`absolute inset-x-6 bottom-6 p-6 rounded-3xl backdrop-blur-2xl border shadow-2xl z-50 bg-surface-card/90 border-surface-border text-text-main`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Tradução Detectada</span>
                <button onClick={() => setResult(null)} className="p-1 hover:bg-surface rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-lg font-bold leading-tight">{result}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Container */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/40 to-transparent pt-20 pb-12 px-6 flex flex-col items-center gap-8 z-30">
        <div className="flex items-center justify-center gap-10">
          <button 
            onClick={() => setFlashOn(!flashOn)}
            aria-label="Alternar Lanterna"
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-lg active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-white/10 backdrop-blur-xl ${
              flashOn 
                ? 'border-indigo-500 text-indigo-400 shadow-indigo-500/20' 
                : 'border-white/10 text-white hover:text-indigo-400'
            }`}
          >
            <Zap className={`w-5 h-5 ${flashOn ? 'fill-current' : ''}`} />
          </button>
          
          <button 
            onClick={captureFrame}
            disabled={!isStreaming || isTranslating}
            aria-label="Capturar e Traduzir"
            className={`w-28 h-28 rounded-full p-2 shadow-[0_0_50px_rgba(79,70,229,0.3)] active:scale-95 transition-all border border-white/20 bg-white/5 backdrop-blur-2xl group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isTranslating ? 'opacity-50' : ''}`}
          >
            <div className={`w-full h-full rounded-full border-4 border-white/20 flex items-center justify-center transition-colors group-hover:border-primary/50`}>
              <div className={`w-16 h-16 rounded-full bg-primary shadow-2xl shadow-primary/40 group-active:scale-90 transition-transform flex items-center justify-center`}>
                {isTranslating ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <div className="w-8 h-8 rounded-full border-4 border-white/40" />}
              </div>
            </div>
          </button>

          <button 
            onClick={() => {
              stopCamera();
              startCamera();
            }}
            aria-label="Reiniciar Câmera"
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all bg-white/10 border-white/10 text-white hover:text-indigo-400 backdrop-blur-xl`}
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>

        <button 
          aria-label="Carregar foto da galeria"
          className="flex items-center justify-center gap-3 py-4 px-10 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 border bg-white/10 border-white/10 text-white hover:bg-white/20 backdrop-blur-xl">
          <Upload className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          Importar Foto
        </button>
      </div>
    </div>
  );
}
