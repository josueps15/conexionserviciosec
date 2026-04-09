import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, orderBy, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function listCategories() {
  console.log("🔍 Obteniendo lista completa de categorías...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const q = query(collection(db, "categories"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("⚠️ La colección 'categories' está vacía.");
    } else {
      console.log(`✅ Se encontraron ${querySnapshot.size} documentos en la colección 'categories'.\n`);
      const categories = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({ id: doc.id, name: data.name });
        console.log(`- [${doc.id}] ${data.name}`);
      });

      // Identificar duplicados
      const counts = {};
      const duplicates = [];
      categories.forEach(cat => {
        counts[cat.name] = (counts[cat.name] || 0) + 1;
        if (counts[cat.name] > 1) {
          duplicates.push(cat);
        }
      });

      if (duplicates.length > 0) {
        console.log("\n⚠️ CATEGORÍAS DUPLICADAS DETECTADAS:");
        duplicates.forEach(dup => {
            console.log(`  - ${dup.name} (Duplicate ID: ${dup.id})`);
        });
      } else {
        console.log("\n✅ No se detectaron duplicados por nombre.");
      }
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR AL LEER CATEGORÍAS:", error);
    process.exit(1);
  }
}

listCategories();
