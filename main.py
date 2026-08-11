import csv
import os
import math
import json
import base64
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SmartValuation API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent

# ---------------------------------------------------------------------------
# Load CSV
# ---------------------------------------------------------------------------
PRODUCTOS = []
csv_path = BASE_DIR / "data" / "productos.csv"
with open(csv_path, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        row["precio_nuevo"] = float(row.get("precio_nuevo", 0) or 0)
        row["precio_usado_bueno"] = float(row.get("precio_usado_bueno", 0) or 0)
        row["precio_usado_regular"] = float(row.get("precio_usado_regular", 0) or 0)
        row["precio_usado_deficiente"] = float(row.get("precio_usado_deficiente", 0) or 0)
        PRODUCTOS.append(row)

ESTADO_MULT = {"Excelente": 1.12, "Bueno": 1.0, "Regular": 0.78, "Deficiente": 0.55}

FACTOR_CATEGORIA = {
    "Celular": 0.08, "Laptop": 0.10, "Tablet": 0.09, "Consola": 0.06,
    "TV": 0.12, "Audifonos": 0.07, "Lavadora": 0.14, "Refrigerador": 0.15,
    "Microondas": 0.12, "Bicicleta": 0.05,
}

DEPRECIACION_MESES = {
    "Celular": 0.03, "Laptop": 0.025, "TV": 0.04, "Consola": 0.02,
    "Audifonos": 0.035, "Tablet": 0.03, "Lavadora": 0.045,
    "Refrigerador": 0.04, "Microondas": 0.04, "Bicicleta": 0.025,
}

CAT_ICONS = {
    "Celular": "📱", "Laptop": "💻", "Tablet": "📟", "Consola": "🎮",
    "TV": "📺", "Audifonos": "🎧", "Lavadora": "🫧", "Refrigerador": "❄️",
    "Microondas": "📻", "Bicicleta": "🚲",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def buscar_producto(categoria: str, marca: str, modelo: str):
    cl, ml, mdl = categoria.lower(), marca.lower(), modelo.lower().strip()

    for p in PRODUCTOS:
        if (p["categoria"].lower() == cl and p["marca"].lower() == ml
                and p["modelo"].lower().strip() == mdl):
            return p

    for p in PRODUCTOS:
        if p["marca"].lower() == ml and p["modelo"].lower().strip() == mdl:
            return p

    for p in PRODUCTOS:
        if (p["categoria"].lower() == cl and p["marca"].lower() == ml
                and mdl in p["modelo"].lower()):
            return p

    for p in PRODUCTOS:
        if p["marca"].lower() == ml and mdl in p["modelo"].lower():
            return p

    for p in PRODUCTOS:
        if mdl in p["modelo"].lower():
            return p

    return None


def calcular_precio(producto: dict, estado: str) -> dict:
    key = f"precio_usado_{estado.lower()}"
    base = producto.get(key, 0)
    if not base and estado == "Excelente":
        base = round(producto["precio_usado_bueno"] * 1.12)
    base = base or 0

    mult = ESTADO_MULT.get(estado, 1.0)
    cat_factor = FACTOR_CATEGORIA.get(producto["categoria"], 0.08)

    precio = round(base * mult)
    variacion = max(500, round(precio * cat_factor))

    minimo = max(100, round((precio - variacion) / 100) * 100)
    sugerido = round(precio / 100) * 100
    maximo = round((precio + variacion) / 100) * 100

    return {
        "minimo": minimo,
        "sugerido": sugerido,
        "maximo": maximo,
        "precio_nuevo": round(producto["precio_nuevo"]),
    }


def calcular_comparacion(precios: dict, producto: dict) -> dict:
    precios_similares = [
        p["precio_usado_bueno"]
        for p in PRODUCTOS
        if p["categoria"] == producto["categoria"] and p["precio_usado_bueno"] > 0
    ]
    promedio = sum(precios_similares) / len(precios_similares) if precios_similares else precios["sugerido"]
    diff = ((precios["sugerido"] - promedio) / promedio * 100) if promedio else 0

    if diff < -5:
        posicion = "muy por debajo del mercado"
        recomendacion = "Excelente para vender rapido. Podrias subir un poco."
    elif diff < 0:
        posicion = "ligeramente por debajo del mercado"
        recomendacion = "Buen precio para vender en 1-2 semanas."
    elif diff < 5:
        posicion = "en el promedio del mercado"
        recomendacion = "Precio competitivo. Venta estimada en 2-4 semanas."
    else:
        posicion = "por encima del mercado"
        recomendacion = "Podria tardar mas en vender. Considera bajar 5-10%."

    return {
        "precio_promedio_mercado": round(promedio),
        "diferencia_porcentaje": round(diff, 1),
        "posicion": posicion,
        "recomendacion": recomendacion,
        "total_productos_categoria": len(precios_similares),
    }


async def llamar_groq(prompt: str, max_tokens: int = 300, temperature: float = 0.8) -> str:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        print("GROQ_API_KEY no configurada")
        return ""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            data = resp.json()
            if "error" in data:
                print(f"Groq API error: {data['error']}")
                return ""
            return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except httpx.TimeoutException:
        print("Groq timeout")
        return ""
    except Exception as e:
        print(f"Groq exception: {e}")
        return ""


async def generar_descripcion(categoria, marca, modelo, estado, accesorios, idioma="both") -> str:
    api_key = os.environ.get("GROQ_API_KEY", "")
    acc_text = accesorios or "No incluye"

    if idioma == "both":
        lang_instruction = "Primero escribe la descripcion completa en ESPANOL. Luego escribe el separador '---'. Luego escribe la descripcion completa en INGLES."
    elif idioma == "es":
        lang_instruction = "Escribe SOLO en ESPANOL."
    else:
        lang_instruction = "Write ONLY in ENGLISH."

    prompt = f"""Eres un experto vendedor en MercadoLibre Mexico. Escribe una descripcion de venta PROFESIONAL y COMPLETA para este articulo de segunda mano.

INSTRUCCIONES IMPORTANTES:
- Escribe como si fueras el DUEÑO vendiendo su articulo personal, no como comprador
- Usa lenguaje de marketing profesional pero honesto
- NO inventes caracteristicas que no conozcas del modelo
- Enfocate en los puntos fuertes conocidos de este modelo especifico
- Maximo 250 palabras por idioma
- NO uses markdown, negrita ni asteriscos, solo texto plano con emojis

ESTRUCTURA DE LA DESCRIPCION:

1. TITULO LLAMATIVO:
Emoji de fuego + marca + modelo + gancho de venta

2. INTRODUCCION (2-3 lineas):
Breve descripcion de por que este articulo es una buena compra. Que lo hace especial.

3. CARACTERISTICAS DESTACADAS (5-7 bullet points):
Emoji de diamante + cada caracteristica importante del modelo:
- Camara y fotos
- Rendimiento/velocidad
- Pantalla
- Bateria
- Diseno y materiales
- Seguridad
- Cualquier otro punto fuerte conocido

4. ESTADO DEL ARTICULO:
Emoji de check + descripcion honesta del estado fisico

5. ACCESORIOS INCLUIDOS:
Emoji de caja + lista de accesorios con checkmarks

6. PRECIO Y NEGOCIACION:
Emoji de dinero + precio sugerido + nota sobre negociacion

7. CIERRE:
Call to action urgente + como contactar

IDIOMAS: {lang_instruction}

DATOS DEL ARTICULO:
- Categoria: {categoria}
- Marca: {marca}
- Modelo: {modelo}
- Estado: {estado}
- Accesorios incluidos: {acc_text}

Escribe SOLO la descripcion, sin titulos extra ni explicaciones."""

    if api_key:
        try:
            resultado = await llamar_groq(prompt, max_tokens=800, temperature=0.8)
            if resultado:
                return resultado
        except Exception as e:
            print(f"Groq error: {e}")

    estado_emoji = {"Excelente": "🔥", "Bueno": "👍", "Regular": "⚠️", "Deficiente": "📦"}.get(estado, "📦")
    acc_list = "\n".join(f"✅ {a.strip()}" for a in accesorios.split(",")) if accesorios else ""
    desc = f"{estado_emoji} ¡{marca} {modelo} en estado {estado}!\n"
    desc += f"💎 {marca} {modelo}, articulo en excelente condicion.\n"
    if acc_list:
        desc += f"📦 Incluye:\n{acc_list}\n"
    desc += "📱 Funciona al 100%, ideal para uso diario.\n"
    desc += "💰 Precio negociable. Envio disponible.\n"
    desc += "📩 Mandame mensaje si te interesa. ¡No dejes pasar esta oportunidad!"
    return desc


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class TasarParams(BaseModel):
    categoria: str
    marca: str
    modelo: str
    estado: str = "Bueno"
    accesorios: str = ""
    idioma: str = "both"


class ChatParams(BaseModel):
    pregunta: str
    producto: dict


class VisionParams(BaseModel):
    imagen: str


class AnalisisParams(BaseModel):
    marca: str
    modelo: str


# ---------------------------------------------------------------------------
# Routes: Static & HTML
# ---------------------------------------------------------------------------

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.get("/")
async def index():
    return FileResponse(str(BASE_DIR / "templates" / "index.html"))


# ---------------------------------------------------------------------------
# Routes: Base API
# ---------------------------------------------------------------------------

@app.get("/api/categorias")
async def categorias():
    cats = sorted(set(p["categoria"] for p in PRODUCTOS))
    return cats


@app.get("/api/marcas")
async def marcas(categoria: str = ""):
    cat = categoria.lower()
    marcas = sorted(set(p["marca"] for p in PRODUCTOS if cat in p["categoria"].lower()))
    return marcas


@app.get("/api/modelos")
async def modelos(categoria: str = "", marca: str = ""):
    cat, mar = categoria.lower(), marca.lower()
    modelos = sorted(set(
        p["modelo"] for p in PRODUCTOS
        if cat in p["categoria"].lower() and mar in p["marca"].lower()
    ))
    return modelos


@app.get("/api/insights")
async def insights():
    por_categoria = {}
    for p in PRODUCTOS:
        cat = p["categoria"]
        if cat not in por_categoria:
            por_categoria[cat] = {"count": 0, "dep_bueno": 0, "dep_regular": 0, "dep_deficiente": 0}
        d = por_categoria[cat]
        d["count"] += 1
        if p["precio_nuevo"] > 0:
            d["dep_bueno"] += (1 - p["precio_usado_bueno"] / p["precio_nuevo"]) * 100
            d["dep_regular"] += (1 - p["precio_usado_regular"] / p["precio_nuevo"]) * 100
            d["dep_deficiente"] += (1 - p["precio_usado_deficiente"] / p["precio_nuevo"]) * 100

    insights_list = []
    for cat, d in por_categoria.items():
        n = d["count"]
        insights_list.append({
            "categoria": cat,
            "icon": CAT_ICONS.get(cat, "📦"),
            "total": n,
            "depBueno": round(d["dep_bueno"] / n) if n else 0,
            "depRegular": round(d["dep_regular"] / n) if n else 0,
            "depDeficiente": round(d["dep_deficiente"] / n) if n else 0,
        })

    insights_list.sort(key=lambda x: x["depBueno"])
    return insights_list


# ---------------------------------------------------------------------------
# Routes: Pricing + AI
# ---------------------------------------------------------------------------

@app.post("/api/tasar")
async def tasar(params: TasarParams):
    producto = buscar_producto(params.categoria, params.marca, params.modelo)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado en la base de datos")

    precios = calcular_precio(producto, params.estado)
    comparacion = calcular_comparacion(precios, producto)

    try:
        descripcion = await generar_descripcion(
            params.categoria, params.marca, params.modelo,
            params.estado, params.accesorios, params.idioma,
        )
    except Exception as e:
        print(f"Error generando descripcion: {e}")
        acc_text = params.accesorios or "No incluye"
        descripcion = f"📱 {params.marca} {params.modelo} en estado {params.estado}. "
        descripcion += f"Incluye: {acc_text}. Excelente relacion calidad-precio. Envio disponible."

    return {
        "precios": precios,
        "descripcion": descripcion,
        "comparacion": comparacion,
        "producto": {
            "categoria": producto["categoria"],
            "marca": producto["marca"],
            "modelo": producto["modelo"],
        },
    }


@app.post("/api/tasar-stream")
async def tasar_stream(params: TasarParams):
    producto = buscar_producto(params.categoria, params.marca, params.modelo)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    precios = calcular_precio(producto, params.estado)

    api_key = os.environ.get("GROQ_API_KEY", "")

    async def event_generator():
        yield f"data: {json.dumps({'precios': precios})}\n\n"

        if not api_key:
            desc = f"{params.marca} {params.modelo} en estado {params.estado}."
            if params.accesorios:
                desc += f" Incluye: {params.accesorios}."
            desc += " Excelente relacion calidad-precio. Envio disponible."
            yield f"data: {json.dumps({'chunk': desc})}\n\n"
            yield "data: [DONE]\n\n"
            return

        acc_text = params.accesorios or "Ninguno"
        prompt = f"""Escribe una descripcion comercial persuasiva y honesta para vender este articulo en un marketplace.
Maximo 100 palabras. Sin emojis. Solo texto plano.

Articulo:
- Categoria: {params.categoria}
- Marca: {params.marca}
- Modelo: {params.modelo}
- Estado: {params.estado}
- Accesorios: {acc_text}

Escribe SOLO la descripcion, sin titulos ni explicaciones."""

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                async with client.stream(
                    "POST",
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 200,
                        "temperature": 0.7,
                        "stream": True,
                    },
                ) as resp:
                    buffer = ""
                    async for chunk in resp.aiter_text():
                        buffer += chunk
                        lines = buffer.split("\n")
                        buffer = lines.pop()
                        for line in lines:
                            if line.startswith("data: "):
                                data = line[6:]
                                if data.strip() == "[DONE]":
                                    yield "data: [DONE]\n\n"
                                    return
                                try:
                                    parsed = json.loads(data)
                                    content = parsed.get("choices", [{}])[0].get("delta", {}).get("content")
                                    if content:
                                        yield f"data: {json.dumps({'chunk': content})}\n\n"
                                except json.JSONDecodeError:
                                    pass
        except Exception as e:
            yield f"data: {json.dumps({'chunk': f'Error: {str(e)}'})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Routes: NEW AI Features
# ---------------------------------------------------------------------------

@app.post("/api/chat")
async def chat(params: ChatParams):
    producto = params.producto
    prompt = f"""Eres un asistente experto en VENTA de articulos usados en Mexico.
Tu trabajo es ayudar al VENDEDOR a vender su articulo lo mas rapido posible y al mejor precio.
NUNCA respondas como si fueras comprador. Siempre responde desde la perspectiva del vendedor.

CONTEXTO - El usuario esta vendiendo este producto:
- Marca: {producto.get('marca', 'N/A')}
- Modelo: {producto.get('modelo', 'N/A')}
- Estado: {producto.get('estado', 'N/A')}
- Precio sugerido para vender: ${producto.get('precio', 0)}

REGLAS:
- Responde SOLO sobre como VENDER mejor este articulo
- Da consejos para vender mas rapido y mejor
- Sugiere como mejorar la publicacion
- Recomienda estrategias de venta en MercadoLibre/Facebook
- Maximo 3 oraciones, breve y practico
- Si te preguntan sobre comprar, redirige a que eres asistente de VENDEDORES

Pregunta del vendedor: {params.pregunta}

Respuesta util para el vendedor:"""

    respuesta = await llamar_groq(prompt, max_tokens=200, temperature=0.7)
    if not respuesta:
        respuesta = "Como vendedor, te recomiendo: precio competitivo, fotos claras, descripcion honesta y envio rapido. Esto ayuda a vender mas rapido."

    return {"respuesta": respuesta}


@app.get("/api/prediccion")
async def prediccion(precio: float, categoria: str, meses: int = 12):
    factor = DEPRECIACION_MESES.get(categoria, 0.03)
    predicciones = []
    for i in range(1, meses + 1):
        precio_futuro = precio * math.pow(1 - factor, i)
        dep = (1 - math.pow(1 - factor, i)) * 100
        predicciones.append({
            "mes": i,
            "precio": round(precio_futuro),
            "depreciacion": round(dep, 1),
        })

    mejor_momento = "Ahora" if factor > 0.03 else "Tienes tiempo"
    venta_recomendada = "Vender dentro de 1-2 meses para maximizar ganancia" if factor > 0.03 else "Puedes esperar 3-6 meses sin perder mucho valor"

    return {
        "predicciones": predicciones,
        "mejor_momento": mejor_momento,
        "venta_recomendada": venta_recomendada,
        "depreciacion_mensual": round(factor * 100, 1),
    }


@app.post("/api/analisis-mercado")
async def analisis_mercado(params: AnalisisParams):
    prompt = f"""Basado en tu conocimiento del mercado mexicano de articulos usados (agosto 2026):

PRODUCTO: {params.marca} {params.modelo}

Proporciona un analisis conciso en JSON:
1. DEMANDA: (Alta/Media/Baja)
2. TENDENCIA: (Subiendo/Estable/Bajando)
3. MEJOR_MOMENTO_VENTA: (Ahora/Esperar_1_3_meses/Esperar_3_6_meses)
4. CONSEJOS: 3 tips para vender mejor este producto

Responde SOLO con el JSON, sin explicaciones adicionales.
Formato: {{"demanda":"...", "tendencia":"...", "momento":"...", "consejos":["tip1","tip2","tip3"]}}"""

    respuesta = await llamar_groq(prompt, max_tokens=250, temperature=0.7)

    try:
        analisis = json.loads(respuesta)
    except (json.JSONDecodeError, TypeError):
        analisis = {
            "demanda": "Media",
            "tendencia": "Estable",
            "momento": "Ahora",
            "consejos": [
                "Incluye todos los accesorios disponibles",
                "Tomas fotos de buena calidad con buena luz",
                "Describe honestamente el estado del producto"
            ]
        }

    return analisis


@app.post("/api/detectar-foto")
async def detectar_foto(params: VisionParams):
    """Detectar producto desde foto usando Google Cloud Vision (si esta configurado)."""
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    if not creds_path or not os.path.exists(creds_path):
        return {
            "detectado": False,
            "mensaje": "Google Cloud Vision no esta configurado. Sube las credenciales JSON.",
            "etiquetas": [],
        }

    try:
        from google.cloud import vision
        client = vision.ImageAnnotatorClient()

        img_bytes = base64.b64decode(params.imagen)
        image = vision.Image(content=img_bytes)

        response = client.label_detection(image=image)
        labels = response.label_annotations

        marcas_conocidas = ["Samsung", "Apple", "Sony", "Xiaomi", "LG", "Nike", "Nintendo", "Microsoft"]
        marca_detectada = None
        for label in labels:
            for marca in marcas_conocidas:
                if marca.lower() in label.description.lower():
                    marca_detectada = marca
                    break
            if marca_detectada:
                break

        tipos_map = {
            "Headphones": "Audifonos", "Headset": "Audifonos",
            "Mobile phone": "Celular", "Smartphone": "Celular",
            "Laptop": "Laptop", "Computer": "Laptop",
            "Television": "TV", "Tablet": "Tablet",
            "Game console": "Consola", "Bicycle": "Bicicleta",
        }
        tipo_detectado = None
        for label in labels:
            for keyword, tipo in tipos_map.items():
                if keyword.lower() in label.description.lower():
                    tipo_detectado = tipo
                    break
            if tipo_detectado:
                break

        etiquetas = [l.description for l in labels[:8]]

        productos_sugeridos = []
        if marca_detectada:
            productos_sugeridos = [
                {"marca": p["marca"], "modelo": p["modelo"], "categoria": p["categoria"]}
                for p in PRODUCTOS if p["marca"].lower() == marca_detectada.lower()
            ][:5]

        return {
            "detectado": True,
            "marca": marca_detectada,
            "tipo": tipo_detectado,
            "etiquetas": etiquetas,
            "productos_sugeridos": productos_sugeridos,
        }
    except Exception as e:
        return {"detectado": False, "mensaje": f"Error: {str(e)}", "etiquetas": []}


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    print(f"SmartValuation corriendo en http://localhost:{port}")
    print(f"Productos cargados: {len(PRODUCTOS)}")
    print(f"Documentacion API: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
