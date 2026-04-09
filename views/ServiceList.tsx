import React, { useState } from 'react';
import { Service, User } from '../types';
import { ArrowLeft, Star, Heart, ChevronRight, Lock, Filter, SearchX, ShieldCheck, Search, MapPin, X, Check, ChevronDown } from 'lucide-react';

interface Props {
  direction?: 'forward' | 'backward';
  user: User | null;
  category: string;
  subcategory: string;
  province: string;
  canton: string;
  services: Service[];
  favorites: string[];
  isDarkMode: boolean;
  onBack: () => void;
  onSelectService: (service: Service) => void;
  onToggleFavorite: (id: string) => void;
  onGoToLogin: () => void;
  onOpenSearch?: () => void;
  onChangeLocation: () => void;
  t: any;
}

type SortOption = 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc';

const ServiceList: React.FC<Props> = ({
  direction = 'forward', user, subcategory, canton, services, favorites, isDarkMode, onBack, onSelectService, onToggleFavorite, onGoToLogin, onOpenSearch, onChangeLocation, t
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('rating_desc');

  const isGuest = !user || user.isGuest;
  const animClass = direction === 'forward' ? 'animate-page-in' : 'animate-page-back';

  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    headerBg: isDarkMode
      ? 'bg-gradient-to-br from-[#59CBC8] via-[#2DD4BF] to-[#59CBC8]'
      : 'bg-[#00D1FF]',
    card: isDarkMode ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-white border-slate-200/50 shadow-sm',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    subtext: isDarkMode ? 'text-white/80' : 'text-slate-500',
    input: isDarkMode ? 'bg-[#0a0f1e] border-white/10' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50',
    shadowPrimary: isDarkMode ? 'dark-shadow-primary' : 'shadow-xl shadow-blue-500/10',
    modalBg: isDarkMode ? 'bg-[#0a0f1e]' : 'bg-white',
    accentText: isDarkMode ? 'text-[#00E7DB]' : 'text-[#00D1FF]'
  };

  const activeServices = services.filter(s => s.status === 'active');

  // Sorting Logic
  const sortedServices = [...activeServices].sort((a, b) => {
    switch (sortOption) {
      case 'rating_desc': return b.rating - a.rating;
      case 'rating_asc': return a.rating - b.rating;
      case 'name_asc': return a.title.localeCompare(b.title);
      case 'name_desc': return b.title.localeCompare(a.title);
      default: return 0;
    }
  });

  const handleCardClick = (service: Service) => {
    if (isGuest) {
      setShowAuthModal(true);
    } else {
      onSelectService(service);
    }
  };

  const getSortLabel = (key: SortOption) => {
    switch (key) {
      case 'rating_desc': return t.list_sort_rating_desc;
      case 'rating_asc': return t.list_sort_rating_asc;
      case 'name_asc': return t.list_sort_name_asc;
      case 'name_desc': return t.list_sort_name_desc;
    }
  };

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto h-full transition-colors duration-700 hide-scrollbar ${theme.bg} ${animClass}`}>

      {/* CABECERA (NO STICKY) */}
      <div className="relative w-full shrink-0 mb-16">
        <div className={`relative ${theme.headerBg} pt-10 pb-10 rounded-b-[40px] ${theme.shadowPrimary} border-b ${isDarkMode ? 'border-white/20' : 'border-white/40'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
          <header className="px-8 flex flex-col relative z-10 max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <button onClick={onBack} className={`rounded-2xl flex items-center justify-center transition-all active:scale-90 border w-12 h-12 ${isDarkMode ? 'border-white/50 bg-white shadow-lg' : 'border-white/60 bg-white shadow-xl'}`}>
                <ArrowLeft size={20} className="text-slate-900" strokeWidth={3} />
              </button>

              <h1 className="text-[14px] xs:text-[16px] font-[1000] tracking-tighter italic leading-none select-none whitespace-nowrap">
                <span className="text-[#0f172a] drop-shadow-sm">CONEXIÓN </span>
                <span className="text-white drop-shadow-md">SERVICIOS</span>
              </h1>

              {/* FILTER BUTTON - Now Functional */}
              <button
                onClick={() => setShowFilterModal(true)}
                className="bg-white/90 rounded-2xl flex items-center justify-center active:scale-95 shadow-md border border-white w-12 h-12 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[#00E7DB]/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <Filter size={20} className="text-[#0F172A] relative z-10" />
                {sortOption !== 'rating_desc' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-[#00E7DB] rounded-full ring-2 ring-white"></div>
                )}
              </button>
            </div>

            <div className="flex flex-col items-center px-2 text-center w-full">
              <button onClick={onChangeLocation} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-white shadow-md border border-slate-100 active:scale-95 transition-transform group">
                <MapPin size={12} className="text-[#0F172A] group-hover:scale-110 transition-transform" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-[2px] text-[#0F172A]">
                  {canton.toUpperCase()}, ECUADOR
                </span>
              </button>
              <h2 className="font-[1000] uppercase tracking-tighter text-[#0F172A] drop-shadow-md leading-[0.85] w-full text-[32px] xs:text-[40px] mb-2 break-words whitespace-normal text-center">
                {subcategory || t.all}
              </h2>
              <p className="text-[#0F172A]/70 font-bold text-[10px] uppercase tracking-[3px] text-center mt-2">{t.list_select_needed}</p>
            </div>
          </header>

          <div className="absolute -bottom-6 left-0 right-0 px-8 z-20 flex justify-center">
            <button onClick={onOpenSearch} className={`flex items-center w-full max-w-4xl h-14 px-6 rounded-[26px] ${theme.input} active:scale-[0.98] transition-all duration-300 text-left`}>
              <Search className={`${isDarkMode ? 'text-[#00E7DB]' : 'text-[#0F172A]/40'} mr-4`} size={18} strokeWidth={3} />
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white/40' : 'text-[#0F172A]/30'}`}>{t.home_search_placeholder}</span>
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

      <div className={`flex-1 w-full max-w-7xl mx-auto flex flex-col ${sortedServices.length === 0 ? 'justify-center pb-20' : 'px-6 pb-32 pt-8'}`}>

        {sortedServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center animate-pop-in">
            <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center mb-8 border ${theme.card} text-slate-400`}><SearchX size={50} strokeWidth={1.5} /></div>
            <h3 className={`text-2xl font-[1000] uppercase tracking-tighter mb-2 ${theme.text}`}>{t.list_no_results}</h3>
            <p className={`text-[9px] font-black uppercase tracking-[4px] ${theme.subtext}`}>{t.list_no_active}</p>
          </div>
        ) : (
          /* ADAPTIVE GRID LAYOUT */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {sortedServices.map((service, i) => (
              <div key={service.id} onClick={() => handleCardClick(service)} className={`relative w-full h-64 md:h-72 rounded-[45px] overflow-hidden group active:scale-[0.98] transition-all border ${theme.card} animate-slide-up shadow-lg hover:shadow-2xl`} style={{ animationDelay: `${i * 0.1}s` }}>
                <img src={service.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70" alt={service.title} />
                <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-[#020617] via-[#020617]/40' : 'from-slate-900/80 via-transparent'} to-transparent`}></div>
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                  <div className="bg-[#59CBC8] px-4 py-2 rounded-full flex items-center gap-2"><Star size={12} className="fill-slate-900 text-slate-900" /><span className="text-[10px] font-black text-slate-900">{service.rating.toFixed(1)}</span></div>
                  <button onClick={(e) => { e.stopPropagation(); if (isGuest) setShowAuthModal(true); else onToggleFavorite(service.id); }} className={`p-4 rounded-[20px] transition-all backdrop-blur-md border border-white/20 ${favorites.includes(service.id) ? 'bg-red-500 text-white' : 'bg-black/30 text-white'}`}><Heart size={18} fill={favorites.includes(service.id) ? "currentColor" : "none"} /></button>
                </div>
                <div className="absolute inset-x-6 bottom-6 flex items-center gap-3">
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-[1000] text-white uppercase tracking-tighter leading-tight mb-1.5 drop-shadow-lg line-clamp-1 truncate">
                      {service.title}
                    </h3>
                    <div className="flex items-start gap-2">
                      <ShieldCheck size={12} className="text-[#59CBC8] shrink-0 mt-0.5" />
                      <p className="text-[9px] sm:text-[10px] text-white/90 font-black uppercase tracking-wide leading-relaxed line-clamp-2">
                        {service.subcategories && service.subcategories.length > 0 ? service.subcategories.join(', ') : service.subcategory}
                      </p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-[18px] flex items-center justify-center text-[#59CBC8] shadow-xl group-active:scale-90 transition-all shrink-0"><ChevronRight size={22} strokeWidth={4} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAuthModal && (
        <div className="absolute inset-0 z-[100] flex items-end animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAuthModal(false)}></div>
          <div className={`relative w-full rounded-t-[50px] p-10 pb-16 animate-slide-up border-t max-w-xl mx-auto ${isDarkMode ? 'bg-[#0a0f1e] border-white/10' : 'bg-white border-slate-100'}`}>
            <div className={`w-16 h-1.5 rounded-full mx-auto mb-10 ${isDarkMode ? 'bg-white/20' : 'bg-slate-200'}`}></div>
            <div className="flex flex-col items-center text-center">
              <div className={`w-24 h-24 rounded-[35px] flex items-center justify-center mb-8 border ${theme.card} text-[#59CBC8]`}><Lock size={40} /></div>
              <h4 className={`text-2xl font-black uppercase tracking-tighter mb-4 ${theme.text}`}>{t.list_auth_required}</h4>
              <p className={`text-sm mb-8 ${theme.subtext}`}>{t.list_auth_desc}</p>
              <button onClick={onGoToLogin} className="w-full bg-[#59CBC8] text-slate-900 font-black py-6 rounded-[30px] shadow-2xl tracking-[3px] uppercase active:scale-95 transition-all">{t.auth_btn_login}</button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL */}
      {showFilterModal && (
        <div className="absolute inset-0 z-[100] flex items-end animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilterModal(false)}></div>
          <div className={`relative w-full rounded-t-[40px] p-8 pb-12 animate-slide-up border-t max-w-xl mx-auto ${theme.modalBg} ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-2xl font-[1000] uppercase tracking-tighter ${theme.text}`}>{t.list_sort_by}</h3>
              <button onClick={() => setShowFilterModal(false)} className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-3">
              {['rating_desc', 'rating_asc', 'name_asc', 'name_desc'].map((option) => (
                <button
                  key={option}
                  onClick={() => { setSortOption(option as SortOption); setShowFilterModal(false); }}
                  className={`w-full p-5 rounded-[24px] flex items-center justify-between transition-all active:scale-[0.98] border ${sortOption === option
                    ? 'bg-[#00E7DB] border-[#00E7DB] shadow-lg shadow-[#00E7DB]/20'
                    : isDarkMode ? 'bg-white/5 border-white/5 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <span className={`text-sm font-bold uppercase tracking-wider ${sortOption === option ? 'text-slate-950' : ''}`}>
                    {getSortLabel(option as SortOption)}
                  </span>
                  {sortOption === option && (
                    <div className="w-8 h-8 rounded-full bg-slate-950/10 flex items-center justify-center">
                      <Check size={16} className="text-slate-950" strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServiceList;
