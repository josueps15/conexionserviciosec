import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { Capacitor } from "@capacitor/core";

// Configuración Oficial - Conexión Servicios
// NOTA: Usamos una lógica de selección de API Key para asegurar compatibilidad total con Android Nativo
const IS_ANDROID = Capacitor.getPlatform() === 'android';

const firebaseConfig = {
  apiKey: IS_ANDROID 
    ? "AIzaSyAX7a2CMvkTAFQorgLFJxNYsCd3mBIvHFI" // Android API Key (from google-services.json)
    : "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU", // Web API Key
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: IS_ANDROID
    ? "1:231490961430:android:d35fa46ce3e9a317a2f537" // Android App ID
    : "1:231490961430:web:b1a9a92cd3416a51a2f537",   // Web App ID
  measurementId: "G-Y9W5TWE9ZH"
};

// Inicialización de la App
const app = initializeApp(firebaseConfig);

// Inicializamos Analytics
const analytics = getAnalytics(app);

// Servicios exportados
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- CONFIGURACIÓN PROFESIONAL DE PROVEEDORES ---

// 1. Google Provider Configuration
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
// 'select_account' fuerza a que Google pregunte qué cuenta usar (útil si tienes varias)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 2. Facebook Provider Configuration
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
// 'display: popup' asegura que la ventana se renderice correctamente en móviles
facebookProvider.setCustomParameters({
  'display': 'popup'
});

export { googleProvider, facebookProvider };

export default app;
