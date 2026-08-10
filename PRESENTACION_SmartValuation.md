# SmartValuation
## Asistente Inteligente de Tasacion y Automatizacion de Ventas
### Extraccion de Conocimiento de Base de Datos

---

## 1. Problema a Resolver

### Paralisis del Vendedor

En el comercio de segunda mano, los vendedores enfrentan:

- **Falta de criterio para fijar precios** - No saben cuanto vale realmente su articulo usado
- **Paralisis ante la redaccion** - No saben como describir el producto de forma atractiva
- **Resultado**: Articulos utiles que permanecen almacenados indefinidamente

### Solucion

SmartValuation automatiza:
1. **Extraccion de precios** del mercado real
2. **Calculo inteligente** del rango optimo de venta
3. **Generacion de contenido** persuasivo con IA

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/CSS/JS)                │
│  Stepper Form → Grafica → Descripcion IA → Links        │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP API
┌─────────────────────┴───────────────────────────────────┐
│                  BACKEND (Node.js + Express)             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Motor de │  │  Buscador    │  │  Generador IA    │  │
│  │ Precios  │  │  de Productos│  │  (Groq/Llama3)   │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘  │
│       │               │                    │            │
│  ┌────┴───────────────┴────────────────────┴─────────┐  │
│  │           BASE DE DATOS (CSV - 84 productos)      │  │
│  │    Extraccion de MercadoLibre Mexico 2026          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Extraccion de Conocimiento

### 3.1 Fuentes de Datos

| Fuente | Metodo | Datos Obtenidos |
|---|---|---|
| MercadoLibre Mexico | Extraccion manual + API | Precios de 84 productos reales |
| Mercado Libre | Clasificacion por categorias | 10 categorias de productos |
| Mercado Libre | Analisis de depreciacion | Factores de estado fisico |

### 3.2 Estructura del Conocimiento

Cada producto extraido contiene:

```csv
categoria, marca, modelo, precio_nuevo, 
precio_usado_bueno, precio_usado_regular, precio_usado_deficiente
```

**Ejemplo real:**
```csv
Celular,Samsung,Galaxy S23,14999,8800,6500,4000
```

---

## 4. Base de Datos - Extraccion y Estructura

### 4.1 Dataset Extraido

| Categoria | Productos | Rango de Precios |
|---|---|---|
| Celular | 26 | $3,499 - $29,999 |
| Laptop | 12 | $7,499 - $24,999 |
| Audifonos | 10 | $1,999 - $12,999 |
| Consola | 9 | $4,499 - $12,499 |
| TV | 7 | $8,499 - $22,999 |
| Tablet | 6 | $4,499 - $13,999 |
| Refrigerador | 4 | $14,999 - $19,999 |
| Lavadora | 4 | $6,499 - $13,499 |
| Bicicleta | 3 | $7,499 - $13,999 |
| Microondas | 3 | $2,999 - $3,799 |
| **TOTAL** | **84** | |

### 4.2 Conocimiento Extraido por Producto

```
┌─────────────────────────────────────────┐
│         PRODUCTO: Galaxy S23            │
├─────────────────────────────────────────┤
│ Precio Nuevo:        $14,999            │
│ Precio Usado Bueno:  $8,800  (41% dep)  │
│ Precio Usado Regular:$6,500  (57% dep)  │
│ Precio Usado Defic:  $4,000  (73% dep)  │
│                                         │
│ Factor de Estado:                       │
│   Excelente: +12% sobre base            │
│   Bueno:     100% (base)                │
│   Regular:   -22% sobre base            │
│   Deficiente:-45% sobre base            │
└─────────────────────────────────────────┘
```

---

## 5. Algoritmo de Extraccion de Precios

### 5.1 Formula de Tasacion

```
precio_sugerido = precio_usado_base × multiplicador_estado

variacion = max(500, precio_sugerido × factor_categoria)

precio_minimo  = precio_sugerido - variacion
precio_maximo  = precio_sugerido + variacion
```

### 5.2 Factores de Conocimiento

**Multiplicadores por Estado:**
| Estado | Factor | Justificacion |
|---|---|---|
| Excelente | +12% | Prcticamente nuevo, sin rayones |
| Bueno | 100% | Uso normal, pequenos signos |
| Regular | -22% | Danos visibles, funciona bien |
| Deficiente | -45% | Danos funcionales o esteticos |

**Variacion por Categoria:**
| Categoria | Factor | Razon |
|---|---|---|
| Consola | 6% | Alta demanda, poca depreciacion |
| Celular | 8% | Mercado liquido |
| Tablet | 9% | Mercado estable |
| Laptop | 10% | Depreciacion moderada |
| TV | 12% | Depreciacion rapida |
| Lavadora | 14% | Electrodomesticos |
| Refrigerador | 15% | Mayor depreciacion |

---

## 6. Proceso de Extraccion y Generacion

### 6.1 Flujo de Datos

```
Usuario ingresa datos
        ↓
┌───────────────────┐
│ 1. BUSQUEDA      │  Busca en CSV por categoria+marca+modelo
│    de Producto    │  Algoritmo de busqueda en 5 niveles
└────────┬──────────┘
         ↓
┌───────────────────┐
│ 2. CALCULO       │  Aplica factores de estado y categoria
│    de Precios     │  Genera rango min/sugerido/max
└────────┬──────────┘
         ↓
┌───────────────────┐
│ 3. GENERACION    │  Envia prompt a Groq API (Llama 3.3)
│    con IA         │  Recibe descripcion con emojis
└────────┬──────────┘
         ↓
┌───────────────────┐
│ 4. PRESENTACION  │  Muestra resultados al usuario
│    de Resultados  │  Grafica + Descripcion + Links
└───────────────────┘
```

### 6.2 Prompt de Extraccion para IA

```
Escribe una descripcion de venta para marketplace.
Usa emojis llamativos, lenguaje de marketing y ventas.
Formato:
- Empieza con emoji + marca + modelo + estado
- Lista accesorios con checkmarks
- Menciona que funciona al 100%
- Cierra con call to action
```

---

## 7. Endpoints de Extraccion

### 7.1 API REST

| Metodo | Endpoint | Funcion |
|---|---|---|
| GET | `/api/categorias` | Extrae categorias unicas del CSV |
| GET | `/api/marcas?categoria=X` | Filtra marcas por categoria |
| GET | `/api/modelos?categoria=X&marca=Y` | Filtra modelos |
| POST | `/api/tasar` | Extrae precio + genera descripcion IA |
| GET | `/api/insights` | Calcula estadisticas de depreciacion |

### 7.2 Ejemplo de Request

```bash
curl -X POST http://localhost:5000/api/tasar \
  -H "Content-Type: application/json" \
  -d '{
    "categoria": "Celular",
    "marca": "Samsung",
    "modelo": "Galaxy S23",
    "estado": "Bueno",
    "accesorios": "Funda, cargador"
  }'
```

### 7.3 Respuesta Extraida

```json
{
  "precios": {
    "minimo": 8100,
    "sugerido": 8800,
    "maximo": 9500,
    "precio_nuevo": 14999
  },
  "descripcion": "🔥 Samsung Galaxy S23 en buen estado 💎...",
  "producto": {
    "categoria": "Celular",
    "marca": "Samsung",
    "modelo": "Galaxy S23"
  }
}
```

---

## 8. Insights de Mercado - Extraccion de Conocimiento

### 8.1 Analisis de Depreciacion

El sistema calcula automaticamente la depreciacion promedio por categoria:

| Categoria | Dep. Bueno | Dep. Regular | Dep. Deficiente |
|---|---|---|---|
| Consola | 35% | 54% | 73% |
| Audifonos | 36% | 56% | 75% |
| Bicicleta | 38% | 59% | 77% |
| Tablet | 39% | 58% | 76% |
| Celular | 41% | 58% | 75% |
| TV | 43% | 63% | 79% |
| Laptop | 44% | 64% | 80% |
| Refrigerador | 42% | 63% | 80% |
| Lavadora | 45% | 67% | 83% |

### 8.2 Conocimiento Extraido

- **Las consolas mantienen su valor** (35% depreciacion en buen estado)
- **Los electrodomesticos se deprecian mas rapido** (45% lavadoras)
- **Los celulares tienen mercado liquido** (41% depreciacion)
- **Las laptops se deprecian moderadamente** (44%)

---

## 9. Tecnologias de Extraccion

### 9.1 Stack Utilizado

| Capa | Tecnologia | Funcion |
|---|---|---|
| Extraccion de datos | CSV + Node.js FS | Lectura de base de datos |
| Busqueda | Algoritmo de matching en 5 niveles | Encontrar productos |
| Calculo | Formula matematica con factores | Precios optimizados |
| IA Generativa | Groq API + Llama 3.3 70B | Descripciones persuasivas |
| Presentacion | Chart.js + CSS | Graficas y visualizacion |
| Almacenamiento | localStorage | Historial del usuario |

### 9.2 Why These Technologies?

- **CSV**: Simple, rapido, sin dependencias de BD externas
- **Node.js + Express**: Rapido para APIs REST
- **Groq API**: Gratis, rapido, sin costo
- **Llama 3.3**: Modelo open-source de alta calidad
- **Chart.js**: Graficas interactivas sin backend

---

## 10. Resultados y Metricas

### 10.1 Cantidad de Conocimiento Extraido

```
84 productos × 7 campos = 588 datos de precios
10 categorias × 4 estados = 40 factores de depreciacion
5 endpoints API = 5 formas de acceder al conocimiento
```

### 10.2 Tiempo de Respuesta

- Busqueda en CSV: < 1ms
- Calculo de precios: < 1ms
- Generacion con IA: ~2-3 segundos
- Total: ~3 segundos por tasacion

### 10.3 Cobertura del Mercado

- **26 celulares** (Samsung, Apple, Xiaomi, Motorola, Google)
- **12 laptops** (HP, Dell, Lenovo, Acer, ASUS)
- **10 audifonos** (Sony, Apple, JBL, Samsung)
- **9 consolas** (Sony, Microsoft, Nintendo)
- **7 televisions** (LG, Samsung, Sony, TCL)
- **20 electrodomesticos** (Lavadoras, refrigeradores, microondas)

---

## 11. Git y Control de Versiones

### 11.1 branching Strategy

```
main (produccion)
 └── develop (integracion)
      ├── feature/grafica-precios
      ├── feature/historial-local
      ├── feature/validacion-spinner
      ├── feature/dashboard-insights
      ├── feature/streaming-ia
      └── feature/links-marketplace
```

### 11.2 Commits por Feature

| Feature | Commits | Descripcion |
|---|---|---|
| grafica-precios | 1 | Chart.js con barras comparativas |
| historial-local | 1 | localStorage con ultimas 10 |
| validacion-spinner | 1 | Spinner CSS + errores inline |
| dashboard-insights | 1 | Estadisticas de depreciacion |
| streaming-ia | 1 | Efecto typewriter |
| links-marketplace | 1 | Botones a ML, FB, Amazon |

---

## 12. Deploy y Produccion

### 12.1 Pipeline de Despliegue

```
Desarrollador hace push a GitHub
           ↓
GitHub notifica a Render
           ↓
Render ejecuta: npm install
           ↓
Render ejecuta: npm start
           ↓
App disponible en: smartvaluation.onrender.com
```

### 12.2 Plataforma

- **Render Free Tier**: Hosting automatico
- **GitHub**: Repositorio y control de versiones
- **Groq API**: IA generativa sin costo
- **Costo total**: $0 pesos

---

## 13. Conclusiones

### 13.1 Que logramos

1. **Extraccion exitosa** de 84 productos con precios reales del mercado mexicano
2. **Algoritmo inteligente** que considera categoria y estado del articulo
3. **IA generativa** que crea descripciones persuasivas con emojis
4. **Interfaz intuitiva** de 4 pasos con graficas visuales
5. **Deploy automatico** en produccion sin costo

### 13.2 Aplicacion de la Materia

- **Extraccion de datos**: MercadoLibre Mexico
- **Estructuracion**: CSV con campos normalizados
- **Procesamiento**: Algoritmos de calculo y matching
- **Generacion de conocimiento**: Insights de depreciacion por categoria
- **Presentacion**: Graficas, tablas y descripciones IA

### 13.3 Proximo Paso

- Web scraping en tiempo real de MercadoLibre
- Base de datos SQLite para escalabilidad
- Autenticacion de usuarios
- Historial en servidor

---

## 14. Preguntas

### Contacto

- **Equipo**: Oscar Espinoza Landeta, Emmanuel Castro Salvador, Fernando Vasquez Valeriano, Fatima Avelino Celis
- **Repositorio**: https://github.com/OscarEL1/smartvaluation
- **Demo**: https://smartvaluation.onrender.com
- **Materia**: Extraccion de Conocimiento de Base de Datos

---

### Fin

**SmartValuation** - Transformando datos del mercado en conocimiento util para vendedores
