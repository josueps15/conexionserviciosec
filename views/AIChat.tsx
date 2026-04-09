
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';
import { Service, User as UserType } from '../types';

interface Props {
  isDarkMode: boolean;
  onBack: () => void;
  services: Service[];
  user: UserType | null;
  province: string;
  canton: string;
  t: any;
  language: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const AIChat: React.FC<Props> = ({ isDarkMode, onBack, province, canton, t, services }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: `¡Hola! 👋 Soy ServicesBot. Conozco los mejores servicios en ${canton}. ¿Qué necesitas encontrar hoy?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyOpen = window.visualViewport ? window.visualViewport.height < window.innerHeight * 0.85 : false;
      setIsKeyboardOpen(isCurrentlyOpen);
      if (isCurrentlyOpen) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  }, [messages, isLoading, isKeyboardOpen]);

  // Generar contexto de conocimiento local basado en las categorías y servicios reales
  const knowledgeContext = useMemo(() => {
    try {
      const safeServices = services || [];
      const cantonClean = canton || '';
      const localServices = safeServices.filter(s => s?.canton === cantonClean && s?.status === 'active');
      const categoriesCount = safeServices.reduce((acc, s) => {
        if (s?.canton === cantonClean && s?.category) {
          acc[s.category] = (acc[s.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topCats = Object.entries(categoriesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([n, c]) => `${n}:${c}`)
        .join('|');

      // Formato ultra-compacto para ahorrar tokens y mejorar estabilidad
      return `APP:ConexiónServicios|LOC:${cantonClean},Ecuador|SvcActivos:${localServices.length}|TopCats:${topCats || 'Varios'}|Registro:WhatsApp +593 98 724 6441 (Admin Matriz).`;
    } catch (e) {
      return "Experto Local Conexión Servicios.";
    }
  }, [services, canton]);

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userInput };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    setTimeout(() => {
        inputRef.current?.focus();
    }, 10);

    let retryCount = 0;
    const maxRetries = 2;
    const backoffTimes = [1000, 3000];

    while (retryCount <= maxRetries) {
      try {
        const recentMessages = messages.slice(-6);
        const groqMessages = [
          { 
            role: 'system', 
            content: `Eres "ServicesBot", experto en ${canton}, Ecuador. ${knowledgeContext} 
            Instrucciones: Se breve, amable y profesional. Si preguntan por registro, dar el WhatsApp de admin. 
            Si un servicio no está en el catálogo, sugiere buscar por categoría en el inicio.` 
          },
          ...recentMessages.map(m => ({ 
            role: m.role === 'model' ? 'assistant' : 'user', 
            content: m.content 
          })),
          { role: 'user', content: userInput }
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
          },
          body: JSON.stringify({
            messages: groqMessages,
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        const data = await response.json();
        
        if (response.status === 429) {
          if (retryCount < maxRetries) {
            await wait(backoffTimes[retryCount]);
            retryCount++;
            continue;
          } else {
            setMessages(prev => [...prev, { 
              id: Date.now().toString(), 
              role: 'model', 
              content: '¡Huy! Estamos procesando muchas solicitudes. Por favor, intenta de nuevo en un momento.' 
            }]);
            break;
          }
        }

        const botContent = data.choices?.[0]?.message?.content || 'No pude procesar esa consulta ahora mismo.';
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: botContent }]);
        break; 
      } catch (error) {
        console.error(error);
        if (retryCount === maxRetries) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: 'Lo siento, hubo un error de conexión con el servidor.' }]);
        }
        await wait(1000);
        retryCount++;
      }
    }
    
    setIsLoading(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const theme = {
    bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
    headerBg: isDarkMode ? 'bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#B45309]' : 'bg-[#FFB800]',
    text: isDarkMode ? 'text-white' : 'text-[#0F172A]',
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${theme.bg} animate-page-in ${isKeyboardOpen ? 'pb-2' : 'pb-24'}`}>
      {/* Header Compacto */}
      <div className={`relative ${theme.headerBg} ${isKeyboardOpen ? 'pt-6 pb-2' : 'pt-12 pb-6'} px-6 rounded-b-[35px] shadow-2xl z-20 transition-all duration-300`}>
        <div className="flex items-center relative z-10">
          <button onClick={onBack} className={`${isKeyboardOpen ? 'w-8 h-8' : 'w-11 h-11'} flex items-center justify-center bg-black/20 backdrop-blur-md rounded-xl border border-white/20 active:scale-90 transition-all shrink-0`}>
            <ArrowLeft size={isKeyboardOpen ? 16 : 20} className="text-white" strokeWidth={3} />
          </button>
          <div className="flex-1 text-center px-1">
            <h1 className={`${isKeyboardOpen ? 'text-sm' : 'text-lg'} text-white font-[1000] uppercase tracking-[1px] leading-none mb-1 transition-all`}>{t.ai_support_title}</h1>
            {!isKeyboardOpen && (
              <div className="flex items-center justify-center gap-1 opacity-80 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-white text-[8px] font-black uppercase tracking-widest">{t.ai_status_online.replace('{canton}', canton)}</span>
              </div>
            )}
          </div>
          <div className={`${isKeyboardOpen ? 'w-8' : 'w-11'} h-11`}></div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4 hide-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm shrink-0 ${msg.role === 'user' ? (isDarkMode ? 'bg-white/10 border-white/10' : 'bg-slate-200 border-slate-300') : 'bg-[#FFB800] border-[#FFB800] text-[#0F172A]'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-[22px] shadow-sm border ${msg.role === 'user' ? (isDarkMode ? 'bg-[#59CBC8] border-[#59CBC8] text-[#0F172A] rounded-tr-none' : 'bg-[#00D1FF] border-[#00D1FF] text-[#0F172A] rounded-tr-none') : (isDarkMode ? 'bg-white/5 border-white/10 text-white rounded-tl-none' : 'bg-white border-slate-100 text-slate-900 rounded-tl-none')}`}>
              <p className="text-[13px] leading-relaxed font-medium">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Bot size={16} className="text-white/40" />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-[22px] rounded-tl-none">
              <Loader2 size={16} className="animate-spin text-white/40" />
            </div>
          </div>
        )}
        <div className="h-16" /> {/* Espaciador optimizado para balancear el chat */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Consulta - ULTRA REFINADO */}
      <div className={`absolute left-0 right-0 z-30 transition-all duration-300 flex justify-center ${isKeyboardOpen ? 'pb-2 px-2' : 'pb-[72px] px-4'}`} style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className={`flex items-center gap-2 ${isDarkMode ? 'bg-[#1e293b]/95' : 'bg-white/95'} backdrop-blur-xl border border-white/10 rounded-full ${isKeyboardOpen ? 'p-1 pl-4 h-10' : 'p-2 pl-5 h-12'} shadow-2xl w-full max-w-[340px] mx-auto`}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.ai_placeholder}
            className={`flex-1 bg-transparent border-none outline-none ${theme.text} font-bold placeholder:opacity-40 min-w-0 ${isKeyboardOpen ? 'text-xs' : 'text-sm'}`}
          />
          <button
            onPointerDown={(e) => e.preventDefault()}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`${isKeyboardOpen ? 'w-8 h-8' : 'w-10 h-10'} shrink-0 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#FF9000] flex items-center justify-center text-[#0F172A] shadow-lg active:scale-95 transition-all disabled:opacity-30`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={isKeyboardOpen ? 14 : 18} strokeWidth={3} className="ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
