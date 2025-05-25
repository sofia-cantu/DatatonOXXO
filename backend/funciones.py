import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

# --- ARCHIVOS
gdf = gpd.read_file("ne_10m_admin_1_states_provinces.shp")
df_clean_final = pd.read_csv("df_clean_final.csv")

# --- ESTÁ EN MÉXICO
mexico = gdf[gdf['admin'] == 'Mexico']

def esta_en_mexico(lat, lon):
    punto = Point(lon, lat)  
    return mexico.contains(punto).any()

# --- FUNCIONES ALAIN
def cargar_agebs_nl_tamps():
    gdf_nl = gpd.read_file("19a.shp").to_crs("EPSG:4326")
    gdf_tamps = gpd.read_file("28a.shp").to_crs("EPSG:4326")

    if 'AMBITO' in gdf_nl.columns:
        gdf_nl = gdf_nl[gdf_nl['AMBITO'] == '1']
    if 'AMBITO' in gdf_tamps.columns:
        gdf_tamps = gdf_tamps[gdf_tamps['AMBITO'] == '1']

    gdf_agebs = pd.concat([gdf_nl, gdf_tamps], ignore_index=True)
    return gdf_agebs

gdf_agebs = cargar_agebs_nl_tamps()

def esta_dentro_de_ageb(latitud: float, longitud: float) -> bool:
    punto = gpd.GeoDataFrame(geometry=[Point(longitud, latitud)], crs="EPSG:4326")
    resultado = gpd.sjoin(punto, gdf_agebs, how='left', predicate='within')
    return not resultado['CVE_AGEB'].isna().values[0]

def evaluar(LATITUD_NUM, LONGITUD_NUM):
    lat, lon = LATITUD_NUM, LONGITUD_NUM
    if esta_dentro_de_ageb(lat, lon):
        return True
    else:
        return False
    
def armar_input_tienda(row, entorno, lat, lon, cat_cols, num_cols):
    tienda = {col: row[col] for col in cat_cols if col != "ENTORNO_DES"}  
    tienda["ENTORNO_DES"] = entorno  

    for col in num_cols:
        tienda[col] = row[col]
    
    tienda["LATITUD_NUM"] = lat
    tienda["LONGITUD_NUM"] = lon
    return tienda

# --- PREDECIR TIENDA NUEVA
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

# --- VENTAS ESTIMADAS CON UBICACIÓN
def ventas_estimadas_con_ubicacion(x, modelo, base_tienda, encoder, cat_cols, num_cols):

    tienda = base_tienda.copy()

    tienda["MTS2VENTAS_NUM"] = x[0]
    tienda["PUERTASREFRIG_NUM"] = x[1]
    tienda["CAJONESESTACIONAMIENTO_NUM"] = x[2]

    _, prob = predecir_tienda_nueva(tienda, modelo, encoder, cat_cols, num_cols)

    return -prob

# --- HAVERSINE
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  

    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = np.sin(dlat/2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2.0)**2
    c = 2 * np.arcsin(np.sqrt(a))

    return R * c