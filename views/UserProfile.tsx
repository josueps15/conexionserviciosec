
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { ArrowLeft, Camera as LucideCamera, LogOut, Trash2, Save, User as UserIcon, Calendar, Mail, AlertTriangle, Shield, Settings, Palette, Globe, ChevronRight, Moon, Sun, Monitor } from 'lucide-react';
import { auth, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import imageCompression from 'browser-image-compression';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheet, ActionSheetOptionStyle } from '@capacitor/action-sheet';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { googleProvider } from '../firebase';
import Cropper from 'react-easy-crop';

// Helper para procesar el recorte de la imagen
const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject();

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob((blob) => {
                if (!blob) return reject();
                resolve(blob);
            }, 'image/jpeg', 0.8);
        };
        image.onerror = (e) => reject(e);
    });
};

interface Props {
    user: User | null;
    onBack: () => void;
    onLogout: () => void;
    onUpdateUser: (data: Partial<User>) => Promise<void>;
    onDeleteAccount: () => Promise<void>;
    isDarkMode: boolean;
    onAdmin?: () => void;
    onLogin?: () => void;
    onToggleTheme?: () => void;
    onToggleFooter?: (visible: boolean) => void;
    onRegisterBackHandler?: (handler: (() => void) | null) => void;
    language: 'es' | 'en';
    t: any;
    onChangeLanguage: (lang: 'es' | 'en') => void;
    onViewLegal?: (type: 'terms' | 'privacy') => void;
    themeMode?: 'light' | 'dark' | 'system';
    setThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
    canton?: string;
    province?: string;
}


const UserProfile: React.FC<Props> = ({ user, onBack, onLogout, onUpdateUser, onDeleteAccount, isDarkMode, onAdmin, onLogin, onToggleTheme, onToggleFooter, onRegisterBackHandler, language, t, onChangeLanguage, onViewLegal, themeMode, setThemeMode, canton, province }) => {
    // Navigation State
    const [currentView, setCurrentView] = useState<'menu' | 'edit' | 'security' | 'settings' | 'theme' | 'password'>('menu');

    // Edit Profile State
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [dob, setDob] = useState((user as any)?.dob || '');

    // Cropper State
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Password Change State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to top when view changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [currentView]);

    const themeStyles = {
        bg: isDarkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]',
        text: isDarkMode ? 'text-white' : 'text-[#0f172a]',
        subtext: isDarkMode ? 'text-white/60' : 'text-[#64748b]',
        card: isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm',
        input: isDarkMode ? 'bg-white/5 border-white/10 text-white focus:border-[#59CBC8]' : 'bg-white border-slate-200 text-slate-900 focus:border-[#59CBC8] shadow-sm',
        itemBg: isDarkMode ? 'bg-slate-800' : 'bg-[#00D1FF]',
        iconColor: isDarkMode ? 'text-[#59CBC8]' : 'text-white',
    };

    // Modal State
    const [modal, setModal] = useState<{
        visible: boolean;
        type: 'alert' | 'confirm' | 'prompt' | 'password' | 'actions';
        title: string;
        message: string;
        status?: 'success' | 'error' | 'warning' | 'info';
        onConfirm?: (value?: string) => void;
        inputValue?: string;
        options?: { title: string; style?: 'default' | 'destructive' | 'cancel'; icon?: any }[];
    }>({
        visible: false,
        type: 'alert',
        title: '',
        message: ''
    });

    const closeModal = () => setModal(prev => ({ ...prev, visible: false }));

    const showAlert = (title: string, message: string, status: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setModal({
            visible: true,
            type: 'alert',
            title,
            message,
            status,
            onConfirm: closeModal
        });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setModal({
            visible: true,
            type: 'confirm',
            title,
            message,
            status: 'warning',
            onConfirm: () => {
                onConfirm();
                closeModal();
            }
        });
    };

    const showPrompt = (title: string, message: string, onConfirm: (val: string) => void, isPassword = false) => {
        setModal({
            visible: true,
            type: isPassword ? 'password' : 'prompt',
            title,
            message,
            status: isPassword ? 'info' : 'error',
            inputValue: '',
            onConfirm: (val) => {
                onConfirm(val || '');
                // We let the callback decide if it wants to stay open or close
            }
        });
    };

    const showPhotoActions = (onSelect: (index: number) => void) => {
        setModal({
            visible: true,
            type: 'actions',
            title: t.profile_edit,
            message: language === 'es' ? 'Gestionar foto de perfil' : 'Manage profile photo',
            options: [
                { title: language === 'es' ? 'Tomar Foto' : 'Take Photo', style: 'default', icon: <LucideCamera size={18} /> },
                { title: language === 'es' ? 'Elegir de Galería' : 'Choose from Gallery', style: 'default', icon: <Palette size={18} /> },
                { title: language === 'es' ? 'Quitar Foto' : 'Remove Photo', style: 'destructive', icon: <Trash2 size={18} /> },
                { title: t.cancel, style: 'cancel' }
            ],
            onConfirm: (idxStr) => {
                onSelect(parseInt(idxStr || '0'));
                closeModal();
            }
        });
    };

    // Back Handler Fix
    useEffect(() => {
        if (!onRegisterBackHandler) return;

        if (modal.visible) {
            onRegisterBackHandler(closeModal);
        } else if (currentView !== 'menu') {
            onRegisterBackHandler(() => setCurrentView('menu'));
        } else {
            onRegisterBackHandler(null);
        }

        return () => onRegisterBackHandler(null);
    }, [currentView, onRegisterBackHandler, modal.visible]);

    if (!user) {
        return (
            <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-all duration-500 ${themeStyles.bg}`}>
                <div className="w-24 h-24 rounded-[35px] bg-[#59CBC8]/10 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-[#59CBC8]/20 blur-2xl rounded-full"></div>
                    <UserIcon size={48} className="text-[#59CBC8] relative z-10" />
                </div>
                <h3 className={`text-3xl font-[1000] uppercase tracking-tighter mb-4 ${themeStyles.text}`}>
                    {t.profile_guest_title_1}<br />
                    <span className="text-[#59CBC8]">{t.profile_guest_title_2}</span>
                </h3>
                <p className={`text-sm font-medium leading-relaxed mb-10 opacity-60 max-w-[280px] ${themeStyles.subtext}`}>
                    {t.profile_guest_desc}
                </p>
                <button
                    onClick={onLogin}
                    className="w-full max-w-xs py-5 rounded-full bg-[#59CBC8] text-slate-900 font-[1000] text-sm uppercase tracking-[2px] shadow-[0_10px_25px_rgba(89,203,200,0.4)] active:scale-95 transition-all"
                >
                    {t.profile_guest_btn}
                </button>
            </div>
        );
    }

    // Effect to hide footer when cropping or modal is visible
    useEffect(() => {
        if (onToggleFooter) {
            onToggleFooter(!showCropper && !modal.visible);
        }
    }, [showCropper, modal.visible, onToggleFooter]);

    // ... (Keep existing image handling functions: handlePhotoSelection, onCropComplete, applyCrop, handleFileChange, handleSave, handleRemovePhoto, confirmDelete) ...
    // RE-IMPLEMENTING THEM FOR CONTEXT BUT KEEPING LOGIC
    const handlePhotoSelection = () => {
        showPhotoActions(async (index) => {
            try {
                if (index === 0) {
                    const image = await CapacitorCamera.getPhoto({
                        quality: 90,
                        allowEditing: false,
                        resultType: CameraResultType.Uri,
                        source: CameraSource.Camera
                    });
                    if (image.webPath) {
                        setTempImage(image.webPath);
                        setShowCropper(true);
                    }
                } else if (index === 1) {
                    const image = await CapacitorCamera.getPhoto({
                        quality: 90,
                        allowEditing: false,
                        resultType: CameraResultType.Uri,
                        source: CameraSource.Photos
                    });
                    if (image.webPath) {
                        setTempImage(image.webPath);
                        setShowCropper(true);
                    }
                } else if (index === 2) {
                    handleRemovePhoto();
                }
            } catch (e) {
                console.error("Camera Error:", e);
            }
        });
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const applyCrop = async () => {
        if (!tempImage || !croppedAreaPixels) return;
        setLoading(true);
        try {
            const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
            const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setAvatarFile(file);
            setAvatar(URL.createObjectURL(croppedBlob));
            setShowCropper(false);
            setTempImage(null);
        } catch (e) {
            console.error("Crop error:", e);
            showAlert("Error", language === 'es' ? "Error al procesar el recorte" : "Error processing crop", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let photoURL = avatar;
            if (avatarFile) {
                try {
                    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
                    const compressed = await imageCompression(avatarFile, options);

                    if (user.avatar && (user.avatar.includes('firebasestorage') || user.avatar.includes('avatars/'))) {
                        try {
                            const oldRef = ref(storage, user.avatar);
                            await deleteObject(oldRef);
                        } catch (e) { console.warn(e); }
                    }

                    const extension = avatarFile.name.split('.').pop() || 'jpg';
                    const storageRef = ref(storage, `avatars/${user.id}_${Date.now()}.${extension}`);

                    const metadata = { contentType: avatarFile.type || 'image/jpeg' };
                    const snapshot = await uploadBytes(storageRef, compressed, metadata);
                    photoURL = await getDownloadURL(snapshot.ref);
                } catch (storageError: any) {
                    showAlert("Upload Error", storageError.message, 'error');
                    setLoading(false);
                    return;
                }
            }

            await onUpdateUser({
                name,
                avatar: photoURL,
                dob: dob
            } as any);
            showAlert(language === 'es' ? "¡Éxito!" : "Success!", t.profile_save_success, 'success');
            setCurrentView('menu'); // Go back to menu after save
        } catch (error: any) {
            console.error("General Update Error:", error);
            showAlert("Error", error.message, 'error');
        } finally {
            setLoading(false);
        }
    };



    // Sync avatar state with props
    useEffect(() => {
        if (user?.avatar !== undefined) {
            setAvatar(user.avatar || '');
        }
    }, [user?.avatar]);

    const handleRemovePhoto = async () => {
        if (!user) return;

        // Optimistic update: clear UI immediately
        const previousAvatar = avatar;
        setAvatar('');
        setAvatarFile(null);
        setTempImage(null);

        try {
            // Delete from storage if necessary
            if (previousAvatar && (previousAvatar.includes('firebasestorage') || previousAvatar.includes('avatars/'))) {
                try {
                    const avatarRef = ref(storage, previousAvatar);
                    await deleteObject(avatarRef);
                } catch (e) {
                    console.warn("Storage deletion warning:", e);
                }
            }

            // Update database
            await onUpdateUser({ avatar: '' });
            showAlert(language === 'es' ? "¡Éxito!" : "Success!", language === 'es' ? "Foto eliminada" : "Photo removed", 'success');
        } catch (error) {
            console.error("Error removing photo:", error);
            // Rollback if critical (optional, but here we just alert)
            showAlert("Error", language === 'es' ? "Error al eliminar la foto" : "Error removing photo", 'error');
        }
    };

    const confirmDelete = () => {
        showPrompt(
            t.profile_delete,
            t.profile_delete_prompt,
            async (input) => {
                if (input.toLowerCase() === t.profile_delete_keyword) {
                    const currentUser = auth.currentUser;
                    if (!currentUser) {
                        closeModal();
                        return;
                    }

                    const provider = currentUser.providerData[0]?.providerId || 'password';

                    if (provider === 'password') {
                        // Re-identificación para usuarios de email
                        // Mostramos el segundo prompt SIN cerrar el modal actual aún
                        showPrompt(
                            language === 'es' ? "Verifica tu Identidad" : "Verify Identity",
                            language === 'es' ? "Por seguridad, confirma tu contraseña actual:" : "For security, confirm your current password:",
                            async (pass) => {
                                if (!pass) return;
                                setLoading(true);
                                try {
                                    const credential = EmailAuthProvider.credential(currentUser.email!, pass);
                                    await reauthenticateWithCredential(currentUser, credential);
                                    await onDeleteAccount();
                                    showAlert(language === 'es' ? "Cuenta Eliminada" : "Account Deleted", language === 'es' ? "Tu cuenta ha sido borrada permanentemente." : "Your account has been permanently deleted.", 'success');
                                } catch (error: any) {
                                    console.error(error);
                                    if (error.code === 'auth/wrong-password') {
                                        showAlert("Error", language === 'es' ? "Contraseña incorrecta" : "Incorrect password", 'error');
                                    } else {
                                        showAlert("Error", error.message, 'error');
                                    }
                                } finally {
                                    setLoading(false);
                                }
                            },
                            true // isPassword = true
                        );
                    } else if (provider === 'google.com') {
                        // Re-identificación para usuarios de Google
                        showConfirm(
                            language === 'es' ? "Verificación de Google" : "Google Verification",
                            language === 'es' ? "Para continuar, debemos verificar tu cuenta de Google." : "To continue, we must verify your Google account.",
                            async () => {
                                setLoading(true);
                                try {
                                    if (Capacitor.isNativePlatform()) {
                                        await FirebaseAuthentication.signOut();
                                        await FirebaseAuthentication.signInWithGoogle();
                                    } else {
                                        await signInWithPopup(auth, googleProvider);
                                    }

                                    await onDeleteAccount();
                                    showAlert(language === 'es' ? "Cuenta Eliminada" : "Account Deleted", language === 'es' ? "Tu cuenta ha sido borrada permanentemente." : "Your account has been permanently deleted.", 'success');
                                } catch (error: any) {
                                    console.error(error);
                                    showAlert("Error", error.message, 'error');
                                } finally {
                                    setLoading(false);
                                }
                            }
                        );
                    } else {
                        // Fallback delete (might fail with requires-recent-login)
                        setLoading(true);
                        try {
                            await onDeleteAccount();
                            closeModal();
                        } catch (error: any) {
                            if (error.code === 'auth/requires-recent-login') {
                                showAlert(language === 'es' ? "Seguridad" : "Security", language === 'es' ? "Por seguridad, cierra sesión e inicia nuevamente para eliminar tu cuenta." : "For security, log out and log back in to delete your account.", 'warning');
                            } else {
                                showAlert("Error", error.message, 'error');
                            }
                        } finally {
                            setLoading(false);
                        }
                    }
                } else {
                    showAlert("Error", t.profile_delete_error, 'error');
                }
            }
        );
    };

    const handleUpdatePassword = async () => {
        if (!auth.currentUser) return;
        if (!oldPassword || !newPassword || !confirmPassword) {
            showAlert("Info", language === 'es' ? 'Por favor completa todos los campos' : 'Please complete all fields', 'info');
            return;
        }
        if (newPassword !== confirmPassword) {
            showAlert("Error", language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showAlert("Error", language === 'es' ? 'La nueva contraseña debe tener al menos 6 caracteres' : 'New password must be at least 6 characters', 'error');
            return;
        }

        setPasswordLoading(true);
        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email!, oldPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            showAlert(language === 'es' ? "¡Éxito!" : "Success!", t.profile_pass_success, 'success');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setCurrentView('security');
        } catch (error: any) {
            console.error("Password Error:", error);
            if (error.code === 'auth/wrong-password') {
                showAlert("Error", language === 'es' ? 'La contraseña actual es incorrecta' : 'The current password is incorrect', 'error');
            } else {
                showAlert("Error", error.message, 'error');
            }
        } finally {
            setPasswordLoading(false);
        }
    };


    // GUEST VIEW HANDLER (Keep existing)
    if (!user || user.isGuest) {
        // ... (Keep existing guest logic, pasting it for completeness but usually I'd reference it if I could partial replace. Since I'm replacing the whole component I must include it)
        return (
            <div className={`flex-1 flex flex-col h-full relative ${themeStyles.bg} overflow-hidden`}>
                <div className="absolute inset-0 z-0 text-white">
                    <img src="/professionals.png" alt="Background" className="w-full h-full object-cover opacity-50" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-[#020617] via-[#020617]/40 to-transparent' : 'from-slate-50 via-slate-50/40 to-transparent'}`}></div>
                </div>
                <div className="relative z-10 flex flex-col h-full px-8 pb-32 pt-12">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={onBack} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${themeStyles.card} active:scale-95 transition-all shadow-xl`}>
                            <ArrowLeft size={20} className={themeStyles.text} />
                        </button>

                        <h1 className="text-[14px] xs:text-[16px] font-[1000] tracking-tighter italic leading-none select-none whitespace-nowrap">
                            <span className={isDarkMode ? 'text-white' : 'text-[#0f172a]'}>CONEXIÓN </span>
                            <span className={isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]'}>SERVICIOS</span>
                        </h1>

                        <div className="w-12"></div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end items-center text-center animate-page-in space-y-4 pb-6">
                        <div className={`w-24 h-24 rounded-[30px] flex items-center justify-center border shadow-2xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-slate-200'}`}>
                            <UserIcon size={40} className={isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]'} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-2">
                            <h2 className={`text-3xl font-[1000] uppercase tracking-tighter leading-none ${themeStyles.text}`}>
                                {t.profile_join}<br />
                                <span className={isDarkMode ? 'text-[#59CBC8]' : 'text-[#00D1FF]'}>Conexión</span>
                            </h2>
                            <p className={`text-[13px] font-medium leading-relaxed max-w-xs mx-auto ${themeStyles.subtext}`}>
                                Regístrate para guardar tus favoritos, calificar profesionales y acceder a promociones exclusivas.
                            </p>
                        </div>
                        <div className="w-full space-y-4 max-w-xs pt-2">
                            <button onClick={onLogin} className={`w-full py-4 rounded-[22px] font-black uppercase tracking-[3px] text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center ${isDarkMode ? 'bg-[#59CBC8] text-[#020617]' : 'bg-[#00D1FF] text-white'}`}>
                                Iniciar Sesión / Registrarse
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // INTERNAL NAVIGATION HELPER
    const renderContent = () => {
        switch (currentView) {
            case 'edit':
                return (
                    <div className="px-6 pb-6 max-w-lg mx-auto w-full space-y-5 animate-page-in">
                        {/* AVATAR UPLOAD */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={handlePhotoSelection}>
                                <div className={`w-32 h-32 rounded-full border-[6px] ${isDarkMode ? 'border-[#00E7DB]' : 'border-[#00D1FF]'} p-1 flex items-center justify-center ${isDarkMode ? 'bg-white/5 shadow-2xl' : 'bg-white shadow-xl'} overflow-hidden transition-transform active:scale-95`}>
                                    <img src={avatar || 'https://ui-avatars.com/api/?name=' + user.name} className="w-full h-full rounded-full object-cover" alt="Profile" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#59CBC8] rounded-full flex items-center justify-center text-slate-900 shadow-lg border-2 border-[#020617] active:scale-90 transition-all z-10">
                                    <LucideCamera size={18} strokeWidth={2.5} />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>

                        {/* FORM */}
                        <div className="space-y-5">
                            <div>
                                <label className={`text-[10px] font-black uppercase tracking-[2px] mb-2 block ${themeStyles.subtext}`}>{t.profile_full_name}</label>
                                <div className="relative">
                                    <UserIcon size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeStyles.subtext} opacity-50`} />
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={`w-full py-4 pl-12 pr-4 rounded-[20px] outline-none font-bold text-sm border transition-all ${themeStyles.input}`} placeholder={t.auth_name} autoCorrect="on" autoCapitalize="words" spellCheck={true} />
                                </div>
                            </div>


                            <div>
                                <label className={`text-[10px] font-black uppercase tracking-[2px] mb-2 block ${themeStyles.subtext}`}>{t.auth_email}</label>
                                <div className="relative opacity-60">
                                    <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeStyles.subtext} opacity-50`} />
                                    <input type="email" value={user.email} readOnly className={`w-full py-4 pl-12 pr-4 rounded-[20px] outline-none font-bold text-sm border transition-all ${themeStyles.input}`} />
                                </div>
                            </div>



                            <button onClick={handleSave} disabled={loading} className="w-full h-16 bg-[#59CBC8] rounded-[25px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_30px_rgba(89,203,200,0.3)] mt-4">
                                {loading ? <span className="animate-spin w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full"></span> : <><Save size={20} className="text-slate-900" strokeWidth={2.5} /><span className="text-slate-900 text-sm font-[1000] uppercase tracking-widest">{t.save}</span></>}
                            </button>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="px-5 pb-4 space-y-4 animate-page-in">
                        <div className={`p-4 rounded-[25px] ${themeStyles.card} flex items-center gap-4 border-b-4 border-b-[#59CBC8]/20`}>
                            <div className="w-12 h-12 rounded-2xl bg-[#59CBC8]/10 flex items-center justify-center text-[#59CBC8] shadow-inner flex-shrink-0">
                                <Shield size={26} />
                            </div>
                            <div>
                                <h3 className={`font-black uppercase tracking-tight text-sm ${themeStyles.text}`}>{t.profile_security_center}</h3>
                                <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${themeStyles.subtext}`}>{t.profile_protect_access}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className={`text-[10px] font-black uppercase tracking-[4px] mb-3 ${themeStyles.subtext} ml-2`}>AUTENTICACIÓN</h4>
                            <div className={`rounded-[25px] ${themeStyles.card} overflow-hidden divide-y divide-white/5`}>
                                <button
                                    onClick={() => setCurrentView('password')}
                                    className={`w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors active:bg-white/5`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[#59CBC8] shadow-lg`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        </div>
                                        <div className="text-left">
                                            <h4 className={`font-bold text-sm ${themeStyles.text}`}>{t.profile_update_pass}</h4>
                                            <p className={`text-[9px] font-bold uppercase opacity-50 ${themeStyles.subtext}`}>{t.profile_update_access_key}</p>
                                        </div>
                                    </div>
                                    <div className="opacity-30"><ArrowLeft size={18} className="rotate-180" /></div>
                                </button>
                            </div>
                        </div>

                        <p className={`text-center text-[10px] font-bold uppercase tracking-[2px] ${themeStyles.subtext} pt-2 px-8 leading-relaxed opacity-40`}>
                            Tus datos están protegidos bajo estándares internacionales de seguridad.
                        </p>
                    </div>
                );

            case 'password':
                return (
                    <div className="px-6 space-y-5 animate-page-in max-w-lg mx-auto w-full">
                        <div className="text-center space-y-2">
                            <h3 className={`text-2xl font-[1000] uppercase tracking-tighter ${themeStyles.text}`}>Actualizar Contraseña</h3>
                            <p className={`text-[10px] font-black uppercase tracking-[3px] opacity-60 ${themeStyles.subtext}`}>Introduce tus nuevas credenciales</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className={`text-[10px] font-black uppercase tracking-[2px] mb-2 block ${themeStyles.subtext} ml-2`}>Contraseña Actual</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={e => setOldPassword(e.target.value)}
                                        className={`w-full py-5 pl-14 pr-4 rounded-[25px] outline-none font-bold text-sm border transition-all ${themeStyles.input}`}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="h-[1px] bg-white/5 mx-4"></div>

                            <div>
                                <label className={`text-[10px] font-black uppercase tracking-[2px] mb-2 block ${themeStyles.subtext} ml-2`}>Nueva Contraseña</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#59CBC8] opacity-60"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 10 2 2m0-2-2 2M5 20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3a2 2 0 0 1-2-2 2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v13Z" /></svg></div>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className={`w-full py-5 pl-14 pr-4 rounded-[25px] outline-none font-bold text-sm border transition-all ${themeStyles.input}`}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`text-[10px] font-black uppercase tracking-[2px] mb-2 block ${themeStyles.subtext} ml-2`}>Confirmar Nueva Contraseña</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#59CBC8] opacity-60"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className={`w-full py-5 pl-14 pr-4 rounded-[25px] outline-none font-bold text-sm border transition-all ${themeStyles.input}`}
                                        placeholder="Repite tu nueva clave"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleUpdatePassword}
                                disabled={passwordLoading}
                                className="w-full h-20 bg-[#59CBC8] rounded-[30px] flex flex-col items-center justify-center active:scale-95 transition-all shadow-[0_15px_40px_rgba(89,203,200,0.3)] mt-4 group"
                            >
                                {passwordLoading ? (
                                    <span className="animate-spin w-6 h-6 border-3 border-slate-900 border-t-transparent rounded-full"></span>
                                ) : (
                                    <span className="text-slate-900 text-[13px] font-[1000] uppercase tracking-[4px]">{t.profile_update_now}</span>
                                )}
                            </button>
                        </div>

                        <div className={`p-6 rounded-[25px] bg-slate-800/20 border border-white/5 flex gap-4 items-start`}>
                            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-1" />
                            <p className={`text-[10px] font-bold leading-relaxed ${themeStyles.subtext}`}>
                                {t.profile_session_note}
                            </p>
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="px-5 pb-4 space-y-4 animate-page-in pt-2">
                        {/* Idioma Section */}
                        <div className="space-y-2">
                            <h4 className={`text-[10px] font-black uppercase tracking-[2px] mb-1 ${themeStyles.subtext} ml-2`}>
                                {t.settings_lang}
                            </h4>
                            <div className={`rounded-[25px] ${themeStyles.card} overflow-hidden divide-y divide-white/5 shadow-xl`}>
                                <button
                                    onClick={() => onChangeLanguage('es')}
                                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${language === 'es' ? 'text-[#59CBC8]' : 'text-slate-500'} group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg`}>
                                            <Globe size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black text-sm uppercase tracking-tight ${themeStyles.text}`}>Español</p>
                                            <p className={`text-[9px] font-black uppercase tracking-[2px] mt-0.5 ${language === 'es' ? 'text-[#59CBC8]' : 'text-slate-500/50'}`}>
                                                {t.settings_lang_default}
                                            </p>
                                        </div>
                                    </div>
                                    {language === 'es' && (
                                        <div className="w-5 h-5 rounded-full border-2 border-[#59CBC8] flex items-center justify-center p-1 bg-[#59CBC8]/10">
                                            <div className="w-full h-full rounded-full bg-[#59CBC8]"></div>
                                        </div>
                                    )}
                                </button>
                                <button
                                    onClick={() => onChangeLanguage('en')}
                                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${language === 'en' ? 'text-[#59CBC8]' : 'text-slate-500'} group-hover:scale-110 transition-transform flex-shrink-0`}>
                                            <Globe size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black text-sm uppercase tracking-tight ${themeStyles.text}`}>English</p>
                                            <p className={`text-[9px] font-black uppercase tracking-[2px] mt-0.5 ${language === 'en' ? 'text-[#59CBC8]' : 'text-slate-500/50'}`}>
                                                {language === 'en' ? t.settings_lang_selected : t.settings_lang_config}
                                            </p>
                                        </div>
                                    </div>
                                    {language === 'en' && (
                                        <div className="w-5 h-5 rounded-full border-2 border-[#59CBC8] flex items-center justify-center p-1 bg-[#59CBC8]/10">
                                            <div className="w-full h-full rounded-full bg-[#59CBC8]"></div>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Gestión de Cuenta Section */}
                        <div className="space-y-2">
                            <h4 className={`text-[10px] font-black uppercase tracking-[2px] mb-1 ${themeStyles.subtext} ml-2`}>
                                {t.settings_security}
                            </h4>
                            <div className={`rounded-[25px] ${themeStyles.card} overflow-hidden divide-y divide-white/5 shadow-xl`}>
                                <button onClick={onLogout} className={`w-full p-4 flex items-center justify-between hover:bg-red-500/5 transition-all group`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shadow-lg border border-red-500/10">
                                            <LogOut size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-sm uppercase tracking-tight text-red-500">{t.profile_logout}</p>
                                            <p className="text-[9px] font-black text-red-500/40 uppercase tracking-[2px] mt-0.5">{t.profile_logout_note}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-red-500/30" />
                                </button>
                                <button onClick={confirmDelete} className={`w-full p-4 flex items-center justify-between hover:bg-red-500/5 transition-all group`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center text-red-500/60 group-hover:scale-110 transition-transform">
                                            <Trash2 size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-sm uppercase tracking-tight text-red-500/60">{t.profile_delete}</p>
                                            <p className="text-[9px] font-black text-red-500/30 uppercase tracking-[2px] mt-0.5">{t.profile_delete_note}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-red-500/20" />
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'theme':
                return (
                    <div className="px-5 pb-4 space-y-4 animate-page-in pt-2">
                        {/* Phone Preview */}
                        <div className="flex justify-center py-2">
                            <div className={`w-36 h-[240px] rounded-[30px] border-[6px] ${isDarkMode ? 'border-[#1e293b]' : 'border-slate-800'} relative overflow-hidden shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-500`}>
                                <div className={`absolute inset-0 transition-colors duration-700 ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'}`}></div>
                                <div className="absolute top-0 left-0 right-0 h-5 px-3 flex items-center justify-between z-20">
                                    <span className={`text-[7px] font-black ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>12:45</span>
                                    <div className="flex items-center gap-0.5 opacity-40">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-white' : 'bg-slate-900'}`}></div>
                                        <div className={`w-2.5 h-1.5 rounded-[2px] border ${isDarkMode ? 'border-white' : 'border-slate-900'}`}></div>
                                    </div>
                                </div>
                                <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full ${isDarkMode ? 'bg-[#1e293b]' : 'bg-slate-800'} z-30`}></div>
                                <div className="p-2 pt-6 space-y-2 relative z-10 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`w-4 h-4 rounded-md ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} border border-white/10`}></div>
                                        <div className={`h-1.5 w-12 rounded-full ${isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]'} opacity-30`}></div>
                                        <div className={`w-4 h-4 rounded-md ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} border border-white/10`}></div>
                                    </div>
                                    <div className={`w-full h-6 rounded-lg ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} border flex items-center px-1.5 gap-1.5`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]'}`}></div>
                                        <div className={`h-1 w-10 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[1,2,3].map(i => (
                                            <div key={i} className={`w-6 h-6 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} border border-white/5 flex items-center justify-center`}>
                                                <div className={`w-2.5 h-2.5 rounded-full ${i===1 ? (isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]') : (isDarkMode ? 'bg-white/10' : 'bg-slate-100')}`}></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`flex-1 rounded-[16px] ${isDarkMode ? 'bg-[#59CBC8]/5 border-[#59CBC8]/20' : 'bg-white border-slate-200 shadow-md'} border overflow-hidden p-1.5 flex flex-col gap-1.5`}>
                                        <div className={`h-12 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-[#59CBC8]/20 to-transparent' : 'bg-gradient-to-br from-[#00D1FF]/10 to-transparent'}`}></div>
                                        <div className="space-y-1 px-1">
                                            <div className={`h-1.5 w-12 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-slate-300'}`}></div>
                                            <div className={`h-1 w-8 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`}></div>
                                        </div>
                                    </div>
                                    <div className={`absolute bottom-0 left-0 right-0 h-8 ${isDarkMode ? 'bg-[#020617]/80' : 'bg-white/80'} backdrop-blur-sm border-t border-white/5 flex items-center justify-around px-3`}>
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className={`w-1 h-1 rounded-full ${i===2 ? (isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]') : (isDarkMode ? 'bg-white/20' : 'bg-slate-300')}`}></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 blur-3xl rounded-full"></div>
                            </div>
                        </div>

                        {/* Theme Options */}
                        <div className={`rounded-[25px] ${themeStyles.card} overflow-hidden divide-y divide-white/5 shadow-xl`}>
                            <button onClick={() => setThemeMode?.('dark')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                        <Moon size={20} className="text-[#59CBC8]" />
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-black text-sm uppercase tracking-tight ${themeStyles.text}`}>{t.profile_dark_mode || 'Oscuro'}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-[2px] mt-0.5 ${themeMode === 'dark' ? 'text-[#59CBC8]' : 'text-slate-500/50'}`}>{themeMode === 'dark' ? 'Seleccionado' : ''}</p>
                                    </div>
                                </div>
                                {themeMode === 'dark' && (
                                    <div className="w-5 h-5 rounded-full border-2 border-[#59CBC8] flex items-center justify-center p-1 bg-[#59CBC8]/10">
                                        <div className="w-full h-full rounded-full bg-[#59CBC8]"></div>
                                    </div>
                                )}
                            </button>
                            <button onClick={() => setThemeMode?.('light')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                        <Sun size={20} className="text-yellow-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-black text-sm uppercase tracking-tight ${themeStyles.text}`}>{t.profile_light_mode || 'Claro'}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-[2px] mt-0.5 ${themeMode === 'light' ? 'text-[#59CBC8]' : 'text-slate-500/50'}`}>{themeMode === 'light' ? 'Seleccionado' : ''}</p>
                                    </div>
                                </div>
                                {themeMode === 'light' && (
                                    <div className="w-5 h-5 rounded-full border-2 border-[#59CBC8] flex items-center justify-center p-1 bg-[#59CBC8]/10">
                                        <div className="w-full h-full rounded-full bg-[#59CBC8]"></div>
                                    </div>
                                )}
                            </button>
                            <button onClick={() => setThemeMode?.('system')} className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                        <Monitor size={20} className="text-slate-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-black text-sm uppercase tracking-tight ${themeStyles.text}`}>{t.profile_system || 'Sistema'}</p>
                                        <p className={`text-[9px] font-black uppercase tracking-[2px] mt-0.5 ${themeMode === 'system' ? 'text-[#59CBC8]' : 'text-slate-500/50'}`}>{themeMode === 'system' ? 'Seleccionado' : ''}</p>
                                    </div>
                                </div>
                                {themeMode === 'system' && (
                                    <div className="w-5 h-5 rounded-full border-2 border-[#59CBC8] flex items-center justify-center p-1 bg-[#59CBC8]/10">
                                        <div className="w-full h-full rounded-full bg-[#59CBC8]"></div>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                );

            case 'menu':
            default:
                return (
                    <div className="px-5 space-y-3 animate-page-in">
                        {/* Profile Card */}
                        <div className="flex flex-col items-center pt-0 pb-1">
                            <div className={`w-20 h-20 rounded-full border-[4px] ${isDarkMode ? 'border-[#00E7DB]' : 'border-[#00D1FF]'} p-1 flex items-center justify-center ${isDarkMode ? 'bg-white/5 shadow-2xl' : 'bg-white shadow-xl'} overflow-hidden mb-1.5 relative`}>
                                <img src={avatar || 'https://ui-avatars.com/api/?name=' + user.name} className="w-full h-full rounded-full object-cover" alt="Profile" />
                            </div>
                            <h2 className={`text-lg font-[1000] tracking-tight ${themeStyles.text}`}>{user.name}</h2>
                            <div className="flex items-center gap-1 opacity-60">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={themeStyles.subtext}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z" /><circle cx="12" cy="9" r="2.5" /></svg>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.subtext}`}>{canton && province ? `${canton}, ${province}` : canton || province || 'Ecuador'}</span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className={`rounded-[22px] ${themeStyles.card} overflow-hidden divide-y divide-white/5`}>
                            <button onClick={() => setCurrentView('edit')} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${themeStyles.itemBg} flex items-center justify-center ${themeStyles.iconColor} group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg`}>
                                        <UserIcon size={20} />
                                    </div>
                                    <span className={`font-bold text-sm ${themeStyles.text} text-left uppercase tracking-tight`}>{t.profile_edit}</span>
                                </div>
                                <div className={isDarkMode ? 'opacity-30' : 'text-[#00D1FF]'}><ArrowLeft size={18} className="rotate-180" strokeWidth={3} /></div>
                            </button>
                            <button onClick={() => setCurrentView('security')} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${themeStyles.itemBg} flex items-center justify-center ${themeStyles.iconColor} group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg`}>
                                        <Shield size={20} />
                                    </div>
                                    <span className={`font-bold text-sm ${themeStyles.text} text-left uppercase tracking-tight`}>{t.profile_security}</span>
                                </div>
                                <div className={isDarkMode ? 'opacity-30' : 'text-[#00D1FF]'}><ArrowLeft size={18} className="rotate-180" strokeWidth={3} /></div>
                            </button>
                            <button onClick={() => setCurrentView('settings')} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${themeStyles.itemBg} flex items-center justify-center ${themeStyles.iconColor} group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg`}>
                                        <Settings size={20} />
                                    </div>
                                    <span className={`font-bold text-sm ${themeStyles.text} text-left uppercase tracking-tight`}>{t.profile_settings}</span>
                                </div>
                                <div className={isDarkMode ? 'opacity-30' : 'text-[#00D1FF]'}><ArrowLeft size={18} className="rotate-180" strokeWidth={3} /></div>
                            </button>
                            <button onClick={() => setCurrentView('theme')} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${themeStyles.itemBg} flex items-center justify-center ${themeStyles.iconColor} group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg`}>
                                        <Palette size={20} />
                                    </div>
                                    <span className={`font-bold text-sm ${themeStyles.text} text-left uppercase tracking-tight`}>{t.profile_theme}</span>
                                </div>
                                <div className={isDarkMode ? 'opacity-30' : 'text-[#00D1FF]'}><ArrowLeft size={18} className="rotate-180" strokeWidth={3} /></div>
                            </button>
                            <button onClick={() => onViewLegal?.('terms')} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${themeStyles.itemBg} flex items-center justify-center ${themeStyles.iconColor} group-hover:scale-110 transition-transform flex-shrink-0 shadow-lg`}>
                                        <Shield size={20} />
                                    </div>
                                    <span className={`font-bold text-sm ${themeStyles.text} text-left uppercase tracking-tight`}>{t.legal_title_usage || (language === 'es' ? 'Términos y Condiciones' : 'Terms and Conditions')}</span>
                                </div>
                                <div className={isDarkMode ? 'opacity-30' : 'text-[#00D1FF]'}><ArrowLeft size={18} className="rotate-180" strokeWidth={3} /></div>
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div ref={scrollRef} className={`flex-1 flex flex-col min-h-0 overflow-y-auto pb-6 ${themeStyles.bg} hide-scrollbar`}>
            {/* CABECERA MENTA */}
            <div className={`relative ${isDarkMode ? 'bg-gradient-to-br from-[#00E7DB] via-[#2DD4BF] to-[#00E7DB]' : 'bg-gradient-to-br from-[#00E7DB] via-[#00D1FF] to-[#00E7DB]'} pt-6 pb-3 rounded-b-[35px] shadow-2xl mb-3`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                <header className="px-6 flex flex-col relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={currentView === 'menu' ? onBack : () => setCurrentView('menu')} className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all active:scale-90 border bg-white shadow-xl border-white/60`}>
                            <ArrowLeft size={20} className="text-slate-900" strokeWidth={3} />
                        </button>

                        <h1 className="text-[16px] xs:text-[18px] font-[1000] tracking-tighter italic leading-none select-none whitespace-nowrap ml-4">
                            <span className="text-[#0f172a] drop-shadow-sm">CONEXIÓN </span>
                            <span className="text-white drop-shadow-md">SERVICIOS</span>
                        </h1>

                        <div className="w-10"></div>
                    </div>

                    <div className="flex flex-col items-center px-2 w-full text-center">
                        <h2 className={`text-[28px] xs:text-[32px] font-[1000] uppercase tracking-tighter text-white drop-shadow-lg leading-none w-full break-words whitespace-normal text-center flex flex-col items-center`}>
                            {currentView === 'menu' ? t.profile_title :
                                currentView === 'edit' ? t.profile_edit :
                                    currentView === 'security' ? t.profile_security :
                                        currentView === 'password' ? t.auth_pass :
                                            currentView === 'settings' ? (
                                                <>
                                                    <span>CONFIGURACIÓN</span>
                                                    <span className="mt-1">DE CUENTA</span>
                                                </>
                                            ) :
                                                t.profile_theme}
                        </h2>
                    </div>
                </header>
            </div>

            {renderContent()}

            {/* CROPPER MODAL */}
            {showCropper && tempImage && (
                <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
                    <div className="flex-1 relative">
                        <Cropper
                            image={tempImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div className="p-8 pb-14 bg-slate-900 space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 accent-[#59CBC8]"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => { setShowCropper(false); setTempImage(null); }}
                                className="flex-1 py-4 bg-white/5 text-white/60 font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all border border-white/10"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={applyCrop}
                                className="flex-1 py-4 bg-[#59CBC8] text-slate-900 font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg"
                            >
                                {language === 'es' ? 'Aplicar Recorte' : 'Apply Crop'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM DYNAMIC MODAL */}
            {modal.visible && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md" onClick={modal.type === 'alert' ? closeModal : undefined}></div>

                    <div className={`relative w-full max-w-sm rounded-[45px] p-1 shadow-2xl animate-page-in overflow-hidden ${modal.status === 'success' ? 'bg-gradient-to-b from-[#59CBC8]/20 to-[#020617]' :
                        modal.status === 'error' ? 'bg-gradient-to-b from-red-500/20 to-[#020617]' :
                            modal.status === 'warning' ? 'bg-gradient-to-b from-amber-500/20 to-[#020617]' :
                                'bg-gradient-to-b from-blue-500/20 to-[#020617]'
                        }`}>
                        <div className={`p-8 rounded-[44px] ${themeStyles.bg} flex flex-col items-center text-center`}>
                            {/* Icon Wrapper */}
                            <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center shadow-inner relative overflow-hidden`}>
                                <div className={`absolute inset-0 opacity-20 ${modal.status === 'success' ? 'bg-[#59CBC8]' :
                                    modal.status === 'error' ? 'bg-red-500' :
                                        modal.status === 'warning' ? 'bg-amber-500' :
                                            'bg-blue-500'
                                    }`}></div>

                                {modal.status === 'success' && <div className="text-[#59CBC8] scale-150"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></div>}
                                {modal.status === 'error' && <Trash2 size={32} className="text-red-500" strokeWidth={2.5} />}
                                {modal.status === 'warning' && <AlertTriangle size={32} className="text-amber-500" strokeWidth={2.5} />}
                                {modal.status === 'info' && <Shield size={32} className="text-blue-500" strokeWidth={2.5} />}
                                {modal.type === 'actions' && <LucideCamera size={32} className="text-[#59CBC8]" strokeWidth={2.5} />}
                            </div>

                            <h3 className={`text-xl font-[1000] uppercase tracking-tighter mb-2 ${themeStyles.text}`}>
                                {modal.title}
                            </h3>
                            <p className={`text-sm font-medium opacity-60 leading-relaxed mb-8 ${themeStyles.subtext}`}>
                                {modal.message}
                            </p>

                            {/* Prompt Input */}
                            {(modal.type === 'prompt' || modal.type === 'password') && (
                                <div className="w-full mb-8">
                                    <input
                                        autoFocus
                                        type={modal.type === 'password' ? "password" : "text"}
                                        className={`w-full py-4 px-6 rounded-2xl text-center font-black uppercase tracking-[2px] text-sm border-2 outline-none transition-all ${modal.type === 'password'
                                            ? 'border-[#59CBC8] bg-[#59CBC8]/5 text-[#59CBC8]'
                                            : modal.inputValue?.toLowerCase() === t.profile_delete_keyword
                                                ? 'border-[#59CBC8] bg-[#59CBC8]/5 text-[#59CBC8]'
                                                : 'border-red-500/20 bg-red-500/5 text-red-500'
                                            }`}
                                        placeholder={modal.type === 'password' ? "••••••••" : t.profile_delete_keyword}
                                        value={modal.inputValue}
                                        onChange={e => setModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                    />
                                </div>
                            )}

                            {/* Actions List */}
                            {modal.type === 'actions' && modal.options && (
                                <div className="w-full space-y-3 mb-4">
                                    {modal.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => modal.onConfirm?.(i.toString())}
                                            className={`w-full p-4 rounded-2xl border flex items-center justify-between group active:scale-95 transition-all ${opt.style === 'destructive' ? 'border-red-500/20 bg-red-500/5 text-red-500' :
                                                opt.style === 'cancel' ? 'border-transparent bg-white/5 opacity-40' :
                                                    `border-white/5 bg-white/5 hover:bg-white/10 ${themeStyles.text}`
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {opt.icon && <div className="opacity-60">{opt.icon}</div>}
                                                <span className="text-xs font-black uppercase tracking-widest">{opt.title}</span>
                                            </div>
                                            <ChevronRight size={16} className="opacity-20 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Buttons Footer for Alert/Confirm/Prompt/Password */}
                            {modal.type !== 'actions' && (
                                <div className="flex gap-4 w-full">
                                    {(modal.type === 'confirm' || modal.type === 'prompt' || modal.type === 'password') && (
                                        <button
                                            onClick={closeModal}
                                            className="flex-1 py-4 bg-white/5 text-white/40 font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all border border-white/5"
                                        >
                                            {t.cancel}
                                        </button>
                                    )}
                                    <button
                                        disabled={modal.type === 'prompt' && modal.inputValue?.toLowerCase() !== t.profile_delete_keyword}
                                        onClick={() => modal.onConfirm?.(modal.inputValue)}
                                        className={`flex-1 py-4 font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg disabled:opacity-20 disabled:scale-100 ${modal.status === 'error' || modal.status === 'warning' ? 'bg-red-500 text-white' : 'bg-[#59CBC8] text-slate-900'
                                            }`}
                                    >
                                        {modal.type === 'confirm' ? (language === 'es' ? 'Confirmar' : 'Confirm') :
                                            modal.type === 'prompt' ? (language === 'es' ? 'Eliminar Ahora' : 'Delete Now') :
                                                modal.type === 'password' ? (language === 'es' ? 'Verificar' : 'Verify') :
                                                    'OK'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
