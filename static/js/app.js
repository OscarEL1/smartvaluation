let currentStep = 1;
let formData = {
    categoria: '',
    marca: '',
    modelo: '',
    estado: 'Bueno',
    accesorios: '',
};
let priceChart = null;
const HISTORY_KEY = 'smartvaluation_history';

const steps = {
    1: loadCategorias,
    2: loadMarcas,
    4: loadResultado,
};

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
        'Celular': '📱',
        'Laptop': '💻',
        'Tablet': '📟',
        'Consola': '🎮',
        'TV': '📺',
        'Audifonos': '🎧',
        'Lavadora': '🫧',
        'Refrigerador': '❄️',
        'Microondas': '📻',
        'Bicicleta': '🚲',
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

document.addEventListener('DOMContentLoaded', () => {
    const estadoRadios = document.querySelectorAll('input[name="estado"]');
    estadoRadios.forEach(r => {
        r.addEventListener('change', () => { formData.estado = r.value; });
    });
});

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

async function loadResultado() {
    const container = document.getElementById('resultado-container');
    container.innerHTML = '<div class="spinner-container"><div class="spinner"></div><p class="spinner-text">Calculando precio con IA...</p></div>';

    formData.accesorios = document.getElementById('accesorios-input')?.value || '';

    try {
        const res = await fetch('/api/tasar-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let precios = null;
        let descripcion = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.precios) {
                        precios = parsed.precios;
                    }
                    if (parsed.chunk) {
                        descripcion += parsed.chunk;
                    }
                } catch {}
            }

            if (precios && descripcion) {
                container.innerHTML = `
                    <div class="resultado-card">
                        <h3>Rango de precio sugerido</h3>
                        <div class="precio-grid">
                            <div class="precio-item minimo">
                                <div class="precio-label">Minimo</div>
                                <div class="precio-valor">$${precios.minimo.toLocaleString()}</div>
                            </div>
                            <div class="precio-item sugerido">
                                <div class="precio-label">Sugerido</div>
                                <div class="precio-valor">$${precios.sugerido.toLocaleString()}</div>
                            </div>
                            <div class="precio-item maximo">
                                <div class="precio-label">Maximo</div>
                                <div class="precio-valor">$${precios.maximo.toLocaleString()}</div>
                            </div>
                        </div>
                        <div style="text-align:center; font-size:0.8rem; color:#6b7280;">
                            Precio nuevo: $${precios.precio_nuevo.toLocaleString()} &nbsp;|&nbsp;
                            Depreciacion: ${Math.round((1 - precios.sugerido/precios.precio_nuevo) * 100)}%
                        </div>
                    </div>

                    <div class="resultado-card">
                        <div class="descripcion-box">
                            <h4>Descripcion para publicar</h4>
                            <p class="descripcion-text">${descripcion}<span class="cursor">|</span></p>
                            <button class="copy-btn" onclick="copiarDescripcion()" style="display:none" id="copy-btn-final">
                                Copiar descripcion
                            </button>
                        </div>
                    </div>
                `;
                renderChart(precios);
            }
        }

        const cursor = document.querySelector('.cursor');
        if (cursor) cursor.remove();
        const copyBtn = document.getElementById('copy-btn-final');
        if (copyBtn) copyBtn.style.display = 'block';

        if (precios) saveHistory(formData, precios);
    } catch {
        container.innerHTML = '<div class="error-msg">Error al conectar con el servidor</div>';
    }
}

function copiarDescripcion() {
    const text = document.querySelector('.descripcion-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copiado!';
        setTimeout(() => { btn.textContent = 'Copiar descripcion'; }, 2000);
    });
}

function reiniciar() {
    currentStep = 1;
    formData = { categoria: '', marca: '', modelo: '', estado: 'Bueno', accesorios: '' };
    showStep(1);
    updateStepper();
    loadCategorias();
    document.getElementById('accesorios-input').value = '';
    document.querySelector('input[name="estado"][value="Bueno"]').checked = true;
    document.getElementById('chart-container').style.display = 'none';
    if (priceChart) { priceChart.destroy(); priceChart = null; }
}

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
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `$${ctx.raw.toLocaleString()}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: v => '$' + v.toLocaleString()
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

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

async function loadInsights() {
    const grid = document.getElementById('insights-grid');
    try {
        const res = await fetch('/api/insights');
        const data = await res.json();
        grid.innerHTML = data.map(d => {
            const color = d.depBueno < 40 ? '#059669' : d.depBueno < 55 ? '#d97706' : '#dc2626';
            return `
                <div class="insight-card">
                    <div class="cat-name">${d.categoria}</div>
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

loadCategorias();
renderHistory();
loadInsights();
