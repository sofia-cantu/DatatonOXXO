'use client';
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from "chart.js";
import { Line } from "react-chartjs-2";

// Registra los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistorialVenta {
  mes_id: number;
  venta_total: number;
}

interface VentasResponse {
  tienda_id: number;
  historial_ventas: HistorialVenta[];
}

interface VentasLineChartProps {
  tiendaId: number;
}

const VentasLineChart: React.FC<VentasLineChartProps> = ({ tiendaId }) => {
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const res = await axios.get<VentasResponse>(
          `http://localhost:8000/api/historial-ventas/${tiendaId}`
        );
        const historial = res.data.historial_ventas;

        const labels = historial.map((item: HistorialVenta) => {
          const mesStr = item.mes_id.toString();
          const anio = mesStr.slice(0, 4);
          const mes = parseInt(mesStr.slice(4, 6)) - 1;
          return new Date(Number(anio), mes).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short"
          });
        });

        const ventas = historial.map((item: HistorialVenta) => item.venta_total);

        setChartData({
          labels,
          datasets: [
            {
              label: "Venta Total",
              data: ventas,
              fill: true,
              borderColor: "rgba(75,192,192,1)",
              backgroundColor: "rgba(75,192,192,0.2)",
              tension: 0.4
            }
          ]
        });
      } catch (error) {
        console.error("Error al obtener el historial de ventas", error);
        setChartData({
          labels: [],
          datasets: []
        });
      }
    };

    fetchVentas();
  }, [tiendaId]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // Importante para que respete el contenedor
    layout: {
      padding: 20 // Añade padding interno
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        ticks: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  if (!chartData) return <p>Cargando gráfico...</p>;

  return (
    <div className="chart-wrapper">
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
      
      <style jsx>{`
        .chart-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        
        .chart-container {
          position: relative;
          width: 100% !important;
          height: 100% !important;
          min-height: 350px; /* Altura mínima específica */
          flex: 1;
        }
        
        .chart-container canvas {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default VentasLineChart;