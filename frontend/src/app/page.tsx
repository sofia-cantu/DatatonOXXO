'use client';

import React, { useState } from 'react';

export default function Page() {
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [entorno, setEntorno] = useState<string>('Hogar');
  const [porciento, setPorciento] = useState<number | ''>(66);
  const [exito, setExito] = useState<string>('excelente');

  const handleSubmit = () => {
    if (latitude === '' || longitude === '') return;
    console.log({ LATITUD_NUM: latitude, LONGITUD_NUM: longitude, ENTORNO_DES: entorno });
    // Aquí podrías actualizar porciento y exito según la respuesta de tu API
    // setPorciento(nuevoValor);
    // setExito(nuevoEstado);
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
        <button className="play-button" onClick={handleSubmit}>
          <svg viewBox="0 0 24 24">
            <polygon points="9.5,7.5 16.5,12 9.5,16.5" />
          </svg>
        </button>
      </div>

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
        <div className="map-placeholder">
          <div className="map-box">Mapa cargando...</div>
        </div>
      </main>

      <style jsx>{`
        /* Layout */
        .container {
          max-width: 75rem;
          margin: 0 auto;
          font-family: Arial, sans-serif;
        }
        
        .header {
          display: flex;
          flex-direction: column;
          padding: 1.5625rem;
          border-radius: 0.5rem;
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
        }
        
        .map-placeholder {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
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
          outline: 10px solid #DF0024;
          box-shadow: none;
          transition: all 0.2s;
          margin-bottom: 2rem;
        }
        
        .play-button:hover {
          transform: scale(1.05);
          filter: brightness(0.95);
        }
        
        .play-button svg {
          width: 20rem;
          height: 20rem;
          fill: #DF0024;
        }
        
        /* Text Block */
        .text-block {
          flex: 1;
          padding-right: 1.25rem;
          margin: 0 2rem 0 0;
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
        
        /* Map Box */
        .map-box {
          width: 100%;
          height: 18.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0.125rem solid #DF0024;
          border-radius: 0.5rem;
          color: #777;
          font-style: italic;
          margin: 0 2rem 0 0;
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
          }
          
          .map-placeholder {
            margin-top: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}