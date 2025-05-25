import pandas as pd
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

df_clean = pd.read_csv("df_clean.csv") 

app = FastAPI()

# Permitir CORS (para que el frontend pueda llamar a la API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # cámbialo a tu IP o dominio en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo para recibir datos
class InputData(BaseModel):
    LATITUD_NUM: float
    LONGITUD_NUM: float
    ENTORNO_DES: str

@app.post("/api/evaluar")
def evaluar(data: InputData):
    # Simular una lógica dummy (puedes cambiarlo luego)
    lat, lon = data.LATITUD_NUM, data.LONGITUD_NUM
    entorno = data.ENTORNO_DES.lower()

    if entorno in ['hogar', 'base']:
        exito = 'buena'
        porciento = 85
    else:
        exito = 'mejorable'
        porciento = 40

    return {
        "exito": exito,
        "porciento": porciento
    }

@app.get("/api/tiendas")
def tiendas():
    return df_clean.to_dict(orient = "records")


@app.get("/api/desempeno-ventas/{tienda_id}")
def obtener_desempeno_ventas(tienda_id: int):
    df_tienda = df_clean[df_clean['TIENDA_ID'] == tienda_id].copy()
    df_tienda.sort_values(by='MES_ID', inplace=True)
    if df_tienda.empty:
        return {"error": "TIENDA_ID no encontrado en datos de ventas."}
    if len(df_tienda) < 2:
        return {"error": "No hay suficientes registros históricos para evaluar ventas."}
    venta_actual = float(df_tienda['VENTA_TOTAL'].iloc[-1])
    promedio_6m = float(df_tienda['VENTA_TOTAL'].iloc[-7:-1].mean() if len(df_tienda) >= 7 else df_tienda['VENTA_TOTAL'].iloc[:-1].mean())
    maximo = float(df_tienda['VENTA_TOTAL'].max())
    minimo = float(df_tienda['VENTA_TOTAL'].min())
    delta = venta_actual - promedio_6m
    porcentaje = (delta / promedio_6m) * 100 if promedio_6m != 0 else None
    return {
        "venta_ultimo_mes": venta_actual,
        "promedio_6_meses_previos": promedio_6m,
        "venta_maxima_historica": maximo,
        "venta_minima_historica": minimo,
        "comparativo_vs_promedio_pct": round(porcentaje, 2) if porcentaje is not None else None
    }


@app.get("/api/perfil-demografico/{tienda_id}")
def obtener_perfil_demografico(tienda_id: int):
    fila = df_clean[df_clean['TIENDA_ID'] == tienda_id]
    if fila.empty:
        return {"error": "TIENDA_ID no encontrado en datos demográficos."}
    fila = fila.iloc[0]
    return {
        "poblacion_total": int(fila['POBTOT']),
        "total_hogares": int(fila['TOTHOG']),
        "poblacion_economicamente_activa": int(fila['PEA']),
        "viviendas_con_automovil": int(fila['VPH_AUTOM'])
    }


@app.get("/api/historial-ventas/{tienda_id}")
def obtener_historial_ventas(tienda_id: int):
    df_tienda = df_clean[df_clean['TIENDA_ID'] == tienda_id].copy()

    if df_tienda.empty:
        return {"error": "TIENDA_ID no encontrado en datos de ventas."}

    df_tienda.sort_values(by="MES_ID", inplace=True)

    historial = [
        {"mes_id": int(row["MES_ID"]), "venta_total": float(row["VENTA_TOTAL"])}
        for _, row in df_tienda.iterrows()
    ]

    return {
        "tienda_id": tienda_id,
        "historial_ventas": historial
    }