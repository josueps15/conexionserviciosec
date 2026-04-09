import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAAnI0HUJyW57SOu9JCO1n6AyaYT8HmSU",
  authDomain: "services-17abe.firebaseapp.com",
  projectId: "services-17abe",
  storageBucket: "services-17abe.firebasestorage.app",
  messagingSenderId: "231490961430",
  appId: "1:231490961430:web:b1a9a92cd3416a51a2f537",
  measurementId: "G-Y9W5TWE9ZH"
};

async function deepAudit() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("--- AUDITORÍA DE FIRESTORE ---");
  const snap = await getDocs(collection(db, "categories"));
  console.log(`Total documentos: ${snap.size}`);
  
  if (snap.size > 0) {
    const first = snap.docs[0];
    console.log(`Ejemplo Documento [${first.id}]:`, JSON.stringify(first.data(), null, 2));
  } else {
    console.log("¡ERROR! La colección 'categories' está VACÍA.");
  }

  process.exit(0);
}

deepAudit();
