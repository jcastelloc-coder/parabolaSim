// CONTROLADORES PRINCIPALES DEL CANVAS
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

let nivelActual = 'primaria';
let animacionID = null;
let contadorTiros = 0;

// Variables de Posición Física
let x_inicial = 40;
let y_inicial = 440;
let x = x_inicial, y = y_inicial;
let t = 0;

let trayectoriasPasadas = [];
let simulando = false;

// ENLAZAR ACTUALIZACIÓN DE CONTROLES SLIDERS
const configuracionSliders = [
    { id: 'txt-angulo', display: 'val-angulo', sufijo: '°' },
    { id: 'txt-velocidad', display: 'val-velocidad', sufijo: ' m/s' },
    { id: 'txt-masa', display: 'val-masa', sufijo: ' kg' },
    { id: 'txt-gravedad', display: 'val-gravedad', sufijo: ' m/s²' },
    { id: 'txt-altura', display: 'val-altura', sufijo: ' m' },
    { id: 'txt-resistencia', display: 'val-resistencia', sufijo: '' }
];

configuracionSliders.forEach(item => {
    const selector = document.getElementById(item.id);
    if(selector) {
        selector.addEventListener('input', (e) => {
            document.getElementById(item.display).textContent = e.target.value + item.sufijo;
            if (item.id === 'txt-altura') {
                y_inicial = 440 - (parseFloat(e.target.value) * 8);
                dibujarFondoLaboratorio();
            }
        });
    }
});

// GESTIÓN DEL NIVEL SELECCIONADO
function configurarNivel(nivel) {
    nivelActual = nivel;
    document.getElementById('modal-niveles').style.display = 'none';
    document.getElementById('nombre-nivel').textContent = nivel.charAt(0).toUpperCase() + nivel.slice(1);

    // Ocultar o mostrar según la complejidad académica solicitada
    document.getElementById('grupo-masa').style.display = (nivel === 'secundaria' || nivel === 'universidad') ? 'flex' : 'none';
    document.getElementById('grupo-gravedad').style.display = (nivel === 'secundaria' || nivel === 'universidad') ? 'flex' : 'none';
    document.getElementById('grupo-altura').style.display = (nivel === 'universidad') ? 'flex' : 'none';
    document.getElementById('grupo-resistencia').style.display = (nivel === 'universidad') ? 'flex' : 'none';

    // Personalizar el título y saludo de la pizarra inferior según el nivel escogido
    const tituloExplicacion = document.getElementById('titulo-explicacion');
    const textoExplicacion = document.getElementById('texto-explicacion');
    
    if (nivel === 'primaria') {
        tituloExplicacion.innerHTML = "🧠 ¡Pizarra Mágica de Primaria!";
        textoExplicacion.innerHTML = "¡Hola! Elige la dirección (ángulo) y la fuerza (velocidad) de tu cañón. ¡Dale al botón rojo para ver tu súper lanzamiento! 🚀";
    } else {
        tituloExplicacion.innerHTML = "Pizarra del Estudiante";
        textoExplicacion.innerHTML = "Configura las propiedades del tiro y presiona el disparador para analizar los vectores físicos.";
    }

    reiniciarParametrosFisicos();
}

// REDIBUJAR ENTORNO GRÁFICO (CIELO, SUELO Y OBJETOS)
function dibujarFondoLaboratorio() {
    // Fondo Degradado Celeste Claro
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e0f2fe');
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Suelo Césped de Medición
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 440, canvas.width, 40);

    // Cuadrícula Métrica Sutil
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 50; i < canvas.width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 440); ctx.stroke();
    }

    // Soporte del Cañón Dinámico
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x_inicial - 12, y_inicial, 24, 440 - y_inicial + 5);

    // Tubo de Disparo Orientable
    const anguloRad = parseFloat(document.getElementById('txt-angulo').value) * Math.PI / 180;
    ctx.save();
    ctx.translate(x_inicial, y_inicial);
    ctx.rotate(-anguloRad);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, -9, 38, 18);
    ctx.restore();

    // Eje Central Rotatorio
    ctx.beginPath();
    ctx.arc(x_inicial, y_inicial, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Re-dibujar líneas de rastro acumuladas
    trayectoriasPasadas.forEach(punto => {
        ctx.beginPath();
        ctx.arc(punto.px, punto.py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 114, 0, 0.4)';
        ctx.fill();
    });
}

// EJECUCIÓN DEL CÁLCULO FÍSICO ANIMADO
function iniciarLanzamiento() {
    if (simulando) return;
    simulando = true;
    t = 0;

    const v0 = parseFloat(document.getElementById('txt-velocidad').value);
    const anguloDeg = parseFloat(document.getElementById('txt-angulo').value);
    const anguloRad = anguloDeg * Math.PI / 180;
    
    const g = (nivelActual === 'primaria') ? 9.8 : parseFloat(document.getElementById('txt-gravedad').value);
    const resistencia = (nivelActual === 'universidad') ? parseFloat(document.getElementById('txt-resistencia').value) : 0;

    let vx = v0 * Math.cos(anguloRad);
    let vy = v0 * Math.sin(anguloRad);

    x = x_inicial;
    y = y_inicial;

    function frame() {
        t += 0.07;

        if (resistencia > 0) {
            // Modelo Balístico Universitario (Con resistencia del aire)
            const v = Math.sqrt(vx*vx + vy*vy);
            vx -= resistencia * v * vx * 0.01;
            vy -= (g + resistencia * v * vy * 0.01) * 0.07;
            x += vx * 0.07 * 8;
            y -= vy * 0.07 * 8;
        } else {
            // Modelo Parabólico Ideal (Galileano)
            x = x_inicial + (v0 * Math.cos(anguloRad) * t) * 8;
            y = y_inicial - ((v0 * Math.sin(anguloRad) * t) - (0.5 * g * t * t)) * 8;
        }

        dibujarFondoLaboratorio();

        // Dibujar Cuerpo Proyectil Móvil
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();

        if (y <= 440) {
            trayectoriasPasadas.push({ px: x, py: y });
        }

        // Detección de Impacto contra el Piso o límites
        if (y >= 440 || x >= canvas.width) {
            simulando = false;
            cancelAnimationFrame(animacionID);
            registrarResultadoEnTabla(v0, anguloDeg, g);
        } else {
            animacionID = requestAnimationFrame(frame);
        }
    }
    frame();
}

// LÓGICA E INSERCIÓN DENTRO DE LA TABLA LATERAL Y PIZARRA INFERIOR
function registrarResultadoEnTabla(v0, angulo, g) {
    contadorTiros++;
    const rad = angulo * Math.PI / 180;
    
    // Fórmulas Teóricas de Referencia para Muestra
    const hMax = (Math.pow(v0 * Math.sin(rad), 2) / (2 * g)).toFixed(1);
    const alcMax = (Math.pow(v0, 2) * Math.sin(2 * rad) / g).toFixed(1);

    const tbody = document.getElementById('cuerpo-historial');
    const nuevaFila = document.createElement('tr');

    nuevaFila.innerHTML = `
        <td><strong>#${contadorTiros}</strong></td>
        <td>${angulo}°</td>
        <td>${v0}m/s</td>
        <td style="color:#ff7200;">${hMax}m</td>
        <td style="color:#4dfd4d;">${alcMax}m</td>
    `;
    tbody.appendChild(nuevaFila);

    // EVALUACIÓN DE RESPUESTA EXCLUSIVA PARA EL NIVEL DE PRIMARIA
    if (nivelActual === 'primaria') {
        let explicacionAngulo = "";
        let explicacionVelocidad = "";

        // Analizar el ángulo de forma sencilla
        if (angulo > 65) {
            explicacionAngulo = "Apuntaste <strong>muy hacia arriba</strong>, por lo que el objeto subió altísimo como un cohete, pero cayó bastante cerca. 🚀";
        } else if (angulo < 25) {
            explicacionAngulo = "Apuntaste <strong>muy bajito</strong>, rozando el césped. Salió rápido pero tocó el suelo enseguida sin poder volar mucho. ✈️";
        } else {
            explicacionAngulo = "¡Usaste un ángulo <strong>excelente</strong>! Los ángulos intermedios (cerca de los 45°) combinan altura y alcance para llegar lo más lejos posible. 🎯";
        }

        // Analizar la velocidad de forma sencilla
        if (v0 > 35) {
            explicacionVelocidad = "¡Le diste con <strong>mucha fuerza</strong>! Al salir con tanta velocidad, recorrió una gran distancia antes de que la gravedad lograra jalarlo al piso.";
        } else if (v0 < 15) {
            explicacionVelocidad = "Fue un disparo <strong>muy suave y despacio</strong>. Al no llevar tanta fuerza, la gravedad lo atrapó rápidamente.";
        } else {
            explicacionVelocidad = "Llevaba una fuerza <strong>moderada y equilibrada</strong>, ideal para calcular trayectorias estables.";
        }

        // Mostrar texto adaptado e infantilizado en la Pizarra de Primaria
        document.getElementById('texto-explicacion').innerHTML = `
            🎉 <strong>¡Lanzamiento #${contadorTiros} completado!</strong><br>
            📏 Tu objeto subió <strong>${hMax} metros</strong> de alto y avanzó un total de <strong>${alcMax} metros</strong> de largo.<br><br>
            🤔 <strong>¿Por qué pasó esto?:</strong><br>
            • ${explicacionAngulo}<br>
            • ${explicacionVelocidad}
        `;
    } else {
        // Formato técnico y formal original para Secundaria y Universidad
        document.getElementById('texto-explicacion').innerHTML = `Lanzamiento <strong>#${contadorTiros}</strong> completado con éxito. Datos almacenados correctamente en la tabla comparativa lateral derecha para su análisis de laboratorio.`;
    }
}

// CONTROL DE BOTONES Y MENÚS DE FLUJO
function limpiarHistorialTablas() {
    document.getElementById('cuerpo-historial').innerHTML = '';
    contadorTiros = 0;
    reiniciarParametrosFisicos();
}

// Restablece valores de simulación física actuales sin purgar la tabla de comparativas
function reiniciarParametrosFisicos() {
    if (animacionID) cancelAnimationFrame(animacionID);
    simulando = false;
    trayectoriasPasadas = [];
    x = x_inicial;
    y = y_inicial;
    t = 0;
    dibujarFondoLaboratorio();
}

function volverANiveles() {
    reiniciarParametrosFisicos();
    document.getElementById('modal-niveles').style.display = 'flex';
}

function abrirManual() { document.getElementById('modal-manual').style.display = 'flex'; }
function cerrarManual() { document.getElementById('modal-manual').style.display = 'none'; }

// Inicialización Automática
window.onload = () => { 
    // Asegurar que el modal de bienvenida aparezca al cargar la página
    document.getElementById('modal-niveles').style.display = 'flex';
    dibujarFondoLaboratorio(); 
};


