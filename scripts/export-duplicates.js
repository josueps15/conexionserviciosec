import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, where, query } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function exportSpecificDuplicates() {
  const targetNames = ["Centro Naturista", "Centros Educativos", "Aire Acondicionado"];
  const results = {};
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    for (const name of targetNames) {
      const q = query(collection(db, "categories"), where("name", "==", name));
      const querySnapshot = await getDocs(q);
      
      results[name] = [];
      querySnapshot.forEach((doc) => {
        results[name].push({ id: doc.id, ...doc.data() });
      });
    }

    fs.writeFileSync('duplicates_data.json', JSON.stringify(results, null, 2), 'utf-8');
    console.log("✅ Datos exportados exitosamente a duplicates_data.json");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR AL EXPORTAR:", error);
    process.exit(1);
  }
}

exportSpecificDuplicates();
