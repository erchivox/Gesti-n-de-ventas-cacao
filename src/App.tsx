// src/App.tsx (Asegúrate de importar BatchUpload)

import VentaList from './components/VentaList';
import { DashboardMetrics } from './components/DashboardMetrics';
import { BatchUpload } from './components/BatchUpload'; // ¡NUEVO IMPORT!
import VentaForm from './components/VentaForm'; // Mantén el formulario de momento
import './App.css';

function App() {
  return (
    <div className="container mx-auto p-4 max-w-4xl"> 
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">SIGVeCa - Gestión de Ventas de Cacao</h1>
        <p className="text-xl text-gray-600">Versión 3.0: Digitalización y Procesamiento en Lote</p>
      </header>
      
      {/* 👈 Sección de Métricas (Dashboard) */}
      <section className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-700 text-left">📈 Resumen de Flujo</h2>
        <DashboardMetrics />
      </section>
      
      <hr className="my-10" />

      {/* 👈 Sección de Carga en Lote (V3.0) */}
      <section className="mb-10">
          <BatchUpload />
      </section>

      <hr className="my-10" />

      {/* Sección del Formulario (manteniendo la opción manual) */}
      <div className="max-w-md mx-auto mb-10">
        <h2 className="text-3xl font-bold mb-4 text-gray-700 text-left">➕ Registro Manual</h2>
        <VentaForm />
      </div>
      
      <hr className="my-10" />
      
      {/* Sección de la Lista de Ventas */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-gray-700">📚 Historial de Ventas</h2>
        <VentaList />
      </section>
    </div>
  );
}

export default App;