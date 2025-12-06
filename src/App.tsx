/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'*/
import './App.css'
/*
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}*/
// src/App.tsx

import VentaForm from './components/VentaForm';
import VentaList from './components/VentaList';

// Importa el CSS que viene por defecto o tu propio estilo
import './App.css';


function App() {
  return (
    // Asumiendo que has agregado utilidades como Tailwind CSS o algún estilo simple
    <div className="container mx-auto p-4 max-w-4xl"> 
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">SIGVeCa - Gestión de Ventas de Cacao</h1>
        <p className="text-xl text-gray-600">Versión 1.1: Registro y Visualización</p>
      </header>
      
      {/* Sección del Formulario */}
      <div className="max-w-md mx-auto mb-10">
        <VentaForm />
      </div>
      
      <hr className="my-10" />
      
      {/* Sección de la Lista de Ventas */}
      <section>
        <h2 className="text-3xl font-bold mb-6 text-gray-700">📚 Historial de Ventas</h2>
        <VentaList /> {/* ¡Componente de lista de ventas! */}
      </section>
    </div>
  );
}

export default App;


