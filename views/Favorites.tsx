
import React from 'react';
import { Service } from '../types';
import {
  ArrowLeft, Heart, MapPin, Star,
  Sparkles, Ghost, ArrowRight, Bookmark, ChevronDown
} from 'lucide-react';

interface Props {
  direction?: 'forward' | 'backward';
  services: Service[];
  favorites: string[];
  isDarkMode: boolean;
  onBack: () => void;
  onSelectService: (service: Service) => void;
  onToggleFavorite: (id: string) => void;
  onOpenSearch?: () => void;
  onExplore?: () => void;
  t: any;
}

const Favorites: React.FC<Props> = ({
  direction = 'forward', services = [], favorites = [], isDarkMode, onBack, onSelectService, onToggleFavorite, onExplore, t
}) => {
  const favoriteServices = (services || []).filter(s => favorites.includes(s.id));
  const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';

  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    headerBg: isDarkMode
      ? 'bg-gradient-to-br from-[#59CBC8] via-[#2DD4BF] to-[#59CBC8]'
      : 'bg-[#00D1FF]',
    card: isDarkMode ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-white border-slate-200/50 shadow-sm',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    subtext: isDarkMode ? 'text-white/40' : 'text-slate-500',
    shadowPrimary: isDarkMode ? 'dark-shadow-primary' : 'shadow-xl shadow-blue-500/10'
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar transition-all duration-500 ${theme.bg} ${animClass}`}>

      {/* CABECERA (NO STICKY) */}
      <div className={`relative ${theme.headerBg} pt-6 pb-6 rounded-b-[40px] ${theme.shadowPrimary} border-b ${isDarkMode ? 'border-white/20' : 'border-white/40'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
        <header className="px-8 flex flex-col relative z-10">
          <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className={`rounded-2xl flex items-center justify-center transition-all active:scale-90 border w-12 h-12 ${isDarkMode ? 'border-white/50 bg-white shadow-lg' : 'border-white/60 bg-white shadow-xl'}`}>
              <ArrowLeft size={20} className="text-slate-900" strokeWidth={3} />
            </button>
            <div className="rounded-full border flex items-center gap-3 bg-white/90 border-white shadow-md px-5 py-2.5">
              <Heart size={14} className="text-red-500 fill-red-500" />
              <span className="font-black uppercase tracking-[3px] text-[#0F172A] text-[10px]">{t.fav_title_label}</span>
            </div>
          </div>

          <div className="flex flex-col items-center px-2">
            {/* Etiqueta Píldora */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2 backdrop-blur-sm border border-white/40 bg-white shadow-sm">
              <Bookmark size={10} className="text-slate-900" strokeWidth={3} />
              <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-900/80">{t.fav_list_label}</span>
            </div>

            <h2 className="font-[1000] uppercase tracking-tighter text-slate-900 drop-shadow-md leading-none text-[40px] text-center">{t.fav_title}</h2>

            {/* Contador Estilizado */}
            <div className={`mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-sm ${isDarkMode ? 'bg-white/10 border-white/10' : 'bg-white/40 border-white/20 shadow-sm'}`}>
              <Sparkles size={14} className="text-slate-900" strokeWidth={2} />
              <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-900">{favoriteServices.length} {t.fav_count_label}</p>
            </div>
          </div>
        </header>

        {/* Animated Arrow for Favorites */}
        {favoriteServices.length > 0 && (
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="animate-bounce">
              <ChevronDown size={32} className={`${isDarkMode ? 'text-[#00E7DB]' : 'text-[#00D1FF]'}`} strokeWidth={3} />
            </div>
          </div>
        )}
      </div>

      <div className={`flex-1 flex flex-col ${favoriteServices.length === 0 ? 'justify-center pb-20' : 'px-6 pb-32 pt-24'}`}>

        {favoriteServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center animate-pop-in relative">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${isDarkMode ? 'bg-[#00E7DB]/5' : 'bg-[#00D1FF]/10'} blur-[90px] rounded-full pointer-events-none`}></div>
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center mb-6 border-2 transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-[#00E7DB]' : 'bg-white border-blue-50 text-[#00D1FF] shadow-xl shadow-blue-500/10'}`}><Ghost size={56} strokeWidth={1.5} /></div>
            <h3 className={`text-[24px] font-[1000] uppercase tracking-tighter mb-2 ${theme.text}`}>{t.fav_empty_title}</h3>
            <p className={`text-[10px] font-bold uppercase tracking-[3px] opacity-60 ${theme.text}`}>{t.fav_empty_desc}</p>
            <button onClick={onExplore || onBack} className={`mt-8 px-12 py-5 ${isDarkMode ? 'bg-[#00E7DB]' : 'bg-[#00D1FF]'} text-[#0F172A] rounded-full font-black text-[10px] tracking-[5px] uppercase flex items-center gap-4 active:scale-95 transition-all ${theme.shadowPrimary}`}>{t.fav_btn_explore} <ArrowRight size={16} strokeWidth={4} /></button>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {favoriteServices.map((s, idx) => (
              <div key={s.id} onClick={() => onSelectService(s)} className={`w-full rounded-[40px] p-5 border flex items-center justify-between active:scale-[0.98] transition-all group ${theme.card}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-center gap-5 overflow-hidden flex-1">
                  <div className="relative shrink-0"><img src={s.imageUrl} className={`w-16 h-16 rounded-[22px] object-cover border ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`} alt="" /><div className="absolute -top-1 -right-1 w-6 h-6 bg-[#FFB800] rounded-lg shadow-lg flex items-center justify-center text-[#0F172A]"><Star size={10} fill="currentColor" /></div></div>
                  <div className="text-left overflow-hidden flex-1 pl-2">
                    <h4 className={`text-sm xs:text-base font-black uppercase tracking-tighter leading-tight mb-1 break-words ${theme.text}`}>{s.title}</h4>
                    <div className="flex flex-col gap-1 mb-1.5">
                      <div className={`text-[10px] font-bold uppercase tracking-wide opacity-80 ${theme.text}`}>{s.category}</div>
                      <div className={`text-[9px] font-medium uppercase tracking-wider opacity-60 ${theme.text} line-clamp-2`}>
                        {s.subcategories && s.subcategories.length > 0 ? s.subcategories.join(', ') : s.subcategory}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 ${theme.subtext}`}>
                      <MapPin size={10} className="shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-wider truncate">{s.canton}</span>
                    </div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(s.id); }} className={`w-11 h-11 ml-4 rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 ${isDarkMode ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-red-50 text-red-500 border border-red-100 shadow-sm'}`}><Heart size={18} fill="currentColor" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div >
  );
};

export default Favorites;
