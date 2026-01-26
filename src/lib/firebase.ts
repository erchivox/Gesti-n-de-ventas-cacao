// src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1. Reemplaza estos valores con la configuración de tu proyecto en Firebase
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app); // Ya no tiene 'export' aquí

export { db }; // Exportación con nombre explícita al final
// Inicializar Firestore
//export const db = getFirestore(app);