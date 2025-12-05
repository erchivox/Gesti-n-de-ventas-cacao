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

// Importa el CSS que viene por defecto o tu propio estilo
import './App.css';

function App() {
  return (
    <div className="container mx-auto p-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold">SIGVeCa - Gestión de Ventas de Cacao</h1>
        <p className="text-lg">Versión 1.0: Registro Básico de Ventas</p>
      </header>
      <div className="max-w-md mx-auto">
        <VentaForm />
      </div>

      <hr className="my-8" />

      <section>
        <h2 className="text-2xl font-semibold mb-4">📚 Ventas Registradas (Próxima Versión)</h2>
        <p className="text-gray-600">Aquí se mostrará la lista de ventas cargadas desde Firebase y podrás ver el estado (Pendiente/Conciliado).</p>
      </section>
    </div>
  );
}

export default App;

