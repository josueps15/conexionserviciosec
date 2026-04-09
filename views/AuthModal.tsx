
import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, facebookProvider } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { User, UserRole } from '../types';
import { Mail, Lock, User as UserIcon, X, Loader2, LogIn, ChevronRight, Facebook as FacebookIcon } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAuthSuccess: (user: User, isNewUser?: boolean) => void;
    isDarkMode: boolean;
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onAuthSuccess, isDarkMode }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            setTimeout(() => setShouldRender(false), 300);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setName('');
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleSocialLogin = async (providerType: 'google' | 'facebook') => {
        setLoading(true);
        setError('');
        try {
            let user;
            if (providerType === 'google') {
                if (Capacitor.isNativePlatform()) {
                    const result = await FirebaseAuthentication.signInWithGoogle();
                    const credential = GoogleAuthProvider.credential(result.credential?.idToken);
                    const userCred = await signInWithCredential(auth, credential);
                    user = userCred.user;
                } else {
                    const result = await signInWithPopup(auth, googleProvider);
                    user = result.user;
                }
            } else {
                // Fallback for facebook if not fully configured natively
                const result = await signInWithPopup(auth, facebookProvider);
                user = result.user;
            }

            let userRole: UserRole = 'user';
            let fullData: any = {};
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                fullData = userDoc.data();
                if (fullData.role === 'admin') userRole = 'admin';
                await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true });
            } else {
                fullData = {
                    name: user.displayName || 'Socio',
                    email: user.email,
                    role: 'user',
                    avatar: user.photoURL,
                    provider: providerType,
                    lastLogin: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    acceptedTerms: true
                };
                await setDoc(userDocRef, fullData);
            }

            onAuthSuccess({
                id: user.uid,
                email: user.email || '',
                name: fullData.name || 'Usuario',
                role: userRole,
                avatar: fullData.avatar || '',
                isGuest: false
            }, !userDoc.exists());
            onClose();
        } catch (e: any) {
            console.error(e);
            setError('Error al iniciar sesión con redes sociales');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let user;
            if (mode === 'login') {
                const res = await signInWithEmailAndPassword(auth, email, password);
                user = res.user;
            } else {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                user = res.user;
                await setDoc(doc(db, 'users', user.uid), {
                    name,
                    email,
                    role: 'user',
                    createdAt: new Date().toISOString(),
                    acceptedTerms: true
                });
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();

            onAuthSuccess({
                id: user.uid,
                email: user.email || '',
                name: userData?.name || name || 'Usuario',
                role: userData?.role || 'user',
                avatar: userData?.avatar || '',
                isGuest: false
            }, mode === 'register');
            onClose();
        } catch (e: any) {
            console.error(e);
            if (e.code === 'auth/user-not-found') setError('Usuario no encontrado');
            else if (e.code === 'auth/wrong-password') setError('Contraseña incorrecta');
            else if (e.code === 'auth/email-already-in-use') setError('El correo ya está en uso');
            else setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const theme = {
        overlay: 'bg-[#020617]/80 backdrop-blur-md',
        card: isDarkMode ? 'bg-[#0f172a]/95 border-white/10' : 'bg-white border-slate-200 shadow-2xl',
        text: isDarkMode ? 'text-white' : 'text-slate-900',
        subtext: isDarkMode ? 'text-white/60' : 'text-slate-500',
        input: isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-[#59CBC8]' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-[#59CBC8]',
    };

    if (!shouldRender) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`absolute inset-0 ${theme.overlay} transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Card */}
            <div
                className={`relative w-full max-w-[90%] xs:max-w-md ${theme.card} border rounded-[32px] overflow-hidden shadow-2xl p-6 xs:p-8 z-10 transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
            >
                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className={`text-2xl font-black uppercase tracking-tight ${theme.text}`}>
                            {mode === 'login' ? 'Bienvenido' : 'Únete Ahora'}
                        </h3>
                        <p className={`text-xs font-bold uppercase tracking-wider ${theme.subtext}`}>
                            {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta en segundos'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'} transition-all`}
                    >
                        <X size={20} className={theme.text} />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                        <span className="text-red-500 text-xs font-bold">{error}</span>
                    </div>
                )}

                {/* SOCIAL LOGIN */}
                <div className="w-full mb-8">
                    <button
                        onClick={() => handleSocialLogin('google')}
                        className={`w-full h-15 rounded-2xl flex items-center justify-center gap-4 border transition-all active:scale-95 py-4 ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                        <span className={`text-[12px] font-black uppercase tracking-widest ${theme.text}`}>Continuar con Google</span>
                    </button>
                </div>

                <div className="relative mb-8 text-center">
                    <div className={`absolute top-1/2 left-0 right-0 h-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                    <span className={`relative px-4 text-[9px] font-black uppercase tracking-[3px] ${isDarkMode ? 'bg-[#0f172a]' : 'bg-white'} ${theme.subtext}`}>O CON TU CORREO</span>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div className="relative">
                            <UserIcon size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.subtext} opacity-50`} />
                            <input
                                type="text"
                                placeholder="NOMBRE COMPLETO"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full h-14 pl-12 pr-4 rounded-2xl outline-none font-bold text-xs border transition-all ${theme.input} placeholder:opacity-30`}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.subtext} opacity-50`} />
                        <input
                            type="email"
                            placeholder="CORREO ELECTRÓNICO COMPLETO"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full h-14 pl-12 pr-4 rounded-2xl outline-none font-bold text-xs border transition-all ${theme.input} placeholder:opacity-30`}
                        />
                    </div>

                    <div className="relative">
                        <Lock size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.subtext} opacity-50`} />
                        <input
                            type="password"
                            placeholder="CONTRASEÑA"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full h-14 pl-12 pr-4 rounded-2xl outline-none font-bold text-xs border transition-all ${theme.input} placeholder:opacity-30`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-16 rounded-[24px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl mt-6 ${isDarkMode ? 'bg-[#59CBC8] text-slate-900' : 'bg-[#00D1FF] text-white'}`}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <LogIn size={20} strokeWidth={3} />
                                <span className="text-xs font-black uppercase tracking-widest">{mode === 'login' ? 'Entrar Ahora' : 'Crear Cuenta'}</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center px-4">
                    <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="group flex flex-col items-center gap-1 w-full"
                    >
                        <span className={`text-[11px] font-black uppercase tracking-wider ${theme.subtext} transition-colors group-hover:text-[#59CBC8]`}>
                            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya eres socio?'}
                        </span>
                        <span className={`text-[13px] font-black uppercase tracking-[2px] ${isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]'}`}>
                            {mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
