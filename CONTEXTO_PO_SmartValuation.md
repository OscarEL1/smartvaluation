# SmartValuation - Contexto del Proyecto

## Descripcion General

SmartValuation es un asistente inteligente de tasacion para articulos de segunda mano con IA integrada. Permite a un vendedor obtener un rango de precio optimizado, una descripcion profesional multi-idioma, analisis de mercado, prediccion de depreciacion y un chatbot consultor de ventas.

**URL**: https://smartvaluation.onrender.com

## Arquitectura

```
smartvaluation/
├── main.py                 # Backend Python + FastAPI (async)
├── requirements.txt        # Dependencias Python
├── render.yaml             # Configuracion de deploy en Render
├── data/
│   └── productos.csv       # 84 productos con precios reales de MercadoLibre Mexico
├── templates/
│   └── index.html          # Frontend SPA con stepper form + tabs
├── static/
│   ├── css/style.css       # Estilos modernos responsive (PC/Mobile)
│   └── js/app.js           # Logica del stepper, tabs, graficas, chat, historial
├── presentacion/           # Materiales de presentacion
│   ├── presentacion.html   # Diapositivas reveal.js
│   ├── SmartValuation_Presentacion.pdf
│   ├── SmartValuation_Presentacion.pptx
│   ├── generate-pdf.js
│   └── generate-pptx.js
├── CONTEXTO_PO_SmartValuation.md
├── GUION_QA_SmartValuation.md
└── .gitignore
```

## Stack Tecnologico

| Componente | Tecnologia | Version |
|---|---|---|
| Backend | Python + FastAPI | 0.141.1 |
| Servidor ASGI | Uvicorn | 0.52.1 |
| Frontend | HTML + CSS + JS vanilla | Sin framework |
| IA Generativa | Groq API (Llama 3.3 70B) | API gratuita |
| Vision AI | Google Cloud Vision | 1,000 fotos/mes gratis |
| Graficas | Chart.js | 4.4.7 CDN |
| HTTP Client | httpx (async) | 0.24.0+ |
| Datos | CSV local | 84 productos |
| Hosting | Render (free tier) | Python runtime |

## Funcionalidades Implementadas

### 1. Stepper Form (4 pasos)
- Paso 1: Seleccion de categoria (10 opciones con iconos) + Photo upload opcional
- Paso 2: Seleccion de marca y modelo (cascada)
- Paso 3: Estado del articulo + accesorios + idioma
- Paso 4: Resultado con tabs (Precios, Descripcion, Analisis, Chat)

### 2. Motor de Precios
- Base de datos CSV con precios reales de MercadoLibre Mexico
- Algoritmo con factores por categoria y estado
- Rango de precios: minimo, sugerido, maximo
- Busqueda en 5 niveles para evitar errores de match

### 3. IA Generativa - Descripcion Profesional (Groq API)
- Descripcion larga y detallada (250 palabras) con estructura profesional
- Multi-idioma: Espanol + Ingles
- Estructura: titulo, intro, caracteristicas, estado, accesorios, precio, cierre
- Efecto typewriter en el frontend
- Fallback local si no hay API key

### 4. Comparacion Inteligente
- Compara el precio sugerido con el promedio de la categoria
- Indica si esta "por encima", "en el promedio" o "por debajo" del mercado
- Recomienda estrategia de venta segun la posicion

### 5. Prediccion de Depreciacion
- Grafica de linea con evolucion del precio a 12 meses
- Calcula depreciacion mensual por categoria
- Recomienda mejor momento para vender

### 6. Analisis de Mercado con IA
- Demanda del producto (Alta/Media/Baja)
- Tendencia de precio (Subiendo/Estable/Bajando)
- Mejor momento para vender
- 3 consejos especificos para vender mejor

### 7. Chatbot Consultor de Ventas
- Preguntas y respuestas sobre como vender mejor el articulo
- Enfocado exclusivamente en asesorar al VENDEDOR
- Recomendaciones de precio, publicacion y estrategia

### 8. Vision AI (Google Cloud Vision)
- Subir foto del articulo para deteccion automatica
- Identifica marca, tipo de producto y etiquetas
- Sugiere productos de la base de datos

### 9. Grafica de Precios (Chart.js)
- Barras comparando min/sugerido/max vs precio nuevo
- Colores: rojo (minimo), verde (sugerido), azul (maximo), gris (nuevo)

### 10. Dashboard de Insights
- Depreciacion promedio por categoria
- Tarjetas con barras de progreso coloreadas
- Ordenado por menor depreciacion

### 11. Links a Marketplaces
- Botones directos a Mercado Libre, Facebook Marketplace, Amazon
- Busqueda automatica con marca + modelo

### 12. Historial Local
- Almacena ultimas 10 tasaciones en localStorage
- Tabla con fecha, articulo, estado, precio sugerido

### 13. Layout con Tabs
- **Tab Precios**: Grafica, comparacion, prediccion, links marketplaces
- **Tab Descripcion**: Texto completo generado por IA para copiar
- **Tab Analisis**: Analisis de mercado + insights de depreciacion
- **Tab Chat**: Chatbot de asesoramiento de ventas

### 14. UX/UI Moderno
- Diseno responsive: PC (3 columnas) vs Mobile (1 columna)
- Gradientes, sombras suaves, bordes redondeados
- Animaciones: fadeIn, pulse, hover effects
- Spinner CSS animado durante carga
- Scrollbar personalizado

## Variables de Entorno

```
GROQ_API_KEY=gsk_xxxxx    # API key de Groq (gratis)
GOOGLE_APPLICATION_CREDENTIALS=./vision/credentials.json  # Vision AI (opcional)
PORT=5000                 # Puerto del servidor
```

## Endpoints API

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/` | Frontend HTML |
| GET | `/docs` | Documentacion auto-generada de FastAPI |
| GET | `/api/categorias` | Lista categorias disponibles |
| GET | `/api/marcas?categoria=X` | Marcas filtradas por categoria |
| GET | `/api/modelos?categoria=X&marca=Y` | Modelos filtrados |
| POST | `/api/tasar` | Calcula precios + comparacion + descripcion IA |
| POST | `/api/tasar-stream` | Streaming de descripcion via SSE |
| GET | `/api/insights` | Estadisticas de depreciacion por categoria |
| POST | `/api/chat` | Chatbot de asesoramiento de ventas |
| GET | `/api/prediccion` | Prediccion de depreciacion a 12 meses |
| POST | `/api/analisis-mercado` | Analisis de mercado via IA |
| POST | `/api/detectar-foto` | Vision AI para detectar producto |

## Datos del CSV

El archivo `data/productos.csv` contiene 84 productos con precios reales de MercadoLibre Mexico (agosto 2026):

| Categoria | Cantidad | Depreciacion (Bueno) | Ejemplo |
|---|---|---|---|
| Consola | 9 | 35% | PS5, Xbox Series X, Switch OLED |
| Audifonos | 10 | 36% | AirPods Pro 2, WH-1000XM5 |
| Bicicleta | 3 | 38% | Giant ATX, Trek Marlin |
| Tablet | 6 | 39% | iPad 10, Galaxy Tab S9 |
| Celular | 26 | 41% | Galaxy S24 Ultra, iPhone 15, Pixel 8 |
| Refrigerador | 4 | 42% | Mabe 315L, Samsung 355L |
| TV | 7 | 43% | LG OLED C3, Samsung QLED |
| Microondas | 3 | 43% | Whirlpool 20L, Samsung 23L |
| Laptop | 12 | 44% | ThinkPad E14, MacBook Pro, ROG Strix |
| Lavadora | 4 | 45% | Whirlpool 15kg, Mabe 17kg |

## Algoritmo de Precios

```python
# Estado multiplicador
Excelente: +12% (1.12)
Bueno: base (1.0)
Regular: -22% (0.78)
Deficiente: -45% (0.55)

# Variacion por categoria
Celular: 8%, Laptop: 10%, Tablet: 9%, Consola: 6%
TV: 12%, Audifonos: 7%, Lavadora: 14%
Refrigerador: 15%, Microondas: 12%, Bicicleta: 5%

# Formula final
precio = base_used * estado_mult
variacion = max(500, precio * cat_factor)
minimo = precio - variacion
sugerido = precio
maximo = precio + variacion
```

## Decision de Datos: CSV vs APIs Externas

### APIs Investigadas

| API | Resultado | Razon |
|-----|-----------|-------|
| **MercadoLibre** | Bloqueada (403) | Requiere OAuth aprobado, endpoint de busqueda cerrado al publico |
| **eBay Browse API** | Limitada | Gratis pero solo 5,000 llamadas/dia, menos productos en Mexico |
| **Amazon PA API** | No disponible | Requiere ser Associate con ventas minimas |
| **AliExpress** | Sin API | No existe API publica |

### Decision: CSV como fuente de datos

1. **Costo $0**: No necesita servicios de terceros ni proxies
2. **Confiabilidad**: No depende de internet ni de APIs externas
3. **Velocidad**: El servidor carga los datos instantaneamente
4. **Suficiente para el prototipo**: 84 productos cubren las categorias principales
5. **Migrable**: Facil de migrar a SQLite o PostgreSQL

## Comandos Utiles

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar local
GROQ_API_KEY=tu_key python main.py

# Ejecutar sin IA (fallback local)
python main.py

# Probar endpoint de precios
curl -X POST http://localhost:5000/api/tasar \
  -H "Content-Type: application/json" \
  -d '{"categoria":"Celular","marca":"Samsung","modelo":"Galaxy S23","estado":"Bueno","accesorios":"Funda"}'

# Probar chatbot
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"pregunta":"Como vender mas rapido?","producto":{"marca":"Samsung","modelo":"Galaxy S23","estado":"Bueno","precio":8800}}'

# Ver documentacion API
# Abrir http://localhost:5000/docs
```

## Deploy en Render

1. Push a GitHub (rama main)
2. Render detecta `render.yaml`
3. Instala `pip install -r requirements.txt`
4. Ejecuta `python main.py`
5. Variable de entorno `GROQ_API_KEY` en Render Dashboard
6. Auto-deploy en cada push a main

## Git History

```
main (produccion, deploy automatico en Render)
├── feat: migrar backend a Python/FastAPI + IA features completas
├── feat: mejoras IA + layout tabs + chatbot enfocado en vender
├── feat: rediseño completo UI moderno responsive
├── fix: eliminar variable query duplicada que rompia el JS
├── fix: mejorar manejo de errores en llamadas a Groq API
├── docs: presentacion HTML, PDF y PowerPoint para materia
├── docs: guion de preguntas y respuestas para presentacion
└── docs: agregar seccion de decision de datos CSV vs APIs externas
```

## Mejoras Futuras Documentadas

### Prioridad Alta
- [ ] Vision AI completa con Google Cloud Vision (credenciales)
- [ ] Web scraping en tiempo real de MercadoLibre (requiere proxy residencial)
- [ ] Base de datos SQLite o Supabase en vez de CSV

### Prioridad Media
- [ ] Autenticacion de usuarios (Firebase Auth gratis)
- [ ] Historial en servidor (no solo localStorage)
- [ ] Dashboard de analytics con graficas de tendencia
- [ ] Modo oscuro (dark mode)

### Prioridad Baja
- [ ] PWA (Progressive Web App) para instalar en movil
- [ ] Tests unitarios
- [ ] Docker para despliegue
- [ ] CI/CD con GitHub Actions

## Contacto

- **Equipo**: Oscar Espinoza Landeta, Emmanuel Castro Salvador, Fernando Vasquez Valeriano, Fatima Avelino Celis
- **Universidad**: Universidad Tecnologica de Tehuacan
- **Proyecto**: ECBD 2026
- **URL**: https://smartvaluation.onrender.com
