const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'SmartValuation Team';
pptx.title = 'SmartValuation - Presentacion';

const BLUE = '2563eb';
const PURPLE = '7c3aed';
const DARK = '1e293b';
const GRAY = '64748b';
const LIGHT_GRAY = 'f8fafc';
const WHITE = 'FFFFFF';
const GREEN = '059669';
const LIGHT_GREEN = 'd1fae5';
const RED_BG = 'fee2e2';
const BLUE_BG = 'dbeafe';

// Helper: blue gradient background
function blueGradientBg(slide) {
  slide.background = { color: BLUE };
}

// Helper: white background
function whiteBg(slide) {
  slide.background = { color: WHITE };
}

// Helper: add a section divider slide
function addSectionSlide(title, subtitle) {
  const slide = pptx.addSlide();
  blueGradientBg(slide);
  slide.addText(title, { x: 0.5, y: 2.2, w: 12, h: 1.2, fontSize: 36, fontFace: 'Arial', color: WHITE, bold: true, align: 'center' });
  slide.addText(subtitle, { x: 0.5, y: 3.4, w: 12, h: 0.6, fontSize: 18, fontFace: 'Arial', color: 'b0c4ff', align: 'center' });
  return slide;
}

// ===== SLIDE 1: Title =====
{
  const slide = pptx.addSlide();
  blueGradientBg(slide);
  slide.addText('SmartValuation', { x: 0.5, y: 1.5, w: 12, h: 1.5, fontSize: 48, fontFace: 'Arial', color: WHITE, bold: true, align: 'center' });
  slide.addText('Asistente Inteligente de Tasacion\ny Automatizacion de Ventas', { x: 0.5, y: 3.0, w: 12, h: 1.0, fontSize: 20, fontFace: 'Arial', color: 'b0c4ff', align: 'center' });
  slide.addText([
    { text: 'Extraccion de Conocimiento de Base de Datos\n\n', options: { fontSize: 14, fontFace: 'Arial', color: WHITE, bold: true, align: 'center' } },
    { text: 'Oscar Espinoza Landeta\nEmmanuel Castro Salvador\nFernando Vasquez Valeriano\nFatima Avelino Celis\n\n', options: { fontSize: 14, fontFace: 'Arial', color: 'c8d6f0', align: 'center' } },
    { text: 'Universidad Tecnologica de Tehuacan — 2026', options: { fontSize: 12, fontFace: 'Arial', color: '94a3b8', align: 'center' } },
  ], { x: 0.5, y: 4.2, w: 12, h: 2.8, valign: 'middle' });
}

// ===== SLIDE 2: El Problema =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('El Problema', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 30, fontFace: 'Arial', color: BLUE, bold: true });
  slide.addText('Paralisis del Vendedor', { x: 0.5, y: 0.9, w: 12, h: 0.5, fontSize: 16, fontFace: 'Arial', color: GRAY });

  const cards = [
    { emoji: '\u{1F630}', title: 'Falta de criterio', desc: 'No saben cuanto vale realmente su articulo usado en el mercado actual' },
    { emoji: '\u{270D}\u{FE0F}', title: 'Paralisis ante la redaccion', desc: 'No saben como describir el producto de forma atractiva para vender' },
    { emoji: '\u{1F4E6}', title: 'Articulos estancados', desc: 'Productos utiles que permanecen almacenados indefinidamente' },
    { emoji: '\u{1F4A1}', title: 'Solucion SmartValuation', desc: 'Automatizamos la tasacion y la creacion de contenido para vender' },
  ];

  cards.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.1;
    const y = 1.7 + row * 2.3;

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.7, h: 2.0, fill: { color: LIGHT_GRAY }, rectRadius: 0.1, line: { color: 'e2e8f0', width: 1 } });
    slide.addText(c.emoji, { x: x + 0.2, y: y + 0.15, w: 1, h: 0.5, fontSize: 28, valign: 'middle' });
    slide.addText(c.title, { x: x + 0.2, y: y + 0.6, w: 5.2, h: 0.4, fontSize: 16, fontFace: 'Arial', color: DARK, bold: true });
    slide.addText(c.desc, { x: x + 0.2, y: y + 1.0, w: 5.2, h: 0.8, fontSize: 12, fontFace: 'Arial', color: GRAY });
  });
}

// ===== SLIDE 3: Que es SmartValuation =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('Que es SmartValuation?', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 30, fontFace: 'Arial', color: BLUE, bold: true });

  // Gradient box
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.2, w: 12, h: 2.2, fill: { color: BLUE }, rectRadius: 0.1 });
  slide.addText('Plataforma web inteligente que automatiza:', { x: 0.8, y: 1.3, w: 11.4, h: 0.5, fontSize: 18, fontFace: 'Arial', color: WHITE, bold: true });
  slide.addText([
    { text: '1.  Extraccion de precios del mercado real\n', options: { fontSize: 15, fontFace: 'Arial', color: WHITE } },
    { text: '2.  Calculo inteligente del rango optimo de venta\n', options: { fontSize: 15, fontFace: 'Arial', color: WHITE } },
    { text: '3.  Generacion de contenido persuasivo con IA', options: { fontSize: 15, fontFace: 'Arial', color: WHITE } },
  ], { x: 0.8, y: 1.8, w: 11.4, h: 1.5 });

  // 3 stat cards
  const stats = [
    { num: '84', lbl: 'Productos extraidos' },
    { num: '10', lbl: 'Categorias' },
    { num: '~3s', lbl: 'Tiempo de respuesta' },
  ];
  stats.forEach((s, i) => {
    const x = 0.5 + i * 4.1;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 3.7, w: 3.7, h: 1.8, fill: { color: LIGHT_GRAY }, rectRadius: 0.1, line: { color: 'e2e8f0', width: 1 } });
    slide.addText(s.num, { x, y: 3.8, w: 3.7, h: 1.0, fontSize: 36, fontFace: 'Arial', color: BLUE, bold: true, align: 'center' });
    slide.addText(s.lbl, { x, y: 4.7, w: 3.7, h: 0.6, fontSize: 12, fontFace: 'Arial', color: GRAY, align: 'center' });
  });
}

// ===== SLIDE 4: Arquitectura (section divider) =====
addSectionSlide('Arquitectura del Sistema', 'Como esta construida la aplicacion');

// ===== SLIDE 5: Arquitectura detail =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('Arquitectura', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 30, fontFace: 'Arial', color: BLUE, bold: true });

  // Architecture box
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.1, w: 12, h: 2.4, fill: { color: 'f0f9ff' }, rectRadius: 0.1, line: { color: 'bae6fd', width: 2 } });
  slide.addText([
    { text: 'FRONTEND', options: { fontSize: 12, fontFace: 'Courier New', color: DARK, bold: true } },
    { text: '  (HTML + CSS + JS)\n', options: { fontSize: 12, fontFace: 'Courier New', color: GRAY } },
    { text: 'Stepper Form \u2192 Grafica \u2192 Descripcion IA \u2192 Links\n\n', options: { fontSize: 11, fontFace: 'Courier New', color: DARK } },
    { text: 'BACKEND', options: { fontSize: 12, fontFace: 'Courier New', color: DARK, bold: true } },
    { text: '  (Node.js + Express 5)\n', options: { fontSize: 12, fontFace: 'Courier New', color: GRAY } },
    { text: 'Motor de Precios \u2192 Buscador de Productos \u2192 Generador IA (Groq/Llama3)\n\n', options: { fontSize: 11, fontFace: 'Courier New', color: DARK } },
    { text: 'BASE DE DATOS', options: { fontSize: 12, fontFace: 'Courier New', color: DARK, bold: true } },
    { text: '  (CSV - 84 productos)\n', options: { fontSize: 12, fontFace: 'Courier New', color: GRAY } },
    { text: 'Extraccion de MercadoLibre Mexico 2026', options: { fontSize: 11, fontFace: 'Courier New', color: DARK } },
  ], { x: 0.8, y: 1.2, w: 11.4, h: 2.2, valign: 'middle' });

  // 4 tech cards
  const techs = [
    { emoji: '\u26A1', title: 'Node.js + Express 5', desc: 'Backend rapido y ligero' },
    { emoji: '\u{1F916}', title: 'Groq API + Llama 3.3', desc: 'IA generativa gratis' },
    { emoji: '\u{1F4CA}', title: 'Chart.js', desc: 'Graficas interactivas' },
    { emoji: '\u2601\u{FE0F}', title: 'Render Free Tier', desc: 'Deploy automatico $0' },
  ];
  techs.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.1;
    const y = 3.8 + row * 1.3;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.7, h: 1.1, fill: { color: LIGHT_GRAY }, rectRadius: 0.1, line: { color: 'e2e8f0', width: 1 } });
    slide.addText(t.emoji, { x: x + 0.15, y: y + 0.1, w: 0.6, h: 0.9, fontSize: 22, valign: 'middle' });
    slide.addText(t.title, { x: x + 0.7, y: y + 0.1, w: 4.8, h: 0.45, fontSize: 14, fontFace: 'Arial', color: DARK, bold: true });
    slide.addText(t.desc, { x: x + 0.7, y: y + 0.55, w: 4.8, h: 0.4, fontSize: 11, fontFace: 'Arial', color: GRAY });
  });
}

// ===== SLIDE 6: Extraccion de datos =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('Extraccion de Datos', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, fontFace: 'Arial', color: BLUE, bold: true });

  // Sources table
  const rows1 = [
    [{ text: 'Fuente', options: { bold: true, color: WHITE, fill: { color: BLUE } } }, { text: 'Metodo', options: { bold: true, color: WHITE, fill: { color: BLUE } } }, { text: 'Datos Obtenidos', options: { bold: true, color: WHITE, fill: { color: BLUE } } }],
    ['MercadoLibre Mexico', 'Extraccion manual + API', 'Precios de 84 productos reales'],
    ['MercadoLibre', 'Clasificacion por categorias', '10 categorias de productos'],
    ['MercadoLibre', 'Analisis de depreciacion', 'Factores de estado fisico'],
  ];
  slide.addTable(rows1, { x: 0.5, y: 1.0, w: 12, fontSize: 11, fontFace: 'Arial', color: DARK, border: { pt: 0.5, color: 'e2e8f0' }, colW: [3, 4, 5], rowH: 0.4, autoPage: false });

  slide.addText('Dataset por Categoria', { x: 0.5, y: 2.9, w: 12, h: 0.5, fontSize: 16, fontFace: 'Arial', color: DARK, bold: true });

  const rows2 = [
    [{ text: 'Categoria', options: { bold: true, color: WHITE, fill: { color: BLUE } } }, { text: 'Productos', options: { bold: true, color: WHITE, fill: { color: BLUE } } }, { text: 'Rango de Precios', options: { bold: true, color: WHITE, fill: { color: BLUE } } }],
    ['Celular', '26', '$3,499 - $29,999'],
    ['Laptop', '12', '$7,499 - $24,999'],
    ['Audifonos', '10', '$1,999 - $12,999'],
    ['Consola', '9', '$4,499 - $12,499'],
    ['TV', '7', '$8,499 - $22,999'],
    ['Tablet', '6', '$4,499 - $13,999'],
    ['Electrodomesticos', '14', '$2,999 - $19,999'],
  ];
  slide.addTable(rows2, { x: 0.5, y: 3.4, w: 12, fontSize: 10, fontFace: 'Arial', color: DARK, border: { pt: 0.5, color: 'e2e8f0' }, colW: [4, 2.5, 5.5], rowH: 0.35, autoPage: false });
}

// ===== SLIDE 7: Algoritmo =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('Formula de Tasacion', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, fontFace: 'Arial', color: BLUE, bold: true });

  // Code box
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.0, w: 12, h: 2.0, fill: { color: DARK }, rectRadius: 0.1 });
  slide.addText([
    { text: 'precio_sugerido = precio_usado_base x multiplicador_estado\n\n', options: { fontSize: 12, fontFace: 'Courier New', color: 'e2e8f0' } },
    { text: 'variacion = max(500, precio_sugerido x factor_categoria)\n\n', options: { fontSize: 12, fontFace: 'Courier New', color: 'e2e8f0' } },
    { text: 'precio_minimo = precio_sugerido - variacion\n', options: { fontSize: 12, fontFace: 'Courier New', color: 'e2e8f0' } },
    { text: 'precio_maximo = precio_sugerido + variacion', options: { fontSize: 12, fontFace: 'Courier New', color: 'e2e8f0' } },
  ], { x: 0.8, y: 1.1, w: 11.4, h: 1.8 });

  slide.addText('Multiplicadores por Estado', { x: 0.5, y: 3.2, w: 12, h: 0.5, fontSize: 16, fontFace: 'Arial', color: DARK, bold: true });

  const rows = [
    [{ text: 'Estado', options: { bold: true, color: WHITE, fill: { color: BLUE } } }, { text: 'Factor', options: { bold: true, color: WHITE, fill: { color: BLUE } } }, { text: 'Justificacion', options: { bold: true, color: WHITE, fill: { color: BLUE } } }],
    ['Excelente', '+12%', 'Practicamente nuevo'],
    ['Bueno', '100%', 'Uso normal'],
    ['Regular', '-22%', 'Danos visibles'],
    ['Deficiente', '-45%', 'Danos funcionales'],
  ];
  slide.addTable(rows, { x: 0.5, y: 3.7, w: 12, fontSize: 12, fontFace: 'Arial', color: DARK, border: { pt: 0.5, color: 'e2e8f0' }, colW: [3, 3, 6], rowH: 0.45, autoPage: false });
}

// ===== SLIDE 8: Ejemplo Galaxy S23 =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('Ejemplo Real: Galaxy S23', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 30, fontFace: 'Arial', color: BLUE, bold: true });

  // 3 stat cards
  const cards = [
    { num: '$14,999', lbl: 'Precio Nuevo', color: DARK },
    { num: '$8,800', lbl: 'Sugerido (Bueno)', color: GREEN, border: GREEN },
    { num: '41%', lbl: 'Depreciacion', color: DARK },
  ];
  cards.forEach((c, i) => {
    const x = 0.5 + i * 4.1;
    const opts = { x, y: 1.3, w: 3.7, h: 2.0, fill: { color: LIGHT_GRAY }, rectRadius: 0.1, line: { color: c.border || 'e2e8f0', width: c.border ? 2 : 1 } };
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, opts);
    slide.addText(c.num, { x, y: 1.45, w: 3.7, h: 1.0, fontSize: 32, fontFace: 'Arial', color: c.color, bold: true, align: 'center' });
    slide.addText(c.lbl, { x, y: 2.4, w: 3.7, h: 0.6, fontSize: 12, fontFace: 'Arial', color: GRAY, align: 'center' });
  });

  // Price labels
  const prices = [
    { text: 'Min: $8,100', fill: RED_BG, color: '991b1b' },
    { text: 'Sugerido: $8,800', fill: LIGHT_GREEN, color: '166534', bold: true },
    { text: 'Max: $9,500', fill: BLUE_BG, color: '1e40af' },
  ];
  prices.forEach((p, i) => {
    const x = 1.5 + i * 3.6;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 3.8, w: 3.2, h: 0.7, fill: { color: p.fill }, rectRadius: 0.08 });
    slide.addText(p.text, { x, y: 3.8, w: 3.2, h: 0.7, fontSize: 14, fontFace: 'Arial', color: p.color, bold: !!p.bold, align: 'center', valign: 'middle' });
  });
}

// ===== SLIDE 9: Insights (section divider) =====
addSectionSlide('Insights de Mercado', 'Conocimiento extraido del mercado');

// ===== SLIDE 10: Depreciacion bars =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('Depreciacion por Categoria', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 28, fontFace: 'Arial', color: BLUE, bold: true });

  const bars = [
    { name: 'Consola', pct: 35, color: GREEN },
    { name: 'Audifonos', pct: 36, color: GREEN },
    { name: 'Bicicleta', pct: 38, color: '10b981' },
    { name: 'Tablet', pct: 39, color: '10b981' },
    { name: 'Celular', pct: 41, color: 'd97706' },
    { name: 'TV', pct: 43, color: 'd97706' },
    { name: 'Laptop', pct: 44, color: 'd97706' },
    { name: 'Lavadora', pct: 45, color: 'dc2626' },
  ];

  bars.forEach((b, i) => {
    const y = 1.3 + i * 0.65;
    // Label
    slide.addText(b.name, { x: 0.5, y, w: 2.0, h: 0.5, fontSize: 12, fontFace: 'Arial', color: DARK, bold: true, align: 'right', valign: 'middle' });
    // Background bar
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 2.7, y: y + 0.08, w: 8.0, h: 0.35, fill: { color: 'e2e8f0' }, rectRadius: 0.04 });
    // Fill bar
    const fillW = 8.0 * (b.pct / 50);
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 2.7, y: y + 0.08, w: fillW, h: 0.35, fill: { color: b.color }, rectRadius: 0.04 });
    slide.addText(b.pct + '%', { x: 2.7 + fillW - 0.8, y: y + 0.08, w: 0.75, h: 0.35, fontSize: 10, fontFace: 'Arial', color: WHITE, bold: true, align: 'center', valign: 'middle' });
  });

  slide.addText('Depreciacion promedio en estado Bueno vs precio nuevo', { x: 0.5, y: 6.7, w: 12, h: 0.4, fontSize: 10, fontFace: 'Arial', color: GRAY, align: 'center' });
}

// ===== SLIDE 11: Flujo datos (section divider) =====
addSectionSlide('Proceso de Extraccion', 'Flujo de datos completo');

// ===== SLIDE 12: Proceso =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('Flujo de Datos', { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, fontFace: 'Arial', color: BLUE, bold: true });

  // Flow diagram
  const steps = ['Usuario\ningresa datos', 'Busqueda\nen CSV', 'Calculo\nde precios', 'Generacion\ncon IA', 'Resultado\nal usuario'];
  steps.forEach((s, i) => {
    const x = 0.3 + i * 2.6;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.2, w: 2.0, h: 1.0, fill: { color: BLUE }, rectRadius: 0.08 });
    slide.addText(s, { x, y: 1.2, w: 2.0, h: 1.0, fontSize: 11, fontFace: 'Arial', color: WHITE, bold: true, align: 'center', valign: 'middle' });
    if (i < steps.length - 1) {
      slide.addText('\u2192', { x: x + 2.0, y: 1.2, w: 0.6, h: 1.0, fontSize: 22, fontFace: 'Arial', color: GRAY, align: 'center', valign: 'middle' });
    }
  });

  slide.addText('Endpoints API', { x: 0.5, y: 2.6, w: 12, h: 0.5, fontSize: 16, fontFace: 'Arial', color: DARK, bold: true });

  const rows = [
    [{ text: 'Metodo', options: { bold: true, color: WHITE, fill: { color: BLUE } } }, { text: 'Ruta', options: { bold: true, color: WHITE, fill: { color: BLUE } } }, { text: 'Funcion', options: { bold: true, color: WHITE, fill: { color: BLUE } } }],
    ['GET', '/api/categorias', 'Extrae categorias unicas del CSV'],
    ['GET', '/api/marcas', 'Filtra marcas por categoria'],
    ['GET', '/api/modelos', 'Filtra modelos por marca'],
    ['POST', '/api/tasar', 'Calcula precios + genera descripcion IA'],
    ['GET', '/api/insights', 'Estadisticas de depreciacion'],
  ];
  slide.addTable(rows, { x: 0.5, y: 3.1, w: 12, fontSize: 12, fontFace: 'Arial', color: DARK, border: { pt: 0.5, color: 'e2e8f0' }, colW: [2, 3.5, 6.5], rowH: 0.4, autoPage: false });
}

// ===== SLIDE 13: Funcionalidades =====
{
  const slide = pptx.addSlide();
  whiteBg(slide);
  slide.addText('Funcionalidades', { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 30, fontFace: 'Arial', color: BLUE, bold: true });

  const features = [
    { emoji: '\u{1F4CB}', title: 'Stepper Form', desc: '4 pasos: Categoria, Producto, Estado, Resultado' },
    { emoji: '\u{1F4B0}', title: 'Motor de Precios', desc: 'Rango min/sugerido/max con factores reales' },
    { emoji: '\u{1F916}', title: 'IA Generativa', desc: 'Descripciones con emojis y marketing' },
    { emoji: '\u{1F4CA}', title: 'Grafica de Precios', desc: 'Barras comparativas con Chart.js' },
    { emoji: '\u{1F4DC}', title: 'Historial', desc: 'Ultimas 10 tasaciones en localStorage' },
    { emoji: '\u{1F4C8}', title: 'Insights', desc: 'Depreciacion promedio por categoria' },
    { emoji: '\u{1F517}', title: 'Links Marketplaces', desc: 'Botones a ML, Facebook, Amazon' },
    { emoji: '\u2728', title: 'Typewriter Effect', desc: 'Descripcion palabra por palabra' },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.1;
    const y = 1.2 + row * 1.35;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.7, h: 1.15, fill: { color: WHITE }, rectRadius: 0.1, line: { color: 'e2e8f0', width: 2 } });
    slide.addText(f.emoji, { x: x + 0.15, y: y + 0.05, w: 0.6, h: 1.05, fontSize: 22, valign: 'middle' });
    slide.addText(f.title, { x: x + 0.7, y: y + 0.1, w: 4.8, h: 0.4, fontSize: 14, fontFace: 'Arial', color: DARK, bold: true });
    slide.addText(f.desc, { x: x + 0.7, y: y + 0.5, w: 4.8, h: 0.5, fontSize: 11, fontFace: 'Arial', color: GRAY });
  });
}

// ===== SLIDE 14: Gracias =====
{
  const slide = pptx.addSlide();
  blueGradientBg(slide);
  slide.addText('Gracias', { x: 0.5, y: 1.5, w: 12, h: 1.5, fontSize: 48, fontFace: 'Arial', color: WHITE, bold: true, align: 'center' });
  slide.addText('SmartValuation', { x: 0.5, y: 2.8, w: 12, h: 0.6, fontSize: 20, fontFace: 'Arial', color: 'b0c4ff', align: 'center' });
  slide.addText([
    { text: 'Preguntas?\n\n', options: { fontSize: 18, fontFace: 'Arial', color: WHITE, bold: true, align: 'center' } },
    { text: 'Demo: smartvaluation.onrender.com\n\n', options: { fontSize: 14, fontFace: 'Arial', color: 'dcfce7', bold: true, align: 'center' } },
    { text: 'Oscar Espinoza Landeta\nEmmanuel Castro Salvador\nFernando Vasquez Valeriano\nFatima Avelino Celis\n\n', options: { fontSize: 14, fontFace: 'Arial', color: 'c8d6f0', align: 'center' } },
    { text: 'Universidad Tecnologica de Tehuacan — 2026', options: { fontSize: 12, fontFace: 'Arial', color: '94a3b8', align: 'center' } },
  ], { x: 0.5, y: 3.5, w: 12, h: 3.5, valign: 'middle' });
}

const outputPath = __dirname + '/SmartValuation_Presentacion.pptx';
pptx.writeFile({ fileName: outputPath })
  .then(() => console.log('PPTX generado: SmartValuation_Presentacion.pptx'))
  .catch(err => console.error('Error:', err));
