const express = require('express');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length) process.env[key.trim()] = val.join('=').trim();
    });
}

const app = express();
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

let PRODUCTOS = [];
const csv = fs.readFileSync(path.join(__dirname, 'data/productos.csv'), 'utf-8');
const lines = csv.trim().split('\n');
const headers = lines[0].split(',');
for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    const obj = {};
    headers.forEach((h, j) => {
        obj[h.trim()] = vals[j]?.trim() || '';
    });
    obj.precio_nuevo = parseFloat(obj.precio_nuevo) || 0;
    obj.precio_usado_bueno = parseFloat(obj.precio_usado_bueno) || 0;
    obj.precio_usado_regular = parseFloat(obj.precio_usado_regular) || 0;
    obj.precio_usado_deficiente = parseFloat(obj.precio_usado_deficiente) || 0;
    PRODUCTOS.push(obj);
}

const ESTADO_MULT = { Excelente: 1.12, Bueno: 1.0, Regular: 0.78, Deficiente: 0.55 };

const FACTOR_CATEGORIA = {
    Celular: 0.08,
    Laptop: 0.10,
    Tablet: 0.09,
    Consola: 0.06,
    TV: 0.12,
    Audifonos: 0.07,
    Lavadora: 0.14,
    Refrigerador: 0.15,
    Microondas: 0.12,
    Bicicleta: 0.05,
};

function buscarProducto(categoria, marca, modelo) {
    const cl = categoria.toLowerCase();
    const ml = marca.toLowerCase();
    const mdl = modelo.toLowerCase().trim();

    const exactMatch = PRODUCTOS.find(p =>
        p.categoria.toLowerCase() === cl &&
        p.marca.toLowerCase() === ml &&
        p.modelo.toLowerCase().trim() === mdl
    );
    if (exactMatch) return exactMatch;

    const brandExact = PRODUCTOS.find(p =>
        p.marca.toLowerCase() === ml &&
        p.modelo.toLowerCase().trim() === mdl
    );
    if (brandExact) return brandExact;

    const catBrandModel = PRODUCTOS.find(p =>
        p.categoria.toLowerCase() === cl &&
        p.marca.toLowerCase() === ml &&
        p.modelo.toLowerCase().includes(mdl)
    );
    if (catBrandModel) return catBrandModel;

    const brandModel = PRODUCTOS.find(p =>
        p.marca.toLowerCase() === ml &&
        p.modelo.toLowerCase().includes(mdl)
    );
    if (brandModel) return brandModel;

    return PRODUCTOS.find(p => p.modelo.toLowerCase().includes(mdl));
}

function calcularPrecio(producto, estado) {
    const key = `precio_usado_${estado.toLowerCase()}`;
    let base = producto[key];
    if (!base && estado === 'Excelente') {
        base = Math.round(producto.precio_usado_bueno * 1.12);
    }
    base = base || 0;

    const mult = ESTADO_MULT[estado] || 1.0;
    const catFactor = FACTOR_CATEGORIA[producto.categoria] || 0.08;

    const precio = Math.round(base * mult);
    const variacion = Math.max(500, Math.round(precio * catFactor));

    const minimo = Math.round((precio - variacion) / 100) * 100;
    const sugerido = Math.round(precio / 100) * 100;
    const maximo = Math.round((precio + variacion) / 100) * 100;

    return {
        minimo: Math.max(100, minimo),
        sugerido,
        maximo,
        precio_nuevo: Math.round(producto.precio_nuevo),
    };
}

async function generarDescripcion(categoria, marca, modelo, estado, accesorios) {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (apiKey) {
        try {
            const accText = accesorios || 'Ninguno';
            const prompt = `Escribe una descripcion comercial persuasiva y honesta para vender este articulo en un marketplace. 
El texto debe ser atractivo, destacar puntos positivos, ser transparente sobre el estado y optimizado para busquedas.
Maximo 100 palabras. Sin emojis. Solo texto plano.

Articulo:
- Categoria: ${categoria}
- Marca: ${marca}
- Modelo: ${modelo}
- Estado: ${estado}
- Accesorios incluidos: ${accText}

Escribe SOLO la descripcion, sin titulos ni explicaciones.`;

            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 200,
                    temperature: 0.7,
                }),
            });
            const data = await res.json();
            if (data.choices?.[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
        } catch (e) {
            console.error('Groq error:', e.message);
        }
    }

    let desc = `${marca} ${modelo} en estado ${estado}.`;
    if (accesorios) desc += ` Incluye: ${accesorios}.`;
    desc += ' Excelente relacion calidad-precio. Envio disponible.';
    return desc;
}

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/api/categorias', (req, res) => {
    const cats = [...new Set(PRODUCTOS.map(p => p.categoria))].sort();
    res.json(cats);
});

app.get('/api/marcas', (req, res) => {
    const cat = (req.query.categoria || '').toLowerCase();
    const marcas = [...new Set(
        PRODUCTOS.filter(p => p.categoria.toLowerCase().includes(cat)).map(p => p.marca)
    )].sort();
    res.json(marcas);
});

app.get('/api/modelos', (req, res) => {
    const cat = (req.query.categoria || '').toLowerCase();
    const marca = (req.query.marca || '').toLowerCase();
    const modelos = [...new Set(
        PRODUCTOS.filter(p =>
            p.categoria.toLowerCase().includes(cat) &&
            p.marca.toLowerCase().includes(marca)
        ).map(p => p.modelo)
    )].sort();
    res.json(modelos);
});

app.get('/api/insights', (req, res) => {
    const porCategoria = {};
    PRODUCTOS.forEach(p => {
        if (!porCategoria[p.categoria]) {
            porCategoria[p.categoria] = { count: 0, depBueno: 0, depRegular: 0, depDeficiente: 0 };
        }
        const cat = porCategoria[p.categoria];
        cat.count++;
        cat.depBueno += (1 - p.precio_usado_bueno / p.precio_nuevo) * 100;
        cat.depRegular += (1 - p.precio_usado_regular / p.precio_nuevo) * 100;
        cat.depDeficiente += (1 - p.precio_usado_deficiente / p.precio_nuevo) * 100;
    });

    const insights = Object.entries(porCategoria).map(([cat, d]) => ({
        categoria: cat,
        total: d.count,
        depBueno: Math.round(d.depBueno / d.count),
        depRegular: Math.round(d.depRegular / d.count),
        depDeficiente: Math.round(d.depDeficiente / d.count),
    })).sort((a, b) => a.depBueno - b.depBueno);

    res.json(insights);
});

app.post('/api/tasar-stream', async (req, res) => {
    const { categoria, marca, modelo, estado, accesorios } = req.body;
    const producto = buscarProducto(categoria, marca, modelo);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const precios = calcularPrecio(producto, estado);

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    res.write(`data: ${JSON.stringify({ precios })}\n\n`);

    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
        let desc = `${marca} ${modelo} en estado ${estado}.`;
        if (accesorios) desc += ` Incluye: ${accesorios}.`;
        desc += ' Excelente relacion calidad-precio. Envio disponible.';
        res.write(`data: ${JSON.stringify({ chunk: desc })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
    }

    try {
        const accText = accesorios || 'Ninguno';
        const prompt = `Escribe una descripcion comercial persuasiva y honesta para vender este articulo en un marketplace. 
El texto debe ser atractivo, destacar puntos positivos, ser transparente sobre el estado y optimizado para busquedas.
Maximo 100 palabras. Sin emojis. Solo texto plano.

Articulo:
- Categoria: ${categoria}
- Marca: ${marca}
- Modelo: ${modelo}
- Estado: ${estado}
- Accesorios incluidos: ${accText}

Escribe SOLO la descripcion, sin titulos ni explicaciones.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.7,
                stream: true,
            }),
        });

        const reader = response.body;
        let buffer = '';

        for await (const chunk of reader) {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        res.write('data: [DONE]\n\n');
                        return res.end();
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
                        }
                    } catch {}
                }
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (e) {
        console.error('Stream error:', e.message);
        res.write(`data: ${JSON.stringify({ chunk: 'Error al generar descripcion.' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    }
});

app.post('/api/tasar', async (req, res) => {
    const { categoria, marca, modelo, estado, accesorios } = req.body;
    const producto = buscarProducto(categoria, marca, modelo);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado en la base de datos' });

    const precios = calcularPrecio(producto, estado);
    const descripcion = await generarDescripcion(categoria, marca, modelo, estado, accesorios);

    res.json({
        precios,
        descripcion,
        producto: { categoria: producto.categoria, marca: producto.marca, modelo: producto.modelo },
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`SmartValuation corriendo en http://localhost:${PORT}`);
    console.log(`Productos cargados: ${PRODUCTOS.length}`);
});
