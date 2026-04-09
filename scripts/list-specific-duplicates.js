import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, where, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function listSpecificDuplicates() {
  const targetNames = ["Centro Naturista", "Centros Educativos", "Aire Acondicionado"];
  console.log("🔍 Investigando registros específicos en Firestore...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    for (const name of targetNames) {
      console.log(`\n📂 Buscando: "${name}"`);
      const q = query(collection(db, "categories"), where("name", "==", name));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`  ⚠️ No se encontraron registros con el nombre "${name}".`);
      } else {
        console.log(`  ✅ Se encontraron ${querySnapshot.size} registros:`);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`  - ID: [${doc.id}] | Icon: ${data.icon} | Key: ${data.translationKey}`);
        });
      }
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR AL LEER CATEGORÍAS ESPECÍFICAS:", error);
    process.exit(1);
  }
}

listSpecificDuplicates();
