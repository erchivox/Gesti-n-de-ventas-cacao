// src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1. Reemplaza estos valores con la configuración de tu proyecto en Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCewI0aE0XIh9esswRzcRKX0Nd0fikoSxI",
  authDomain: "gestion-de-ventas-fcdd5.firebaseapp.com",
  projectId: "gestion-de-ventas-fcdd5",
  storageBucket: "gestion-de-ventas-fcdd5.firebasestorage.app",
  messagingSenderId: "415358785064",
  appId: "1:415358785064:web:018fe0770b3f037fe9c71d"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app); // Ya no tiene 'export' aquí

export { db }; // Exportación con nombre explícita al final
// Inicializar Firestore
//export const db = getFirestore(app);