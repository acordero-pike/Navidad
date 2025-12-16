// Clave para localStorage
const STORAGE_KEY = 'amigoSecretoState';

// Participantes iniciales fijos
const PARTICIPANTES_INICIALES = ['Albin', 'Pamela', 'Junior', 'Kleyber', 'Caro', 'Rocio']; 

let dadoresDisponibles = [...PARTICIPANTES_INICIALES]; 
let receptoresDisponibles = [...PARTICIPANTES_INICIALES]; 
let resultadosSerializados = []; 

// --- Funciones de Persistencia (localStorage) ---

let musicaIniciada = false;

function iniciarMusicaFondo() {
    if (!musicaIniciada) {
        const musica = document.getElementById('musica-fondo');
        // Usar .play() solo después de la interacción del usuario
        musica.volume = 0.5; // Ajustar el volumen para que no sea demasiado alto
        musica.play().then(() => {
            musicaIniciada = true;
            console.log("Música de fondo navideña iniciada.");
        }).catch(error => {
            console.warn("La reproducción automática de audio fue bloqueada:", error);
        });
    }
}

function guardarEstado() {
    const estado = {
        dadores: dadoresDisponibles,
        receptores: receptoresDisponibles,
        resultados: resultadosSerializados
    };
    // Guardamos el objeto como una cadena JSON en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function cargarEstado() {
    const estadoGuardado = localStorage.getItem(STORAGE_KEY);
    
    if (estadoGuardado) {
        try {
            const estado = JSON.parse(estadoGuardado);
            
            // Lógica para verificar que el estado es consistente
            const todosParticipantes = [...estado.dadores, ...estado.receptores].filter((value, index, self) => self.indexOf(value) === index);
            
            if (todosParticipantes.every(p => PARTICIPANTES_INICIALES.includes(p)) && PARTICIPANTES_INICIALES.length === todosParticipantes.length) {
                 dadoresDisponibles = estado.dadores;
                 receptoresDisponibles = estado.receptores;
                 resultadosSerializados = estado.resultados;
                 console.log("Estado del sorteo recuperado de localStorage.");
                 return true;
            } else {
                 return false;
            }
        } catch (e) {
            console.error("Error al parsear estado de localStorage:", e);
            return false;
        }
    }
    return false;
}

// --- Lógica del Menú y UI ---

function inicializar() {
    cargarEstado(); // Cargar el estado antes de todo
    
    // Llenar selectores (ambos)
    actualizarSelectorDador(); 
    actualizarSelectorConsulta(); 
    actualizarContador(); 
   
    mostrarSeccion('menu'); // Mostrar el menú principal al cargar
}

function mostrarSeccion(seccion) {
     iniciarMusicaFondo(); 
    // Ocultar todas las secciones
    document.getElementById('menu-principal').classList.add('hidden');
    document.getElementById('seccion-asignacion').classList.add('hidden');
    document.getElementById('seccion-consulta').classList.add('hidden');
    
    // Mostrar la sección solicitada
    if (seccion === 'asignacion') {
        // Asegurarse de que los datos de asignación estén frescos
        actualizarSelectorDador();
        actualizarContador();
        document.getElementById('resultado-asignacion').innerHTML = '';
        document.getElementById('seccion-asignacion').classList.remove('hidden');
    } else if (seccion === 'consulta') {
        document.getElementById('resultado-consulta').innerHTML = '';
        document.getElementById('seccion-consulta').classList.remove('hidden');
    } else { // 'menu'
        document.getElementById('menu-principal').classList.remove('hidden');
    }
}

function actualizarSelectorDador() {
    const selector = document.getElementById('nombre-dador-selector');
    selector.innerHTML = '<option value="">-- Selecciona tu nombre --</option>';
    dadoresDisponibles.forEach(nombre => {
        selector.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    });
}

function actualizarSelectorConsulta() {
    const selector = document.getElementById('nombre-consulta-selector');
    selector.innerHTML = '<option value="">-- Selecciona tu nombre --</option>';
    PARTICIPANTES_INICIALES.forEach(nombre => {
        selector.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    });
}

function actualizarContador() {
    document.getElementById('participantes-restantes-count').textContent = dadoresDisponibles.length;
    
    // Si todos han sido asignados, se muestra el botón de descarga del archivo encriptado
    if (dadoresDisponibles.length === 0) {
        document.getElementById('resultados-finales').classList.remove('hidden');
    } else {
         document.getElementById('resultados-finales').classList.add('hidden');
    }
}


// --- Lógica de Asignación (Sortear) ---

function asignarAmigoSecreto() {
    const selector = document.getElementById('nombre-dador-selector');
    const claveInput = document.getElementById('clave-dador-input');
    const resultadoDiv = document.getElementById('resultado-asignacion');

    const dador = selector.value;
    const clave = claveInput.value.trim();

    resultadoDiv.innerHTML = '';
    
    if (!dador || !clave) {
        resultadoDiv.innerHTML = '<span class="error">¡Error! Selecciona tu nombre e ingresa tu clave.</span>';
        return;
    }

    if (!dadoresDisponibles.includes(dador)) {
        resultadoDiv.innerHTML = '<span class="error">Error: Ya has sido asignado. Vuelve al menú y usa la sección de Consulta.</span>';
        return;
    }

    // --- Lógica de Sorteo y Asignación (Mismo código de sorteo) ---
    let receptorAsignado = null;
    let intentos = 0;
    const MAX_INTENTOS = 100;

    while (receptorAsignado === null && intentos < MAX_INTENTOS) {
        const receptoresValidos = receptoresDisponibles.filter(r => r !== dador);

        if (receptoresValidos.length === 0) {
             if (receptoresDisponibles.length === 1 && dadoresDisponibles.length === 1 && dadoresDisponibles[0] === receptoresDisponibles[0]) {
                 receptorAsignado = receptoresDisponibles[0];
                 break; 
             } else {
                 resultadoDiv.innerHTML = '<span class="error">No se pudo encontrar un receptor válido. Reinicia la aplicación.</span>';
                 return;
             }
        }

        const indiceAleatorio = Math.floor(Math.random() * receptoresValidos.length);
        receptorAsignado = receptoresValidos[indiceAleatorio];
        
        // Verificación de ciclo para los últimos 2
        if (dadoresDisponibles.length === 2 && receptoresDisponibles.length === 2) {
            const otroDador = dadoresDisponibles.find(p => p !== dador);
            const otroReceptor = receptoresDisponibles.find(p => p !== receptorAsignado);
            
            if (otroDador === otroReceptor) {
                receptorAsignado = null; 
            }
        }
        
        if (receptorAsignado) break;

        intentos++;
    }

    if (receptorAsignado === null) {
        resultadoDiv.innerHTML = '<span class="error">Error: El sorteo falló. Intenta refrescar.</span>';
        return;
    }

    // --- Encriptar y Guardar el Resultado ---

    const textoOriginal = `${receptorAsignado}||${clave}`; 
    // Encriptación: Base64(Dador + Clave + Base64(Receptor||Clave))
    const textoEncriptado = btoa(dador + clave + btoa(textoOriginal)); 

    resultadosSerializados.push(`${dador}:${textoEncriptado}`);

    // --- Actualizar el Estado y la UI ---
    
    dadoresDisponibles = dadoresDisponibles.filter(p => p !== dador);
    receptoresDisponibles = receptoresDisponibles.filter(p => p !== receptorAsignado);
    
    guardarEstado(); // ¡Guardar en localStorage!

    resultadoDiv.innerHTML = `<p class="success">¡Tu Amigo Secreto es: 🎁 **${receptorAsignado}**!</p>`;
    
    // Limpiar campos
    setTimeout(() => {
        selector.value = "";
        claveInput.value = "";
    }, 2000); 

    actualizarSelectorDador();
    actualizarContador();
}


// --- Lógica de Consulta (Desencriptación) ---

function consultarAmigoSecreto() {
    const selector = document.getElementById('nombre-consulta-selector');
    const inputClave = document.getElementById('clave-consulta-input');
    const resultadoDiv = document.getElementById('resultado-consulta');

    const dador = selector.value;
    const claveConsulta = inputClave.value.trim();

    resultadoDiv.innerHTML = '';
    
    if (!dador || !claveConsulta) {
        resultadoDiv.innerHTML = '<span class="error">¡Error! Selecciona tu nombre e ingresa tu clave.</span>';
        return;
    }
    
    // Buscar resultado en la lista persistente (resultadosSerializados, cargada desde localStorage)
    const lineaEncontrada = resultadosSerializados.find(linea => linea.startsWith(dador + ':'));

    if (!lineaEncontrada) {
        resultadoDiv.innerHTML = '<span class="error">Aún no has participado en la asignación. Ve a la sección de Asignación.</span>';
        return;
    }
    
    const [, textoEncriptado] = lineaEncontrada.split(':');

    try {
        // Desencriptación
        const desencriptado1 = atob(textoEncriptado);
        const saltPattern = dador + claveConsulta;

        if (desencriptado1.startsWith(saltPattern)) {
            const textoLimpioBase64 = desencriptado1.substring(saltPattern.length);
            const textoFinal = atob(textoLimpioBase64);
            const [amigoSecreto, claveOriginal] = textoFinal.split('||');

            if (claveConsulta === claveOriginal) {
                 resultadoDiv.innerHTML = `<p class="success">¡Tu Amigo Secreto es: 🎁 **${amigoSecreto}**!</p>`;
            } else {
                 resultadoDiv.innerHTML = '<span class="error">Clave incorrecta. Intenta de nuevo.</span>';
            }

        } else {
            resultadoDiv.innerHTML = '<span class="error">Clave incorrecta. Intenta de nuevo.</span>';
        }

    } catch (e) {
        resultadoDiv.innerHTML = '<span class="error">Error en el proceso de consulta.</span>';
        console.error("Error de desencriptación:", e);
    }
}


// --- Función de Descarga (Registro Final) ---

function descargarResultados() {
    if (dadoresDisponibles.length > 0) {
         alert("Advertencia: El sorteo aún no ha finalizado. Espera a que todos participen.");
         return;
    }

    const texto = resultadosSerializados.join('\n');
    
    if (texto.trim() === "") {
         alert("No hay datos para descargar.");
         return;
    }
    const blob = new Blob([texto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amigo_secreto_secuencial_encriptado.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("Archivo de resultados encriptados descargado con éxito.");
}

// Inicialización de la Interfaz al cargar la página
document.addEventListener('DOMContentLoaded', inicializar);