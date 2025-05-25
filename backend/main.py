import pickle
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel
from scipy.optimize import minimize
from sklearn.neighbors import NearestNeighbors
from fastapi.middleware.cors import CORSMiddleware

from funciones import esta_en_mexico, predecir_tienda_nueva, ventas_estimadas_con_ubicacion, haversine, armar_input_tienda, esta_dentro_de_ageb

# --- CARGA DE MODELOS Y DATOS
with open("modelo_xgboost.pkl", "rb") as f:
    paquete_modelo = pickle.load(f)

modelo = paquete_modelo["modelo"]
codificador = paquete_modelo["encoder"]
cat_cols = paquete_modelo["cat_cols"]
num_cols = paquete_modelo["num_cols"]

df_clean = pd.read_csv("df_clean_final.csv")

knn = NearestNeighbors(n_neighbors=1)  
knn.fit(df_clean[["LATITUD_NUM", "LONGITUD_NUM"]])

# --- APP
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- POST MODELO

class Entrada(BaseModel):
    LATITUD_NUM: float
    LONGITUD_NUM: float
    ENTORNO_DES: str

ENTORNOS_VALIDOS = {"Base", "Hogar", "Peatonal", "Receso"}

def predecir_y_optimizar_con_recomendacion(lat, lon, entorno, radio_km=5):
    try:
        if entorno not in ENTORNOS_VALIDOS:
            raise ValueError(f"Entorno '{entorno}' no válido. Debe ser uno de {ENTORNOS_VALIDOS}")

        if not esta_en_mexico(lat, lon):
            raise ValueError("Ubicación fuera de México, no se puede hacer predicción.")

        if not esta_dentro_de_ageb(lat, lon):
            print("Controlado: La ubicación está en zona NO habitable (montañas, lagos, bosques, etc.)")
            return None

        # Busco la tienda más cercana
        _, idx = knn.kneighbors([[lat, lon]])
        tienda_cercana = df_clean.iloc[idx[0][0]]

        base_tienda = armar_input_tienda(tienda_cercana, entorno, lat, lon, cat_cols, num_cols)

        # Valores iniciales para optimizar (puedes ajustar bounds)
        x0 = [base_tienda["MTS2VENTAS_NUM"], base_tienda["PUERTASREFRIG_NUM"], base_tienda["CAJONESESTACIONAMIENTO_NUM"]]
        bounds = [(50, 200), (1, 10), (0, 10)]

        resultado = minimize(
            ventas_estimadas_con_ubicacion,
            x0,
            args=(modelo, base_tienda, codificador, cat_cols, num_cols),
            bounds=bounds,
            method='L-BFGS-B'
        )

        if not resultado.success:
            print("La optimización no convergió. Usando parámetros base.")
            mts2_opt, puertas_opt, cajones_opt = x0
            prob_opt = None
        else:
            mts2_opt, puertas_opt, cajones_opt = resultado.x
            prob_opt = -resultado.fun

        pred_usuario, prob_init = predecir_tienda_nueva(base_tienda, modelo, codificador, cat_cols, num_cols)

        print("\n-- RESULTADO INICIAL --")
        print(f"Predicción: {'Éxito' if pred_usuario == 1 else 'No éxito'}")
        print(f"Probabilidad de éxito: {prob_init:.2%}")

        venta_real = tienda_cercana.get("VENTA_TOTAL", None)
        meta_real = tienda_cercana.get("Meta_venta", None)
        if venta_real is not None and meta_real is not None and meta_real != 0:
            diferencia = ((venta_real - meta_real) / meta_real) * 100
            if pred_usuario == 1:
                print(f"Las ventas mejorarían en aproximadamente {diferencia:.2f}%")
            else:
                print(f"Las ventas caerían por debajo de la meta en aproximadamente {abs(diferencia):.2f}%")

        print("\n-- RESULTADO OPTIMIZADO --")
        print(f"Mts2 óptimo: {mts2_opt:.2f}")
        print(f"Puertas refrigeración óptimo: {puertas_opt:.2f}")
        print(f"Cajones estacionamiento óptimo: {cajones_opt:.2f}")
        if prob_opt is not None:
            print(f"Probabilidad estimada de éxito optimizado: {prob_opt:.2%}")

        # Recomendar mejores ubicaciones en el radio
        df_tmp = df_clean.copy()
        df_tmp["DISTANCIA"] = haversine(lat, lon, df_tmp["LATITUD_NUM"], df_tmp["LONGITUD_NUM"])
        vecinas = df_tmp[df_tmp["DISTANCIA"] <= radio_km]

        mejor_prob = prob_init
        mejor_ubicacion = (lat, lon, prob_init)

        for _, row in vecinas.iterrows():
            tienda = armar_input_tienda(row, entorno, row["LATITUD_NUM"], row["LONGITUD_NUM"], cat_cols, num_cols)
            _, prob = predecir_tienda_nueva(tienda, modelo, codificador, cat_cols, num_cols)
            if prob > mejor_prob + 0.05:
                mejor_prob = prob
                mejor_ubicacion = (row["LATITUD_NUM"], row["LONGITUD_NUM"], prob)

        if (mejor_ubicacion[0], mejor_ubicacion[1]) != (lat, lon):
            lat2, lon2, prob2 = mejor_ubicacion
            print("\n-- RECOMENDACIÓN --")
            print(f"Ubicación sugerida: ({lat2:.5f}, {lon2:.5f})")
            print(f"Probabilidad de éxito: {prob2:.2%} (+{(prob2 - prob_init):.2%})")
        else:
            print("\nLa ubicación actual es adecuada. No se encontró mejora significativa en un radio de 5km.")

        return {
            "Prediccion inicial": (pred_usuario, prob_init),
            "Resultado optimizado": (mts2_opt, puertas_opt, cajones_opt, prob_opt),
            "Recomendacion": mejor_ubicacion
        }

    except ValueError as e:
        print(f"Error controlado: {e}")
        return None

# --- ENDPOINTS
@app.post("/api/evaluar")
def evaluar(data: Entrada):
    resultado = predecir_y_optimizar_con_recomendacion(
        data.LATITUD_NUM,
        data.LONGITUD_NUM,
        data.ENTORNO_DES
    )
    if resultado is None:
        return {"error": "Datos inválidos o fuera de rango"}
    return resultado

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