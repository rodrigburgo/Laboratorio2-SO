const stack = 65536;
const heap = 131072;

var programas = [
    {
        nombre: "Word",
        tamano: 1048576,
        bss: 165,
        data: 179450,
        text: 672353,
    },
    {
        nombre: "Excel",
        tamano: 2293760,
        bss: 256,
        data: 893772,
        text: 1203124,
    },
    {
        nombre: "NetBeans",
        tamano: 3342336,
        bss: 460,
        data: 1025223,
        text: 2120045,
    },
    {
        nombre: "Sublime Text",
        tamano: 720896,
        bss: 80,
        data: 238860,
        text: 285348,
    },
    {
        nombre: "Android Studio",
        tamano: 6488064,
        bss: 1123,
        data: 1892119,
        text: 4398214,
    },
];


var particionesVariables = [1, 2, 2, 3, 3, 4]
var gestionMemoria = 0;
var programasEjecutados = [];
var segmentosEjecutados = [];
var programasTTP = [];
var memoria = new Memoria();
var idProceso = 0;
var colores = [];

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function llenarProgramas() {
    document.getElementById("programas").replaceChildren();
    for (let i = 0; i < programas.length; i++) {
        const programa = programas[i];

        var fila = "<tr><td>" + programa.nombre + "</td><td>" + stack + "</td><td>" + heap + "</td><td>" + programa.text + "</td><td>" + programa.data + "</td><td>" + programa.bss + "</td><td>" + programa.tamano + "</td><td><button name = 'btnEncender' class='btn btnEncender'" + " value='" + i + "' disabled>Iniciar</button>" + "</td></tr>";

        var btn = document.createElement("TR");
        btn.innerHTML = fila;
        document.getElementById("programas").appendChild(btn);
    };
}

function removeItemFromArr(arr, item) {
    return arr.filter(function (e) {
        return e.id != item;
    });
};

function llenarMarcos() {
    document.getElementById("marcos").replaceChildren();

    var segmentos = memoria.getSegmentos();
    for (let i = 0; i < segmentos.length; i++) {

        var libre = 1;
        if (segmentos[i].proceso == null) {
            libre = 0;
        }

        const idHex = componentToHex(i);
        var fila = "<tr><td>" + idHex + "</td><td>0x" + segmentos[i].posicion + "</td><td>" + libre + "</td></tr>";

        var btn = document.createElement("TR");
        btn.innerHTML = fila;
        document.getElementById("marcos").appendChild(btn);
    };
}

function llenarLibres() {
    const cuerpoTabla = document.getElementById("libres");
    cuerpoTabla.replaceChildren();

    const segmentos = memoria.getSegmentosLibres();

    for (let i = 0; i < segmentos.length; i++) {
        const tamano = segmentos[i].tamano;
        const posicionHex = segmentos[i].posicion;
        const posicionDec = parseInt(posicionHex, 16); // Convertir de hex a decimal

        const fila = `
            <tr>
                <td>${tamano} (0x${tamano.toString(16).toUpperCase()})</td>
                <td>${posicionDec} (0x${posicionHex.toUpperCase()})</td>
            </tr>
        `;

        const tr = document.createElement("tr");
        tr.innerHTML = fila;
        cuerpoTabla.appendChild(tr);
    }
}

function mostrarSegmentosPorId(idSeleccionado) {
    const cuerpoTabla = document.getElementById("segmentoSeleccionado");

    const segmentosDelPrograma = segmentosEjecutados
        .filter(p => p.id == idSeleccionado)
        .sort((a, b) => Number(a.numero) - Number(b.numero));

    cuerpoTabla.replaceChildren();

    segmentosDelPrograma.forEach(programa => {
        const numero = Number(programa.numero);
        const baseHex = programa.posicion;
        const baseDec = parseInt(baseHex, 16);
        const limite = Number(programa.tamano);

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${numero} (0x${numero.toString(16).toUpperCase()})</td>
            <td>${baseDec} (0x${baseHex.toUpperCase()})</td>
            <td>${limite} (0x${limite.toString(16).toUpperCase()})</td>
            <td>${programa.parte}</td>
        `;
        cuerpoTabla.appendChild(fila);
    });

    const nombre = segmentosDelPrograma[0]?.nombre ?? "";
    document.getElementById("tituloTexto").textContent = `Segmentos de (${idSeleccionado}) ${nombre}`;
    document.getElementById("tituloSegmentoSeleccionado").style.display = "block";
    document.getElementById("contenedorTablaSegmentoUnico").style.display = "block";

    document.getElementById("btnApagarSegmento").dataset.id = idSeleccionado;
}

function llenarProceso() {
    const combo = document.getElementById("comboProceso");
    const cuerpoTabla = document.getElementById("direcciones");

    combo.replaceChildren(); // limpia las opciones
    cuerpoTabla.replaceChildren(); // limpia la tabla

    // Crear opción predeterminada
    const opcionDefault = document.createElement("option");
    opcionDefault.textContent = "Selecciona un segmento";
    opcionDefault.disabled = true;
    opcionDefault.selected = true;
    combo.appendChild(opcionDefault);

    // Si no hay programas, ocultar todo
    if (programasEjecutados.length === 0) {
        document.getElementById("selectorProceso").style.display = "block"; // muestra combo pero solo con el mensaje
        document.getElementById("tituloProcesoSeleccionado").style.display = "none";
        document.getElementById("contenedorTablaDirecciones").style.display = "none";
        return;
    }

    // Mostrar selector
    document.getElementById("selectorProceso").style.display = "block";

    // Llenar combo con procesos
    for (const proceso of programasEjecutados) {
        const option = document.createElement("option");
        option.value = proceso.id;
        option.textContent = `(${proceso.id}) ${proceso.nombre}`;
        combo.appendChild(option);
    }

    // Asignar evento al cambiar selección
    combo.onchange = function () {
        mostrarProcesoPorId(combo.value);
    };

    // Selección automática del primero
    if (programasEjecutados.length >= 1) {
        combo.selectedIndex = 1; // índice 1 porque el 0 es la opción predeterminada
        mostrarProcesoPorId(combo.options[1].value);
    }
}


function mostrarProcesoPorId(idSeleccionado) {
    const cuerpoTabla = document.getElementById("direcciones");

    const direcciones = memoria.tabSeg[idSeleccionado];
    cuerpoTabla.replaceChildren();

    const segmentosDelPrograma = direcciones["segmentos"];
    segmentosDelPrograma.forEach(segmento => {
        const nombre = segmento["nombre"];
        const paginas = segmento["paginas"];
        paginas.forEach(pagina => {
            const numPag = pagina["pagina"];
            const marco = pagina["marco"];
            const fila = document.createElement("tr");
            fila.innerHTML = `
            <td>${nombre}</td>
            <td>${numPag}</td>
            <td>${marco} (0x${componentToHex(marco).toUpperCase()})</td>
        `;
            cuerpoTabla.appendChild(fila);
        });

    });
    $("#contenedorTablaDirecciones").show();

    const nombre = programasEjecutados.find(p => p.id == idSeleccionado)?.nombre || "Desconocido";
    document.getElementById("tituloTextoDir").textContent = `Direcciones de (${idSeleccionado}) ${nombre}`;
    document.getElementById("tituloProcesoSeleccionado").style.display = "block";
    document.getElementById("contenedorTablaDirecciones").style.display = "block";

    document.getElementById("btnApagarProceso").dataset.id = idSeleccionado;
}

function llenarSegmentos() {
    const combo = document.getElementById("comboSegmentos");
    const cuerpoTabla = document.getElementById("segmentoSeleccionado");

    combo.replaceChildren();
    cuerpoTabla.replaceChildren();

    if (segmentosEjecutados.length === 0) {
        document.getElementById("selectorSegmentos").style.display = "none";
        document.getElementById("contenedorTablaSegmentoUnico").style.display = "none";
        document.getElementById("tituloSegmentoSeleccionado").style.display = "none";
        return;
    }

    document.getElementById("selectorSegmentos").style.display = "block";

    // Obtener ids únicos con nombre
    const idsUnicos = {};
    segmentosEjecutados.forEach(p => {
        if (!idsUnicos[p.id]) {
            idsUnicos[p.id] = p.nombre;
        }
    });

    for (const id in idsUnicos) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `(${id}) ${idsUnicos[id]}`;
        combo.appendChild(option);
    }

    combo.onchange = function () {
        mostrarSegmentosPorId(combo.value);
    };

    const idKeys = Object.keys(idsUnicos);
    if (idKeys.length >= 1) {
        combo.selectedIndex = 0;
        mostrarSegmentosPorId(combo.options[0].value);
    }
}

function llenarTpps() {
    const combo = document.getElementById("comboTpp");
    const cuerpoTabla = document.getElementById("tpps");

    combo.replaceChildren();
    cuerpoTabla.replaceChildren();

    if (programasTTP.length === 0) {
        document.getElementById("tituloTPP").style.display = "none";
        document.getElementById("selectorTpp").style.display = "none";
        document.getElementById("tituloTppSeleccionado").style.display = "none";
        document.querySelector(".contenedorTablaTPP").style.display = "none";
        return;
    }

    document.getElementById("tituloTPP").style.display = "block";
    document.getElementById("selectorTpp").style.display = "block";
    document.getElementById("tituloTppSeleccionado").style.display = "block";
    document.querySelector(".contenedorTablaTPP").style.display = "block";

    const idsUnicos = {};
    programasTTP.forEach(p => {
        if (!idsUnicos[p.id]) {
            idsUnicos[p.id] = p.nombre;
        }
    });

    for (const id in idsUnicos) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `(${id}) ${idsUnicos[id]}`;
        combo.appendChild(option);
    }

    combo.onchange = function () {
        mostrarTppsPorId(combo.value);
    };

    const idKeys = Object.keys(idsUnicos);
    if (idKeys.length >= 1) {
        combo.selectedIndex = 0;
        mostrarTppsPorId(combo.options[0].value);
    }
}


function mostrarTppsPorId(idProceso) {
    const cuerpoTabla = document.getElementById("tpps");
    cuerpoTabla.replaceChildren();

    const registros = programasTTP.filter(p => p.id == idProceso);

    if (registros.length === 0) return;

    // Título con nombre del proceso
    document.getElementById("tituloTppTexto").textContent = `TPP de ${registros[0].nombre} (ID: ${idProceso})`;
    document.getElementById("btnApagarTpp").setAttribute('data-id', idProceso);

    registros.forEach((programa) => {
        const nombreCompleto = `${programa.numero}.${programa.nombre}${programa.parte}`;
        const marco = determinarMarco(nombreCompleto, programa.id);

        const marcoDec = marco >= 0 ? marco : "N/A";
        const marcoHex = marco >= 0 ? componentToHex(marco) : "N/A";

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${programa.pagina}</td>
            <td>${marcoDec} / ${marcoHex}</td>
            <td>${programa.parte}</td>
        `;
        cuerpoTabla.appendChild(fila);
    });
}

function determinarMarco(nombreProceso, idProceso) {
    var segmentos = memoria.getSegmentos();
    for (let index = 0; index < segmentos.length; index++) {
        if (segmentos[index].proceso == null) {
            console.log("null");
        } else {
            if (nombreProceso === segmentos[index].proceso.nombre && idProceso === segmentos[index].proceso.id) {
                return marco = index;
            }
        }
    }

}

function limpiarMemoria() {
    var canvas = document.getElementById("memoria");
    canvas.width = canvas.width;
}

function dibujarProceso(posicionY, nombre, altura, id, posicionHex) {
    var canvas = document.getElementById("memoria");
    if (canvas.getContext) {
        var ctx = canvas.getContext("2d");

        let colorId = this.colores.findIndex(c => c.id === id);
        let r, g, b;
        if (colorId !== -1) {
            ({ r, g, b } = this.colores[colorId]);
        } else {
            r = Math.round(Math.random() * 255);
            g = Math.round(Math.random() * 255);
            b = Math.round(Math.random() * 255);
            this.colores.push({ id, r, g, b });
        }

        ctx.fillStyle = `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
        ctx.fillRect(0, posicionY, 300, altura);
        ctx.strokeRect(0, posicionY, 300, altura);

        const o = Math.round((r * 299 + g * 587 + b * 114) / 1000);
        ctx.fillStyle = o > 125 ? 'black' : 'white';

        const fontSize = Math.min(Math.max(altura * 0.4, 14), 22);
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(nombre, 150, posicionY + altura / 1.7, 280);

        ctx.textAlign = "left";
        ctx.font = "12px Arial";
        ctx.fillText(`0x${componentToHex(posicionHex).toUpperCase()}`, 5, posicionY + altura - 5);
    }
}




function dibujarMemoria(numParticiones, tipoGestionMemoria) {
    var canvas = document.getElementById("memoria");
    if (canvas.getContext) {

        var ctx = canvas.getContext("2d");
        if (tipoGestionMemoria == 4 || tipoGestionMemoria == 6) {
            var valor = 765 / numParticiones;

            for (let index = 0; index < numParticiones; index++) {
                ctx.rect(0, index * valor + 51, 300, valor);
                ctx.stroke();
            }
        } else if (tipoGestionMemoria == 3) {
            var cont = 0;

            for (let index = 0; index < numParticiones; index++) {
                ctx.rect(0, cont * 51 + 51, 300, 51 * particionesVariables[index]);
                ctx.stroke();
                cont = cont + particionesVariables[index];
            }
        }

    }
}

function activarBotones(botones) {
    for (let i = 0; i < botones.length; i++) {
        var boton = botones[i]
        boton.disabled = false;
    }
}

function agregarListener() {
    //// Empezar el programa 
    var btnEmpezar = document.getElementById("empezar");
    btnEmpezar.addEventListener("click", function () {
        var botones = document.getElementsByName("btnEncender");
        memoria = new Memoria(1048576 * 15, null);
        programasEjecutados = [];
        idProceso = 0;

        // Obtener los valores
        const bitsLogicos = Number(document.getElementById("bitsLogicos")?.value);
        const bitsSegmento = Number(document.getElementById("bitsSegmento")?.value);
        const bitspagina = Number(document.getElementById("bitsPagina")?.value);
        const bitsOffset = Number(document.getElementById("bitsOffset")?.value);

        // Validar que todos sean números válidos
        const valoresValidos =
            !isNaN(bitsLogicos) &&
            !isNaN(bitsSegmento) &&
            !isNaN(bitsOffset) &&
            !isNaN(bitspagina) &&
            bitsLogicos > 0 &&
            bitsSegmento > 0 &&
            bitspagina > 0 &&
            bitsOffset > 0;

        if (!valoresValidos) {
            alert("Por favor, ingrese valores numéricos válidos en los tres campos.");
        } else if (bitsSegmento + bitsOffset + bitspagina !== bitsLogicos) {
            alert(`La suma de bits de segmento (${bitsSegmento}), de pagina (${bitspagina}) y offset (${bitsOffset}) debe ser igual a los bits lógicos totales (${bitsLogicos}).`);
        } else {

            memoria.setMetodoSegmentacionPaginada(bitsSegmento, bitspagina, bitsOffset);
            gestionMemoria = 6; // Paginación segmentada
            llenarLibres();
            limpiarMemoria();
            dibujarProcesos();
            dibujarDiagramaMemoria();
            llenarMarcos();
            llenarTpps();
            activarBotones(botones);
            this.colores = [];
        }
    })

    //// Acción para crear un programa
    var btnNuevoPrograma = document.getElementById("nuevoPrograma");
    btnNuevoPrograma.addEventListener("click", function () {
        var name = prompt("Nombre del programa");
        var text = parseInt(prompt("Tamaño del código"));
        var data = parseInt(prompt("Tamaño de datos inicializados"));
        var bss = parseInt(prompt("Tamaño de datos sin inicializar"));

        if (name != "" && !isNaN(text) && !isNaN(data) && !isNaN(bss)) {
            programas.push({
                "nombre": name,
                "text": text,
                "data": data,
                "bss": bss,
                "stack": stack,
                "heap": heap,
                "tamano": data + text + bss + stack + heap,
            });
            llenarProgramas();
        } else {
            alert("Error en el llenado del formulario");
        }
    }, false)


    //// Acción para ejecutar programas existentes
    $('#tablaProgramas').unbind('click');
    $('#tablaProgramas').on('click', '.btnEncender', function (event) {
        var $row = $(this).closest("tr");
        var $tds = $row.find("td");

        ejecutarProceso($tds);
    });

    $('#btnApagarProceso').on('click', function (event) {
        const id = $(this).attr('data-id');
        if (!id) return;
        limpiarMemoria();
        dibujarMemoria(1, 4);

        memoria.eliminarProceso(id);
        const idNum = Number(id); // o parseInt(id)
        programasEjecutados = programasEjecutados.filter(p => p.id !== idNum);

        llenarLibres();
        llenarMarcos();
        llenarProceso();
        dibujarProcesos();
        dibujarDiagramaMemoria();

        // Vuelve a llenar el combo y la tabla
        llenarSegmentos();

        // Forzar selección del siguiente disponible (si hay)
        const combo = document.getElementById("comboSegmentos");
        if (combo.options.length > 0) {
            combo.selectedIndex = 0;
            combo.onchange(); // dispara mostrarSegmentosPorId()
        }
    });
}

function ejecutarProceso(proceso) {

    var id = ++idProceso
    var resultado = memoria.insertarProceso({
        "id": id, "bss": proceso[5].textContent,
        "data": proceso[4].textContent,
        "text": proceso[3].textContent,
        "stack": stack,
        "heap": heap,
        "nombre": proceso[0].textContent, "tamano": proceso[6].textContent
    });
    if (resultado == 1) {
        alert("Memoria insuficiente");
        return 0;
    }

    if (resultado == 0) {
        alert("Memoria llena");
        return 0;
    }

    programasEjecutados.push({
        "id": id, "bss": proceso[5].textContent,
        "data": proceso[4].textContent,
        "text": proceso[3].textContent,
        "stack": stack,
        "heap": heap,
        "nombre": proceso[0].textContent, "tamano": proceso[6].textContent
    });

    dibujarProcesos();
    llenarMarcos();
    llenarProceso();
    dibujarDiagramaMemoria();
}

function dibujarProcesos() {
    const memoriaEstatica = memoria.getSegmentos();
    const canvas = document.getElementById("memoria");
    const ctx = canvas.getContext("2d");

    const alturaBloque = 60;
    const cantidadSegmentos = memoriaEstatica.length;

    canvas.height = alturaBloque * cantidadSegmentos;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    memoriaEstatica.forEach((segmento, index) => {
        const y = canvas.height - (index + 1) * alturaBloque;

        if (segmento.proceso !== null) {
            const nombre = `(${segmento.proceso.id}) ${segmento.proceso.nombre} (${memoria.tamPag})`;
            dibujarProceso(y, nombre, alturaBloque, segmento.proceso.id, segmento.posicion);
        } else {
            const nombre = `Libre (${segmento.tamano})`;
            dibujarProceso(y, nombre, alturaBloque, `libre-${segmento.posicion}`, segmento.posicion);
        }
    });

    dibujarDiagramaMemoria();
}




let historialUsoMemoria = [];

function calcularUsoMemoria() {
    const total = 15 * 1048576;
    const libre = memoria.getMemoriaDisponible();
    const usado = total - libre;
    return (usado / total) + 1048576;
}

function dibujarDiagramaMemoria() {
    const canvas = document.getElementById("chartMemoria");
    if (!canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = 800;
    const height = canvas.height = 300;

    // Agrega el valor actual al historial
    historialUsoMemoria.push(calcularUsoMemoria());
    if (historialUsoMemoria.length > 100) {
        historialUsoMemoria.shift(); // mantener máximo 100 puntos
    }

    ctx.clearRect(0, 0, width, height);

    // Dibujar fondo
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, width, height);

    // Dibujar línea
    ctx.beginPath();
    ctx.moveTo(0, height * (1 - historialUsoMemoria[0]));
    for (let i = 1; i < historialUsoMemoria.length; i++) {
        const x = (i / 100) * width;
        const y = height * (1 - historialUsoMemoria[i]);
        ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#3498db";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Etiquetas
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.fillText("Uso de Memoria (%)", 10, 20);
}


function generarColor(id) {
    // Generar un color consistente basado en el ID del proceso
    var hash = 0;
    for (var i = 0; i < id.toString().length; i++) {
        hash = id.toString().charCodeAt(i) + ((hash << 5) - hash);
    }

    var color = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }

    return color;
}

function init() {
    llenarProgramas();
    agregarListener();
}

setInterval(() => {
    dibujarDiagramaMemoria();
}, 1000); // cada 1 segundo

init();

let chart;
let datosMemoria = {
    labels: Array.from({ length: 50 }, (_, i) => ""), // etiquetas vacías
    datasets: [{
        label: 'Uso de memoria',
        data: [],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderWidth: 2,
        tension: 0.3,
    }]
};

function iniciarGraficaMemoria() {
    const ctx = document.getElementById("chartMemoria").getContext("2d");
    chart = new Chart(ctx, {
        type: 'line',
        data: datosMemoria,
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 1,
                    ticks: {
                        callback: value => `${Math.round(value * 100)}%`
                    },
                    title: {
                        display: true,
                        text: 'Uso de memoria (%)'
                    }
                },
                x: {
                    display: false
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Calcula uso de memoria actual
function obtenerUsoMemoria() {
    const total = 16 * 1048576;
    const libre = memoria.getMemoriaDisponible();
    return (total - libre) / total;
}

// Actualiza la gráfica cada segundo
setInterval(() => {
    const uso = obtenerUsoMemoria();

    datosMemoria.datasets[0].data.push(uso);
    if (datosMemoria.datasets[0].data.length > 50) {
        datosMemoria.datasets[0].data.shift();
    }

    chart.update();
}, 1000);

iniciarGraficaMemoria();
