import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function cleanupCategories() {
  console.log("🧹 Iniciando limpieza de categorías duplicadas en Firestore...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 1. Centro Naturista
    console.log("\n📂 Procesando: 'Centro Naturista'");
    const naturistaRef = doc(db, "categories", "naturista");
    const centroNaturistaRef = doc(db, "categories", "centro-naturista");
    
    // Mover imagen del duplicado al original
    const imgCentroNaturista = "https://firebasestorage.googleapis.com/v0/b/services-17abe.firebasestorage.app/o/categories%2Fcentro-naturista%2Fcover?alt=media&token=427e7aaa-beb5-4194-8da8-fc98139a97a1";
    await updateDoc(naturistaRef, { imageUrl: imgCentroNaturista });
    console.log("  ✅ Imagen vinculada a 'naturista'");
    await deleteDoc(centroNaturistaRef);
    console.log("  🗑️ Documento 'centro-naturista' eliminado");

    // 2. Centros Educativos
    console.log("\n📂 Procesando: 'Centros Educativos'");
    const educacionRef = doc(db, "categories", "educacion");
    await deleteDoc(educacionRef);
    console.log("  🗑️ Documento 'educacion' eliminado (se mantiene 'educativos')");

    // 3. Aire Acondicionado
    console.log("\n📂 Procesando: 'Aire Acondicionado'");
    const aireAconUnderscoreRef = doc(db, "categories", "aire_acondicionado");
    const aireAconDashRef = doc(db, "categories", "aire-acondicionado");
    
    const imgAireAcon = "https://firebasestorage.googleapis.com/v0/b/services-17abe.firebasestorage.app/o/categories%2Faire-acondicionado%2Fcover?alt=media&token=6d939c06-e702-46b0-ad6b-bcfc21fa82c8";
    await updateDoc(aireAconUnderscoreRef, { imageUrl: imgAireAcon });
    console.log("  ✅ Imagen vinculada a 'aire_acondicionado'");
    await deleteDoc(aireAconDashRef);
    console.log("  🗑️ Documento 'aire-acondicionado' eliminado");

    console.log("\n✨ Limpieza finalizada exitosamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR DURANTE LA LIMPIEZA:", error);
    process.exit(1);
  }
}

cleanupCategories();
