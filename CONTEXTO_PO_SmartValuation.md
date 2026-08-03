# SmartValuation - Contexto del Proyecto

## Descripcion General

SmartValuation es un asistente inteligente de tasacion para articulos de segunda mano. Permite a un vendedor obtener un rango de precio optimizado y una descripcion persuasiva con emojis lista para publicar en marketplaces como Mercado Libre, Facebook Marketplace y Amazon.

## Arquitectura

```
smartvaluation/
├── server.js              # Backend Node.js + Express 5
├── package.json           # Dependencias: express
├── .env                   # Variables de entorno (GROQ_API_KEY)
├── data/
│   └── productos.csv      # 84 productos con precios reales de MercadoLibre Mexico
├── templates/
│   └── index.html         # Frontend SPA con stepper form
└── static/
    ├── css/style.css      # Estilos responsivos + animaciones
    └── js/app.js          # Logica del stepper, graficas, historial
```

## Stack Tecnologico

| Componente | Tecnologia | Version |
|---|---|---|
| Backend | Node.js + Express | Express 5.2.1 |
| Frontend | HTML + CSS + JS vanilla | Sin framework |
| IA Generativa | Groq API (Llama 3.3 70B) | API gratuita |
| Graficas | Chart.js | 4.4.7 CDN |
| Datos | CSV local | 84 productos |
| Hosting | Render (free tier) | Automatico desde GitHub |

## Funcionalidades Implementadas

### 1. Stepper Form (4 pasos)
- Paso 1: Seleccion de categoria (10 opciones con iconos)
- Paso 2: Seleccion de marca y modelo (cascada)
- Paso 3: Estado del articulo + accesorios
- Paso 4: Resultado con precios, grafica, descripcion IA, links

### 2. Motor de Precios
- Base de datos CSV con precios reales de MercadoLibre Mexico
- Algoritmo con factores por categoria y estado
- Rango de precios: minimo, sugerido, maximo
- Busqueda exacta para evitar errores de match

### 3. IA Generativa (Groq API)
- Descripciones con emojis y marketing de ventas
- Streaming simulado con efecto typewriter
- Fallback local si no hay API key

### 4. Grafica de Precios (Chart.js)
- Barras comparando min/sugerido/max vs precio nuevo
- Colores: rojo (minimo), verde (sugerido), azul (maximo), gris (nuevo)

### 5. Historial Local
- Almacena ultimas 10 tasaciones en localStorage
- Tabla con fecha, articulo, estado, precio sugerido
- Boton para limpiar historial

### 6. Dashboard de Insights
- Depreciacion promedio por categoria
- Tarjetas con barras de progreso coloreadas
- Ordenado por menor depreciacion

### 7. Links a Marketplaces
- Botones directos a Mercado Libre, Facebook Marketplace, Amazon
- Busqueda automatica con marca + modelo

### 8. UX/UI
- Spinner CSS animado durante carga
- Validacion inline (sin alerts)
- Cursor parpadeante en descripcion
- Responsive para movil

## Variables de Entorno

```
GROQ_API_KEY=gsk_xxxxx  # API key de Groq (gratis)
PORT=5000                # Puerto del servidor
```

## Comandos Utiles

```bash
# Ejecutar local
GROQ_API_KEY=tu_key node server.js

# Ejecutar sin IA (fallback local)
node server.js

# Probar endpoint de precios
curl -X POST http://localhost:5000/api/tasar \
  -H "Content-Type: application/json" \
  -d '{"categoria":"Celular","marca":"Samsung","modelo":"Galaxy S23","estado":"Bueno","accesorios":"Funda"}'

# Probar insights
curl http://localhost:5000/api/insights
```

## Endpoints API

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/categorias` | Lista categorias disponibles |
| GET | `/api/marcas?categoria=X` | Marcas filtradas por categoria |
| GET | `/api/modelos?categoria=X&marca=Y` | Modelos filtrados |
| POST | `/api/tasar` | Calcula precios + genera descripcion IA |
| GET | `/api/insights` | Estadisticas de depreciacion por categoria |

## Datos del CSV

El archivo `data/productos.csv` contiene 84 productos con precios reales de MercadoLibre Mexico (agosto 2026):

| Categoria | Cantidad | Ejemplo |
|---|---|---|
| Celular | 26 | Galaxy S24 Ultra, iPhone 15, Pixel 8 |
| Laptop | 12 | ThinkPad E14, MacBook Pro, ROG Strix |
| Audifonos | 10 | AirPods Pro 2, WH-1000XM5 |
| Consola | 9 | PS5, Xbox Series X, Switch OLED |
| TV | 7 | LG OLED C3, Samsung QLED |
| Tablet | 6 | iPad 10, Galaxy Tab S9 |
| Refrigerador | 4 | Mabe 315L, Samsung 355L |
| Lavadora | 4 | Whirlpool 15kg, Mabe 17kg |
| Bicicleta | 3 | Giant ATX, Trek Marlin |
| Microondas | 3 | Whirlpool 20L, Samsung 23L |

## Algoritmo de Precios

```javascript
// Estado multiplicador
Excelente: +12%
Bueno: base (100%)
Regular: -22%
Deficiente: -45%

// Variacion por categoria
Celular: 8%, Laptop: 10%, TV: 12%, Consola: 6%

// Formula final
precio = base_used * estado_mult
variacion = max(500, precio * cat_factor)
minimo = precio - variacion
sugerido = precio
maximo = precio + variacion
```

## Mejoras Pendientes (Backlog)

### Prioridad Alta
- [ ] Web scraping en tiempo real de MercadoLibre (requiere OAuth o Puppeteer)
- [ ] Base de datos SQLite en vez de CSV
- [ ] Autenticacion de usuarios (Firebase Auth gratis)
- [ ] Historial en servidor (no solo localStorage)

### Prioridad Media
- [ ] Subir foto del articulo y predecir precio con vision AI
- [ ] Dashboard de analytics con graficas de tendencia
- [ ] Exportar descripcion como imagen para redes sociales
- [ ] Modo oscuro (dark mode)
- [ ] PWA (Progressive Web App) para instalar en movil

### Prioridad Baja
- [ ] Internacionalizacion (es/en)
- [ ] Tests unitarios con Jest
- [ ] Docker para despliegue
- [ ] CI/CD con GitHub Actions
- [ ] Rate limiting en la API

## Git Branching

```
main (produccion, deploy automatico en Render)
 └── develop (integracion)
      ├── feature/grafica-precios
      ├── feature/historial-local
      ├── feature/validacion-spinner
      ├── feature/dashboard-insights
      ├── feature/streaming-ia (cambiado a typewriter)
      └── feature/links-marketplace
```

## Deploy

- **Plataforma**: Render (free tier)
- **_REPO**: https://github.com/OscarEL1/smartvaluation
- **Build**: `npm install`
- **Start**: `npm start`
- **Env**: `GROQ_API_KEY` en Render Dashboard
- **Auto-deploy**: Push a `main`触发redeploy

## Contacto

- **Equipo**: Oscar Espinoza Landeta, Emmanuel Castro Salvador, Fernando Vasquez Valeriano, Fatima Avelino Celis
- **Universidad**: Universidad Tecnologica de Tehuacan
- **Proyecto**: ECBD 2026
