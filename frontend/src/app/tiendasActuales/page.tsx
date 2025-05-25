'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapaTiendas = dynamic(
  () => import('@/components/MapaTiendas'),
  { ssr: false }
);

// Tipo para los datos demográficos
type DemographicData = {
  poblacion_total: number;
  total_hogares: number;
  poblacion_economicamente_activa: number;
  viviendas_con_automovil: number;
};

// Tipo para los datos de ventas
type SalesData = {
  venta_ultimo_mes: number;
  promedio_6_meses_previos: number;
  venta_maxima_historica: number;
  venta_minima_historica: number;
  comparativo_vs_promedio_pct: number | null;
};

export default function Page() {
  const [inputValue, setInputValue] = useState<string>('');
  const [tienda, setTienda] = useState<number | ''>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tiendas, setTiendas] = useState([]);

  // Metricas de tablas
  /*
  const [ventaUltimoMes, setVentaUltimoMes] = useState('$759,744');
  const [ventaSeisMeses, setVentaSeisMeses] = useState('$1,985,931');
  const [ventaMaximo, setVentaMaximo] = useState('$2,276,754');
  const [ventaMinimo, setVentaMinimo] = useState('$759,744');
  const [comparativoVsPromedio, setComparativoVsPromedio] = useState('61.7%');

  const [perfilPoblacion, setPerfilPoblacion] = useState('2,934');
  const [perfilHogares, setPerfilHogares] = useState('850.0');
  const [perfilEconomicaActiva, setPerfilEconomicaActiva] = useState('1,435.0');
  const [perfilViviendasAuto, setPerfilViviendasAuto] = useState('732.0');
  */
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [demographicData, setDemographicData] = useState<DemographicData | null>(null);

  // Formateador de números
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  });

  const percentageFormatter = new Intl.NumberFormat('es-MX', {
    style: 'percent',
    maximumFractionDigits: 1
  });

  // Fetch stores data on component mount
    useEffect(() => {
      fetch('http://localhost:8000/api/tiendas')
        .then((res) => res.json())
        .then((data) => setTiendas(data))
        .catch(() => setTiendas([]));
    }, []);

  const handleSubmit = async () => {
    if (!inputValue) return;

    setLoading(true);
    setError(null);

    try {
      //const tiendaValue = inputValue === '' ? '' : Number(inputValue);
      //setTienda(tiendaValue);
      const tiendaId = Number(inputValue);
      
      // Llamar a ambos endpoints en paralelo
      const [salesResponse, demographicResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/desempeno-ventas/${tiendaId}`),
        fetch(`http://localhost:8000/api/perfil-demografico/${tiendaId}`)
      ]);

      if (!salesResponse.ok || !demographicResponse.ok) {
        throw new Error('Error al obtener datos de la tienda');
      }

      const salesData: SalesData = await salesResponse.json();
      const demographicData: DemographicData = await demographicResponse.json();

      setSalesData(salesData);
      setDemographicData(demographicData);
      setTienda(tiendaId);

    } catch (err) {
      //setError('Ocurrió un error al procesar la tienda');
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setSalesData(null);
      setDemographicData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => formatter.format(value);

  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A';
    return percentageFormatter.format(value / 100);
  };

  return (
    <div className="container">
      <header className="header">
        <div className="input-row">
          <div className="input-group">
            <label>Anota el id de la tienda que te interese estudiar:</label>
            <input
              type="number"
              placeholder="Ejemplo: 33"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="button-container">
        <button 
          className="play-button" 
          onClick={handleSubmit}
          disabled={loading || inputValue.trim() === ''}
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
        {tienda === '' ? (
            <div className="noResult">
                <p>Mapa de todas las tiendas: </p>


                <div className="graph-placeholder">
                <div className="map-section">
                  {tiendas.length > 0 ? (
                    <MapaTiendas data={tiendas} />
                  ) : (
                    <div className="map-loading">Cargando mapa...</div>
                  )}
                </div>
                </div>
                
            </div>
        ) : (
            <div className="totalResult">

                <div className="espacio">
                    <div className="imagen">
                    <p>Mapa de todas las tiendas: </p>
                    <div className="graph-placeholder">
                        <div className="map-section">
                          {tiendas.length > 0 ? (
                            <MapaTiendas data={tiendas} />
                          ) : (
                            <div className="map-loading">Cargando mapa...</div>
                          )}
                        </div>
                    </div>
                    </div>
                        <table className="tiendas-tabla">
                          <thead>
                            <tr>
                              <th>Tipo de venta</th>
                              <th>Desempeño</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Último mes</td>
                              <td>{salesData ? formatCurrency(salesData.venta_ultimo_mes) : 'Cargando...'}</td>
                            </tr>
                            <tr>
                              <td>Promedio 6 meses</td>
                              <td>{salesData ? formatCurrency(salesData.promedio_6_meses_previos) : 'Cargando...'}</td>
                            </tr>
                            <tr>
                              <td>Máximo histórico</td>
                              <td>{salesData ? formatCurrency(salesData.venta_maxima_historica) : 'Cargando...'}</td>
                            </tr>
                            <tr>
                              <td>Mínimo histórico</td>
                              <td>{salesData ? formatCurrency(salesData.venta_minima_historica) : 'Cargando...'}</td>
                            </tr>
                            <tr>
                              <td>Comparativo vs promedio</td>
                              <td>{salesData ? formatPercentage(salesData.comparativo_vs_promedio_pct) : 'Cargando...'}</td>
                            </tr>
                          </tbody>
                        </table>
                </div>

                <div className="espacio">
                    <table className="tiendas-tabla">
                      <thead>
                        <tr>
                          <th>Categoría</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Población Total (POBTOT)</td>
                          <td>{demographicData?.poblacion_total.toLocaleString() ?? 'Cargando...'}</td>
                        </tr>
                        <tr>
                          <td>Total de Hogares (TOTHOG)</td>
                          <td>{demographicData?.total_hogares.toLocaleString() ?? 'Cargando...'}</td>
                        </tr>
                        <tr>
                          <td>Población Econ. Activa (PEA)</td>
                          <td>{demographicData?.poblacion_economicamente_activa.toLocaleString() ?? 'Cargando...'}</td>
                        </tr>
                        <tr>
                          <td>Viviendas con Auto (VPH_AUTOM)</td>
                          <td>{demographicData?.viviendas_con_automovil.toLocaleString() ?? 'Cargando...'}</td>
                        </tr>
                      </tbody>
                    </table>


                    <div className="imagen">
                    <p>Grafica de ventas para tienda {tienda}:</p>
                    <div className="graph-placeholder">
                        <div className="map-box">Grafica cargando...</div>
                    </div>
                    </div>
                </div>


            </div>
        )}

      </main>

      <style jsx>{`
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
        
        .noResult {
            display: flex;
            flex-direction: column;
            margin: 4rem 2rem 6rem 4rem;
            align-items: center; 
            font-weight: bold;     
            font-size: 1.2rem;
        }

        .totalResult {
            margin: 1rem 1rem 1rem 1rem;
            flex-direction: column;
            margin: 4rem 2rem 6rem 4rem;
        }

        .espacio {
            display: flex;
            flex-direction: row;
            margin-bottom: 3rem;
        }

        .espacio p {
            font-weight: bold;
            font-size: 1.2rem;
        }

        .map-placeholder {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* MAPA - CSS SIMPLIFICADO */
        .map-section {
          flex: 1;
          height: 23rem; /* o la altura que necesites */
          min-height: 400px; /* altura mínima */
          border: 0.7rem solid #DF0024;
          border-radius: 0.5rem;
          position: relative; /* importante para Leaflet */
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
        
        .graph-placeholder {
          width: 60vw;
          display: flex;
          align-items: center;
          justify-content: center;
        }


        .tiendas-tabla {
            width: 30vw;
            margin: 3rem;
            margin-top: 4rem; 
            border-collapse: collapse;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9f9f9; /* gris muy claro */
            color: #333; /* texto gris oscuro */
            border-radius: 8px;
            overflow: hidden;
        }

        .tiendas-tabla th,
        .tiendas-tabla td {
            padding: 0.8rem 1.2rem;
            text-align: left;
        }

        .tiendas-tabla th {
            background-color: #eaeaea; /* gris claro */
            font-weight: bold;
        }

        .tiendas-tabla tr:nth-child(even) {
            background-color: #f2f2f2; /* rayado claro */
        }

        .tiendas-tabla tr:hover {
            background-color: #e0e0e0; /* gris al pasar el cursor */
            cursor: pointer;
        }

        
        .button-container {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: -1.5rem;
          position: relative;
          z-index: 1;
        }
        
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
        
        .input-group input {
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
        
        .input-group input:focus {
          outline: 0.125rem solid #F6D300;
        }
        
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
          cursor: not-allowed;
        }
        
        .play-button svg {
          width: 30rem;
          height: 30rem;
          fill: #DF0024;
        }
        
        .map-box {
          width: 100%;
          height: 18.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0.7rem solid #DF0024;
          border-radius: 0.5rem;
          color: #777;
          font-style: italic;
          margin: 0 2rem 0 0;
        }
        
        .error-message {
          color: white;
          background-color: #ff4444;
          padding: 1rem;
          margin: 1rem auto;
          border-radius: 0.5rem;
          max-width: 600px;
          text-align: center;
        }
        
        @media (max-width: 48rem) {
          .input-row {
            flex-direction: column;
            gap: 0;
            margin-bottom: 1rem;
            height: auto;
            padding-bottom: 2rem;
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
        }
      `}</style>
    </div>
  );
}