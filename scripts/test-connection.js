import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function testConnection() {
  console.log("🔍 Iniciando diagnóstico de conexión Firebase...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log("📡 1. Intentando leer colección 'categories'...");
    const q = query(collection(db, "categories"), limit(5));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("⚠️ La colección 'categories' está vacía o no existe.");
    } else {
      console.log(`✅ Conexión Firestore Exitosa. Se leyeron ${querySnapshot.size} categorías.`);
      querySnapshot.forEach((doc) => {
        console.log(`   - ID: ${doc.id} => ${doc.data().name}`);
      });
    }

    console.log("📡 2. Verificando estado de Firebase Auth...");
    if (auth) {
      console.log("✅ Servicio Auth inicializado correctamente.");
    }

    console.log("\n✨ Diagnóstico Finalizado: Los servicios de Firebase están OPERATIVOS.");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR CRÍTICO DE CONEXIÓN:", error);
    process.exit(1);
  }
}

testConnection();
