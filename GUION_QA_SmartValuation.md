# Guion de Preguntas y Respuestas
## SmartValuation — Extraccion de Conocimiento de Base de Datos

---

## PREGUNTAS SOBRE LOS DATOS

### P1: De donde salen los precios del CSV?

**R:** Los precios fueron extraidos del mercado real de MercadoLibre Mexico. Inicialmente intentamos acceso automatico via su API publica y web scraping, pero MercadoLibre requiere autenticacion OAuth para acceder a los datos. Por lo tanto, se realizo una extraccion manual controlada de 84 productos representativos de 10 categorias, verificando que los precios reflejen el mercado actual.

### P2: Por que no usaron una base de datos SQL o NoSQL?

**R:** El CSV se uso como prototipo rapido para demostrar el concepto de extraccion de conocimiento. Es un formato simple, sin dependencias, y facil de migrar a SQLite o MongoDB en el futuro. El objetivo de la materia es demostrar el proceso de extraccion, estructuracion y presentacion de conocimiento.

### P3: Que pasa si el producto que busca el usuario no esta en la base?

**R:** El sistema tiene un algoritmo de busqueda en 5 niveles: busqueda exacta por categoria+marca+modelo, luego por marca+modelo, luego por modelo con marca, y finalmente por coincidencia parcial. Si no encuentra ninguna coincidencia, retorna un error "Producto no encontrado en la base de datos".

### P4: Cuantos productos hay y por que esa cantidad?

**R:** 84 productos en 10 categorias. La cantidad se determino para cubrir los productos mas vendidos en MercadoLibre Mexico: celulares (26), laptops (12), audifonos (10), consolas (9), TVs (7), tablets (6), y electrodomesticos (14). Es una muestra representativa del mercado de segunda mano.

### P5: Los precios son exactos o aproximados?

**R:** Son precios aproximados pero realistas. Se basan en el rango de precios que se maneja en MercadoLibre Mexico para articulos usados en diferentes estados de conservacion. El algoritmo luego ajusta estos precios con multiplicadores segun el estado fisico del articulo.

---

## PREGUNTAS SOBRE EL ALGORITMO

### P6: Como funciona el algoritmo de precios?

**R:** El algoritmo usa una formula de tres factores:
1. Precio base del CSV para el estado del articulo
2. Multiplicador de estado: Excelente (+12%), Bueno (100%), Regular (-22%), Deficiente (-45%)
3. Variacion por categoria (Consolas 6%, Celulares 8%, TVs 12%, Lavadoras 15%)

La formula es: `precio_sugerido = base x multiplicador`, y el rango es mas o menos la variacion.

### P7: Por que los televisores se deprecian mas que las consolas?

**R:** Por la demanda del mercado. Las consolas como PS5 y Switch tienen alta demanda y poca oferta de usadas, por eso mantienen su valor (35% depreciacion). Los televisores tienen mas competencia de nuevos baratos y se deprecian mas rapido (43%).

### P8: Que tan preciso es el algoritmo?

**R:** El algoritmo esta calibrado para dar precios dentro del rango que maneja MercadoLibre Mexico. No es preciso al 100% porque cada articulo es unico, pero da una referencia solida. La IA generativa luego ajusta el tono de la descripcion segun el estado.

### P9: Por que no usaron Machine Learning para predecir precios?

**R:** Para este prototipo, un algoritmo basado en reglas con factores de negocio es suficiente y explicable. Un modelo de ML requeriria miles de datos historicos de ventas reales para entrenarse correctamente. Esto esta documentado como mejora futura.

### P10: Como se calcula la depreciacion que se muestra en los Insights?

**R:** Es el porcentaje promedio de perdida de valor de cada categoria comparando el precio nuevo vs el precio usado en buen estado. Formula: `depreciacion = (1 - precio_usado_bueno / precio_nuevo) x 100`. Se calcula en tiempo real desde el CSV.

---

## PREGUNTAS SOBRE LA IA

### P11: Que modelo de IA usan y por que?

**R:** Usamos Llama 3.3 70B via Groq API. Groq ofrece acceso gratuito a modelos de lenguaje de alta calidad con tiempos de respuesta muy rapidos (2-3 segundos). Llama 3.3 es un modelo open-source de Meta que genera texto de alta calidad en espanol.

### P12: La IA genera las descripciones o son templates?

**R:** Son descripciones generadas dinamicamente por la IA. Le enviamos un prompt con los datos del articulo y ella genera una descripcion con emojis, lenguaje de marketing y call to action. Si no hay API key disponible, usa un template local como fallback.

### P13: No es peligroso tener la API key en el codigo?

**R:** La API key NO esta en el codigo fuente. Se almacena como variable de entorno (GROQ_API_KEY) en el servidor. En el repositorio de GitHub esta en el archivo .env que esta en .gitignore. En Render se configura desde el dashboard.

---

## PREGUNTAS SOBRE LA ARQUITECTURA

### P14: Por que Node.js y no Python o Java?

**R:** Node.js fue elegido porque: (1) ya estaba instalado en el entorno de desarrollo, (2) Express es ideal para APIs REST rapidas, (3) el mismo lenguaje se usa en frontend y backend, (4) es ligero y rapido para este tipo de aplicacion.

### P15: Es escalable esta arquitectura?

**R:** Para el prototipo actual es suficiente. Para escalar a produccion real se necesitaria: (1) migrar el CSV a SQLite o PostgreSQL, (2) agregar autenticacion, (3) implementar web scraping en tiempo real, (4) usar Redis para cachear respuestas. Todo esto esta documentado en el backlog.

### P16: Por que no usaron un framework como React o Angular?

**R:** Para un prototipo de 3 horas, JavaScript vanilla con HTML/CSS es mas rapido de desarrollar. No se necesita la complejidad de un framework completo. El stepper form, las graficas y las animaciones se logran facilmente con CSS y Chart.js.

### P17: Cuanto cuesta desplegar la aplicacion?

**R:** $0 pesos. Render Free Tier hosting, GitHub para control de versiones, Groq API para IA. Todo es gratuito para este nivel de uso.

---

## PREGUNTAS SOBRE LA MATERIA

### P18: Que relacion tiene con Extraccion de Conocimiento de Base de Datos?

**R:** El proyecto demuestra todo el ciclo de extraccion de conocimiento:
1. Extraccion: Obtuvimos datos de MercadoLibre Mexico
2. Estructuracion: Organizamos los datos en un CSV con campos normalizados
3. Procesamiento: Aplicamos algoritmos de calculo y matching
4. Generacion de conocimiento: Creamos insights de depreciacion por categoria
5. Presentacion: Mostramos graficas, tablas y descripciones IA

### P19: Que aprendimos del proceso de extraccion?

**R:** Aprendimos que la extraccion automatica de datos de sitios web como MercadoLibre es dificil sin autorizacion (API con OAuth). Aprendimos a estructurar datos manualmente de forma consistente, y a crear algoritmos que transforman datos crudos en conocimiento util.

### P20: Cual seria el siguiente paso para mejorar la extraccion?

**R:** Implementar web scraping con Puppeteer o Playwright para obtener precios en tiempo real, o registrar una app en el programa de desarrolladores de MercadoLibre para acceder a su API oficial con OAuth.

---

## PREGUNTAS TRAMPA

### P21: El proyecto es solo un CRUD basico?

**R:** No. Un CRUD es crear, leer, actualizar y eliminar registros. Este proyecto tiene: (1) algoritmo de calculo de precios, (2) integracion con IA generativa, (3) dashboard de insights con analisis estadistico, (4) graficas interactivas.

### P22: Por que no usaron bases de datos relacionales?

**R:** El CSV cumple perfectamente su funcion como fuente de datos para este prototipo. La migracion a SQLite o PostgreSQL esta documentada como mejora futura.

### P23: Que diferencia tiene con una busqueda simple en Google?

**R:** Google te da listados de precios sin contexto. SmartValuation: (1) calcula un rango optimo basado en el estado, (2) genera una descripcion de venta lista, (3) muestra la depreciacion real, (4) da links directos a los marketplaces.

### P24: El costo $0 es realista para produccion?

**R:** Para un prototipo academico si. En produccion real con miles de usuarios se necesitaria: servidor dedicado (~$5-20/mes), base de datos (~$5-10/mes), API key de IA (~$10-50/mes). Total estimado: $20-80/mes.

### P25: Que tan original es el proyecto?

**R:** La idea de tasar articulos usados no es nueva, pero la combinacion de: (1) algoritmo de precios con factores de mercado mexicano, (2) IA generativa para descripciones, (3) dashboard de insights, (4) interfaz de 4 pasos con graficas, (5) todo por $0 en menos de 3 horas, lo hace original y practico.

---

## TIPS PARA LA PRESENTACION

1. **Empieza con el problema**: "Cuantos han tenido un articulo que no saben cuanto vender?"
2. **Muestra la app en vivo**: Abre smartvaluation.onrender.com y haz una tasacion real
3. **Destaca los numeros**: 84 productos, 10 categorias, ~3 segundos, $0 costo
4. **Explica la IA**: Muestra como genera una descripcion con emojis en tiempo real
5. **Cierra con escalabilidad**: "Esto es un prototipo, pero se puede escalar a..."

---

*Documento preparado para la materia de Extraccion de Conocimiento de Base de Datos*
*Universidad Tecnologica de Tehuacan — 2026*
