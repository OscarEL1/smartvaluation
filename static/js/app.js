let currentStep = 1;
let formData = {
    categoria: '',
    marca: '',
    modelo: '',
    estado: 'Bueno',
    accesorios: '',
    idioma: 'both',
};
let priceChart = null;
let prediccionChart = null;
const HISTORY_KEY = 'smartvaluation_history';

const steps = {
    1: loadCategorias,
    2: loadMarcas,
    4: loadResultado,
};

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------
async function loadCategorias() {
    const grid = document.getElementById('categoria-options');
    grid.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    try {
        const res = await fetch('/api/categorias');
        const cats = await res.json();
        grid.innerHTML = cats.map(c => `
            <div class="option-card ${formData.categoria === c ? 'selected' : ''}"
                 onclick="selectCategoria('${c}')">
                ${getCatIcon(c)} ${c}
            </div>
        `).join('');
    } catch {
        grid.innerHTML = '<div class="error-msg">Error al cargar categorias</div>';
    }
}

function getCatIcon(cat) {
    const icons = {
        'Celular': '📱', 'Laptop': '💻', 'Tablet': '📟', 'Consola': '🎮',
        'TV': '📺', 'Audifonos': '🎧', 'Lavadora': '🫧', 'Refrigerador': '❄️',
        'Microondas': '📻', 'Bicicleta': '🚲',
    };
    return icons[cat] || '📦';
}

function selectCategoria(cat) {
    formData.categoria = cat;
    formData.marca = '';
    formData.modelo = '';
    document.querySelectorAll('#categoria-options .option-card').forEach(el => {
        el.classList.toggle('selected', el.textContent.trim().includes(cat));
    });
}

// ---------------------------------------------------------------------------
// Marcas y Modelos
// ---------------------------------------------------------------------------
async function loadMarcas() {
    if (!formData.categoria) return;
    const select = document.getElementById('marca-select');
    select.innerHTML = '<option value="">Cargando marcas...</option>';
    try {
        const res = await fetch(`/api/marcas?categoria=${encodeURIComponent(formData.categoria)}`);
        const marcas = await res.json();
        select.innerHTML = '<option value="">Selecciona una marca</option>' +
            marcas.map(m => `<option value="${m}" ${formData.marca === m ? 'selected' : ''}>${m}</option>`).join('');
        document.getElementById('modelo-group').style.display = formData.marca ? 'block' : 'none';
    } catch {
        select.innerHTML = '<option value="">Error al cargar</option>';
    }

    select.onchange = async () => {
        formData.marca = select.value;
        formData.modelo = '';
        document.getElementById('modelo-group').style.display = 'none';
        if (formData.marca) {
            const modeloGroup = document.getElementById('modelo-group');
            modeloGroup.style.display = 'block';
            const modeloSelect = document.getElementById('modelo-select');
            modeloSelect.innerHTML = '<option value="">Cargando modelos...</option>';
            const res = await fetch(`/api/modelos?categoria=${encodeURIComponent(formData.categoria)}&marca=${encodeURIComponent(formData.marca)}`);
            const modelos = await res.json();
            modeloSelect.innerHTML = '<option value="">Selecciona un modelo</option>' +
                modelos.map(m => `<option value="${m}">${m}</option>`).join('');
            modeloSelect.onchange = () => { formData.modelo = modeloSelect.value; };
        }
    };
}

// ---------------------------------------------------------------------------
// Estado radios
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[name="estado"]').forEach(r => {
        r.addEventListener('change', () => { formData.estado = r.value; });
    });
});

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------
function updateStepper() {
    document.querySelectorAll('.step').forEach(el => {
        const step = parseInt(el.dataset.step);
        el.classList.remove('active', 'completed');
        if (step === currentStep) el.classList.add('active');
        else if (step < currentStep) el.classList.add('completed');
    });

    document.getElementById('btn-prev').style.display = currentStep > 1 ? 'block' : 'none';
    document.getElementById('btn-next').textContent = currentStep === 3 ? 'Tasar ahora' : 'Siguiente';
    document.getElementById('btn-next').disabled = false;

    if (currentStep === 4) {
        document.querySelector('.nav-buttons').style.display = 'none';
        document.getElementById('actions').style.display = 'block';
    } else {
        document.querySelector('.nav-buttons').style.display = 'flex';
        document.getElementById('actions').style.display = 'none';
    }
}

function showStep(n) {
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${n}`).classList.add('active');
}

function showFieldError(step, msg) {
    const el = document.getElementById(`error-step${step}`);
    if (el) el.textContent = msg;
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
document.getElementById('btn-next').addEventListener('click', async () => {
    clearFieldErrors();
    if (currentStep === 1 && !formData.categoria) {
        showFieldError(1, 'Selecciona una categoria');
        return;
    }
    if (currentStep === 2 && !formData.marca) {
        showFieldError(2, 'Selecciona una marca');
        return;
    }
    if (currentStep === 2 && !formData.modelo) {
        showFieldError(2, 'Selecciona un modelo');
        return;
    }

    currentStep++;
    if (currentStep <= 4) {
        showStep(currentStep);
        updateStepper();
        if (steps[currentStep]) await steps[currentStep]();
    }
});

document.getElementById('btn-prev').addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateStepper();
    }
});

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------
async function loadResultado() {
    const container = document.getElementById('resultado-container');
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div><p class="spinner-text">Calculando precio con IA...</p></div>';

    formData.accesorios = document.getElementById('accesorios-input')?.value || '';
    formData.idioma = document.getElementById('idioma-select')?.value || 'both';

    try {
        const res = await fetch('/api/tasar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const data = await res.json();

        if (data.error) {
            container.innerHTML = `<div class="error-msg">${data.error}</div>`;
            return;
        }

        const p = data.precios;
        const c = data.comparacion;
        const query = encodeURIComponent(`${formData.marca} ${formData.modelo}`);

        container.innerHTML = `
            <div class="resultado-card">
                <h3>Rango de precio sugerido</h3>
                <div class="precio-grid">
                    <div class="precio-item minimo">
                        <div class="precio-label">Minimo</div>
                        <div class="precio-valor">$${p.minimo.toLocaleString()}</div>
                    </div>
                    <div class precio-item sugerido">
                        <div class="precio-label">Sugerido</div>
                        <div class="precio-valor">$${p.sugerido.toLocaleString()}</div>
                    </div>
                    <div class="precio-item maximo">
                        <div class="precio-label">Maximo</div>
                        <div class="precio-valor">$${p.maximo.toLocaleString()}</div>
                    </div>
                </div>
                <div style="text-align:center; font-size:0.8rem; color:#6b7280;">
                    Precio nuevo: $${p.precio_nuevo.toLocaleString()} &nbsp;|&nbsp;
                    Depreciacion: ${Math.round((1 - p.sugerido/p.precio_nuevo) * 100)}%
                </div>
            </div>

            <div class="comparacion-card">
                <h4>Comparacion de mercado</h4>
                <p>Tu precio esta <strong>${c.posicion}</strong></p>
                <p>Promedio de la categoria: <strong>$${c.precio_promedio_mercado.toLocaleString()}</strong> (${c.total_productos_categoria} productos)</p>
                <p class="recomendacion-text">${c.recomendacion}</p>
            </div>

            <div class="marketplace-links">
                <h4>Buscar en marketplaces</h4>
                <div class="marketplace-btns">
                    <a href="https://listado.mercadolibre.com.mx/${query}" target="_blank" class="mp-link ml">
                        Mercado Libre
                    </a>
                    <a href="https://www.facebook.com/marketplace/search?q=${query}" target="_blank" class="mp-link fb">
                        Facebook
                    </a>
                    <a href="https://www.amazon.com.mx/s?k=${query}" target="_blank" class="mp-link amz">
                        Amazon
                    </a>
                </div>
            </div>

            <div class="resultado-card">
                <div class="descripcion-box">
                    <h4>Descripcion para publicar</h4>
                    <p class="descripcion-text" id="desc-text"></p>
                    <button class="copy-btn" onclick="copiarDescripcion()" style="display:none" id="copy-btn-final">
                        Copiar descripcion
                    </button>
                </div>
            </div>
        `;

        renderChart(p);
        saveHistory(formData, p);
        typewriterEffect(document.getElementById('desc-text'), data.descripcion);

        // Cargar features de IA en paralelo
        loadPrediccion(p.sugerido, formData.categoria);
        loadAnalisisMercado(formData.marca, formData.modelo);
        document.getElementById('chat-container').classList.remove('hidden');

    } catch {
        container.innerHTML = '<div class="error-msg">Error al conectar con el servidor</div>';
    }
}

// ---------------------------------------------------------------------------
// Typewriter
// ---------------------------------------------------------------------------
function typewriterEffect(el, text) {
    let i = 0;
    el.innerHTML = '<span class="cursor">|</span>';
    const interval = setInterval(() => {
        if (i < text.length) {
            el.innerHTML = text.substring(0, i + 1) + '<span class="cursor">|</span>';
            i++;
        } else {
            clearInterval(interval);
            const cursor = el.querySelector('.cursor');
            if (cursor) cursor.remove();
            const copyBtn = document.getElementById('copy-btn-final');
            if (copyBtn) copyBtn.style.display = 'block';
        }
    }, 20);
}

function copiarDescripcion() {
    const text = document.querySelector('.descripcion-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copiado!';
        setTimeout(() => { btn.textContent = 'Copiar descripcion'; }, 2000);
    });
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------
function renderChart(precios) {
    const container = document.getElementById('chart-container');
    container.style.display = 'block';
    if (priceChart) priceChart.destroy();

    const ctx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Minimo', 'Sugerido', 'Maximo', 'Precio Nuevo'],
            datasets: [{
                label: 'Precio ($)',
                data: [precios.minimo, precios.sugerido, precios.maximo, precios.precio_nuevo],
                backgroundColor: [
                    'rgba(220, 38, 38, 0.8)',
                    'rgba(5, 150, 105, 0.8)',
                    'rgba(37, 99, 235, 0.8)',
                    'rgba(156, 163, 175, 0.5)',
                ],
                borderColor: [
                    'rgba(220, 38, 38, 1)',
                    'rgba(5, 150, 105, 1)',
                    'rgba(37, 99, 235, 1)',
                    'rgba(156, 163, 175, 0.8)',
                ],
                borderWidth: 2,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => '$' + v.toLocaleString() },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// ---------------------------------------------------------------------------
// Prediccion de depreciacion
// ---------------------------------------------------------------------------
async function loadPrediccion(precio, categoria) {
    const container = document.getElementById('prediccion-container');
    try {
        const res = await fetch(`/api/prediccion?precio=${precio}&categoria=${encodeURIComponent(categoria)}&meses=12`);
        const data = await res.json();
        container.classList.remove('hidden');

        const info = document.getElementById('prediccion-info');
        info.innerHTML = `
            <div class="prediccion-info-cards">
                <div class="pred-card">
                    <span class="pred-label">Depreciacion mensual</span>
                    <span class="pred-value">${data.depreciacion_mensual}%</span>
                </div>
                <div class="pred-card">
                    <span class="pred-label">Mejor momento</span>
                    <span class="pred-value">${data.mejor_momento}</span>
                </div>
                <div class="pred-card">
                    <span class="pred-label">Recomendacion</span>
                    <span class="pred-value-sm">${data.venta_recomendada}</span>
                </div>
            </div>
        `;

        if (prediccionChart) prediccionChart.destroy();
        const ctx = document.getElementById('prediccionChart').getContext('2d');
        prediccionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.predicciones.map(p => `Mes ${p.mes}`),
                datasets: [{
                    label: 'Precio estimado',
                    data: data.predicciones.map(p => p.precio),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        ticks: { callback: v => '$' + v.toLocaleString() },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch {
        container.classList.add('hidden');
    }
}

// ---------------------------------------------------------------------------
// Analisis de mercado
// ---------------------------------------------------------------------------
async function loadAnalisisMercado(marca, modelo) {
    const container = document.getElementById('analisis-container');
    const content = document.getElementById('analisis-content');
    try {
        const res = await fetch('/api/analisis-mercado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ marca, modelo }),
        });
        const data = await res.json();
        container.classList.remove('hidden');

        const demandaColor = data.demanda === 'Alta' ? '#059669' : data.demanda === 'Media' ? '#d97706' : '#dc2626';
        const tendenciaIcon = data.tendencia === 'Subiendo' ? '📈' : data.tendencia === 'Bajando' ? '📉' : '➡️';

        content.innerHTML = `
            <div class="analisis-grid">
                <div class="analisis-item">
                    <span class="analisis-label">Demanda</span>
                    <span class="analisis-value" style="color:${demandaColor}">${data.demanda}</span>
                </div>
                <div class="analisis-item">
                    <span class="analisis-label">Tendencia</span>
                    <span class="analisis-value">${tendenciaIcon} ${data.tendencia}</span>
                </div>
                <div class="analisis-item">
                    <span class="analisis-label">Momento para vender</span>
                    <span class="analisis-value">${data.momento}</span>
                </div>
            </div>
            <div class="consejos-list">
                <strong>Consejos para vender:</strong>
                <ul>
                    ${data.consejos.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        `;
    } catch {
        container.classList.add('hidden');
    }
}

// ---------------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------------
async function enviarChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const messages = document.getElementById('chat-messages');
    messages.innerHTML += `<div class="chat-msg user-msg">${msg}</div>`;
    input.value = '';
    messages.innerHTML += `<div class="chat-msg bot-msg loading-msg"><div class="spinner-small"></div></div>`;
    messages.scrollTop = messages.scrollHeight;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pregunta: msg,
                producto: {
                    marca: formData.marca,
                    modelo: formData.modelo,
                    estado: formData.estado,
                    precio: document.querySelector('.precio-item.sugerido .precio-valor')?.textContent || 0,
                },
            }),
        });
        const data = await res.json();
        const loadingMsg = messages.querySelector('.loading-msg');
        if (loadingMsg) loadingMsg.remove();
        messages.innerHTML += `<div class="chat-msg bot-msg">${data.respuesta}</div>`;
        messages.scrollTop = messages.scrollHeight;
    } catch {
        const loadingMsg = messages.querySelector('.loading-msg');
        if (loadingMsg) loadingMsg.remove();
        messages.innerHTML += `<div class="chat-msg bot-msg">Error al conectar con la IA</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarChat();
    });
});

// ---------------------------------------------------------------------------
// Vision AI - Upload foto
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fotoInput')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            const resultado = document.getElementById('deteccion-resultado');
            resultado.classList.remove('hidden');
            resultado.innerHTML = '<div class="spinner-container"><div class="spinner-small"></div> Detectando producto...</div>';

            try {
                const res = await fetch('/api/detectar-foto', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imagen: base64 }),
                });
                const data = await res.json();

                if (data.detectado) {
                    let html = '<div class="deteccion-exito">';
                    if (data.marca) html += `<p>Marca detectada: <strong>${data.marca}</strong></p>`;
                    if (data.tipo) html += `<p>Tipo: <strong>${data.tipo}</strong></p>`;
                    if (data.etiquetas.length) {
                        html += `<p>Elementos: ${data.etiquetas.slice(0, 5).join(', ')}</p>`;
                    }
                    if (data.productos_sugeridos.length) {
                        html += '<p>Productos sugeridos:</p><ul>';
                        data.productos_sugeridos.forEach(p => {
                            html += `<li onclick="seleccionarProducto('${p.categoria}', '${p.marca}', '${p.modelo}')" class="producto-sugerido">${p.marca} ${p.modelo}</li>`;
                        });
                        html += '</ul>';
                    }
                    html += '</div>';
                    resultado.innerHTML = html;
                } else {
                    resultado.innerHTML = `<p class="deteccion-info">${data.mensaje || 'No se pudo detectar el producto. Selecciona manualmente.'}</p>`;
                }
            } catch {
                resultado.innerHTML = '<p class="deteccion-info">Error al analizar la foto</p>';
            }
        };
        reader.readAsDataURL(file);
    });
});

function seleccionarProducto(categoria, marca, modelo) {
    formData.categoria = categoria;
    formData.marca = marca;
    formData.modelo = modelo;
    loadCategorias();
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
function saveHistory(form, precios) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.unshift({
        fecha: new Date().toLocaleDateString('es-MX'),
        articulo: `${form.marca} ${form.modelo}`,
        estado: form.estado,
        sugerido: precios.sugerido,
    });
    if (history.length > 10) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const section = document.getElementById('history-section');
    const tbody = document.getElementById('history-body');

    if (history.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    tbody.innerHTML = history.map(h => `
        <tr>
            <td>${h.fecha}</td>
            <td>${h.articulo}</td>
            <td>${h.estado}</td>
            <td><strong>$${h.sugerido.toLocaleString()}</strong></td>
        </tr>
    `).join('');
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------
async function loadInsights() {
    const grid = document.getElementById('insights-grid');
    try {
        const res = await fetch('/api/insights');
        const data = await res.json();
        grid.innerHTML = data.map(d => {
            const color = d.depBueno < 40 ? '#059669' : d.depBueno < 55 ? '#d97706' : '#dc2626';
            return `
                <div class="insight-card">
                    <div class="cat-name">${d.icon || ''} ${d.categoria}</div>
                    <div class="insight-bar-wrap">
                        <div class="insight-bar" style="width:${d.depBueno}%;background:${color}"></div>
                    </div>
                    <div class="dep-value"><strong>${d.depBueno}%</strong> dep. buen estado</div>
                </div>
            `;
        }).join('');
    } catch {
        grid.innerHTML = '<div class="error-msg">Error al cargar insights</div>';
    }
}

// ---------------------------------------------------------------------------
// Reiniciar
// ---------------------------------------------------------------------------
function reiniciar() {
    currentStep = 1;
    formData = { categoria: '', marca: '', modelo: '', estado: 'Bueno', accesorios: '', idioma: 'both' };
    showStep(1);
    updateStepper();
    loadCategorias();
    document.getElementById('accesorios-input').value = '';
    document.querySelector('input[name="estado"][value="Bueno"]').checked = true;
    document.getElementById('chart-container').style.display = 'none';
    document.getElementById('prediccion-container').classList.add('hidden');
    document.getElementById('analisis-container').classList.add('hidden');
    document.getElementById('chat-container').classList.add('hidden');
    document.getElementById('deteccion-resultado').classList.add('hidden');
    document.getElementById('chat-messages').innerHTML = '';
    if (priceChart) { priceChart.destroy(); priceChart = null; }
    if (prediccionChart) { prediccionChart.destroy(); prediccionChart = null; }
}

// Init
loadCategorias();
renderHistory();
loadInsights();
