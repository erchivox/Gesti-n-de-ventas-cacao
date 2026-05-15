// src/components/BatchUpload.tsx

import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

// Definimos los precios fijos
const PRECIOS = { cono: 1.9, tableta: 1.5, dulce: 1.0 };

// Función auxiliar para convertir el archivo a Base64
const fileToGenerativePart = async (file: File) => {
    const base64Promise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
    const base64Data = (await base64Promise) as string;
    return {
        inlineData: {
            data: base64Data.split(',')[1],
            mimeType: file.type
        },
    };
};

interface ParsedRecord {
    cliente: string;
    cacaoCono: number;
    cacaoTableta: number;
    cacaoDulce: number;
}

export const BatchUpload: React.FC = () => {
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0]);
            setMessage('');
        }
    };

    const handleScanAndSave = async () => {
        if (!uploadFile) {
            setMessage('❌ Por favor, selecciona una imagen primero.');
            return;
        }

        // --- INICIO DE LA CORRECCIÓN CRÍTICA ---
        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        
        if (!apiKey || apiKey.trim() === "") {
            setMessage('❌ Error: La API Key de Gemini no está configurada en el servidor.');
            return;
        }

        setIsProcessing(true);
        setMessage('⏳ Procesando imagen con IA...');

        try {
            // Inicializamos la IA aquí adentro para evitar que la app explote al cargar
            const genAI = new GoogleGenAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const imagePart = await fileToGenerativePart(uploadFile);
            
            const prompt = `
                Analiza esta imagen que contiene una tabla de ventas. 
                Extrae los datos y devuélvelos ÚNICAMENTE en formato JSON plano (un array de objetos).
                Cada objeto debe tener: "cliente" (nombre), "cacaoCono" (cantidad), "cacaoTableta" (cantidad) y "cacaoDulce" (cantidad).
                Si una celda está vacía, usa 0.
            `;

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            let text = response.text();
            
            // Limpiar posibles etiquetas de markdown del JSON
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const records: ParsedRecord[] = JSON.parse(text);
            // --- FIN DE LA CORRECCIÓN CRÍTICA ---

            let count = 0;
            for (const record of records) {
                const totalVenta = 
                    (record.cacaoCono * PRECIOS.cono) + 
                    (record.cacaoTableta * PRECIOS.tableta) + 
                    (record.cacaoDulce * PRECIOS.dulce);

                await addDoc(collection(db, 'ventas'), {
                    cliente: record.cliente,
                    productos: {
                        cono: record.cacaoCono,
                        tableta: record.cacaoTableta,
                        dulce: record.cacaoDulce
                    },
                    total: totalVenta,
                    fecha: new Date().toISOString(),
                    metodo: 'IA Scan'
                });
                count++;
            }

            setMessage(`✅ ¡Éxito! Se registraron ${count} ventas correctamente.`);
            setUploadFile(null);
        } catch (error) {
            console.error("Error completo:", error);
            setMessage('❌ Error al procesar: Asegúrate de que la API Key sea válida y que la imagen sea clara.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🚀 Escáner de Lotes con IA
            </h2>
            
            <div className="flex flex-col space-y-4">
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange} 
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isProcessing}
                />

                <button
                    onClick={handleScanAndSave}
                    disabled={isProcessing || !uploadFile}
                    className={`py-3 px-6 rounded-lg text-white font-bold transition-colors duration-300 ${
                        (isProcessing || !uploadFile)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isProcessing ? '⏳ Escaneando...' : '🖼️ Escanear y Registrar'}
                </button>
            </div>

            {message && (
                <p className={`mt-4 p-3 rounded text-sm ${
                    message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {message}
                </p>
            )}
        </div>
    );
};