//src/components/RateManager.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const RateManager: React.FC = () => {
  const [rate, setRate] = useState<number>(0);
  const [inputRate, setInputRate] = useState<string>('');

  useEffect(() => {
    // Escucha en tiempo real la tasa guardada en Firebase
    const unsub = onSnapshot(doc(db, 'config', 'tasas'), (docSnap) => {
      if (docSnap.exists()) {
        setRate(docSnap.data().bcv);
      }
    });
    return () => unsub();
  }, []);

  const handleUpdate = async () => {
    const val = parseFloat(inputRate);
    if (isNaN(val) || val <= 0) return alert("Ingresa una tasa válida");
    
    try {
      await setDoc(doc(db, 'config', 'tasas'), { bcv: val, fecha: new Date() });
      setInputRate('');
      alert("Tasa actualizada correctamente");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="text-gray-500 text-xs font-bold uppercase">Tasa BCV del día</h3>
        <p className="text-2xl font-black text-blue-700">Bs. {rate.toFixed(2)}</p>
      </div>
      <div className="flex gap-2">
        <input 
          type="number" 
          placeholder="Nueva tasa"
          value={inputRate}
          onChange={(e) => setInputRate(e.target.value)}
          className="border rounded-lg px-3 py-2 w-32 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button 
          onClick={handleUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
};
export default RateManager; 