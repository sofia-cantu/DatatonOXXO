
import pandas as pd
import geopandas as gpd
import joblib
import json
import numpy as np
from shapely.geometry import Point
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import OneHotEncoder

# --------------------------
# Constantes y columnas
# --------------------------
ENTORNOS_VALIDOS = {"Base", "Hogar", "Peatonal", "Receso"}

cat_cols = [
    "PLAZA_CVE", "NIVELSOCIOECONOMICO_DES", "ENTORNO_DES",
    "SEGMENTO_MAESTRO_DESC", "LID_UBICACION_TIENDA"
]

num_cols = [
    "MTS2VENTAS_NUM", "PUERTASREFRIG_NUM", "CAJONESESTACIONAMIENTO_NUM",
    "LATITUD_NUM", "LONGITUD_NUM",
    'POBTOT', 'TOTHOG', 'POCUPADA', 'PDESOCUP', 'P_18A24', 'P_18A24_F', 'P_18A24_M',
    'VPH_REFRI', 'VPH_AUTOM', 'VPH_PC', 'VPH_NDACMM', 'VPH_SINCINT',
    'P_12YMAS', 'P_15YMAS', 'P_15A49_F', 'POB15_64', 'PEA', 'PE_INAC', 'P12YM_CASA',
    'P12YM_SOLT', 'P15YM_AN', 'P15YM_SE', 'P15PRI_CO', 'P15SEC_CO', 'P18YM_PB'
]

# --------------------------
# Cargar datos globales
# --------------------------
df_clean = pd.read_csv("../Data/df_clean_final.csv")
df_features = df_clean.copy()

knn = NearestNeighbors(n_neighbors=1)
knn.fit(df_features[["LATITUD_NUM", "LONGITUD_NUM"]])

gdf = gpd.read_file("../DSC/DSC/Data/ne_10m_admin_1_states_provinces/ne_10m_admin_1_states_provinces.shp")
mexico = gdf[gdf['admin'] == 'Mexico']

def cargar_agebs_nl_tamps():
    gdf_nl = gpd.read_file("../Data/Datos-Inegi/ageb/19_nuevoleon/conjunto_de_datos/19a.shp").to_crs("EPSG:4326")
    gdf_tamps = gpd.read_file("../Data/Datos-Inegi/ageb/28_tamaulipas/conjunto_de_datos/28a.shp").to_crs("EPSG:4326")
    if 'AMBITO' in gdf_nl.columns:
        gdf_nl = gdf_nl[gdf_nl['AMBITO'] == '1']
    if 'AMBITO' in gdf_tamps.columns:
        gdf_tamps = gdf_tamps[gdf_tamps['AMBITO'] == '1']
    return pd.concat([gdf_nl, gdf_tamps], ignore_index=True)

gdf_agebs = cargar_agebs_nl_tamps()

# --------------------------
# Funciones auxiliares
# --------------------------
def esta_en_mexico(lat, lon):
    punto = Point(lon, lat)
    return mexico.contains(punto).any()

def esta_dentro_de_ageb(latitud, longitud):
    punto = gpd.GeoDataFrame(geometry=[Point(longitud, latitud)], crs="EPSG:4326")
    resultado = gpd.sjoin(punto, gdf_agebs, how='left', predicate='within')
    return not resultado['CVE_AGEB'].isna().values[0]

def predecir_tienda_nueva(nueva_tienda, model, encoder, cat_cols, num_cols):
    nueva_df = pd.DataFrame([nueva_tienda])
    cat_encoded = encoder.transform(nueva_df[cat_cols])
    cat_encoded_df = pd.DataFrame(cat_encoded, columns=encoder.get_feature_names_out(cat_cols), index=nueva_df.index)
    X_new = pd.concat([nueva_df[num_cols], cat_encoded_df], axis=1)
    for col in model.get_booster().feature_names:
        if col not in X_new.columns:
            X_new[col] = 0
    X_new = X_new[model.get_booster().feature_names]
    pred = model.predict(X_new)[0]
    prob = model.predict_proba(X_new)[0][1]
    return pred, prob

# --------------------------
# Función principal
# --------------------------
def generar_input_desde_coordenadas_json(lat, lon, entorno):
    if entorno not in ENTORNOS_VALIDOS:
        raise ValueError(f"Entorno '{entorno}' no válido. Usa uno de: {ENTORNOS_VALIDOS}")

    if not esta_en_mexico(lat, lon):
        raise ValueError("La ubicación está fuera de México.")

    if not esta_dentro_de_ageb(lat, lon):
        raise ValueError("Ubicación fuera de AGEBs urbanas.")

    # Buscar tienda más cercana
    _, idx = knn.kneighbors([[lat, lon]])
    tienda_cercana = df_features.iloc[idx[0][0]]

    # Construir el diccionario
    input_dict = {}

    # Categóricas
    input_dict.update({col: (entorno if col == "ENTORNO_DES" else tienda_cercana[col]) for col in cat_cols})

    # Numéricas
    for col in num_cols:
        if col == "LATITUD_NUM":
            input_dict[col] = lat
        elif col == "LONGITUD_NUM":
            input_dict[col] = lon
        else:
            input_dict[col] = tienda_cercana[col]

    # Convertir a JSON serializable si es necesario
    input_json = json.loads(json.dumps(input_dict, default=str))  # default=str evita errores con objetos no serializables

    return input_json

# --------------------------
# Función de prueba rápida
# --------------------------
def test_input_con_modelo(lat, lon, entorno, path_modelo="modelo-nueva-tienda.pkl"):
    modelo_dict = joblib.load(path_modelo)
    modelo = modelo_dict["modelo"]
    encoder = modelo_dict["encoder"]
    cat_cols = modelo_dict["cat_cols"]
    num_cols = modelo_dict["num_cols"]
    input_modelo = generar_input_desde_coordenadas_json(lat, lon, entorno)
    pred, prob = predecir_tienda_nueva(input_modelo, modelo, encoder, cat_cols, num_cols)
    return {"prediccion": pred, "probabilidad": prob}
