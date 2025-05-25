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
