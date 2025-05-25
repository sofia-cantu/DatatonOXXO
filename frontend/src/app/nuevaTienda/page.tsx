'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapaTiendas = dynamic(
  () => import('@/components/MapaTiendas'),
  { ssr: false }
);

export default function Page() {
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [entorno, setEntorno] = useState<string>('Hogar');
  const [porciento, setPorciento] = useState<number | ''>(85);
  const [exito, setExito] = useState<string>('buena');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tiendas, setTiendas] = useState([]);

  // Fetch stores data on component mount
  useEffect(() => {
    fetch('http://localhost:8000/api/tiendas')
      .then((res) => res.json())
      .then((data) => setTiendas(data))
      .catch(() => setTiendas([]));
  }, []);

  const handleSubmit = async () => {
    if (latitude === '' || longitude === '') {
      setError('Por favor, introduce latitud y longitud.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/evaluar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          LATITUD_NUM: Number(latitude),
          LONGITUD_NUM: Number(longitude),
          ENTORNO_DES: entorno
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Respuesta Back:', data);
      
      // Actualiza el estado con la respuesta de la API
      setPorciento(data.porciento || 0);
      setExito(data.exito || 'mejorable');
      
    } catch (err) {
      console.error('Error al conectar con la API:', err);
      setError('Error al conectar con el servidor. Por favor, intenta nuevamente.');
      // Valores por defecto en caso de error
      setPorciento(0);
      setExito('mejorable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="input-row">
          <div className="input-group">
            <label>Latitud:</label>
            <input
              type="number"
              placeholder="Ejemplo: 2.569107"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
          </div>
          <div className="input-group">
            <label>Entorno:</label>
            <select value={entorno} onChange={(e) => setEntorno(e.target.value)}>
              {['Base', 'Hogar', 'Peatonal', 'Receso'].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Longitud:</label>
            <input
              type="number"
              placeholder="Ejemplo: -100.21261"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
          </div>
        </div>
      </header>

      <div className="button-container">
        <button 
          className="play-button" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span>Cargando...</span>
          ) : (
            <svg viewBox="0 0 24 24">
              <polygon points="9.5,7.5 16.5,12 9.5,16.5" />
            </svg>
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main className="result">
        <div className="text-block">
          <h2>La localización en esta zona es <span className="highlight">{exito}</span>.</h2>
          <p className="percent">
            {exito === 'mejorable' 
              ? <>Le falta aumentar <strong>{porciento}%</strong> de las ventas para el éxito</>
              : <>Supera <strong>{porciento}%</strong> de las ventas esperadas para el éxito</>}
          </p>
          <p>El camino al éxito está cerca, por la naturaleza de la zona, te recomendamos tomar lo siguiente en mente:</p>
          <ul>
            <li>Punto 1</li>
            <li>Punto 2</li>
            <li>Punto 3</li>
          </ul>
          <p>Se recomienda bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla.</p>
        </div>
        
        {/* MAPA SIMPLIFICADO */}
        <div className="map-section">
          {tiendas.length > 0 ? (
            <MapaTiendas data={tiendas} />
          ) : (
            <div className="map-loading">Cargando mapa...</div>
          )}
        </div>

      </main>

      <style jsx>{`
        /* Layout */
        .container {
          margin: 0 auto;
          font-family: Arial, sans-serif;
        }
        
        .header {
          display: flex;
          flex-direction: column;
          padding: 1.5625rem;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          height: 10rem;
          background: #DF0024;
          color: white;
        }
        
        .input-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          gap: 1rem;
        }
        
        .result {
          display: flex;
          margin: 4rem 2rem 6rem 4rem;
          gap: 2rem;
        }
        
        .button-container {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: -1.5rem;
          position: relative;
          z-index: 1;
        }
        
        /* Input Groups */
        .input-group {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }
        
        .input-group label {
          margin-bottom: 0.5rem;
          color: white;
          font-weight: 600;
          font-size: 1.125rem;
        }
        
        .input-group input,
        .input-group select {
          width: 100%;
          height: 3.5rem;
          padding: 0.75rem 1rem;
          box-sizing: border-box;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          color: #374151;
          background-color: white;
          transition: box-shadow 0.2s;
        }
        
        .input-group input:focus,
        .input-group select:focus {
          outline: 0.125rem solid #F6D300;
        }
        
        /* Play Button */
        .play-button {
          width: 5rem;
          height: 5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: #F6D300;
          outline: 9px solid #DF0024;
          border: 1px solid #DF0024;
          transition: all 0.2s;
          margin-bottom: 2rem;
        }
        
        .play-button:hover:not(:disabled) {
          transform: scale(1.05);
          filter: brightness(0.95);
        }
        
        .play-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .play-button svg {
          width: 30rem;
          height: 30rem;
          fill: #DF0024;
        }
        
        /* Text Block */
        .text-block {
          flex: 1;
          margin-right: 2rem;
        }
        
        .text-block h2 {
          font-size: 1.5rem;
        }
        
        .text-block .highlight {
          color: #DF0024;
          text-decoration: underline;
        }
        
        .text-block .percent {
          font-size: 2rem;
          margin: 0.625rem 0;
        }
        
        .percent strong {
          color: #DF0024;
        }
        
        .text-block ul {
          list-style: disc;
          margin: 0.625rem 0 1.25rem 1.25rem;
        }
        
        /* MAPA - CSS SIMPLIFICADO */
        .map-section {
          flex: 1;
          height: 23rem;
          border: 0.7rem solid #DF0024;
          border-radius: 0.5rem;
        }
        
        .map-loading {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #777;
          font-style: italic;
        }
        
        /* Error Message */
        .error-message {
          color: white;
          background-color: #ff4444;
          padding: 1rem;
          margin: 1rem auto;
          border-radius: 0.5rem;
          max-width: 600px;
          text-align: center;
        }
        
        /* Responsive */
        @media (max-width: 48rem) {
          .input-row {
            flex-direction: column;
            gap: 0;
            margin-bottom: 1rem;
            height: auto;
            padding-bottom: 2rem;
            position: relative;
            z-index: 2;
            background: #DF0024;
          }
          
          .input-group {
            margin-bottom: 1rem;
          }
          
          .header {
            height: auto;
            padding-bottom: 3rem;
          }
          
          .button-container {
            margin-top: -2.5rem;
          }
          
          .result {
            flex-direction: column;
            margin-top: 0rem;
            gap: 1rem;
          }
          
          .text-block {
            margin-right: 0;
          }
          
          .map-section {
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
}