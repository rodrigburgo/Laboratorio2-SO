// script.js - Simulador de Gestión de Memoria

// Constantes
const MEMORY_SIZE = 16 * 1024 * 1024; // 16 MiB en bytes
const DEFAULT_PROGRAMS = [
    { id: 1, name: "Navegador", size: 2, color: "#3498db" },
    { id: 2, name: "Editor", size: 1, color: "#2ecc71" },
    { id: 3, name: "Reproductor", size: 3, color: "#e74c3c" },
    { id: 4, name: "Antivirus", size: 1.5, color: "#f39c12" },
    { id: 5, name: "Base de datos", size: 4, color: "#9b59b6" }
];

// Variables de estado
let memory = [];
let programs = [];
let memoryType = "fixed";
let algorithm = "first-fit";
let currentMemorySize = 16; // MiB

// Elementos del DOM
const memoryTypeSelect = document.getElementById("memory-type");
const algorithmSelect = document.getElementById("algorithm");
const memorySizeInput = document.getElementById("memory-size");
const simulateBtn = document.getElementById("simulate-btn");
const resetBtn = document.getElementById("reset-btn");
const programsContainer = document.getElementById("programs-container");
const addProgramBtn = document.getElementById("add-program-btn");
const memoryMap = document.getElementById("memory-map");
const totalMemorySpan = document.getElementById("total-memory");
const usedMemorySpan = document.getElementById("used-memory");
const freeMemorySpan = document.getElementById("free-memory");
const fragmentationSpan = document.getElementById("fragmentation");
const eventLog = document.getElementById("event-log");

// Inicialización
function init() {
    loadDefaultPrograms();
    setupEventListeners();
    renderPrograms();
    updateMemoryInfo();
    logEvent("Sistema inicializado");
}

// Cargar programas por defecto
function loadDefaultPrograms() {
    programs = [...DEFAULT_PROGRAMS];
}

// Configurar event listeners
function setupEventListeners() {
    memoryTypeSelect.addEventListener("change", (e) => {
        memoryType = e.target.value;
        logEvent(`Tipo de memoria cambiado a: ${getMemoryTypeName(memoryType)}`);
    });

    algorithmSelect.addEventListener("change", (e) => {
        algorithm = e.target.value;
        logEvent(`Algoritmo cambiado a: ${getAlgorithmName(algorithm)}`);
    });

    memorySizeInput.addEventListener("change", (e) => {
        currentMemorySize = parseInt(e.target.value);
        logEvent(`Tamaño de memoria cambiado a: ${currentMemorySize} MiB`);
    });

    simulateBtn.addEventListener("click", simulateMemoryAllocation);
    resetBtn.addEventListener("click", resetSimulation);
    addProgramBtn.addEventListener("click", addNewProgram);
}

// Renderizar programas
function renderPrograms() {
    programsContainer.innerHTML = "";
    programs.forEach(program => {
        const programCard = document.createElement("div");
        programCard.className = "program-card";
        programCard.innerHTML = `
            <h3>${program.name}</h3>
            <p>Tamaño: ${program.size} MiB</p>
            <button class="btn btn-remove" data-id="${program.id}">Eliminar</button>
        `;
        programsContainer.appendChild(programCard);
    });

    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll(".btn-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.target.getAttribute("data-id"));
            removeProgram(id);
        });
    });
}

// Añadir nuevo programa
function addNewProgram() {
    const name = prompt("Nombre del programa:");
    if (!name) return;

    const size = parseFloat(prompt("Tamaño en MiB:"));
    if (isNaN(size) || size <= 0) {
        alert("Tamaño inválido");
        return;
    }

    const id = programs.length > 0 ? Math.max(...programs.map(p => p.id)) + 1 : 1;
    const color = getRandomColor();

    programs.push({ id, name, size, color });
    renderPrograms();
    logEvent(`Programa añadido: ${name} (${size} MiB)`);
}

// Eliminar programa
function removeProgram(id) {
    const program = programs.find(p => p.id === id);
    if (!program) return;

    programs = programs.filter(p => p.id !== id);
    renderPrograms();
    logEvent(`Programa eliminado: ${program.name}`);
}

// Simular asignación de memoria
function simulateMemoryAllocation() {
    logEvent("Iniciando simulación...");
    
    // Convertir tamaño de memoria a bytes
    const memorySizeBytes = currentMemorySize * 1024 * 1024;
    
    // Inicializar memoria según el tipo seleccionado
    switch (memoryType) {
        case "fixed":
            initFixedPartitions(memorySizeBytes);
            break;
        case "variable":
            initVariablePartitions(memorySizeBytes);
            break;
        case "dynamic":
        case "compact":
            initDynamicMemory(memorySizeBytes);
            break;
    }

    // Asignar programas a memoria
    allocatePrograms();

    // Renderizar memoria
    renderMemory();

    // Actualizar información
    updateMemoryInfo();

    logEvent("Simulación completada");
}

// Inicializar particiones fijas
function initFixedPartitions(totalSize) {
    memory = [];
    const partitionSize = totalSize / 8; // 8 particiones iguales
    
    for (let i = 0; i < 8; i++) {
        memory.push({
            start: i * partitionSize,
            size: partitionSize,
            free: true,
            program: null,
            partitionId: i + 1
        });
    }
    
    logEvent(`Particiones fijas creadas (8 particiones de ${bytesToMiB(partitionSize).toFixed(2)} MiB cada una)`);
}

// Inicializar particiones variables
function initVariablePartitions(totalSize) {
    memory = [];
    // Crear 5 particiones de tamaño variable predefinido
    const partitionSizes = [
        totalSize * 0.2, // 20%
        totalSize * 0.15, // 15%
        totalSize * 0.25, // 25%
        totalSize * 0.3,  // 30%
        totalSize * 0.1   // 10%
    ];
    
    let currentStart = 0;
    partitionSizes.forEach((size, i) => {
        memory.push({
            start: currentStart,
            size: size,
            free: true,
            program: null,
            partitionId: i + 1
        });
        currentStart += size;
    });
    
    logEvent("Particiones variables creadas con tamaños predefinidos");
}

// Inicializar memoria dinámica
function initDynamicMemory(totalSize) {
    memory = [{
        start: 0,
        size: totalSize,
        free: true,
        program: null
    }];
    
    logEvent("Memoria dinámica inicializada (un solo bloque libre)");
}

// Asignar programas a memoria
function allocatePrograms() {
    // Ordenar programas según el algoritmo
    const programsToAllocate = [...programs];
    
    if (algorithm === "best-fit" || algorithm === "worst-fit") {
        programsToAllocate.sort((a, b) => algorithm === "best-fit" ? a.size - b.size : b.size - a.size);
    }

    programsToAllocate.forEach(program => {
        const sizeBytes = program.size * 1024 * 1024;
        let allocated = false;

        if (memoryType === "fixed" || memoryType === "variable") {
            allocated = allocateInPartitions(program, sizeBytes);
        } else {
            allocated = allocateDynamic(program, sizeBytes);
        }

        if (!allocated) {
            logEvent(`No se pudo asignar memoria para ${program.name} (${program.size} MiB)`, "error");
        }
    });

    // Compactar si es necesario
    if (memoryType === "compact" && memory.some(block => block.free)) {
        compactMemory();
    }
}

// Asignar en particiones (fijas o variables)
function allocateInPartitions(program, sizeBytes) {
    let partitions = [...memory];
    
    // Ordenar particiones según el algoritmo
    if (algorithm === "best-fit") {
        partitions.sort((a, b) => (a.free ? a.size : Infinity) - (b.free ? b.size : Infinity));
    } else if (algorithm === "worst-fit") {
        partitions.sort((a, b) => (b.free ? b.size : -Infinity) - (a.free ? a.size : -Infinity));
    }

    for (const partition of partitions) {
        if (partition.free && partition.size >= sizeBytes) {
            partition.free = false;
            partition.program = program;
            logEvent(`${program.name} asignado a partición ${partition.partitionId} (${bytesToMiB(partition.size).toFixed(2)} MiB)`);
            return true;
        }
    }
    
    return false;
}

// Asignar en memoria dinámica
function allocateDynamic(program, sizeBytes) {
    let blocks = [...memory];
    
    // Ordenar bloques según el algoritmo
    if (algorithm === "best-fit") {
        blocks.sort((a, b) => (a.free ? a.size : Infinity) - (b.free ? b.size : Infinity));
    } else if (algorithm === "worst-fit") {
        blocks.sort((a, b) => (b.free ? b.size : -Infinity) - (a.free ? a.size : -Infinity));
    }

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.free && block.size >= sizeBytes) {
            // Dividir el bloque si hay espacio sobrante
            if (block.size > sizeBytes) {
                const newFreeBlock = {
                    start: block.start + sizeBytes,
                    size: block.size - sizeBytes,
                    free: true,
                    program: null
                };
                memory.splice(memory.indexOf(block) + 1, 0, newFreeBlock);
            }
            
            // Actualizar el bloque actual
            block.size = sizeBytes;
            block.free = false;
            block.program = program;
            
            logEvent(`${program.name} asignado en memoria dinámica (${bytesToMiB(sizeBytes).toFixed(2)} MiB)`);
            return true;
        }
    }
    
    return false;
}

// Compactar memoria
function compactMemory() {
    // Juntar todos los bloques libres
    const usedBlocks = memory.filter(block => !block.free);
    const freeSize = memory.filter(block => block.free).reduce((sum, block) => sum + block.size, 0);
    
    if (freeSize > 0) {
        // Reorganizar memoria
        let currentStart = 0;
        const newMemory = [];
        
        // Colocar primero los bloques usados
        usedBlocks.forEach(block => {
            newMemory.push({
                start: currentStart,
                size: block.size,
                free: false,
                program: block.program
            });
            currentStart += block.size;
        });
        
        // Agregar el bloque libre consolidado al final
        if (freeSize > 0) {
            newMemory.push({
                start: currentStart,
                size: freeSize,
                free: true,
                program: null
            });
        }
        
        memory = newMemory;
        logEvent(`Memoria compactada. Bloque libre consolidado: ${bytesToMiB(freeSize).toFixed(2)} MiB`);
    }
}

// Renderizar memoria
function renderMemory() {
    memoryMap.innerHTML = "";
    const totalSize = currentMemorySize * 1024 * 1024;
    
    memory.forEach(block => {
        const blockElement = document.createElement("div");
        blockElement.className = "memory-block";
        
        // Calcular tamaño y posición relativa
        const percentage = (block.size / totalSize) * 100;
        const offsetPercentage = (block.start / totalSize) * 100;
        
        blockElement.style.height = "100%";
        blockElement.style.width = `${percentage}%`;
        blockElement.style.left = `${offsetPercentage}%`;
        blockElement.style.backgroundColor = block.free ? "#95a5a6" : block.program.color;
        
        // Información del bloque
        const sizeMiB = bytesToMiB(block.size).toFixed(2);
        const info = block.free 
            ? `Libre: ${sizeMiB} MiB` 
            : `${block.program.name}\n${sizeMiB} MiB`;
        
        blockElement.textContent = info;
        blockElement.title = block.free
            ? `Bloque libre\nInicio: 0x${block.start.toString(16).toUpperCase()}\nTamaño: ${sizeMiB} MiB`
            : `Programa: ${block.program.name}\nInicio: 0x${block.start.toString(16).toUpperCase()}\nTamaño: ${sizeMiB} MiB`;
        
        memoryMap.appendChild(blockElement);
    });
}

// Actualizar información de memoria
function updateMemoryInfo() {
    const totalBytes = currentMemorySize * 1024 * 1024;
    const usedBytes = memory.reduce((sum, block) => block.free ? sum : sum + block.size, 0);
    const freeBytes = totalBytes - usedBytes;
    
    totalMemorySpan.textContent = currentMemorySize;
    usedMemorySpan.textContent = bytesToMiB(usedBytes).toFixed(2);
    freeMemorySpan.textContent = bytesToMiB(freeBytes).toFixed(2);
    
    // Calcular fragmentación (solo para particiones dinámicas)
    if (memoryType === "dynamic" || memoryType === "compact") {
        const freeBlocks = memory.filter(block => block.free).length;
        const fragmentation = freeBlocks > 1 ? ((freeBlocks - 1) / memory.length) * 100 : 0;
        fragmentationSpan.textContent = fragmentation.toFixed(2);
    } else {
        fragmentationSpan.textContent = "N/A";
    }
}

// Reiniciar simulación
function resetSimulation() {
    memory = [];
    programs = [...DEFAULT_PROGRAMS];
    currentMemorySize = 16;
    memorySizeInput.value = currentMemorySize;
    memoryType = "fixed";
    memoryTypeSelect.value = memoryType;
    algorithm = "first-fit";
    algorithmSelect.value = algorithm;
    
    renderPrograms();
    updateMemoryInfo();
    memoryMap.innerHTML = "";
    logEvent("Simulación reiniciada");
}

// Registrar evento en el log
function logEvent(message, type = "info") {
    const entry = document.createElement("div");
    entry.className = `event-entry event-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    eventLog.appendChild(entry);
    eventLog.scrollTop = eventLog.scrollHeight;
}

// Helper: Convertir bytes a MiB
function bytesToMiB(bytes) {
    return bytes / (1024 * 1024);
}

// Helper: Obtener nombre del tipo de memoria
function getMemoryTypeName(type) {
    const names = {
        "fixed": "Particiones estáticas de tamaño fijo",
        "variable": "Particiones estáticas de tamaño variable",
        "dynamic": "Particiones dinámicas sin compactación",
        "compact": "Particiones dinámicas con compactación"
    };
    return names[type] || type;
}

// Helper: Obtener nombre del algoritmo
function getAlgorithmName(alg) {
    const names = {
        "first-fit": "Primer ajuste",
        "best-fit": "Mejor ajuste",
        "worst-fit": "Peor ajuste"
    };
    return names[alg] || alg;
}

// Helper: Generar color aleatorio
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Iniciar la aplicación
document.addEventListener("DOMContentLoaded", init);