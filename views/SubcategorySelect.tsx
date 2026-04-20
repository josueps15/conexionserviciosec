
import React from 'react';
import { Category } from '../types';
import { ArrowLeft, ChevronRight, Sparkles, Search, Rocket, Layers, MousePointerClick, ChevronDown } from 'lucide-react';
import * as Icons from 'lucide-react';

interface Props {
  direction?: 'forward' | 'backward';
  category: Category;
  isDarkMode: boolean;
  onBack: () => void;
  onSelectSubcategory: (subcategory: string) => void;
  onOpenSearch?: () => void;
  onContactAdmin: () => void;
  t: any;
}

const SubcategorySelect: React.FC<Props> = ({
  direction = 'forward', category, isDarkMode, onBack, onSelectSubcategory, onOpenSearch, onContactAdmin, t
}) => {
  const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';

  // Tema unificado con Favorites.tsx para consistencia visual
  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    headerBg: isDarkMode
      ? 'bg-gradient-to-br from-[#59CBC8] via-[#2DD4BF] to-[#59CBC8]'
      : 'bg-[#00D1FF]',
    card: isDarkMode ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-white border-slate-200/50 shadow-sm',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    subtext: isDarkMode ? 'text-white/60' : 'text-slate-500',
    input: isDarkMode ? 'bg-[#0a0f1e] border-white/10' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50',
    shadowPrimary: isDarkMode ? 'dark-shadow-primary' : 'shadow-xl shadow-blue-500/10'
  };

  const getIcon = (name: string, size = 24, className = "") => {
    const LucideIcon = (Icons as any)[name];
    return LucideIcon ? <LucideIcon size={size} className={className} /> : <Icons.HelpCircle size={size} className={className} />;
  };

  // Lógica para ajustar el tamaño de la fuente según la longitud del nombre
  const getTitleFontSize = (text: string) => {
    const len = text.length;
    // Nombres cortos (ej: SALUD)
    if (len < 8) return "text-[40px] xs:text-[48px]";
    // Nombres medios (ej: AUTOMOTRIZ, TECNOLOGÍA)
    if (len < 12) return "text-[32px] xs:text-[40px]";
    // Nombres largos (ej: SALA DE EVENTOS)
    if (len < 18) return "text-[26px] xs:text-[32px]";
    // Nombres muy largos
    return "text-[22px] xs:text-[26px]";
  };

  return (
    <div className={`flex-1 flex flex-col relative overflow-y-auto h-full w-full transition-colors duration-700 hide-scrollbar ${theme.bg} ${animClass}`}>

      {/* CABECERA (Estilo Guardados) */}
      <div className="relative w-full shrink-0 mb-8 z-40">
        <div className={`relative ${theme.headerBg} pt-10 pb-10 rounded-b-[40px] ${theme.shadowPrimary} border-b ${isDarkMode ? 'border-white/20' : 'border-white/40'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
          <header className="px-8 flex flex-col relative z-10">
            <div className="flex items-center justify-between mb-4">
              <button onClick={onBack} className={`rounded-2xl flex items-center justify-center transition-all active:scale-90 border w-12 h-12 ${isDarkMode ? 'border-white/50 bg-white shadow-lg' : 'border-white/60 bg-white shadow-xl'}`}>
                <ArrowLeft size={20} className="text-slate-900" strokeWidth={3} />
              </button>

              <h1 className="text-[14px] xs:text-[16px] font-[1000] tracking-tighter italic leading-none select-none whitespace-nowrap">
                <span className="text-[#0f172a] drop-shadow-sm">CONEXIÓN </span>
                <span className="text-white drop-shadow-md">SERVICIOS</span>
              </h1>

              <div className="bg-white/90 rounded-2xl flex items-center justify-center shadow-md border border-white w-12 h-12">
                {getIcon(category?.icon || 'HelpCircle', 20, "text-[#0F172A]")}
              </div>
            </div>

            <div className="flex flex-col items-center px-2 w-full text-center">
              {/* Etiqueta Píldora */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/40 bg-white shadow-sm">
                <Layers size={10} className="text-slate-900" strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-900/80">{t?.sub_explore_branch || 'EXPLORAR'}</span>
              </div>

              {/* TÍTULO RESPONSIVE: Se eliminó truncate, se agregó break-words y tamaño dinámico */}
              <h2 className={`${getTitleFontSize(t?.[`cat_${category?.id}`] || category?.name || '')} font-[1000] uppercase tracking-tighter text-slate-900 drop-shadow-md leading-[0.9] w-full break-words whitespace-normal text-center`}>
                {t?.[`cat_${category?.id}`] || category?.name || 'Categoría'}
              </h2>

              {/* Instrucción Estilizada */}
              {/* Instrucción Estilizada - Icono centrado debajo */}
              <div className="mt-4 flex flex-col items-center justify-center gap-2 opacity-70">
                <p className="text-slate-900 font-bold text-[10px] uppercase tracking-[3px] text-center">{t?.sub_select_specialty || 'SELECCIONE UNA ESPECIALIDAD'}</p>
              </div>
            </div>
          </header>

          <div className="absolute -bottom-6 left-0 right-0 px-8 z-50 pointer-events-none">
            <button
              onClick={() => {
                onOpenSearch && onOpenSearch();
              }}
              className={`flex items-center w-full h-14 px-6 rounded-[26px] ${theme.input} active:scale-[0.98] transition-all duration-300 text-left pointer-events-auto`}
            >
              <Search className={`${isDarkMode ? 'text-[#00E7DB]' : 'text-[#0F172A]/40'} mr-4`} size={18} strokeWidth={3} />
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white/40' : 'text-[#0F172A]/30'}`}>{t.home_search_placeholder}</span>
              {/* Marca visual temporal para confirmar actualización */}
              <div className="ml-auto opacity-20 text-[6px]">v2</div>
            </button>
          </div>

          {/* Animated Arrow */}
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="animate-bounce">
              <ChevronDown size={32} className={`${isDarkMode ? 'text-[#00E7DB]' : 'text-slate-400'}`} strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-10 transition-all duration-500 pt-8 space-y-4 relative z-10 flex-1">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Sparkles size={14} className="text-[#00E7DB]" />
          <span className={`text-[10px] font-black uppercase tracking-[4px] ${theme.subtext}`}>{t.sub_available_zone}</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(category?.subcategories || []).map((sub, i) => {
            const config = category?.subcategoryConfig?.[sub];
            const hasBg = !!config?.bgImage;
            return (
            <button key={sub} onClick={() => onSelectSubcategory(sub)} style={{ animationDelay: `${i * 0.05}s` }} className={`w-full group h-28 px-8 overflow-hidden rounded-[40px] border flex items-center justify-center active:scale-[0.97] transition-all animate-slide-up shadow-lg relative ${theme.card} hover:border-[#00E7DB]/40`}>
              {hasBg && (
                <div className="absolute inset-0 z-0 bg-black">
                  <img src={config.bgImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ opacity: config.bgOpacity ?? 0.6, objectPosition: config.bgPosition || 'center' }} alt={sub} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/80 pointer-events-none"></div>
                </div>
              )}
              <div className="absolute left-6 w-12 h-12 bg-[#00E7DB]/20 backdrop-blur-md rounded-full flex items-center justify-center text-[#00E7DB] border border-[#00E7DB]/50 group-hover:scale-110 transition-transform z-10 shadow-[0_0_15px_rgba(0,231,219,0.3)]">{getIcon(category?.icon || 'HelpCircle', 20)}</div>
              <span className={`text-[16px] font-[1000] uppercase tracking-tighter text-left w-full pl-20 pr-12 relative z-10 ${hasBg ? 'text-white drop-shadow-lg' : theme.text}`}>{sub}</span>
              <div className="absolute right-6 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center text-[#00E7DB] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 group-hover:bg-[#00E7DB]/20 transition-all z-10 shadow-lg"><ChevronRight size={20} strokeWidth={4} /></div>
            </button>
          )})}
        </div>

        {/* TARJETA DE NEGOCIO (DISEÑO COHETE DORADO) */}
        <div className="mt-12 mb-8 mx-0 p-8 rounded-[45px] bg-[#0A0F1C] relative overflow-hidden text-center shadow-2xl border border-white/5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {/* Fondo con gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#151C32] to-[#020617] opacity-80 pointer-events-none"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FFB800]/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-[#FFB800] rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,184,0,0.3)] border-4 border-[#FFB800]/20">
              <Rocket size={32} className="text-[#020617] fill-[#020617]" strokeWidth={2.5} />
            </div>

            <h3 className="text-3xl font-[1000] text-white leading-[0.9] uppercase tracking-tighter mb-4">
              {t.sub_business_title.split('\n')[0]}<br />
              <span className="text-[#FFB800]">{t.sub_business_title.split('\n')[1]}</span>
            </h3>

            <p className="text-white/40 text-[10px] font-black uppercase tracking-[3px] mb-8 leading-relaxed max-w-[240px]">
              {t.sub_business_desc}
            </p>

            <button
              onClick={onContactAdmin}
              className="w-full h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center gap-3 active:scale-95 transition-all group hover:bg-white/10"
            >
              <span className="text-[#FFB800] text-[11px] font-black uppercase tracking-[3px]">{t.sub_business_btn}</span>
              <ChevronRight size={16} className="text-[#FFB800] group-hover:translate-x-1 transition-transform" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubcategorySelect;
