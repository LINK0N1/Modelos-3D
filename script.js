// ==============================================================================
// 1. CONFIGURACIÓN DEL CANVAS Y CENTRO DE PANTALLA
// ==============================================================================
const canvas = document.getElementById('lienzo3D');
const ctx = canvas.getContext('2d');
const CENTRO_X = canvas.width / 2;
const CENTRO_Y = canvas.height / 2;

// ==============================================================================
// 2. GEOMETRÍAS TRIDIMENSIONALES (MODELOS LOCALES 3D CENTRADOS EN EL ORIGEN)
// ==============================================================================

// Cubo Base (8 vértices, 12 aristas)
const cubo = {
    vertices: [
        {x: -80, y: -80, z: -80}, {x:  80, y: -80, z: -80},
        {x:  80, y:  80, z: -80}, {x: -80, y:  80, z: -80},
        {x: -80, y: -80, z:  80}, {x:  80, y: -80, z:  80},
        {x:  80, y:  80, z:  80}, {x: -80, y:  80, z:  80}
    ],
    aristas: [
        [0, 1], [1, 2], [2, 3], [3, 0], // Cara Trasera
        [4, 5], [5, 6], [6, 7], [7, 4], // Cara Frontal
        [0, 4], [1, 5], [2, 6], [3, 7]  // Conexiones
    ]
};

// OPCIÓN A: Pirámide de base cuadrada (5 vértices, 8 aristas)
const piramide = {
    vertices: [
        {x: -80, y: -80, z: -80}, // V0: Base Trasera Izq
        {x:  80, y: -80, z: -80}, // V1: Base Trasera Der
        {x:  80, y: -80, z:  80}, // V2: Base Frontal Der
        {x: -80, y: -80, z:  80}, // V3: Base Frontal Izq
        {x:   0, y:  80, z:   0}  // V4: Ápice Superior
    ],
    aristas: [
        [0, 1], [1, 2], [2, 3], [3, 0], // Base Cuadrada
        [0, 4], [1, 4], [2, 4], [3, 4]  // Lados inclinados al ápice
    ]
};

// OPCIÓN B: Prisma triangular (6 vértices, 9 aristas)
const prisma = {
    vertices: [
        {x: -80, y: -80, z: -80}, // V0: Triángulo Trasero Izq
        {x:  80, y: -80, z: -80}, // V1: Triángulo Trasero Der
        {x:   0, y:  80, z: -80}, // V2: Triángulo Trasero Top
        {x: -80, y: -80, z:  80}, // V3: Triángulo Frontal Izq
        {x:  80, y: -80, z:  80}, // V4: Triángulo Frontal Der
        {x:   0, y:  80, z:  80}  // V5: Triángulo Frontal Top
    ],
    aristas: [
        [0, 1], [1, 2], [2, 0], // Cara Trasera
        [3, 4], [4, 5], [5, 3], // Cara Frontal
        [0, 3], [1, 4], [2, 5]  // Aristas Longitudinales
    ]
};

// OPCIÓN C: Octaedro (6 vértices, 12 aristas)
const octaedro = {
    vertices: [
        {x:   0, y:  100, z:    0}, // V0: Ápice Superior
        {x:   0, y: -100, z:    0}, // V1: Ápice Inferior
        {x: -80, y:    0, z:  -80}, // V2: Plano Medio - Trasero Izq
        {x:  80, y:    0, z:  -80}, // V3: Plano Medio - Trasero Der
        {x:  80, y:    0, z:   80}, // V4: Plano Medio - Frontal Der
        {x: -80, y:    0, z:   80}  // V5: Plano Medio - Frontal Izq
    ],
    aristas: [
        [2, 3], [3, 4], [4, 5], [5, 2], // Anillo Ecuatorial Medio
        [0, 2], [0, 3], [0, 4], [0, 5], // Conexiones Pirámide Superior
        [1, 2], [1, 3], [1, 4], [1, 5]  // Conexiones Pirámide Inferior
    ]
};

// Diccionario de geometrías
const geometrias = { cubo, piramide, prisma, octaedro };

// ==============================================================================
// 3. PIPELINE DE TRANSFORMACIONES TRIDIMENSIONALES
// ==============================================================================
function transformarVertice3D(v, params) {
    let { tx, ty, tz, sx, sy, sz, rx, ry, rz, shxy, shxz } = params;

    let radX = rx * Math.PI / 180;
    let radY = ry * Math.PI / 180;
    let radZ = rz * Math.PI / 180;

    // 1. Escalamiento (S)
    let x1 = v.x * sx;
    let y1 = v.y * sy;
    let z1 = v.z * sz;

    // 2. Sesgado (Shear)
    let x2 = x1 + (shxy * y1) + (shxz * z1);
    let y2 = y1;
    let z2 = z1;

    // 3. Rotación X (Pitch)
    let x3 = x2;
    let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
    let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);

    // 4. Rotación Y (Yaw)
    let x4 = x3 * Math.cos(radY) + z3 * Math.sin(radY);
    let y4 = y3;
    let z4 = -x3 * Math.sin(radY) + z3 * Math.cos(radY);

    // 5. Rotación Z (Roll)
    let x5 = x4 * Math.cos(radZ) - y4 * Math.sin(radZ);
    let y5 = x4 * Math.sin(radZ) + y4 * Math.cos(radZ);
    let z5 = z4;

    // 6. Traslación (T)
    let xFinal = x5 + tx;
    let yFinal = y5 + ty;
    let zFinal = z5 + tz;

    return { x: xFinal, y: yFinal, z: zFinal };
}

// ==============================================================================
// 4. PROYECCIÓN PERSPECTIVA (3D A CANAL 2D)
// ==============================================================================
function proyectar3Da2D(v3d) {
    const distanciaCamara = 500;
    
    let zAjustado = v3d.z + distanciaCamara;
    if (zAjustado < 1) zAjustado = 1;

    let factorProyeccion = distanciaCamara / zAjustado;

    let x2d = CENTRO_X + (v3d.x * factorProyeccion);
    let y2d = CENTRO_Y - (v3d.y * factorProyeccion); // Inversión Eje Y

    return { x: x2d, y: y2d, factor: factorProyeccion };
}

// ==============================================================================
// 5. BUCLE DE RENDERIZADO Y ESTILOS PERSONALIZADOS
// ==============================================================================
function renderizar() {
    const params = {
        tx: parseFloat(document.getElementById('tx').value),
        ty: parseFloat(document.getElementById('ty').value),
        tz: parseFloat(document.getElementById('tz').value),
        sx: parseFloat(document.getElementById('sx').value),
        sy: parseFloat(document.getElementById('sy').value),
        sz: parseFloat(document.getElementById('sz').value),
        rx: parseFloat(document.getElementById('rx').value),
        ry: parseFloat(document.getElementById('ry').value),
        rz: parseFloat(document.getElementById('rz').value),
        shxy: parseFloat(document.getElementById('shxy').value),
        shxz: parseFloat(document.getElementById('shxz').value)
    };

    // Actualizar interfaz
    document.getElementById('valTx').innerText = params.tx;
    document.getElementById('valTy').innerText = params.ty;
    document.getElementById('valTz').innerText = params.tz;
    document.getElementById('valSx').innerText = params.sx.toFixed(1);
    document.getElementById('valSy').innerText = params.sy.toFixed(1);
    document.getElementById('valSz').innerText = params.sz.toFixed(1);
    document.getElementById('valRx').innerText = params.rx + '°';
    document.getElementById('valRy').innerText = params.ry + '°';
    document.getElementById('valRz').innerText = params.rz + '°';
    document.getElementById('valShXY').innerText = params.shxy.toFixed(1);
    document.getElementById('valShXZ').innerText = params.shxz.toFixed(1);

    // Seleccionar primitiva
    const tipoFigura = document.getElementById('selectFigura').value;
    const figuraActual = geometrias[tipoFigura];

    // Limpiar Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Ejes de Referencia (Color Violeta Muted)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CENTRO_X, 0); ctx.lineTo(CENTRO_X, canvas.height);
    ctx.moveTo(0, CENTRO_Y); ctx.lineTo(canvas.width, CENTRO_Y);
    ctx.stroke();

    // Transformar y Proyectar
    let verticesTransformados = figuraActual.vertices.map(v => transformarVertice3D(v, params));
    let vertices2D = verticesTransformados.map(proyectar3Da2D);

    // Personalización de Estilo: Grosor dinámico de línea según escala promedio
    let escalaPromedio = (params.sx + params.sy + params.sz) / 3;
    let grosorLinea = Math.max(1, 2.5 * escalaPromedio);

    // Renderizar Aristas (Líneas Neón Fucsia/Rosa)
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = grosorLinea;
    for (let arista of figuraActual.aristas) {
        let p1 = vertices2D[arista[0]];
        let p2 = vertices2D[arista[1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // Renderizar Vértices (Puntos Neón Esmeralda/Verde con resplandor)
    ctx.fillStyle = '#10b981';
    for (let p of vertices2D) {
        ctx.beginPath();
        // El radio varía dinámicamente según el factor de perspectiva (profundidad Z)
        let radioDinamico = Math.max(3, 5 * p.factor);
        ctx.arc(p.x, p.y, radioDinamico, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==============================================================================
// 6. RETO: BOTÓN DE AUTO-ROTACIÓN (requestAnimationFrame)
// ==============================================================================
let autoRotando = false;
let animId = null;
const btnAutoRotar = document.getElementById('btnAutoRotar');
const inputRy = document.getElementById('ry');

function animar() {
    if (!autoRotando) return;

    let ryVal = parseFloat(inputRy.value);
    ryVal = (ryVal + 1.5) % 360; // Incrementar Yaw
    if (ryVal > 180) ryVal -= 360; // Mantener rango [-180, 180]
    
    inputRy.value = ryVal;
    renderizar();

    animId = requestAnimationFrame(animar);
}

btnAutoRotar.addEventListener('click', () => {
    autoRotando = !autoRotando;
    if (autoRotando) {
        btnAutoRotar.innerText = '⏸ Pausar Auto-Rotación';
        btnAutoRotar.style.backgroundColor = '#ef4444';
        animar();
    } else {
        btnAutoRotar.innerText = '▶ Iniciar Auto-Rotación';
        btnAutoRotar.style.backgroundColor = '#10b981';
        cancelAnimationFrame(animId);
    }
});

// Escuchadores de eventos
document.querySelectorAll('input[type=range], select').forEach(elem => {
    elem.addEventListener('input', renderizar);
});

// Render inicial
renderizar();
