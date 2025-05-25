# Dataton con Oxxo! 🚀

Este proyecto desarrolla un modelo predictivo para evaluar el éxito potencial de nuevas tiendas Oxxo, integrando variables clave como ubicación geográfica (latitud, longitud) y entorno (Base, Hogar, Peatonal, Receso). Además de predecir si la tienda será exitosa, el sistema genera un análisis con factores críticos y recomendaciones estratégicas personalizadas mediante un modelo de lenguaje (LLM). La solución incluye visualizaciones interactivas, como mapas y simulaciones de escenarios, para guiar decisiones de inversión. Con este proyecto, ofrecemos una herramienta integral para OXXO que combina precisión técnica con accionabilidad estratégica.

## 🧰 Tecnologías Usadas

- ### Backend (Python)
- **Framework**: FastAPI
- **ML**: XGBoost, Scikit-learn
- **Geoespacial**: Geopandas, Shapely
- **Optimización**: SciPy
- **Serialización**: Joblib, Pickle

### Frontend (JavaScript)
- **Framework**: Next.js
- **UI**: React
- **Visualización**: Leaflet/React-Leaflet
- **Estilos**: CSS Modules

## 📦 Instalación

### Requisitos Previos
- Python 3.9+
- Node.js 16+
- PostgreSQL 14+ (opcional para persistencia)

### Configuración
1. Clonar repositorio:
```bash
git clone https://github.com/tu-usuario/dataton-oxxo.git
```

#### Carpeta backend
```bash
cd dataton-oxxo/backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
#### Carpeta frontend
```bash
npm install
npm run dev
```

### Accedemos al navegador
```bash
http://localhost:3000
```
