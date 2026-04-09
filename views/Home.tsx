
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Category, Service } from '../types';
import * as LucideIcons from 'lucide-react';
import {
  Heart, Sun, Moon, MapPin, ChevronRight, ChevronLeft, ChevronDown, Star,
  HelpCircle, Bell, Search, Zap, ShieldCheck, Briefcase, LogIn, LogOut, User as UserIcon, MessageCircle,
  Award, Users, Rocket, Sparkles, LayoutDashboard, Bot, Headset
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface Props {
  direction?: 'forward' | 'backward';
  categories: Category[];
  user: User | null;
  province: string;
  canton: string;
  services: Service[];
  favorites: string[];
  isDarkMode: boolean;
  onOpenCategory: (cat: Category) => void;
  onSelectService: (service: Service) => void;
  onLogout: () => void;
  onLogin: () => void;
  onAdmin: () => void;
  onChangeLocation: () => void;
  onContactAdmin: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleTheme: () => void;
  onGoToFavorites: () => void;
  onOpenNotifications?: () => void;
  unreadNotifsCount?: number;
  onOpenSearch?: () => void;
  onOpenAI?: () => void;
  onOpenProfile?: () => void;
  onContactService?: (id: string) => void;
  initialCategoryIndex?: number;
  onActiveCategoryChange?: (index: number) => void;
  t: any;
}

const Home: React.FC<Props> = ({
  user, canton, services, favorites, isDarkMode, categories,
  onOpenCategory, onChangeLocation, onToggleTheme, onGoToFavorites,
  onLogin, onLogout, onOpenNotifications, unreadNotifsCount, onOpenSearch, onContactAdmin, onOpenAI, onAdmin, onOpenProfile,
  onSelectService, onToggleFavorite, onContactService, initialCategoryIndex = 0, onActiveCategoryChange, t
}) => {
  // Force HMR Update
  const [activeIndex, setActiveIndex] = useState(initialCategoryIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);

  // Featured Services Logic
  const featuredServices = React.useMemo(() => {
    return (services || [])
      .filter(s => s && s.canton === canton && s.status === 'active')
      .sort((a, b) => ((b.clicks || 0) - (a.clicks || 0)))
      .slice(0, 5);
  }, [services, canton]);

  const ITEM_WIDTH = 140;

  // Definición de Tema Dinámico
  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    headerBg: isDarkMode
      ? 'bg-gradient-to-br from-[#59CBC8] via-[#2DD4BF] to-[#59CBC8]'
      : 'bg-[#00D1FF]',
    headerShadow: isDarkMode ? 'dark-shadow-primary' : 'shadow-xl shadow-blue-500/10',
    headerBorder: isDarkMode ? 'border-white/20' : 'border-[#00D1FF]/20',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    textMuted: isDarkMode ? 'text-white/60' : 'text-slate-500',
    sectionTitle: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    cardBg: isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200/50 shadow-sm',
    iconBg: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    arrowBtn: isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700 shadow-lg',
    searchBar: isDarkMode ? 'bg-[#020617] border-white/20' : 'bg-white border-slate-100 shadow-xl',
    searchBarText: isDarkMode ? 'text-white/50' : 'text-slate-400',
    searchBarIcon: isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]',
    itemInactive: isDarkMode ? 'bg-white/5 text-white border-white/10' : 'bg-white text-slate-400 border-slate-100 shadow-sm',
    navButtonBg: isDarkMode ? 'bg-white/90 text-slate-900' : 'bg-white text-slate-900 shadow-xl border border-slate-100',
    // Propiedades para acento dinámico: Menta en Dark, Celeste en Light
    accentText: isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]',
    accentBg: isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]',
    accentBorder: isDarkMode ? 'border-[#59CBC8]' : 'border-[#00D1FF]',
    accentShadow: isDarkMode ? 'shadow-[0_10px_30px_rgba(89,203,200,0.3)]' : 'shadow-[0_10px_30px_rgba(0,209,255,0.3)]',
    accentLightBg: isDarkMode ? 'bg-[#59CBC8]/10' : 'bg-[#00D1FF]/10',
    accentLightBorder: isDarkMode ? 'border-[#59CBC8]/20' : 'border-[#00D1FF]/20',
  };

  useEffect(() => {
    if (scrollRef.current && initialCategoryIndex > 0) {
      // Small delay to ensure items are rendered and measured
      setTimeout(() => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const items = container.querySelectorAll('.cat-item');
        const targetElement = items[initialCategoryIndex] as HTMLElement;

        if (targetElement) {
          const containerWidth = container.offsetWidth;
          const targetScroll = targetElement.offsetLeft - (containerWidth / 2) + (targetElement.offsetWidth / 2);
          container.scrollLeft = targetScroll;
          setScrollX(targetScroll);
        }
      }, 100);
    }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const containerWidth = container.offsetWidth;
    const scrollPosition = container.scrollLeft;
    const centerPoint = scrollPosition + (containerWidth / 2);
    setScrollX(scrollPosition);

    const items = container.querySelectorAll('.cat-item');
    let closestIndex = 0;
    let minDiff = Infinity;

    items.forEach((item, i) => {
      const itemElement = item as HTMLElement;
      const itemCenter = itemElement.offsetLeft + (itemElement.offsetWidth / 2);
      const diff = Math.abs(centerPoint - itemCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
      onActiveCategoryChange?.(closestIndex);
    }
  };

  const navigateTo = (index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const targetIndex = Math.max(0, Math.min(index, categories.length - 1));
    const items = container.querySelectorAll('.cat-item');
    const targetElement = items[targetIndex] as HTMLElement;

    if (targetElement) {
      const containerWidth = container.offsetWidth;
      const targetScroll = targetElement.offsetLeft - (containerWidth / 2) + (targetElement.offsetWidth / 2);
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (index: number, category: Category) => {
    if (activeIndex === index) {
      onOpenCategory(category);
    } else {
      navigateTo(index);
    }
  };

  const activeCategory = categories[activeIndex] || categories[0] || ({} as Category);

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
          {/* Using Sparkles as a clearer 'Cleaning' metaphor since Broom is often unrecognizable at small sizes or custom paths fail */}
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
        </svg>
      );
    }
    const IconComponent = (LucideIcons as any)[name] || HelpCircle;
    return <IconComponent size={size} strokeWidth={2.5} />;
  };

  const getItemDynamicStyle = (index: number) => {
    if (!scrollRef.current && index === 0) {
      return { transform: 'scale(1.2)', opacity: 1 };
    }

    if (!scrollRef.current) return { opacity: 0.2, transform: 'scale(0.8)' };

    const container = scrollRef.current;
    const containerWidth = container.offsetWidth;
    const centerPoint = scrollX + (containerWidth / 2);
    const items = container.querySelectorAll('.cat-item');
    const itemElement = items[index] as HTMLElement;

    if (!itemElement && index === 0 && scrollX === 0) {
      return { transform: 'scale(1.2)', opacity: 1 };
    }

    if (!itemElement) return { opacity: 0.2, transform: 'scale(0.8)' };

    const itemCenter = itemElement.offsetLeft + (itemElement.offsetWidth / 2);
    const distance = Math.abs(centerPoint - itemCenter);
    const threshold = ITEM_WIDTH;
    let scale = 0.8;
    let opacity = 0.2;

    if (distance < threshold) {
      const factor = 1 - (distance / threshold);
      scale = 0.8 + (factor * 0.4);
      opacity = 0.2 + (factor * 0.8);
    }

    return {
      transform: `scale(${scale})`,
      opacity,
      transition: 'transform 0.1s linear, opacity 0.1s linear',
    };
  };

  // Helper para tamaño de fuente del cantón
  const getLocationFontSize = (text: string) => {
    const len = text.length;
    if (len < 10) return "text-[36px] xs:text-[44px] sm:text-[50px]";
    if (len < 15) return "text-[28px] xs:text-[34px] sm:text-[40px]";
    if (len < 20) return "text-[24px] xs:text-[28px] sm:text-[34px]";
    return "text-[18px] xs:text-[22px] sm:text-[26px]";
  };

  // Helper para tamaño de fuente de la CATEGORÍA (Principal)
  const getCategoryTitleFontSize = (text: string) => {
    const len = text.length;
    // Ej: SALUD
    if (len <= 7) return "text-[42px] xs:text-[54px]";
    // Ej: DEPORTES, TURISMO
    if (len <= 10) return "text-[36px] xs:text-[48px]";
    // Ej: CONSTRUCCIÓN (12 chars), RESTAURANT
    if (len <= 14) return "text-[30px] xs:text-[40px]";
    // Ej: BANCARIOS Y FINANCIEROS
    return "text-[24px] xs:text-[32px]";
  };

  return (
    <div
      className={`flex-1 flex flex-col relative h-full w-full overflow-y-auto hide-scrollbar transition-colors duration-500 ${theme.bg}`}
    >

      {/* HEADER SUPERIOR */}
      <div className={`relative w-full pt-2 pb-8 px-4 rounded-b-[30px] ${theme.headerBg} z-40 ${theme.headerShadow} border-b ${theme.headerBorder}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>

        {/* Barra de Búsqueda Flotante - Movida arriba en el DOM para evitar que su contenedor absoluto bloquee el botón superior */}
        <div className="absolute -bottom-5 left-0 w-full px-6 flex justify-center z-40 pointer-events-none">
          <button onClick={onOpenSearch} className={`w-full max-w-2xl h-11 rounded-[20px] flex items-center px-6 active:scale-[0.98] transition-all border ${theme.searchBar} pointer-events-auto shadow-2xl`}>
            <Search size={18} className={`${theme.searchBarIcon} mr-3`} strokeWidth={3} />
            <span className={`${theme.searchBarText} font-bold text-[10px] uppercase tracking-wide`}>{t.home_search_placeholder}</span>
          </button>
        </div>

        <div className="relative z-50 max-w-4xl mx-auto pointer-events-auto">
          <div className="flex items-center justify-between px-2 mb-1 relative min-h-[40px]">
            {/* IZQUIERDA: Logo y Admin */}
            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <button
                  onClick={onAdmin}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all bg-white shadow-lg border border-white/20 shrink-0`}
                  title="Panel de Administración"
                >
                  <LayoutDashboard size={16} className="text-slate-900" strokeWidth={2.5} />
                </button>
              )}
              <h1 className="text-[16px] xs:text-[19px] sm:text-[22px] font-[1000] tracking-tighter italic leading-none select-none text-center">
                <span className="text-[#0f172a] drop-shadow-sm">CONEXIÓN </span>
                <span className="text-white drop-shadow-md">SERVICIOS</span>
              </h1>
            </div>

            {/* DERECHA: Notificaciones */}
            <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  onOpenNotifications && onOpenNotifications();
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all ${theme.navButtonBg} border ${theme.headerBorder} relative shrink-0`}
              >
                <Bell size={16} />
                {unreadNotifsCount !== undefined && unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-red-600 rounded-full border border-white flex items-center justify-center shadow-lg">
                    <span className="text-[8px] font-black text-white leading-none">
                      {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                    </span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SECCIÓN UBICACIÓN - Sin recuadro */}
          <div className="mb-0 flex justify-center w-full mt-2 relative z-50">
            <button
              onClick={onChangeLocation}
              className="group relative z-50 flex flex-col items-center max-w-full border-2 border-white rounded-[30px] px-6 py-3 active:scale-[0.98] transition-all cursor-pointer pointer-events-auto"
            >
              <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full mb-0.5 bg-[#020617] border border-white/10 shadow-sm backdrop-blur-sm pointer-events-none`}>
                <MapPin size={8} className="text-white" strokeWidth={3} />
                <span className="text-[7px] font-black uppercase tracking-[2px] text-white/90">{t.home_location_label}</span>
              </div>

              <h2 className={`${getLocationFontSize(canton)} font-[1000] text-[#020617] uppercase tracking-tighter leading-none mb-1 drop-shadow-sm pointer-events-none`}>
                {canton}
              </h2>

              <div className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all shrink-0 bg-[#020617] border border-white/10 text-white shadow-xl pointer-events-none`}>
                <ChevronDown size={16} strokeWidth={4} />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex-1 pb-24 relative z-10 pt-10"
      >

        {/* Intro Section Restored */}
        <div className="mb-1 text-center relative z-10 px-6 animate-fade-in-up">
          <p className={`${theme.accentText} text-[11px] xs:text-[13px] font-black uppercase tracking-[3px] mb-0.5 opacity-90`}>{t.home_intro_solution}</p>
          <h3 className={`text-[28px] xs:text-[34px] sm:text-[40px] font-[1000] leading-[0.9] uppercase tracking-tighter ${theme.text} mb-1`}>
            {t.home_intro_question}<br />
            <span className={theme.accentText}>{t.home_intro_looking}</span>
          </h3>
          <div className="flex justify-center">
            <ChevronDown size={22} className="text-white drop-shadow-[0_0_8px_rgba(50,255,200,0.8)] animate-bounce" strokeWidth={4} />
          </div>
        </div>

        {/* Nombre Categoría Activa */}
        <div className="min-h-[36px] flex items-center justify-center w-full px-6 overflow-hidden mb-1" key={activeCategory.id}>
          <h1 className={`text-[23px] xs:text-[27px] font-[1000] uppercase tracking-tighter animate-pop-in text-center leading-tight w-full break-words whitespace-normal ${theme.text}`}>
            {t[`cat_${activeCategory.id}`] || activeCategory.name}
          </h1>
        </div>

        {/* NAVEGADOR CIRCULAR */}
        <div className="relative w-full h-[195px] flex items-center overflow-visible mb-1">
          <button
            onClick={() => navigateTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className={`absolute left-10 z-50 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${theme.arrowBtn} ${activeIndex === 0 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronLeft size={24} strokeWidth={3} className={theme.accentText} />
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto overflow-y-hidden hide-scrollbar w-full h-full items-center snap-x snap-mandatory pt-6 pb-2"
          >
            <div style={{ minWidth: 'calc(50% - 82px)' }} className="shrink-0" />
            {categories.map((cat, i) => {
              const style = getItemDynamicStyle(i);
              const isActive = i === activeIndex;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(i, cat)}
                  className={`cat-item shrink-0 w-[164px] flex flex-col items-center justify-center snap-center transition-all duration-300 cursor-pointer relative group`}
                  style={{ ...style, scrollSnapStop: 'always' }}
                >
                  <div className={`
                    w-[113px] h-[113px] rounded-[32px] flex items-center justify-center mb-4 transition-all duration-500 relative
                    ${isActive ? `${theme.accentBg} ${theme.accentShadow} scale-110 rotate-3` : `${theme.cardBg} group-hover:border-[#00D1FF]/50`}
                  `}>
                    <div className={`relative z-10 transition-transform w-full h-full flex items-center justify-center duration-500 ${isActive ? 'text-[#0F172A] scale-110' : theme.textMuted}`}>
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} className="w-full h-full rounded-[32px] object-cover" style={{ objectPosition: cat.imagePosition || 'center' }} alt={cat.name} />
                      ) : (
                        getIcon(cat.icon, isActive ? 41 : 33)
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ minWidth: 'calc(50% - 82px)' }} className="shrink-0" />
          </div>

          <button
            onClick={() => navigateTo(activeIndex + 1)}
            disabled={activeIndex === categories.length - 1}
            className={`absolute right-10 z-50 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${theme.arrowBtn} ${activeIndex === categories.length - 1 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronRight size={24} strokeWidth={3} className={theme.accentText} />
          </button>
        </div>

        {/* BOTÓN SELECCIONAR CATEGORÍA */}
        <div className="w-full flex justify-center mt-1 mb-2 px-6 animate-slide-up relative z-20" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => onOpenCategory(activeCategory)}
            className={`
              group relative w-full max-w-[280px] h-12 rounded-full flex items-center justify-center gap-3
              ${isDarkMode ? 'bg-[#59CBC8] shadow-[0_0_20px_rgba(89,203,200,0.4)] hover:shadow-[0_0_30px_rgba(89,203,200,0.6)]' : 'bg-[#00D1FF] shadow-[0_10px_25px_rgba(0,209,255,0.3)] hover:shadow-[0_15px_35px_rgba(0,209,255,0.4)]'}
              active:scale-[0.98] transition-all duration-300
              border border-white/20
            `}
          >
            <span className="text-slate-900 font-[1000] text-[11px] uppercase tracking-[2px]">{t.home_btn_select}</span>
            <div className="w-7 h-7 bg-slate-900/10 rounded-full flex items-center justify-center group-hover:bg-slate-900/20 transition-colors">
              <ChevronRight size={14} className="text-slate-900" strokeWidth={4} />
            </div>
          </button>
        </div>

        {/* SECCIÓN SERVICIOS DESTACADOS */}
        <div className="w-full mt-10 mb-8 px-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${theme.accentLightBg} ${theme.accentText}`}>
                <Star size={20} fill="currentColor" />
              </div>
              <h4 className={`text-xl font-[1000] uppercase tracking-tighter ${theme.text}`}>{t.home_featured_title}</h4>
            </div>
          </div>

          {featuredServices.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar px-1 snap-x">
              {featuredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className={`
                    shrink-0 w-64 p-4 rounded-[35px] border ${theme.cardBg}
                    flex flex-col gap-4 active:scale-95 transition-all text-left snap-start
                  `}
                >
                  <div className="relative w-full aspect-[4/3] rounded-[25px] overflow-hidden">
                    <img src={service.imageUrl} className="w-full h-full object-cover" alt={service.title} />
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 border border-white/20">
                      <Star size={10} className="fill-[#FFB800] text-[#FFB800]" />
                      <span className="text-[10px] font-black text-white">{service.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="px-2 pb-2">
                    <h5 className={`font-[1000] text-sm uppercase tracking-tight line-clamp-1 mb-1 ${theme.text}`}>{service.title}</h5>
                    <div className="flex items-center justify-between">
                      <p className={`text-[10px] font-bold uppercase opacity-60 ${theme.textMuted}`}>
                        {(() => {
                          const cat = categories.find(c => c.name === service.category || c.id === service.category);
                          return cat ? (t[`cat_${cat.id}`] || cat.name) : service.category;
                        })()}
                      </p>
                      <div className="flex items-center gap-1">
                        <Zap size={10} className={theme.accentText} fill="currentColor" />
                        <span className={`text-[10px] font-black ${theme.accentText}`}>TOP</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={`py-12 px-8 rounded-[40px] border border-dashed flex flex-col items-center justify-center text-center gap-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <HelpCircle size={40} className="opacity-20 translate-y-2" />
              <p className={`text-sm font-bold uppercase opacity-60 tracking-[2px] px-4 ${theme.textMuted}`}>
                {t.home_no_services}
              </p>
            </div>
          )}
        </div>

        {/* TARJETA DE NEGOCIO - Rediseñada */}
        <div className="w-full px-6 mb-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center animate-fade-in">
            <h4 className={`text-2xl xs:text-3xl font-[1000] uppercase tracking-tighter ${theme.text}`}>
              {t.home_business_title_1}<span className="text-[#FFB800]">{t.home_business_title_2}</span>{t.home_business_title_3}
            </h4>
            <p className={`text-[10px] font-black uppercase tracking-[4px] opacity-40 mt-1 ${theme.text}`}>
              {t.home_business_desc}
            </p>
          </div>

          <button
            onClick={onContactAdmin}
            className="w-full py-7 rounded-[35px] bg-[#0A0F1C] relative overflow-hidden shadow-2xl border border-white/5 group active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-6 px-10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#451a03] via-[#b45309] to-[#451a03] opacity-90 animate-gradient-x"></div>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>

            <div className="relative z-10 flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center shrink-0 border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                <Rocket size={34} className="text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-[1000] text-lg uppercase tracking-[2px] leading-tight">{t.home_business_btn_publish}</p>
                <p className="text-white/70 text-[11px] font-black uppercase tracking-widest">{t.home_business_btn_premium}</p>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-center gap-4 bg-white w-full max-w-[200px] py-4 rounded-[15px] shadow-2xl group-hover:scale-105 transition-all text-[#b45309]">
              <span className="text-[12px] font-[1000] uppercase tracking-[3px]">{t.home_business_btn_start}</span>
              <ChevronRight size={18} strokeWidth={4} />
            </div>
          </button>
        </div>

        {/* SECCIÓN POR QUÉ USAR CONEXIÓN SERVICIOS */}
        <div className="w-full px-6 mb-2 max-w-2xl mx-auto space-y-10">
          <div className="text-center">
            <h4 className={`text-2xl font-[1000] uppercase tracking-tighter ${theme.text}`}>
              {t.home_why_title_1}<span className={theme.accentText}>{t.home_why_title_2}</span>{t.home_why_title_3}
            </h4>
            <div className={`h-1 w-20 mx-auto mt-2 rounded-full ${theme.accentBg} opacity-50`}></div>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: <ShieldCheck size={24} />,
                title: t.home_why_1_title,
                desc: t.home_why_1_desc
              },
              {
                icon: <Search size={24} />,
                title: t.home_why_2_title,
                desc: t.home_why_2_desc
              },
              {
                icon: <MessageCircle size={24} />,
                title: t.home_why_3_title,
                desc: t.home_why_3_desc
              }
            ].map((point, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-5 p-6 rounded-[30px] border animate-fade-in ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/50'}`}
                style={{ animationDelay: `${0.1 * (idx + 1)}s` }}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${theme.accentLightBg} ${theme.accentText}`}>
                  {point.icon}
                </div>
                <div className="space-y-1">
                  <h5 className={`font-black uppercase tracking-tight text-sm ${theme.text}`}>{point.title}</h5>
                  <p className={`text-[12px] font-medium leading-relaxed opacity-60 ${theme.textMuted}`}>{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div >
  );
};

export default Home;
