
import React, { useState, useEffect } from 'react';
import { Service, User, Review } from '../types';
import {
  ArrowLeft, Star, Phone, MessageCircle, MapPin, Heart,
  Info, ImageIcon, Lock, LogIn, Send, UserCircle, MessageSquare,
  ShieldCheck, Zap, ChevronRight, Camera, StarHalf, Video, ThumbsUp, X, Instagram,
  Share2, Copy, Facebook as FacebookIcon, Twitter, Send as SendIcon, ArrowRight
} from 'lucide-react';

interface Props {
  direction?: 'forward' | 'backward';
  service: Service;
  user?: User | null;
  isFavorite: boolean;
  isDarkMode: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onAddReview: (review: Review) => void;
  onGoToLogin: () => void;
  onContact?: () => void;
  t: any;
}

const ServiceDetail: React.FC<Props> = ({
  service, user, isFavorite, isDarkMode, onBack, onToggleFavorite, onAddReview, onGoToLogin, onContact, t
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [isFinishingReview, setIsFinishingReview] = useState(false);
  // Estado para el visor de imágenes (Lightbox)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Combinación única de portada + galería para el visor
  const allImages = React.useMemo(() => {
    const gallery = service.gallery || [];
    if (!service.imageUrl) return gallery;
    return [service.imageUrl, ...gallery.filter(img => img !== service.imageUrl)];
  }, [service.imageUrl, service.gallery]);

  const isGuest = !user || user.isGuest;

  // Lógica de Swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex === null || allImages.length === 0) return;
    setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev! + 1));
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex === null || allImages.length === 0) return;
    setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev! - 1));
  };

  // Verificar si el usuario ya ha calificado este servicio
  useEffect(() => {
    if (user && !isGuest && service.reviews) {
      const existingReview = service.reviews.find(r => r.userId === user.id);
      if (existingReview) {
        setHasRated(true);
        setRating(existingReview.rating);
        setComment(existingReview.comment || '');
      } else {
        setHasRated(false);
        setRating(0);
        setComment('');
      }
    }
  }, [user, service, isGuest]);

  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    card: isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200/50 shadow-sm',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
    subtext: isDarkMode ? 'text-white/60' : 'text-[#64748B]',
    accent: isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]',
    glass: isDarkMode ? 'bg-[#020617]/80' : 'bg-white/80'
  };

  const handleWhatsApp = () => {
    if (onContact) onContact();
    const number = service.whatsappNumber;
    const message = encodeURIComponent(service.whatsappMessage || t.detail_wa_message);
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  const submitReview = () => {
    if (rating === 0) return;
    const newReview: Review = {
      id: Math.random().toString(),
      userId: user?.id || '',
      userName: user?.name || 'Usuario',
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleDateString()
    };
    onAddReview(newReview);
    setHasRated(true);
    setIsFinishingReview(false);
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative transition-colors duration-700 ${theme.bg} overflow-y-auto hide-scrollbar`}>


      <div className="shrink-0">
        {/* IMAGEN DE PORTADA CON BOTONES INTEGRADOS */}
        <div className="relative w-full aspect-[4/5] lg:aspect-video overflow-hidden shrink-0">
          <img
            src={service.imageUrl}
            className="w-full h-full object-cover"
            alt={service.title}
            onClick={() => {
              // Ahora siempre abrimos el visor en el índice 0 (que es la portada)
              if (allImages.length > 0) {
                setSelectedImageIndex(0);
              }
            }}
          />

          {/* Buttons at top of image */}
          <div className="absolute top-0 left-0 right-0 safe-pt z-10">
            <div className="flex items-center justify-between px-6 py-4">
              <button onClick={onBack} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/30 active:scale-90 transition-all shadow-lg">
                <ArrowLeft size={20} className="text-white" strokeWidth={3} />
              </button>

              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => setShowShareModal(true)} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/30 active:scale-90 transition-all shadow-lg">
                  <Share2 size={20} className="text-white" strokeWidth={2.5} />
                </button>
                <button onClick={onToggleFavorite} className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center backdrop-blur-md rounded-xl sm:rounded-2xl border active:scale-90 transition-all shadow-lg ${isFavorite ? 'bg-red-500 border-red-400 text-white' : 'bg-black/40 border-white/30 text-white'}`}>
                  <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent pointer-events-none"></div>

          <div className="absolute bottom-12 left-8 right-8 pointer-events-none">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="bg-[#59CBC8] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                <Star size={10} className="fill-[#020617] text-[#020617]" />
                <span className="text-[10px] font-black text-[#020617]">{service.rating.toFixed(1)}</span>
              </div>
              <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">•
                {service.subcategories && service.subcategories.length > 0
                  ? service.subcategories.join(', ')
                  : service.subcategory}
              </span>
            </div>
            <h1 className="text-4xl xs:text-5xl lg:text-7xl font-[1000] text-white tracking-tighter uppercase leading-[0.85] drop-shadow-2xl break-words whitespace-normal">
              {service.title}
            </h1>
          </div>
        </div>

        {/* CUERPO DE INFORMACIÓN */}
        <div className="p-8 xs:p-10 pb-10 space-y-12">

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#59CBC8]/10 rounded-2xl flex items-center justify-center text-[#59CBC8] border border-[#59CBC8]/20">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className={`text-[12px] font-black uppercase tracking-[3px] ${theme.text}`}>{t.detail_verified}</p>
                </div>
              </div>
            </div>

            <h4 className={`text-[11px] font-black uppercase tracking-[5px] px-2 ${theme.text}`}>{t.detail_info_title}</h4>

            <div className={`p-10 rounded-[40px] border leading-relaxed text-sm xs:text-base font-medium shadow-inner ${theme.card} ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>
              {service.description}
            </div>

            {service.subcategories && service.subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.subcategories.map(sub => (
                  <span key={sub} className="text-[10px] bg-[#59CBC8]/10 text-[#59CBC8] px-3 py-1.5 rounded-lg font-bold uppercase border border-[#59CBC8]/20">
                    {sub}
                  </span>
                ))}
              </div>
            )}

            {allImages.length > 1 && (
              <div className="space-y-4">
                <h4 className={`text-[11px] font-black uppercase tracking-[5px] px-2 ${theme.text}`}>{t.detail_gallery_title}</h4>
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={`shrink-0 active:scale-95 transition-all ${i === 0 ? 'relative' : ''}`}
                    >
                      <img src={img} className={`w-32 h-32 rounded-[25px] object-cover border ${i === 0 ? 'border-[#59CBC8] shadow-[0_0_15px_rgba(89,203,200,0.3)]' : 'border-white/10'}`} />
                      {i === 0 && (
                        <div className="absolute top-2 right-2 bg-[#59CBC8] p-1 rounded-full shadow-lg">
                          <Star size={8} fill="currentColor" className="text-slate-950" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className={`text-[11px] font-black uppercase tracking-[5px] ${theme.text}`}>{t.detail_location_title}</h4>
              <MapPin size={16} className="text-[#59CBC8]" />
            </div>
            <div className={`w-full p-8 rounded-[45px] border flex flex-col gap-4 ${theme.card}`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[22px] bg-[#59CBC8]/10 flex items-center justify-center text-[#59CBC8] border border-[#59CBC8]/10 shadow-inner">
                  <MapPin size={32} />
                </div>
                <div className="flex-1">
                  <p className={`text-xl font-black uppercase tracking-tighter ${theme.text}`}>{service.canton}</p>
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${theme.subtext}`}>{service.province}, Ecuador</p>
                </div>
              </div>
              {service.location?.address && (
                <p className={`text-[13px] font-bold uppercase ${theme.text} bg-white/5 p-4 rounded-2xl border border-white/5`}>
                  {service.location.address}
                </p>
              )}
              {service.mapsUrl && (
                <button onClick={() => window.open(service.mapsUrl, '_blank')} className="w-full py-4 bg-[#59CBC8]/10 text-[#59CBC8] rounded-2xl font-black text-[10px] tracking-[3px] uppercase flex items-center justify-center gap-2">
                  {t.detail_btn_maps} <ChevronRight size={14} />
                </button>
              )}
            </div>
          </section>

          {service.promoVideoUrl && (
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className={`text-[11px] font-black uppercase tracking-[5px] ${theme.text}`}>{t.detail_video_title}</h4>
                <Video size={16} className="text-[#59CBC8]" />
              </div>
              <button onClick={() => window.open(service.promoVideoUrl, '_blank')} className={`w-full p-10 rounded-[45px] border border-white/10 ${theme.card} flex flex-col items-center gap-4 active:scale-95 transition-all`}>
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
                  <Video size={32} />
                </div>
                <span className="text-[12px] font-black text-white uppercase tracking-[2px]">{t.detail_video_btn}</span>
              </button>
            </section>
          )}

          {(service.socialUrls?.instagram || service.socialUrls?.tiktok || service.socialUrls?.facebook || service.socialUrl) && (
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className={`text-[11px] font-black uppercase tracking-[5px] ${theme.text}`}>{t.detail_social_title}</h4>
                <Share2 size={16} className="text-[#59CBC8]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {service.socialUrls?.instagram && (
                  <button onClick={() => window.open(service.socialUrls.instagram, '_blank')} className={`p-5 rounded-[25px] border border-white/10 ${theme.card} flex flex-col items-center gap-3 active:scale-95 transition-all shadow-lg group`}>
                    <div className="w-12 h-12 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-full flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                      <Instagram size={22} color="white" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white">Instagram</span>
                  </button>
                )}
                {service.socialUrls?.tiktok && (
                  <button onClick={() => window.open(service.socialUrls.tiktok, '_blank')} className={`p-5 rounded-[25px] border border-white/10 ${theme.card} flex flex-col items-center gap-3 active:scale-95 transition-all shadow-lg group`}>
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white">TikTok</span>
                  </button>
                )}
                {service.socialUrls?.facebook && (
                  <button onClick={() => window.open(service.socialUrls.facebook, '_blank')} className={`p-5 rounded-[25px] border border-white/10 ${theme.card} flex flex-col items-center gap-3 active:scale-95 transition-all shadow-lg group`}>
                    <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
                      <FacebookIcon size={22} color="white" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white">Facebook</span>
                  </button>
                )}
                {service.socialUrl && !service.socialUrls?.instagram && !service.socialUrls?.tiktok && !service.socialUrls?.facebook && (
                  <button onClick={() => window.open(service.socialUrl, '_blank')} className={`col-span-3 p-6 rounded-[35px] border border-white/10 ${theme.card} flex items-center justify-between gap-4 active:scale-95 transition-all shadow-lg group`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-full flex items-center justify-center text-white border border-white/20 shadow-inner group-hover:scale-110 transition-transform">
                        <Instagram size={28} color="white" />
                      </div>
                      <div className="text-left">
                        <p className={`text-[13px] font-black uppercase tracking-wide ${theme.text}`}>{t.detail_social_follow}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider opacity-60 ${theme.subtext}`}>{t.detail_social_view}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <ChevronRight size={20} className={theme.text} />
                    </div>
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className={`text-[11px] font-black uppercase tracking-[5px] ${theme.text}`}>{t.detail_rate_title}</h4>
              <Star size={16} className="text-[#FFB800]" />
            </div>

            <div className={`p-10 rounded-[45px] border shadow-2xl ${theme.card}`}>
              {isGuest ? (
                <div className="text-center space-y-6 py-4">
                  <p className={`text-[12px] font-black uppercase tracking-widest ${theme.text}`}>{t.detail_rate_login}</p>
                  <button onClick={onGoToLogin} className="w-full h-16 bg-[#59CBC8] rounded-[28px] text-[#020617] text-[12px] font-black tracking-[4px] uppercase active:scale-95 transition-all shadow-xl">
                    {t.auth_btn_login}
                  </button>
                </div>
              ) : hasRated ? (
                <div className="flex flex-col items-center justify-center py-4 gap-4 animate-pop-in">
                  <div className="w-16 h-16 bg-green-500/20 rounded-[22px] flex items-center justify-center text-green-500 shadow-lg border border-green-500/10">
                    <ThumbsUp size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className={`text-xl font-[1000] uppercase tracking-tighter ${theme.text}`}>{t.detail_rate_done}</h4>
                    <p className={`text-[11px] font-bold opacity-60 uppercase tracking-widest ${theme.text} mt-1`}>
                      {t.detail_rate_help.replace('{stars}', rating.toString())}
                    </p>
                  </div>

                  <div className="flex gap-2 opacity-100 pointer-events-none mb-2">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <Star
                        key={starVal}
                        size={22}
                        fill={rating >= starVal ? "#FFB800" : "none"}
                        className={rating >= starVal ? "text-[#FFB800] drop-shadow-md" : "text-slate-400 opacity-20"}
                        strokeWidth={rating >= starVal ? 0 : 2}
                      />
                    ))}
                  </div>

                  {comment ? (
                    <div className={`w-full p-6 rounded-[30px] border italic text-sm ${theme.card} relative overflow-hidden`}>
                      <MessageSquare size={16} className={`absolute top-4 right-4 opacity-20 ${theme.text}`} />
                      <p className={`${theme.text} opacity-80 leading-relaxed`}>"{comment}"</p>
                    </div>
                  ) : (
                    !isFinishingReview && (
                      <button
                        onClick={() => setIsFinishingReview(true)}
                        className={`text-[10px] font-black uppercase tracking-[3px] py-3 px-6 rounded-full border ${theme.card} ${theme.accent} active:scale-95 transition-all mt-2`}
                      >
                        + Añadir Reseña Opcional
                      </button>
                    )
                  )}

                  {isFinishingReview && (
                    <div className="w-full space-y-4 animate-slide-up mt-4">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Escribe tu opinión aquí..."
                        className={`w-full min-h-[120px] p-5 rounded-[30px] border outline-none font-medium text-sm transition-all focus:border-[#FFB800]/50 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsFinishingReview(false)}
                          className={`flex-1 h-14 rounded-[25px] border ${theme.card} ${theme.text} font-black text-[10px] uppercase tracking-[3px] active:scale-95 transition-all`}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={submitReview}
                          className="flex-[2] h-14 bg-[#FFB800] text-[#020617] rounded-[25px] font-black text-[10px] uppercase tracking-[3px] shadow-lg active:scale-95 transition-all"
                        >
                          Enviar Reseña
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 flex flex-col items-center">
                  <p className={`text-[10px] font-black uppercase tracking-[3px] opacity-70 ${theme.text}`}>
                    {t.detail_rate_touch}
                  </p>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        onClick={() => setRating(starVal)}
                        className="active:scale-125 transition-transform duration-200 focus:outline-none"
                      >
                        <Star
                          size={36}
                          fill={rating >= starVal ? "#FFB800" : "none"}
                          className={rating >= starVal ? "text-[#FFB800] drop-shadow-lg" : "text-slate-400 opacity-30"}
                          strokeWidth={rating >= starVal ? 0 : 2}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <div className="w-full space-y-5 animate-slide-up mt-8">
                      <div className="relative">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Tu opinión nos ayuda a todos (opcional)"
                          className={`w-full min-h-[140px] p-6 rounded-[35px] border outline-none font-medium text-sm transition-all focus:border-[#FFB800]/50 placeholder:opacity-40 animate-fade-in ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-inner'}`}
                        />
                        <div className="absolute top-6 right-6 opacity-20">
                          <MessageSquare size={18} />
                        </div>
                      </div>

                      <button
                        onClick={submitReview}
                        className="w-full h-16 bg-[#FFB800] text-[#020617] rounded-[32px] font-black text-[13px] tracking-[4px] uppercase shadow-[0_10px_40px_rgba(255,184,0,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all group"
                      >
                        {comment.trim().length > 0 ? 'Publicar con Reseña' : t.detail_rate_confirm.replace('{stars}', rating.toString())}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* LISTA DE RESEÑAS / COMENTARIOS */}
          <section className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between px-2">
              <h4 className={`text-[11px] font-black uppercase tracking-[5px] ${theme.text}`}>OPINIONES ({service.reviews?.length || 0})</h4>
              <MessageSquare size={16} className={theme.accent} />
            </div>

            {service.reviews && service.reviews.length > 0 ? (
              <div className="space-y-4">
                {service.reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((rev) => (
                  <div key={rev.id} className={`p-6 rounded-[35px] border ${theme.card} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'} flex items-center justify-center`}>
                          <UserCircle size={22} className={theme.subtext} />
                        </div>
                        <div>
                          <p className={`text-[13px] font-black uppercase tracking-tight ${theme.text}`}>{rev.userName || 'Usuario'}</p>
                          <p className={`text-[9px] font-bold uppercase opacity-40 ${theme.subtext}`}>{rev.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} fill={rev.rating >= s ? "#FFB800" : "none"} className={rev.rating >= s ? "text-[#FFB800]" : "text-slate-400 opacity-20"} />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className={`text-[12px] font-medium leading-relaxed ${theme.text} opacity-80 pl-2 border-l-2 border-[#FFB800]/30`}>
                        {rev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-10 rounded-[40px] border border-dashed text-center opacity-40 ${isDarkMode ? 'border-white/10' : 'border-slate-300'}`}>
                <p className={`text-[10px] font-black uppercase tracking-[3px] ${theme.text}`}>No hay reseñas aún. ¡Sé el primero!</p>
              </div>
            )}
          </section>

          {/* BOTÓN DE CONTACTO - AL FINAL DEL SCROLL */}
          <section className="pt-4 max-w-md mx-auto">
            <button
              onClick={handleWhatsApp}
              className="relative w-full py-10 rounded-[45px] bg-[#22c35e] shadow-[0_20px_60px_rgba(34,195,94,0.4)] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all overflow-hidden border-t border-white/30"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
              <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/20 shadow-inner">
                <MessageCircle size={40} fill="white" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-[1000] text-white uppercase tracking-tighter leading-none mb-1">{t.detail_contact_btn}</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <p className="text-[13px] font-black text-white/90 uppercase tracking-[4px]">WHATSAPP</p>
                </div>
              </div>
            </button>
          </section>

        </div>
      </div>

      {/* LIGHTBOX / CARRUSEL DE IMÁGENES */}
      {selectedImageIndex !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-xl flex items-center justify-center animate-fade-in touch-none"
          onClick={() => setSelectedImageIndex(null)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Botón Cerrar */}
          <button
            className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-all border border-white/10 z-50 hover:bg-white/20"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X size={24} strokeWidth={3} />
          </button>

          {/* Botón Anterior (Desktop) */}
          <button
            className="absolute left-4 z-40 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all hidden md:flex"
            onClick={handlePrevImage}
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>

          {/* Botón Siguiente (Desktop) */}
          <button
            className="absolute right-4 z-40 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all hidden md:flex"
            onClick={handleNextImage}
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>

          {/* Imagen Actual */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              key={selectedImageIndex} // Key para forzar re-render y animación al cambiar
              src={allImages[selectedImageIndex]}
              className="max-w-full max-h-[85vh] rounded-[20px] object-contain shadow-2xl animate-pop-in select-none"
              onClick={(e) => e.stopPropagation()}
              alt={`Imagen ${selectedImageIndex + 1}`}
              draggable="false"
            />

            {/* Indicador de Posición */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 pointer-events-none">
              {allImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === selectedImageIndex ? 'w-8 bg-[#59CBC8]' : 'w-1.5 bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}


      {/* SHARE MODAL */}
      {
        showShareModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowShareModal(false)}>
            <div className={`w-full max-w-md mx-4 mb-4 sm:mb-0 p-8 rounded-[35px] ${theme.card} border shadow-2xl animate-slide-up`} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-[1000] uppercase tracking-tight ${theme.text}`}>{t.detail_share_title}</h3>
                <button onClick={() => setShowShareModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all">
                  <X size={20} className={theme.text} />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert(t.detail_share_copied);
                    setShowShareModal(false);
                  }}
                  className={`w-full p-5 rounded-[25px] border ${theme.card} flex items-center gap-4 active:scale-95 transition-all group`}
                >
                  <div className="w-12 h-12 bg-slate-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Copy size={20} className="text-slate-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-sm font-black uppercase ${theme.text}`}>{t.detail_share_copy}</p>
                    <p className={`text-xs uppercase tracking-wider ${theme.subtext}`}>{t.detail_share_copy_desc}</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`¡Mira este servicio: ${service.title}!`);
                    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                    setShowShareModal(false);
                  }}
                  className={`w-full p-5 rounded-[25px] border ${theme.card} flex items-center gap-4 active:scale-95 transition-all group`}
                >
                  <div className="w-12 h-12 bg-[#22c35e]/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle size={20} className="text-[#22c35e]" />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-sm font-black uppercase ${theme.text}`}>WhatsApp</p>
                    <p className={`text-xs uppercase tracking-wider ${theme.subtext}`}>{t.detail_share_chat}</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                    setShowShareModal(false);
                  }}
                  className={`w-full p-5 rounded-[25px] border ${theme.card} flex items-center gap-4 active:scale-95 transition-all group`}
                >
                  <div className="w-12 h-12 bg-[#1877F2]/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FacebookIcon size={20} className="text-[#1877F2]" />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-sm font-black uppercase ${theme.text}`}>Facebook</p>
                    <p className={`text-xs uppercase tracking-wider ${theme.subtext}`}>{t.detail_share_wall}</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`¡Mira este servicio: ${service.title}!`);
                    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                    setShowShareModal(false);
                  }}
                  className={`w-full p-5 rounded-[25px] border ${theme.card} flex items-center gap-4 active:scale-95 transition-all group`}
                >
                  <div className="w-12 h-12 bg-[#1DA1F2]/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Twitter size={20} className="text-[#1DA1F2]" />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-sm font-black uppercase ${theme.text}`}>Twitter</p>
                    <p className={`text-xs uppercase tracking-wider ${theme.subtext}`}>{t.detail_share_tweet}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ServiceDetail;
