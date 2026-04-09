import React, { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Wifi, WifiOff, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  onComplete?: () => void;
  isReady?: boolean;
}

const Splash: React.FC<Props> = ({ onComplete, isReady = true }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animación de puntos suspensivos
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    let checkTimeout: NodeJS.Timeout;

    const startConnectionCheck = async () => {
      // Timeout de 15 segundos para error de red
      checkTimeout = setTimeout(() => {
        setStatus('error');
      }, 15000);

      const checkCurrentStatus = async () => {
        const networkStatus = await Network.getStatus();
        if (networkStatus.connected) {
          handleConnected();
        }
      };

      checkCurrentStatus();

      const listener = await Network.addListener('networkStatusChange', (s) => {
        if (s.connected) {
          handleConnected();
        } else {
          setStatus('connecting');
        }
      });

      return listener;
    };

    const handleConnected = () => {
      if (checkTimeout) clearTimeout(checkTimeout);
      setStatus('connected');
    };

    const networkListenerPromise = startConnectionCheck();

    return () => {
      clearInterval(dotsInterval);
      if (checkTimeout) clearTimeout(checkTimeout);
      networkListenerPromise.then(l => l.remove());
    };
  }, []);

  // Completion logic: wait for BOTH network connection AND auth readiness
  useEffect(() => {
    if (status === 'connected' && isReady) {
      const transitionTimeout = setTimeout(() => {
        if (onComplete) onComplete();
      }, 800);
      return () => clearTimeout(transitionTimeout);
    }
  }, [status, isReady, onComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden">
      {/* Background Dial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square bg-[radial-gradient(circle,_rgba(89,203,200,0.15)_0%,_transparent_70%)] pointer-events-none animate-pulse"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative group">
          <div className="absolute inset-[-40px] border border-white/5 rounded-[60px] animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute inset-[-20px] border border-white/10 rounded-[50px] animate-[spin_15s_linear_infinite_reverse]"></div>

          <div className="w-48 h-48 bg-white rounded-[45px] shadow-[0_0_100px_rgba(255,255,255,0.1)] flex items-center justify-center animate-pop-in relative">
            {/* LOGO CS IMAGE */}
            <img
              src="/logo-new.png"
              alt="Conexión Servicios Logo"
              className="w-full h-full object-contain p-1 rounded-[35px]"
            />
          </div>
        </div>

        <div className="mt-20 text-center animate-slide-up">
          <h1 className="text-white text-[40px] font-[1000] tracking-[-0.05em] leading-[0.9] select-none uppercase mb-2 text-glow">
            CONEXIÓN<br />
            <span className="text-[#59CBC8]">SERVICIOS</span>
          </h1>
          <p className="text-white/60 text-[10px] font-black tracking-[8px] uppercase">RED PROFESIONAL 2026</p>
        </div>
      </div>

      {/* CONNECTION STATUS AREA */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center px-10 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className={`
          flex items-center justify-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl border transition-all duration-500
          ${status === 'connecting' ? 'bg-white/5 border-white/10' : ''}
          ${status === 'connected' ? 'bg-green-500/10 border-green-500/30' : ''}
          ${status === 'error' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : ''}
        `}>
          {status === 'connecting' && (
            <>
              <Loader2 size={16} className="text-[#59CBC8] animate-spin" />
              <span className="text-[10px] font-black text-white/80 uppercase tracking-[2px] text-center">
                Conectándose con la red{dots}
              </span>
            </>
          )}

          {status === 'connected' && (
            <>
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-[10px] font-black text-green-400 uppercase tracking-[2px] text-center">
                Conectado exitosamente
              </span>
            </>
          )}

          {status === 'error' && (
            <>
              <WifiOff size={16} className="text-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-[2px] text-center">
                No se ha podido conectar a la red
              </span>
            </>
          )}
        </div>

        {status === 'error' && (
          <p className="mt-4 text-[9px] text-white/40 font-bold uppercase tracking-widest text-center max-w-[200px] leading-relaxed">
            Verifica tu conexión para continuar con el servicio
          </p>
        )}
      </div>

      {/* DECORATIVE ELEMENTS */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#59CBC8]/5 rounded-full blur-[80px]"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]"></div>
    </div>
  );
};

export default Splash;
