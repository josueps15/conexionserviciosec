import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function dumpFirestore() {
  console.log("📂 Iniciando volcado de Firestore para análisis...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("📡 Leyendo colección 'categories'...");
    const querySnapshot = await getDocs(collection(db, "categories"));
    
    const results = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        name: data.name,
        hasImage: !!data.imageCover,
        imageCover: data.imageCover || null,
        allFields: Object.keys(data)
      });
    });

    console.log(`📊 Se encontraron ${results.length} documentos.`);
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR AL LEER FIRESTORE:", error);
    process.exit(1);
  }
}

dumpFirestore();
