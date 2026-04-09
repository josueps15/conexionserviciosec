
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, X, History, TrendingUp, ChevronRight, ChevronDown, Layers, Sparkles, User, Briefcase } from 'lucide-react';
import { Category, Service } from '../types';

interface Props {
  direction?: 'forward' | 'backward';
  isDarkMode: boolean;
  province: string;
  canton: string;
  query?: string;
  categories: Category[];
  services: Service[];
  onBack: () => void;
  onSelectResult: (term: string, type: 'category' | 'subcategory' | 'service') => void;
  t: any;
}

const SearchView: React.FC<Props> = ({ direction = 'forward', isDarkMode, canton, query = '', categories, services, onBack, onSelectResult, t }) => {
  const [searchTerm, setSearchTerm] = useState(query);
  const [recentSearches, setRecentSearches] = useState<{ term: string, type: 'category' | 'subcategory' | 'service' }[]>([]);
  const [showAllTrends, setShowAllTrends] = useState(false);

  const animClass = 'animate-slide-up';

  // Mint color constant
  const MINT_COLOR = '#59CBC8';

  const allSubcategories = useMemo(() => {
    return (categories || []).flatMap(c => (c.subcategories || []).map(sub => ({
      name: sub,
      category: c.name,
      type: 'subcategory' as const
    })));
  }, [categories]);

  // Filtrar sugerencias en tiempo real incluyendo servicios
  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];

    const term = searchTerm.toLowerCase();

    // 1. Coincidencias en Categorías
    const catMatches = (categories || [])
      .filter(c => c.name.toLowerCase().includes(term) || (t[c.translationKey] && t[c.translationKey].toLowerCase().includes(term)))
      .map(c => ({ 
        name: t[c.translationKey] || c.name, 
        type: 'category' as const, 
        parent: '', 
        id: c.id,
        tag: t.search_category 
      }));

    // 2. Coincidencias en Especialidades
    const subMatches = (allSubcategories || [])
      .filter(s => s.name.toLowerCase().includes(term))
      .map(s => {
        const cat = (categories || []).find(c => c.name === s.category);
        return { 
          name: s.name, 
          type: 'subcategory' as const, 
          parent: cat ? (t[cat.translationKey] || cat.name) : s.category,
          tag: t.search_specialty
        };
      });

    // 3. Coincidencias en Nombres de Servicios (Negocios)
    const serviceMatches = (services || [])
      .filter(s => s.status === 'active' && s.title.toLowerCase().includes(term))
      .map(s => ({
        name: s.title,
        type: 'service' as const,
        parent: s.canton,
        tag: 'Servicio',
        id: s.id,
        image: s.imageUrl
      }));

    // Priorizamos nombres de servicios, luego categorías, luego especialidades
    return [...serviceMatches, ...catMatches, ...subMatches].slice(0, 10);
  }, [searchTerm, allSubcategories, services, t]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches_v2');
    if (saved) setRecentSearches(JSON.parse(saved).slice(0, 3));
  }, []);

  const handleSelect = (name: string, type: 'category' | 'subcategory' | 'service', id?: string) => {
    const termToSave = type === 'service' && id ? id : name;
    const newRecent = [{ term: name, type, id: id }, ...recentSearches.filter(s => s.term !== name)].slice(0, 3);
    setRecentSearches(newRecent as any);
    localStorage.setItem('recent_searches_v2', JSON.stringify(newRecent));
    onSelectResult(termToSave, type);
  };

  const removeRecent = (term: string) => {
    const newRecent = recentSearches.filter(s => s.term !== term);
    setRecentSearches(newRecent);
    localStorage.setItem('recent_searches_v2', JSON.stringify(newRecent));
  };

  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    subtext: isDarkMode ? 'text-white/40' : 'text-[#64748B]',
    card: isDarkMode ? 'bg-white/5 border-white/5 shadow-2xl' : 'bg-white border-slate-200/50 shadow-sm',
    itemHover: isDarkMode ? 'active:bg-white/10' : 'active:bg-slate-50',
    input: isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/40',
    iconBg: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    accent: isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]',
    accentBg: isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]'
  };

  const trends = useMemo(() => {
    const baseTrends = [
      { term: 'Mecanica', type: 'subcategory' as const, category: 'Automotriz' },
      { term: 'Medicina general', type: 'subcategory' as const, category: 'Salud' },
      { term: 'Electricista', type: 'subcategory' as const, category: 'Construcción' },
      { term: 'Burger', type: 'subcategory' as const, category: 'Restaurant' },
      { term: 'Odontología', type: 'subcategory' as const, category: 'Salud' },
      { term: 'Llantas', type: 'subcategory' as const, category: 'Automotriz' }
    ];
    return showAllTrends ? baseTrends : baseTrends.slice(0, 3);
  }, [showAllTrends]);

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden ${animClass}`}
      style={{ backgroundColor: isDarkMode ? '#020617' : '#F1F5F9' }}
    >

      {/* SEARCH BAR HEADER */}
      <header className="px-6 pt-14 pb-4 flex items-center gap-4 relative z-50">
        <button
          onClick={onBack}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${isDarkMode ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow-xl'}`}
        >
          <ArrowLeft size={24} strokeWidth={3} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
        </button>

        <div className={`flex-1 flex items-center px-5 h-12 rounded-2xl relative group transition-all border ${theme.input}`}>
          <Search size={18} className={`${searchTerm ? theme.accent : theme.subtext} mr-3 transition-colors`} strokeWidth={3} />
          <input
            type="text"
            placeholder={t.search_placeholder}
            className={`w-full bg-transparent outline-none text-sm font-bold text-left ${theme.text} placeholder:font-medium placeholder:opacity-40`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck={true}
            inputMode="search"
            autoComplete="on"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.iconBg} ${theme.subtext} active:scale-90 transition-all`}
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10 hide-scrollbar pb-32">

        {/* MODO SUGERENCIAS */}
        {searchTerm.length >= 2 ? (
          <section className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${theme.accentBg} animate-pulse`} />
                <h3 className={`text-[11px] font-[1000] uppercase tracking-[3px] ${theme.subtext}`}>{t.search_suggestions}</h3>
              </div>
              <span className={`text-[10px] font-black opacity-30 ${theme.text}`}>• {suggestions.length} {t.all.toUpperCase()}</span>
            </div>
            
            <div className="space-y-3">
              {suggestions.length > 0 ? suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(s.name, s.type, (s as any).id)}
                  className={`
                    w-full p-4 rounded-[28px] border flex items-center justify-between transition-all group
                    ${theme.card} ${theme.itemHover} active:scale-[0.97]
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-12 h-12 rounded-[20px] flex items-center justify-center relative overflow-hidden
                      ${theme.iconBg} border border-white/5 transition-transform group-active:scale-90
                    `}>
                      {s.type === 'service' && (s as any).image ? (
                        <img src={(s as any).image} className="w-full h-full object-cover" alt={s.name} />
                      ) : (
                        <div className={`text-[#59CBC8]`}>
                          {s.type === 'category' ? <Layers size={20} strokeWidth={2.5} /> : 
                           s.type === 'service' ? <Briefcase size={20} strokeWidth={2.5} /> :
                           <Search size={20} strokeWidth={2.5} />}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left">
                      <h4 className={`text-sm font-[1000] tracking-tight group-active:translate-x-1 transition-transform truncate w-full text-left ${theme.text}`}>
                        {s.name}
                      </h4>
                      <div className="flex items-center gap-2 w-full text-left">
                         <span className={`text-[9px] font-black uppercase tracking-wider ${theme.accent} opacity-80 shrink-0 text-left`}>
                          {s.tag}
                        </span>
                        {s.parent && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                            <span className={`text-[9px] font-bold uppercase tracking-wide opacity-30 truncate text-left ${theme.text}`}>
                               {s.parent}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme.iconBg} ${theme.subtext} group-active:translate-x-1`}>
                    <ChevronRight size={14} strokeWidth={3} />
                  </div>
                </button>
              )) : (
                <div className="py-20 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <History size={32} className="opacity-10" />
                  </div>
                  <p className={`text-sm font-bold uppercase tracking-wider opacity-30 ${theme.text}`}>{t.search_no_results}</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* ÚLTIMAS BÚSQUEDAS */}
            {recentSearches.length > 0 && (
              <section className="animate-slide-up">
                <div className="flex items-center gap-3 mb-6">
                   <History size={16} className={theme.accent} />
                   <h3 className={`text-[19px] font-[1000] tracking-tight ${theme.text}`}>{t.search_recent_title}</h3>
                </div>
                <div className="space-y-4">
                  {recentSearches.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-[28px] transition-all ${theme.card} group active:scale-[0.98]`}>
                      <button
                        onClick={() => handleSelect(item.term, item.type, (item as any).id)}
                        className="flex items-center gap-4 flex-1 text-left"
                      >
                        <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center ${theme.iconBg} border border-white/5`}>
                          <History size={16} className={theme.subtext} />
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold text-left ${theme.text}`}>{item.term}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 text-left ${theme.text}`}>
                            {item.type === 'category' ? t.search_category : item.type === 'service' ? 'Negocio' : t.search_specialty}
                          </p>
                        </div>
                      </button>
                      <button 
                        onClick={() => removeRecent(item.term)} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.subtext} hover:bg-red-500/10 hover:text-red-500 transition-all`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* TENDENCIAS */}
            <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp size={18} className={theme.accent} />
                <h3 className={`text-[19px] font-[1000] tracking-tight ${theme.text}`}>
                  {t.search_trends_title} <span className={theme.accent}>{canton}</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {trends.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.term, item.type)}
                    className={`
                      flex items-center gap-5 p-4 rounded-[28px] text-left active:scale-[0.98] transition-all group border
                      ${theme.card} ${theme.itemHover}
                    `}
                  >
                    <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center font-[1000] text-[15px] relative overflow-hidden ${theme.iconBg} ${theme.text}`}>
                      <div className={`absolute inset-0 ${theme.accentBg} opacity-10`} />
                      <span className={theme.accent}>{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-[1000] tracking-tight ${theme.text}`}>{item.term}</p>
                      <p className={`text-[10px] font-black uppercase tracking-wider opacity-30 ${theme.text}`}>{item.category}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme.iconBg} ${theme.subtext}`}>
                      <ChevronRight size={14} strokeWidth={3} />
                    </div>
                  </button>
                ))}
              </div>

              {!showAllTrends && (
                <button
                  onClick={() => setShowAllTrends(true)}
                  className={`
                    w-full mt-8 py-5 rounded-[24px] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[3px] 
                    ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'} 
                    active:scale-95 transition-all
                  `}
                >
                  {t.search_btn_more} <ChevronDown size={14} strokeWidth={3} />
                </button>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  );
};

export default SearchView;
