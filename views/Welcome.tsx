
import React, { useState, useEffect } from 'react';
import { Search, Zap, ChevronRight, ShieldCheck, Briefcase } from 'lucide-react';
import { Category } from '../types';
import * as LucideIcons from 'lucide-react';

interface Props {
  direction?: 'forward' | 'backward';
  categories: Category[];
  onLogin: () => void;
  onEnterAsGuest: () => void;
  onContactAdmin: () => void;
  onBack: () => void;
  isDarkMode: boolean;
  t: any;
}

const Welcome: React.FC<Props> = ({ direction = 'forward', categories, onLogin, onEnterAsGuest, onContactAdmin, onBack, isDarkMode, t }) => {
  const [logoAnim, setLogoAnim] = useState(false);
  const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';

  const triggerLogoAnim = () => {
    if (logoAnim) return;
    setLogoAnim(true);
    setTimeout(() => setLogoAnim(false), 1200);
  };

  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    subtext: isDarkMode ? 'text-white/80' : 'text-slate-500',
    shadowPrimary: isDarkMode ? 'dark-shadow-primary' : 'shadow-xl shadow-blue-500/10',
    shadowSecondary: isDarkMode ? 'dark-shadow-secondary' : 'shadow-lg shadow-slate-200'
  };

  // Helper para obtener iconos
  const getIcon = (name: string, size = 24) => {
    if (name === 'Broom') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-sparkles"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
        </svg>
      );
    }
    const IconComponent = (LucideIcons as any)[name];
    if (!IconComponent) return null;
    return <IconComponent size={size} strokeWidth={1.5} />;
  };

  // Definición de Colores Dinámicos
  const primaryColor = isDarkMode ? '#59CBC8' : '#00D1FF';
  const primaryBgAlpha = isDarkMode ? 'bg-[#59CBC8]/10' : 'bg-[#00D1FF]/10';
  const primaryTextClass = isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]';
  const primaryBgClass = isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]';

  return (
    <div className={`flex-1 flex flex-col justify-around items-center h-full w-full relative overflow-hidden transition-all duration-500 ${theme.bg} ${animClass} p-8 pt-16 ios-safe-pt ios-safe-pb`}>

      {/* BACKGROUND EFFECTS CREATIVO - ICONOS FLOTANTES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">

        {/* Gradiente sutil de fondo */}
        <div className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[${primaryColor}]/10 via-transparent to-transparent opacity-60`}></div>

        {/* Malla de Iconos Flotantes - Columnas Laterales Ordenadas */}
        {categories.slice(0, 10).map((cat, i) => {
          // Distribución en dos columnas fijas
          const isLeft = i % 2 === 0;

          // Posicionamiento vertical ordenado (20% de separación entre iconos)
          const verticalIndex = Math.floor(i / 2);
          const top = (verticalIndex * 18) + 10;

          // Posiciones horizontales fijas para evitar solapamiento con el centro
          // Izquierda fija en 4% | Derecha fija en 4% (usando right)

          const delay = i * 0.5;
          const duration = 15 + (i % 5);
          const size = 50 + (i % 3) * 10; // Tamaños más pequeños y controlados: 50, 60, 70
          const rotation = isLeft ? -15 : 15; // Rotación sutil y ordenada
          const colorClass = isLeft ? primaryTextClass : 'text-[#FFB800]';

          return (
            <div
              key={cat.id}
              className={`absolute opacity-30 ${colorClass} animate-float-slow`}
              style={{
                top: `${top}%`,
                left: isLeft ? '4%' : undefined,
                right: !isLeft ? '4%' : undefined,
                transform: `rotate(${rotation}deg)`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            >
              {getIcon(cat.icon, size)}
            </div>
          );
        })}
      </div>

      {/* HERO SECTION - CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
        <div className="text-center w-full px-10 mb-8">
          <h1 className={`text-[42px] md:text-[50px] font-[1000] ${theme.text} leading-[0.85] tracking-[-0.08em] uppercase drop-shadow-sm`}>
            {t.welcome_title_1}<br />
            {t.welcome_title_2}<br />
            <span className={primaryTextClass}>{t.welcome_title_3}</span>
          </h1>
        </div>

        <button
          onClick={triggerLogoAnim}
          className="relative group outline-none perspective-1000 mb-2"
        >
          <div className={`
            absolute inset-[-50%] ${primaryBgAlpha} rounded-full blur-[60px] transition-all duration-1000 ease-out
            ${logoAnim ? 'scale-125 opacity-60 blur-[80px]' : 'scale-100 opacity-20'}
          `}></div>

          <div className={`
            w-40 h-40 flex items-center justify-center relative z-20 
            transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${logoAnim ? 'animate-[ethereal-focus_1.2s_forwards] scale-105' : 'active:scale-95'}
          `}>
            {/* LOGO CS IMAGE */}
            <img
              src="/logo-new.png"
              alt="Conexión Servicios Logo"
              className={`relative z-10 w-full h-full object-contain rounded-[35px] transition-transform duration-1000 ${logoAnim ? 'rotate-[360deg]' : ''}`}
            />
          </div>
        </button>
      </div>

      {/* BLOQUE DE ACCIÓN */}
      <div className="w-full flex-initial space-y-4 relative z-10 flex flex-col items-center">
        <div className="text-center w-full px-10 mb-2 mt-4">
          <div className="flex flex-col items-center gap-2 animate-slide-up opacity-90">
            <div className={`h-[2px] w-8 ${primaryBgClass} rounded-full opacity-50 mb-1`}></div>

            <p className={`${theme.subtext} font-black text-[11px] uppercase tracking-[3px] leading-tight max-w-[260px]`}>
              {t.welcome_network_1}
            </p>
            <p className={`${primaryTextClass} font-black text-[13px] uppercase tracking-[2px] leading-tight whitespace-nowrap`}>
              {t.welcome_network_2}
            </p>
          </div>
        </div>

        <button
          onClick={onEnterAsGuest}
          className={`w-full max-w-sm h-16 ${primaryBgClass} text-[#0F172A] rounded-full active:scale-[0.97] transition-all flex items-center px-4 group relative overflow-hidden ${theme.shadowPrimary}`}
        >
          <div className="w-11 h-11 flex items-center justify-center shrink-0 h-full aspect-square">
            <Search size={24} strokeWidth={3} />
          </div>

          <div className="flex-1 text-center -ml-4 pr-11">
            <span className="block text-[15px] tracking-[0.5px] font-[1000] uppercase leading-none">{t.welcome_search_1}</span>
            <span className="block text-[12px] tracking-[1px] font-black uppercase leading-none mt-1 opacity-70">{t.welcome_search_2}</span>
          </div>

          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-40">
            <ChevronRight size={20} strokeWidth={4} />
          </div>
        </button>

        <button
          onClick={onContactAdmin}
          className={`w-full max-w-sm h-16 bg-[#F97316] text-white rounded-full active:scale-[0.97] transition-all flex items-center px-4 group relative overflow-hidden shadow-[0_10px_30px_rgba(249,115,22,0.25)] dark:shadow-[0_10px_30px_rgba(249,115,22,0.15)]`}
        >
          <div className="w-11 h-11 flex items-center justify-center shrink-0 h-full aspect-square">
            <Briefcase size={24} strokeWidth={3} />
          </div>

          <div className="flex-1 text-center -ml-4 pr-11">
            <span className="block text-[15px] tracking-[0.5px] font-[1000] uppercase leading-none">{t.welcome_publish_1}</span>
            <span className="block text-[12px] tracking-[1px] font-black uppercase leading-none mt-1 opacity-70">{t.welcome_publish_2}</span>
          </div>

          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-40">
            <ChevronRight size={20} strokeWidth={4} />
          </div>
        </button>

        <div className="mt-8 flex flex-col items-center gap-6 w-full pb-4">


          <div className="flex flex-col items-center gap-1.5 opacity-40 mt-2">
            <ShieldCheck size={14} className={primaryTextClass} />
            <p className={`text-[9px] font-black uppercase tracking-[4px] ${theme.text} text-center`}>
              {t.welcome_guaranteed}
            </p>
          </div>
          <div className={`h-1 w-8 ${primaryBgClass}/20 rounded-full`}></div>
        </div>
      </div>

      <style>{`
        @keyframes ethereal-focus {
          0% { transform: scale(1); }
          40% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1200px;
        }
      `}</style>
    </div>
  );
};

export default Welcome;
