import { PROVINCES, CATEGORIES, ADMIN_CREDENTIALS } from './constants';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { translations, Language } from './translations';
import { User, Service, Category, Review, UserRole, RegionConfig } from './types';
import Splash from './views/Splash';
import Welcome from './views/Welcome';
import Login from './views/Auth';
import GeoSelect from './views/GeoSelect';
import ServiceCategories from './views/Home';
import ServiceList from './views/ServiceList';
import ServiceDetail from './views/ServiceDetail';
import UserProfile from './views/UserProfile';
import AdminDashboard from './views/AdminDashboard';
import AdminAdvanced from './views/AdminAdvanced';
import SearchResults from './views/SearchView';
import PrivacyPolicy from './views/Legal';
import ContactAdmin from './views/ContactAdmin';
import Favorites from './views/Favorites';
import Notifications from './views/Notifications';
import SubcategorySelect from './views/SubcategorySelect';
import AIChat from './views/AIChat';
import WelcomeUser from './views/WelcomeUser';
import Footer from './components/Footer';

import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, query, where, getDoc, onSnapshot } from 'firebase/firestore';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';
import { ref, deleteObject } from 'firebase/storage';
import { WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<string>('splash');
  const [dir, setDir] = useState<'forward' | 'backward'>('forward');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Region Configuration State
  const [regionConfig, setRegionConfig] = useState<RegionConfig>({});

  // Fetch Region Config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'regions'), (doc) => {
      if (doc.exists()) {
        setRegionConfig(doc.data() as RegionConfig);
      }
    });
    return () => unsub();
  }, []);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('theme_preference');
    return (saved as 'light' | 'dark' | 'system') || 'dark';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return themeMode === 'dark';
  });

  const [categories, setCategories] = useState<Category[]>(CATEGORIES);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(data);
      } else {
        setCategories(CATEGORIES);
      }
    }, (error) => {
       console.error("Error fetching categories:", error);
       setCategories(CATEGORIES);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode]);

  const [isOnline, setIsOnline] = useState(true);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved as Language) || 'es';
  });

  // Data State
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Selection State
  const [selectedProvince, setSelectedProvince] = useState<string>(() => localStorage.getItem('selected_province') || '');
  const [selectedCanton, setSelectedCanton] = useState<string>(() => localStorage.getItem('selected_canton') || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(() => {
    try {
      const saved = localStorage.getItem('selected_category');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(() => localStorage.getItem('selected_subcategory') || '');
  const [selectedService, setSelectedService] = useState<Service | null>(() => {
    try {
      const saved = localStorage.getItem('selected_service');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('search_query') || '');
  const [isFooterHidden, setIsFooterHidden] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [legalType, setLegalType] = useState<'privacy' | 'terms'>(() => (localStorage.getItem('legal_type') as any) || 'privacy');
  const [homeCategoryIndex, setHomeCategoryIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Notifications Listener (Unread Count)
  useEffect(() => {
    const q = query(collection(db, 'notifications'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastRead = localStorage.getItem('last_notif_read');
      const lastReadDate = lastRead ? new Date(lastRead) : new Date(0);

      const unread = snapshot.docs.filter(doc => {
        const data = doc.data();
        const createdAt = data.createdAt ? new Date(data.createdAt) : new Date(0);

        // Basic unread check
        const isNew = createdAt > lastReadDate;
        if (!isNew) return false;

        // Location filtering
        if (data.target === 'all' || !data.target) return true;

        // Expiration check
        if (data.expiresAt && new Date(data.expiresAt).getTime() < now.getTime()) {
          return false;
        }

        // Schedule check
        if (data.scheduledTime && new Date(data.scheduledTime).getTime() > now.getTime()) {
          return false;
        }

        if (data.target === 'location') {
          const matchesProv = data.targetProvince === selectedProvince;
          const matchesCant = !data.targetCanton || data.targetCanton === selectedCanton;
          return matchesProv && matchesCant;
        }
        return false;
      });

      setUnreadNotifsCount(unread.length);
    });

    return () => unsubscribe();
  }, [selectedProvince, selectedCanton]);

  // History stack
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('navigation_history');
      return saved ? JSON.parse(saved) : ['splash'];
    } catch { return ['splash']; }
  });

  // Back Handler Ref (Must be at top level for all components to register)
  const backHandlerRef = useRef<(() => void) | null>(null);

  const registerBackHandler = (handler: (() => void) | null) => {
    backHandlerRef.current = handler;
  };

  // State Refs for Listeners (to avoid stale closures)
  const viewRef = useRef(view);
  const historyRef = useRef(history);
  const userRef = useRef(user);

  useEffect(() => {
    viewRef.current = view;
    historyRef.current = history;
    userRef.current = user;
  }, [view, history, user]);

  // Fetch Services on Mount
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const q = query(collection(db, 'services'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          // FORCE ADMIN ROLE FOR MASTER EMAIL
          let role: UserRole = (userData.role as UserRole) || 'user';
          if (firebaseUser.email?.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
            role = 'admin';
          }

          // --- PUSH NOTIFICATION TOKEN SYNC ---
          const pendingToken = localStorage.getItem('pending_fcm_token');
          if (pendingToken) {
            try {
              const userRef = doc(db, 'users', firebaseUser.uid);
              await setDoc(userRef, { fcmToken: pendingToken }, { merge: true });
              localStorage.removeItem('pending_fcm_token');
              console.log('Pending fcmToken saved successfully');
            } catch (e) {
              console.warn("Failed to save pending fcmToken", e);
            }
          }

          setUser({
            id: firebaseUser.uid,
            name: userData.name || firebaseUser.displayName || 'Usuario',
            email: firebaseUser.email || '',
            role: role,
            avatar: userData.avatar || firebaseUser.photoURL || undefined,
            isGuest: false,
            favorites: userData.favorites || [],
            dob: userData.dob
          });
        } catch (e) {
          console.error("Error fetching user profile:", e);

          // Fallback also respects admin credentials
          let role: UserRole = 'user';
          if (firebaseUser.email?.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase()) {
            role = 'admin';
          }

          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuario',
            email: firebaseUser.email || '',
            role: role,
            avatar: firebaseUser.photoURL || undefined,
            isGuest: false,
            favorites: []
          });
        }
      } else {
        // PREVENIR QUE EL ADMIN MAESTRO SE CIERRE
        setUser(prev => (prev?.id === 'admin-master') ? prev : null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []); // Global listener, no dependencies

  // Push Notifications Setup
  useEffect(() => {
    if (!user) return;

    const setupPush = async () => {
      try {
        const isPushAvailable = Capacitor.getPlatform() !== 'web';
        if (!isPushAvailable) return;

        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') return;

        // Create channel for Android 8.0+
        if (Capacitor.getPlatform() === 'android') {
          await PushNotifications.createChannel({
            id: 'push-notifications',
            name: 'Push Notifications',
            description: 'General push notifications',
            importance: 5, // High
            visibility: 1, // Public
            sound: 'default'
          });
        }

        // Add listeners BEFORE register
        PushNotifications.addListener('registration', async (token) => {
          console.log('Registration success, token:', token.value);
          const currentUserId = user?.id || localStorage.getItem('user_id');
          if (currentUserId) {
            try {
              const userRef = doc(db, 'users', currentUserId);
              await setDoc(userRef, { fcmToken: token.value }, { merge: true });
              console.log('fcmToken saved successfully for user:', currentUserId);
            } catch (e) {
              console.warn("Failed to save fcmToken", e);
            }
          } else {
            console.warn("No user ID found, storing token in localStorage for later");
            localStorage.setItem('pending_fcm_token', token.value);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        await PushNotifications.register();


        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ' + JSON.stringify(notification));
        });


        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ' + JSON.stringify(notification));
          const data = notification.notification.data;

          if (data && data.type === 'notifications') {
            navigateTo('notifications');
          } else {
            navigateTo('notifications'); // Default fallback
          }
        });


      } catch (error) {
        console.warn('Error setting up push notifications', error);
      }
    };

    setupPush();

    return () => {
      if (Capacitor.getPlatform() !== 'web') {
        PushNotifications.removeAllListeners();
      }
    };
  }, [user?.id]); // Register / update when user logs in

  // Robust Navigation System (Capacitor & Browser/System Gestures)
  useEffect(() => {
    // 1. Initialize History for Gestures (Once)
    if (!window.location.hash) {
      window.history.replaceState({ view: 'splash' }, '', '#splash');
    }

    // 2. Centralized Back Handler (popstate)
    const handlePopState = (e: PopStateEvent) => {

      if (backHandlerRef.current) {
        backHandlerRef.current();
        return;
      }

      const currentHistory = historyRef.current;
      if (currentHistory.length > 1) {
        const newHistory = [...currentHistory];
        newHistory.pop();
        const prevView = newHistory[newHistory.length - 1];

        setHistory(newHistory);
        setDir('backward');
        setView(prevView);
      } else {
        const currentView = viewRef.current;
        const currentUser = userRef.current;
        if (currentUser || currentView === 'home') {
          CapacitorApp.exitApp();
        } else {
          setDir('backward');
          setView('welcome');
        }
      }
    };

    // 3. Native Event Listeners (Fallbacks for ROMs like XOS)
    const handleGenericBack = (source: string) => {
      // 1. Prioritize component-specific handlers (e.g. GeoSelect steps)
      if (backHandlerRef.current) {
        backHandlerRef.current();
        return;
      }

      const currentView = viewRef.current;
      const currentUser = userRef.current;
      const isAuth = !!currentUser;

      // 'geo-select' is a Root View ONLY if the user is logged in
      const isRootView = ['home', 'welcome', 'splash', 'welcome-user'].includes(currentView) || (currentView === 'geo-select' && isAuth);

      if (isRootView) {
        const shouldShowToast = (isAuth && ['home', 'geo-select', 'welcome-user'].includes(currentView)) || (!isAuth && currentView === 'home');

        if (shouldShowToast) {
          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBackPressRef.current = now;
            setShowExitToast(true);
            setTimeout(() => setShowExitToast(false), 2000);
          }
        } else {
          CapacitorApp.exitApp();
        }
      } else {
        // This is where we bridge to the unified history logic
        window.history.back();
      }
    };

    // Listen to ALL variations of the hardware back event
    const onDOMBack = () => handleGenericBack('DOM backbutton');
    const onDOMBackCase = () => handleGenericBack('DOM backButton'); // MainActivity.java sends this

    document.addEventListener('backbutton', onDOMBack);
    document.addEventListener('backButton', onDOMBackCase);
    window.addEventListener('backButton', onDOMBackCase); // Extra layer for reliability

    // 4. Capacitor Native Back Button Handler
    const backListener = CapacitorApp.addListener('backButton', () => {
      handleGenericBack('Capacitor backButton');
    });

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('backbutton', onDOMBack);
      document.removeEventListener('backButton', onDOMBackCase);
      window.removeEventListener('backButton', onDOMBackCase);
      backListener.then(f => f.remove());
    };
  }, []); // Static registration

  // Double-back-to-exit state
  const lastBackPressRef = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);

  // Network Status Monitoring
  useEffect(() => {
    let networkListener: any;

    const setupNetworkMonitoring = async () => {
      // Check initial status
      const status = await Network.getStatus();
      setIsOnline(status.connected);

      // Listen for network changes
      networkListener = await Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
      });
    };

    setupNetworkMonitoring();

    return () => {
      if (networkListener) networkListener.remove();
    };
  }, []);

  // Persist State for Resume/Reload
  useEffect(() => {
    if (view === 'splash') return; // Evitar guardar el estado durante el splash para no perder la vista real
    localStorage.setItem('app_lang', language);
    localStorage.setItem('theme_preference', themeMode);
    localStorage.setItem('selected_province', selectedProvince);
    localStorage.setItem('selected_canton', selectedCanton);
    localStorage.setItem('current_view', view);
    localStorage.setItem('navigation_history', JSON.stringify(history));
    localStorage.setItem('selected_category', JSON.stringify(selectedCategory));
    localStorage.setItem('selected_subcategory', selectedSubcategory);
    localStorage.setItem('selected_service', JSON.stringify(selectedService));
    localStorage.setItem('search_query', searchQuery);
    localStorage.setItem('legal_type', legalType);
  }, [
    language, themeMode, selectedProvince, selectedCanton,
    view, history, selectedCategory, selectedSubcategory,
    selectedService, searchQuery, legalType
  ]);

  const navigateTo = (newView: string, resetHistory: boolean = false) => {
    setDir('forward');
    if (resetHistory) {
      setHistory([newView]);
      window.history.replaceState({ view: newView }, '', `#${newView}`);
    } else {
      setHistory(prev => [...prev, newView]);
      // Sync with browser history using HASH
      // This forces ROMs like XOS to see a history change
      window.history.pushState({ view: newView }, '', `#${newView}`);
    }
    setView(newView);
  };

  const handleBack = () => {
    // 1. Capture state before attempting back
    const startView = viewRef.current;
    const startHistory = historyRef.current;

    // 2. Trigger browser back
    window.history.back();

    // 3. Fallback for Restored Sessions / Cold Starts:
    // If we have history in our internal stack but the browser history is empty
    // (length 1), popstate won't fire. We wait a bit and check if view changed.
    setTimeout(() => {
      if (viewRef.current === startView && startHistory.length > 1) {
        console.log("Fallback manual back triggered");
        const newHistory = [...startHistory];
        newHistory.pop();
        const prevView = newHistory[newHistory.length - 1];

        setHistory(newHistory);
        setDir('backward');
        setView(prevView);

        // Also update hash manually for consistency
        window.history.replaceState({ view: prevView }, '', `#${prevView}`);
      }
    }, 150);
  };

  const handleSplashComplete = () => {
    // 1. Try to recover saved view from persistence
    const savedView = localStorage.getItem('current_view');

    // Only recover if it's a valid meaningful view (not splash/null)
    if (savedView && savedView !== 'splash') {
      // For auth-protected views, verify user first
      const authViews = ['profile', 'favorites', 'admin', 'admin-advanced'];
      const needsAuth = authViews.includes(savedView);

      if (!needsAuth || (needsAuth && user)) {
        setView(savedView);
        // Sincronizar el hash para que coincida con la vista recuperada
        // IMPORTANT: replaceState ensures we don't push a new entry, just update the current one
        window.history.replaceState({ view: savedView }, '', `#${savedView}`);

        // Ensure the internal history stack is also consistent
        const savedHistory = localStorage.getItem('navigation_history');
        if (savedHistory) {
          try {
            setHistory(JSON.parse(savedHistory));
          } catch (e) {
            setHistory(['splash', savedView]);
          }
        }
        return;
      }
    }

    // 2. Fallback to normal logic if no saved state or auth failed
    if (user) {
      if (user.role === 'admin') {
        navigateTo('admin', true);
      } else if (selectedProvince && selectedCanton) {
        navigateTo('home', true);
      } else {
        navigateTo('geo-select', true);
      }
    } else {
      navigateTo('welcome', true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);

      // Clear navigation persistence on logout
      localStorage.removeItem('current_view');
      localStorage.removeItem('navigation_history');
      localStorage.removeItem('selected_category');
      localStorage.removeItem('selected_subcategory');
      localStorage.removeItem('selected_service');
      localStorage.removeItem('search_query');

      navigateTo('welcome', true);
    } catch (e) {
      console.error("Error logging out:", e);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigateTo('search');
  };

  const handleUpdateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, data, { merge: true });
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (e) {
      console.error("Error updating user:", e);
      throw e;
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser) return;
    try {
      // 1. Delete Avatar from Storage if exists
      if (user.avatar && (user.avatar.includes('firebasestorage') || user.avatar.includes('avatars/'))) {
        try {
          // If it's a full URL, we can ref it directly or parse it. 
          // Firebase ref() handles full URLs fine usually if it belongs to the bucket.
          // But safer to create a ref from the URL if possible, or just try deleting.
          // Given UserProfile logic uses ref(storage, user.avatar), we'll do the same.
          // Note: we need to import 'ref' and 'deleteObject' and 'storage' in App.tsx if not already there.
          // Checking imports... App.tsx imports 'storage' from './firebase'. 
          // Need to import ref and deleteObject from firebase/storage.

          // Let's assume user.avatar is the path or url.
          const avatarRef = ref(storage, user.avatar);
          await deleteObject(avatarRef);
        } catch (e) {
          console.warn("Could not delete avatar from storage:", e);
          // Continue with account deletion even if avatar delete fails
        }
      }

      // 2. Delete User Document
      await deleteDoc(doc(db, 'users', user.id));

      // 3. Delete Auth User
      await deleteUser(auth.currentUser);

      setUser(null);
      navigateTo('welcome', true);
    } catch (e) {
      console.error("Error deleting account:", e);
      throw e;
    }
  };

  const handleToggleFavorite = async (serviceId: string) => {
    if (!user) return;
    const isFav = user.favorites?.includes(serviceId);
    const userRef = doc(db, 'users', user.id);

    try {
      if (isFav) {
        await updateDoc(userRef, { favorites: arrayRemove(serviceId) });
        setUser(prev => prev ? { ...prev, favorites: prev.favorites?.filter(id => id !== serviceId) } : null);
      } else {
        await updateDoc(userRef, { favorites: arrayUnion(serviceId) });
        setUser(prev => prev ? { ...prev, favorites: [...(prev.favorites || []), serviceId] } : null);
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
    }
  };

  const handleAddReview = async (review: Review) => {
    if (!selectedService || !user) return;
    const serviceRef = doc(db, 'services', selectedService.id);

    try {
      const existingReviewIndex = selectedService.reviews.findIndex(r => r.userId === user.id);
      let newReviews = [...selectedService.reviews];
      let newCount = selectedService.reviewsCount;
      let newRating = selectedService.rating;

      if (existingReviewIndex !== -1) {
        // Update existing review
        const oldReview = newReviews[existingReviewIndex];
        newReviews[existingReviewIndex] = { ...oldReview, ...review, id: oldReview.id }; // Keep original ID

        // Recalculate rating: subtract old rating, add new rating, divide by same count
        const totalRatingSum = selectedService.rating * selectedService.reviewsCount;
        newRating = (totalRatingSum - oldReview.rating + review.rating) / selectedService.reviewsCount;
      } else {
        // Add new review
        newReviews = [...newReviews, review];
        newCount = selectedService.reviewsCount + 1;
        newRating = (selectedService.rating * selectedService.reviewsCount + review.rating) / newCount;
      }

      await updateDoc(serviceRef, {
        reviews: newReviews,
        rating: newRating,
        reviewsCount: newCount
      });

      const updatedService = { ...selectedService, reviews: newReviews, rating: newRating, reviewsCount: newCount };
      setSelectedService(updatedService);
      setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));

    } catch (e) {
      console.error("Error adding review:", e);
    }
  };

  // Service Management Handlers
  const handleAddService = async (service: Service) => {
    try {
      const docRef = await addDoc(collection(db, 'services'), service);
      const newService = { ...service, id: docRef.id };
      await updateDoc(doc(db, 'services', docRef.id), { id: docRef.id });
      setServices(prev => [newService, ...prev]);
      return newService;
    } catch (e) {
      console.error("Error adding service:", e);
      throw e;
    }
  };

  const handleUpdateService = async (service: Service) => {
    try {
      const serviceRef = doc(db, 'services', service.id);
      await updateDoc(serviceRef, { ...service });
      setServices(prev => prev.map(s => s.id === service.id ? service : s));
    } catch (e) {
      console.error("Error updating service:", e);
      throw e;
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error("Error deleting service:", e);
      throw e;
    }
  };

  const handleContactService = async (serviceId: string) => {
    try {
      const serviceRef = doc(db, 'services', serviceId);
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const newClicks = (service.clicks || 0) + 1;
        await updateDoc(serviceRef, { clicks: newClicks });
        setServices(prev => prev.map(s => s.id === serviceId ? { ...s, clicks: newClicks } : s));
      }
    } catch (e) {
      console.error("Error tracking service click:", e);
    }
  };

  // Filtered Services Logic
  const filteredServices = React.useMemo(() => {
    return services.filter(s => {
      // Location Filter
      if (selectedProvince && s.province !== selectedProvince) return false;
      if (selectedCanton && s.canton !== selectedCanton) return false;

      // Category Filter (only for list view)
      if (view === 'service-list') {
        if (selectedCategory && s.category !== selectedCategory.name) return false;
        if (selectedSubcategory && !(s.subcategories || []).includes(selectedSubcategory) && s.subcategory !== selectedSubcategory) return false;
      }

      return true;
    });
  }, [services, selectedProvince, selectedCanton, selectedCategory, selectedSubcategory, view]);

  // Render View Swtich
  const renderView = () => {
    const commonProps = {
      isDarkMode,
      themeMode, // Pass theme preference
      setThemeMode, // Function to change preference
      onToggleTheme: () => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark'),
      onBack: handleBack,
      user,
      language,
      t: translations[language],
      dir,
      categories
    };

    switch (view) {
      case 'splash': return <Splash onComplete={handleSplashComplete} isReady={isAuthReady} />;

      case 'welcome':
        return <Welcome
          {...commonProps}
          onLogin={() => navigateTo('login')}
          onEnterAsGuest={() => navigateTo('login')}
          onContactAdmin={() => navigateTo('contact-admin')}
          direction={dir}
        />;

      case 'login':
        return <Login
          mode="login"
          onSwitch={() => navigateTo('register')}
          onAuthSuccess={(u: User, isNewUser?: boolean) => {
            setUser(u);
            if (u.role === 'admin') {
              navigateTo('admin', true);
            } else if (isNewUser) {
              navigateTo('welcome-user', true);
            } else {
              navigateTo('geo-select', true);
            }
          }}
          onEnterAsGuest={() => navigateTo('geo-select')}
          onViewLegal={(type) => { setLegalType(type); navigateTo('legal'); }}
          {...commonProps}
        />;

      case 'register':
        return <Login
          mode="register"
          onSwitch={() => handleBack()}
          onAuthSuccess={(u: User, isNewUser?: boolean) => {
            setUser(u);
            if (u.role === 'admin') {
              navigateTo('admin', true);
            } else if (isNewUser) {
              navigateTo('welcome-user', true);
            } else {
              navigateTo('geo-select', true);
            }
          }}
          onEnterAsGuest={() => navigateTo('geo-select')}
          onViewLegal={(type) => { setLegalType(type); navigateTo('legal'); }}
          {...commonProps}
        />;

      case 'welcome-user':
        return <WelcomeUser
          {...commonProps}
          user={user!}
          onContinue={() => navigateTo('geo-select', true)}
        />;

      case 'geo-select':
        return <GeoSelect
          {...commonProps}
          onRegisterBackHandler={registerBackHandler}
          onSelect={(prov, cant) => {
            setSelectedProvince(prov);
            setSelectedCanton(cant);
            navigateTo('home');
          }}
          onAdmin={() => navigateTo('admin')}
          regionConfig={regionConfig} // Pass config
        />;

      case 'home':
        return <ServiceCategories
          {...commonProps}
          province={selectedProvince}
          canton={selectedCanton}
          services={filteredServices}
          favorites={user?.favorites || []}
          onOpenCategory={(cat) => {
            setSelectedCategory(cat);
            navigateTo('subcategories');
          }}
          onOpenProfile={() => navigateTo('profile')}
          onOpenSearch={() => navigateTo('search')}
          onGoToFavorites={() => navigateTo('favorites')}
          onOpenNotifications={() => {
            localStorage.setItem('last_notif_read', new Date().toISOString());
            setUnreadNotifsCount(0);
            navigateTo('notifications');
          }}
          unreadNotifsCount={unreadNotifsCount}
          onAdmin={() => navigateTo('admin')}
          onLogin={() => navigateTo('login')}
          onLogout={async () => { await signOut(auth); setUser(null); navigateTo('welcome', true); }}
          onChangeLocation={() => navigateTo('geo-select')}
          onContactAdmin={() => navigateTo('contact-admin')}
          onSelectService={(service) => {
            setSelectedService(service);
            navigateTo('service-detail');
          }}
          onToggleFavorite={handleToggleFavorite}
          onOpenAI={() => navigateTo('ai-chat')}
          onContactService={handleContactService}
          initialCategoryIndex={homeCategoryIndex}
          onActiveCategoryChange={setHomeCategoryIndex}
        />;

      case 'subcategories':
        return <SubcategorySelect
          {...commonProps}
          category={selectedCategory!}
          onSelectSubcategory={(sub) => {
            setSelectedSubcategory(sub);
            navigateTo('service-list');
          }}
          onContactAdmin={() => navigateTo('contact-admin')}
          onOpenSearch={() => navigateTo('search')}
        />;

      case 'service-list':
        return <ServiceList
          {...commonProps}
          category={selectedCategory?.name || ''}
          subcategory={selectedSubcategory}
          province={selectedProvince}
          canton={selectedCanton}
          services={filteredServices}
          favorites={user?.favorites || []}
          onSelectService={(svc) => {
            setSelectedService(svc);
            navigateTo('service-detail');
          }}
          onToggleFavorite={handleToggleFavorite}
          onGoToLogin={() => navigateTo('login')}
          onOpenSearch={() => navigateTo('search')}
          onChangeLocation={() => handleBack()}
        />;

      case 'service-detail':
        return <ServiceDetail
          {...commonProps}
          service={selectedService!}
          isFavorite={user?.favorites?.includes(selectedService!.id) || false}
          onToggleFavorite={() => handleToggleFavorite(selectedService!.id)}
          onAddReview={handleAddReview}
          onGoToLogin={() => navigateTo('login')}
          onContact={() => handleContactService(selectedService!.id)}
        />;

      case 'search':
        return <SearchResults
          {...commonProps}
          onBack={handleBack}
          query={searchQuery}
          province={selectedProvince}
          canton={selectedCanton}
          services={services}
          onSelectResult={(term, type) => {
            if (type === 'service') {
              const service = services.find(s => s.id === term || s.title === term);
              if (service) {
                setSelectedService(service);
                navigateTo('service-detail');
              }
              return;
            }
            if (type === 'category') {
              const cat = categories.find(c => c.name === term);
              if (cat) {
                setSelectedCategory(cat);
                navigateTo('subcategories');
              }
            } else {
              setSelectedSubcategory(term);
              navigateTo('service-list');
            }
          }}
        />;

      case 'profile':
        return <UserProfile
          {...commonProps}
          onBack={handleBack}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
          onDeleteAccount={handleDeleteAccount}
          onAdmin={() => navigateTo('admin')}
          onLogin={() => navigateTo('login')}
          onToggleFooter={(visible: boolean) => setIsFooterHidden(!visible)}
          onRegisterBackHandler={registerBackHandler}
          onChangeLanguage={setLanguage}
          onViewLegal={(type) => { setLegalType(type); navigateTo('legal'); }}
          canton={selectedCanton}
          province={selectedProvince}
        />;

      case 'favorites':
        return <Favorites
          {...commonProps}
          onBack={handleBack}
          services={services} // Pass all services to allow filtering by favorites inside component
          favorites={user?.favorites || []}
          onSelectService={(s) => { setSelectedService(s); navigateTo('service-detail'); }}
          onToggleFavorite={handleToggleFavorite}
          onExplore={() => handleBack()}
        />;

      case 'admin':
        if (user?.role !== 'admin') return <GeoSelect {...commonProps} onSelect={(prov, cant) => { setSelectedProvince(prov); setSelectedCanton(cant); navigateTo('home'); }} onAdmin={() => navigateTo('admin')} regionConfig={regionConfig} />;
        return <AdminDashboard
          services={services}
          categories={categories}
          onAddService={handleAddService}
          onUpdateService={handleUpdateService}
          onDeleteService={handleDeleteService}
          onLogout={handleLogout}
          onBackToUserView={() => navigateTo('geo-select')}
          initialEditingService={null}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onRegisterBackHandler={registerBackHandler}
          t={translations[language]}
          language={language}
          onOpenAdvanced={() => navigateTo('admin-advanced')} // New Prop
        />;

      case 'admin-advanced':
        if (user?.role !== 'admin') return <GeoSelect {...commonProps} onSelect={(prov, cant) => { setSelectedProvince(prov); setSelectedCanton(cant); navigateTo('home'); }} onAdmin={() => navigateTo('admin')} regionConfig={regionConfig} />;
        return <AdminAdvanced
          {...commonProps}
          onBack={() => handleBack()}
          categories={categories}
        />;



      case 'contact-admin': return <ContactAdmin isDarkMode={isDarkMode} onBack={handleBack} direction={dir} t={translations[language]} />;
      case 'legal': return <PrivacyPolicy type={legalType} isDarkMode={isDarkMode} onBack={handleBack} direction={dir} t={translations[language]} />;
      case 'notifications': return <Notifications isDarkMode={isDarkMode} onBack={handleBack} direction={dir} t={translations[language]} province={selectedProvince} canton={selectedCanton} />;
      case 'ai-chat': return <AIChat services={services} user={user} province={selectedProvince} canton={selectedCanton} isDarkMode={isDarkMode} onBack={() => handleBack()} t={translations[language]} language={language} />;

      default: return null;
    }
  };

  return (
    <div className={`w-full h-[100dvh] relative flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'} ${view === 'admin' ? 'w-screen' : 'mx-auto max-w-md md:max-w-3xl lg:max-w-[1600px] shadow-2xl'} overflow-x-hidden`} style={{ overscrollBehavior: 'none', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Offline Notification Banner */}
      <div
        className={`
          absolute top-0 left-0 right-0 z-[9999]
          transition-all duration-500 ease-out
          ${!isOnline ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        `}
      >
        <div className={`
          ${isDarkMode ? 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-500' : 'bg-gradient-to-r from-orange-400 via-red-400 to-orange-400'}
          px-6 py-3 shadow-[0_4px_20px_rgba(239,68,68,0.4)]
          flex items-center justify-center gap-3
        `}>
          <WifiOff size={18} className="text-white animate-pulse" strokeWidth={2.5} />
          <span className="text-white text-[11px] font-black uppercase tracking-[2px]">
            {translations[language].common_no_internet}
          </span>
        </div>
      </div>

      {/* Capa de fondo persistente - siempre visible, nunca se animua ni se desmonta */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'}`} style={{ zIndex: 0 }} />

      {/* Vista animada - encima del fondo */}
      <div
        key={view}
        className={`w-full flex-1 flex flex-col overflow-hidden relative ${dir === 'forward' ? 'animate-enter-forward' : 'animate-enter-backward'}`}
        style={{ zIndex: 1 }}
      >
        {renderView()}
      </div>

      {/* Exit App Toast */}
      {showExitToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full text-white text-sm font-medium shadow-2xl">
            {language === 'es' ? 'Presione de nuevo para salir' : 'Press again to exit'}
          </div>
        </div>
      )}

      {/* Persistent Footer - Only on main top-level views and if not explicitly hidden */}
      {!isFooterHidden && ['home', 'profile', 'favorites', 'ai-chat'].includes(view) && (
        <Footer
          isDarkMode={isDarkMode}
          user={user}
          onOpenSearch={() => navigateTo('search')}
          onChangeLocation={() => handleBack()}
          onOpenAI={() => navigateTo('ai-chat')}
          onGoToFavorites={() => navigateTo('favorites')}
          onOpenProfile={() => navigateTo('profile')}
          onGoToHome={() => handleBack()}
          t={translations[language]}
          theme={{
            accentBg: isDarkMode ? 'bg-[#59CBC8]' : 'bg-[#00D1FF]',
            accentShadow: isDarkMode ? 'shadow-[0_0_25px_rgba(89,203,200,0.5)]' : 'shadow-[0_0_25px_rgba(0,209,255,0.6)]',
            accentText: isDarkMode ? 'text-[#59CBC8]' : 'text-[#0080FF]'
          }}
        />
      )}
    </div>
  );
};

export default App;
