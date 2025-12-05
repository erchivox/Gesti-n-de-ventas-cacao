

import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// (Opcional, importar VentaData si definiste la interfaz)

const VentaForm: React.FC = () => {
  const [cliente, setCliente] = useState('');
  const [cono, setCono] = useState(0);
  const [tableta, setTableta] = useState(0);
  const [dulce, setDulce] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Agregar un nuevo documento a la colección 'ventas'
      await addDoc(collection(db, 'ventas'), {
        cliente,
        cacaoCono: cono,
        cacaoTableta: tableta,
        cacaoDulce: dulce,
        fecha: new Date(),
        estado: 'Pendiente' // Estado inicial
      });

      // Limpiar el formulario
      setCliente('');
      setCono(0);
      setTableta(0);
      setDulce(0);
      alert('Venta registrada con éxito!');

    } catch (error) {
      console.error("Error al añadir documento: ", error);
      alert('Error al registrar la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow">
      <h3>➕ Registrar Nueva Venta</h3>
      <input
        type="text"
        placeholder="Nombre del Cliente"
        value={cliente}
        onChange={(e) => setCliente(e.target.value)}
        required
        className="w-full p-2 mb-2 border"
      />
      <p className="font-bold">Cantidades vendidas (en taza/unidades):</p>
      <label>Cacao Cono:
        <input type="number" value={cono} min="0" onChange={(e) => setCono(Number(e.target.value))} className="p-1 border ml-2 w-16" />
      </label><br />
      <label>Cacao Tableta:
        <input type="number" value={tableta} min="0" onChange={(e) => setTableta(Number(e.target.value))} className="p-1 border ml-2 w-16" />
      </label><br />
      <label>Cacao Dulce:
        <input type="number" value={dulce} min="0" onChange={(e) => setDulce(Number(e.target.value))} className="p-1 border ml-2 w-16" />
      </label><br />
      <button type="submit" disabled={loading} className="mt-4 p-2 bg-green-500 text-white rounded hover:bg-green-600">
        {loading ? 'Registrando...' : 'Registrar Venta'}
      </button>
    </form>
  );
};

export default VentaForm;