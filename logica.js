var programas = [{
    "nombre": "Word",
    "tamano": 1048576,
    "bss": 165,
    "data": 244986,
    "text": 803425,
},
{
    "nombre": "Excel",
    "tamano": 1048576 * 2,
    "bss": 256,
    "data": 893772,
    "text": 1203124,
},
{
    "nombre": "NetBeans",
    "tamano": 1048576 * 3,
    "bss": 460,
    "data": 1025223,
    "text": 2120045,
},
{
    "nombre": "Sublime Text",
    "tamano": 1048576 / 2,
    "bss": 80,
    "data": 238860,
    "text": 285348,
},
{
    "nombre": "Android Studio",
    "tamano": 1048576 * 6,
    "bss": 1123,
    "data": 1892119,
    "text": 4398214,
},
]

var particionesVariables = [1, 2, 2, 3, 3, 4]
var gestionMemoria = 0;
var programasEjecutados = [];
var segmentosEjecutados = [];
var memoria = new Memoria();
var idProceso = 0;
var colores = [];
var listaMemoria = [];

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function llenarProgramas() {
    document.getElementById("programas").replaceChildren();
    for (let i = 0; i < programas.length; i++) {
        const programa = programas[i];

        var fila = "<tr><td>" + programa.nombre + "</td><td>" + programa.text + "</td><td>" + programa.data + "</td><td>" + programa.bss + "</td><td>" + programa.tamano + "</td></tr>";

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

function llenarLibres() {
    document.getElementById("libres").replaceChildren();

    var segmentos = memoria.getSegmentosLibres();
    for (let i = 0; i < segmentos.length; i++) {
        var fila = "<tr><td>" + segmentos[i].tamano + "</td><td>0x" + segmentos[i].posicion + "</td></tr>";

        var btn = document.createElement("TR");
        btn.innerHTML = fila;
        document.getElementById("libres").appendChild(btn);
    };
}

function limpiarMemoria() {
    var canvas = document.getElementById("memoria");
    canvas.width = canvas.width;
}

function dibujarProceso(posicionHex, nombre, tamano, id) {
    var canvas = document.getElementById("memoria");
    if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        /// 51px = 1048576 bytes = 1 MiB
        /// 51*tamaño/1024*1024
        var posicion = 51 * parseInt(componentToHex(posicionHex), 16) / 1048576;
        var altura = 51 * tamano / 1048576;

        // Fondo
        var colorId = null;
        for (let index = 0; index < this.colores.length; index++) {
            const element = this.colores[index];
            if (element.id == id) {
                colorId = index
            }
        }

        if (colorId != null) {
            var r = this.colores[colorId].r;
            var g = this.colores[colorId].g;
            var b = this.colores[colorId].b;
        } else {
            var r = Math.round(Math.random() * 255);
            var g = Math.round(Math.random() * 255);
            var b = Math.round(Math.random() * 255);
            this.colores.push({ "id": id, "r": r, "g": g, "b": b });
        }

        ctx.fillStyle = "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        ctx.fillRect(0, posicion, 300, altura);

        // Texto
        ctx.font = "20px Arial";
        ctx.textAlign = "center";

        var o = Math.round(((parseInt(r) * 299) + (parseInt(g) * 587) + (parseInt(b) * 114)) / 1000);
        if (o > 125) {
            ctx.fillStyle = 'black';
        } else {
            ctx.fillStyle = 'white';
        }

        ctx.strokeRect(0, posicion, 300, altura);
        ctx.fillText(nombre, 150, posicion + altura / 1.5, 300);
    }
}

function generarTabla() {
    const tiempos = parseInt(document.getElementById("tiempos").value);
    const contenedor = document.getElementById("contenedorTabla");

    let tabla = document.createElement("table");
    tabla.className = "tabla tablaTiempos";

    // Encabezado
    let thead = document.createElement("thead");
    let filaEncabezado = document.createElement("tr");
    filaEncabezado.appendChild(document.createElement("th")); // Celda vacía

    for (let i = 1; i <= tiempos; i++) {
        let th = document.createElement("th");
        th.textContent = "t" + i;
        filaEncabezado.appendChild(th);
    }
    thead.appendChild(filaEncabezado);
    tabla.appendChild(thead);

    // Cuerpo de tabla
    let tbody = document.createElement("tbody");
    programas.forEach(proceso => {
        let fila = document.createElement("tr");

        let th = document.createElement("th");
        th.textContent = proceso.nombre;
        fila.appendChild(th);

        for (let t = 0; t < tiempos; t++) {
            let td = document.createElement("td");
            td.classList.add("inactivo");
            td.dataset.estado = "off";
            td.dataset.orden = "";
            td.dataset.columna = t;

            td.onclick = function () {
                if (td.dataset.estado === "off") {
                    // Activar el cuadro
                    td.dataset.estado = "on";
                    td.classList.remove("inactivo");
                    td.classList.add("activo");
                } else {
                    // Desactivar este cuadro y todos los posteriores de la fila
                    td.dataset.estado = "off";
                    td.classList.remove("activo");
                    td.classList.add("inactivo");
                    td.textContent = "";

                    // Desactivar posteriores en la fila
                    let fila = td.parentElement;
                    let columna = parseInt(td.dataset.columna);
                    for (let col = columna + 1; col < tiempos; col++) {
                        let siguienteTd = fila.cells[col + 1]; // +1 porque la primera celda es nombre
                        if (siguienteTd.dataset.estado === "on") {
                            siguienteTd.dataset.estado = "off";
                            siguienteTd.classList.remove("activo");
                            siguienteTd.classList.add("inactivo");
                            siguienteTd.dataset.orden = "";
                            siguienteTd.textContent = "";
                        }
                    }
                }

                // Actualizar la columna actual y todas las posteriores para mantener consistencia
                for (let col = 0; col < tiempos; col++) {
                    actualizarOrdenColumna(tabla, col);
                }
            };

            fila.appendChild(td);
        }
        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    contenedor.innerHTML = "";
    contenedor.appendChild(tabla);
    document.getElementById("btnMostrarTabla").style.display = "inline-block";
}

const numerosAsignadosPorColumna = {}; // global o en scope adecuado

function actualizarOrdenColumna(tabla, indiceColumna) {
    if (!numerosAsignadosPorColumna[indiceColumna]) {
        numerosAsignadosPorColumna[indiceColumna] = {};
    }

    const asignados = numerosAsignadosPorColumna[indiceColumna];
    const usados = new Set();

    // Primero: detectar cuáles números ya están asignados para reservarlos
    for (let i = 1; i < tabla.rows.length; i++) {
        const fila = tabla.rows[i];
        const td = fila.cells[indiceColumna + 1];
        const nombreFila = fila.cells[0].textContent;

        if (td.dataset.estado === "on") {
            const tdAnterior = indiceColumna > 0 ? fila.cells[indiceColumna] : null;

            const esContinuidad =
                tdAnterior &&
                tdAnterior.dataset.estado === "on" &&
                (tdAnterior.dataset.orden === "x" || /^x\d+$/.test(tdAnterior.dataset.orden));

            if (esContinuidad) {
                // continuidad: solo "x"
                td.dataset.orden = "x";
                td.textContent = "x";

                // Si tenía número asignado, liberarlo
                if (asignados[nombreFila]) {
                    delete asignados[nombreFila];
                }
            } else {
                // No continuidad: tiene que tener número asignado
                if (asignados[nombreFila]) {
                    // conserva el número asignado
                    usados.add(asignados[nombreFila]);
                    td.dataset.orden = "x" + asignados[nombreFila];
                    td.textContent = td.dataset.orden;
                } else {
                    // aún no tiene número asignado, dejamos para asignar después
                    td.dataset.orden = ""; 
                    td.textContent = "";
                }
            }
        } else {
            // apagado: limpiar
            if (asignados[nombreFila]) {
                delete asignados[nombreFila];
            }
            td.dataset.orden = "";
            td.textContent = "";
        }
    }

    // Segundo: asignar números nuevos a filas activas sin número
    let siguienteNumero = 1;
    for (let i = 1; i < tabla.rows.length; i++) {
        const fila = tabla.rows[i];
        const td = fila.cells[indiceColumna + 1];
        const nombreFila = fila.cells[0].textContent;

        if (td.dataset.estado === "on" && td.dataset.orden === "") {
            // buscar siguiente número disponible
            while (usados.has(siguienteNumero)) {
                siguienteNumero++;
            }

            asignados[nombreFila] = siguienteNumero;
            td.dataset.orden = "x" + siguienteNumero;
            td.textContent = td.dataset.orden;
            usados.add(siguienteNumero);
            siguienteNumero++;
        }
    }
}


function simular() {
    const tabla = document.querySelector(".tablaTiempos");

    if (!tabla) {
        console.warn("No se ha generado la tabla aún.");
        return;
    }

    // 1. Limpiar canvas, imágenes anteriores y select
    limpiarSimulacionAnterior();

    // 2. Obtener estructura de tiempos desde la tabla
    const jsonResultado = extraerTiemposDesdeTabla(tabla);

    // 3. Procesar los snapshots y redibujar por cada tiempo
    procesarSnapshots(jsonResultado);

    console.log("Resultado de la simulación:", JSON.stringify(jsonResultado, null, 2));
}

function limpiarSimulacionAnterior() {
    memoria = new Memoria();
    limpiarCanvas(); // Limpiar el canvas
    imagenesMemoria = []; // Reiniciar lista de imágenes

    const selector = document.getElementById("selectorTiempos");
    if (selector) selector.innerHTML = "";

    document.getElementById("selectorTiempos").style.display = "none";
    document.getElementById("lbSelectorTiempos").style.display = "none";
}

function extraerTiemposDesdeTabla(tabla) {
    const jsonResultado = {};
    const encabezados = tabla.rows[0].cells;

    // Inicializar claves t1, t2, ...
    for (let i = 1; i < encabezados.length; i++) {
        const tiempo = encabezados[i].textContent.trim();
        jsonResultado[tiempo] = [];
    }

    // Recorrer filas de procesos
    for (let i = 1; i < tabla.rows.length; i++) {
        const fila = tabla.rows[i];
        const nombreProceso = fila.cells[0].textContent.trim();

        for (let j = 1; j < fila.cells.length; j++) {
            const celda = fila.cells[j];
            const valor = celda.textContent.trim();
            if (valor !== "") {
                const tiempo = encabezados[j].textContent.trim();
                jsonResultado[tiempo].push({
                    proceso: nombreProceso,
                    valor: valor
                });
            }
        }
    }

    return jsonResultado;
}

function procesarSnapshots(tiemposMemoria) {
    const selector = document.getElementById("selectorTiempos");

    iniciarMemoria();

    listaMemoria = []; // Limpiar lista de memorias anteriores
    let procesosActivos = [];

    for (let tiempo in tiemposMemoria) {
        const procesosTiempo = tiemposMemoria[tiempo];
        const nombresActuales = procesosTiempo.map(p => p.proceso);
        const nuevosProcesos = [];
        const continuos = [];

        procesosTiempo.forEach(p => {
            if (p.valor === "x") continuos.push(p.proceso);
            else nuevosProcesos.push(p);
        });

        // Eliminar los procesos que ya no están en este tiempo
        const procesosEnMemoria = memoria.getProcesos();
        procesosEnMemoria.forEach(proc => {
            if (!nombresActuales.includes(proc.nombre)) {
                memoria.eliminarProceso(proc.id, proc.nombre, gestionMemoria);
            }
        });

        // Agregar nuevos procesos por orden x1, x2...
        nuevosProcesos.sort((a, b) => {
            const na = parseInt(a.valor.replace("x", ""));
            const nb = parseInt(b.valor.replace("x", ""));
            return na - nb;
        });

        nuevosProcesos.forEach(p => {
            const def = programas.find(pr => pr.nombre === p.proceso);
            if (def) {
                const id = ++idProceso;
                const nuevo = new Proceso(id, def.nombre, def.bss, def.data, def.text, def.tamano);
                const seleccionAjuste = $('input:radio[name=ordenamiento]:checked').val();
                memoria.insertarProceso(nuevo, gestionMemoria, seleccionAjuste);

                programasEjecutados.push({
                    id,
                    nombre: def.nombre,
                    tamano: def.tamano,
                    posicion: null
                });
            }
        });

        // Actualizar procesos activos
        procesosActivos = nombresActuales;

        // Guardar copia profunda del estado actual de la memoria
        listaMemoria.push({
            tiempo: tiempo,
            memoria: clonarMemoria(memoria)
        });
    }
    console.log("Lista de memorias:", listaMemoria);
    // Llenar selector
    llenarSelectTiempos(listaMemoria);
    //llenarSelectTiempos(imagenesMemoria);
    selector.style.display = "inline-block";
    document.getElementById("lbSelectorTiempos").style.display = "inline-block";
}

function clonarMemoria(memoriaOriginal) {
    const copia = new Memoria(0);
    copia.segmentos = JSON.parse(JSON.stringify(memoriaOriginal.segmentos));
    return copia;
}

function iniciarMemoria() {
    var seleccionAjuste = $('input:radio[name=ordenamiento]:checked').val();
    memoria = new Memoria(1048576 * 15, null);
    programasEjecutados = [];
    idProceso = 0;
    
    switch (gestionMemoria) {

        case 1:
            if (seleccionAjuste != undefined) {
                limpiarMemoria();
                dibujarMemoria(1, 4);
            } else {
                alert("Debe seleccionar un tipo de ajuste");
            }
            break;
        case 2:
            if (seleccionAjuste != undefined) {
                limpiarMemoria();
                dibujarMemoria(1, 4);
            } else {
                alert("Debe seleccionar un tipo de ajuste");
            }
            break;
        case 3:
            if (seleccionAjuste != undefined) {
                limpiarMemoria();
                dibujarMemoria(particionesVariables.length, gestionMemoria);

                memoria.setMetodoVariable(particionesVariables);
            } else {
                alert("Debe seleccionar un tipo de ajuste");
            }
            break;
        case 4:
            var cantParticion = document.getElementsByName("cantidadParticiones");
            limpiarMemoria();
            if (cantParticion[0].value != "") {
                dibujarMemoria(cantParticion[0].value, gestionMemoria);

                memoria.setMetodoFija(parseInt(cantParticion[0].value));

                
            } else {
                alert("Debe ingresar el número de particiones")
            }
            break;
        default:
            alert("Debe seleccionar un método de gestión de memoria");
            limpiarMemoria();
    }
    this.colores = [];
}

function llenarSelectTiempos(imagenes) {
    const select = document.getElementById("selectorTiempos");
    select.innerHTML = "";

    imagenes.forEach((imagen, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = imagen.tiempo;
        select.appendChild(option);
    });

    // Mostrar la primera imagen al cargar
    if (imagenes.length > 0) {
        mostrarImagen(0);
    }
}

function limpiarCanvas() {
    const canvas = document.getElementById("memoria");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function dibujarMemoria(numParticiones, tipoGestionMemoria) {
    var canvas = document.getElementById("memoria");
    if (canvas.getContext) {

        var ctx = canvas.getContext("2d");
        if (tipoGestionMemoria == 4) {
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

    document.getElementById("selectorTiempos").addEventListener("change", function () {
        const index = this.value;
        mostrarImagen(index);
    });

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
                "tamano": data + text + bss,
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

    //// Detener prorgamas en ejecución
    $('#tablaEjecutados').unbind('click');
    $('#tablaEjecutados').on('click', '.btnApagar', function (event) {
        limpiarMemoria();
        switch (gestionMemoria) {
            case 1:
                dibujarMemoria(1, 4);
                break;
            case 2:
                dibujarMemoria(1, 4);
                break;
            case 3:
                dibujarMemoria(particionesVariables.length, gestionMemoria);
                break;
            case 4:
                var cantParticion = document.getElementsByName("cantidadParticiones");
                dibujarMemoria(cantParticion[0].value, gestionMemoria);
                break;
        }
        dibujarProceso("000000", "SO", 1048576);

        var $row = $(this).closest("tr"),
            $tds = $row.find("td");

        memoria.eliminarProceso($tds[0].textContent, $tds[1].textContent, gestionMemoria);

        programasEjecutados = removeItemFromArr(programasEjecutados, $tds[0].textContent);

        for (let index = 0; index < programasEjecutados.length; index++) {
            const element = programasEjecutados[index];
            var proceso = memoria.getProceso(element.id);
            element.posicion = proceso[0].posicion;
        }

        llenarEjecutados();
        dibujarProcesos();
    });

    //// Selección de método de gestión de memoria
    var optMetodo = document.getElementById("selecProgramas");
    optMetodo.addEventListener("click", function () {
        var ordenamiento = document.getElementsByName("ordenamiento");
        switch (optMetodo.value) {
            case "1":
                console.log("Particionamiento Dinamico Con Compactacion");
                gestionMemoria = 1;
                $("#contMetodos").hide();
                $(".ordenamiento").show();

                ordenamiento[0].disabled = false;
                ordenamiento[1].disabled = false;
                ordenamiento[2].disabled = false;
                break;
            case "2":
                console.log("Particionamiento Dinamico Sin Compactacion");
                gestionMemoria = 2;
                $("#contMetodos").hide();
                $(".ordenamiento").show();

                ordenamiento[0].disabled = false;
                ordenamiento[1].disabled = false;
                ordenamiento[2].disabled = false;
                break;
            case "3":
                console.log("Particionamiento Estatico Variable");
                gestionMemoria = 3;
                $("#contMetodos").show();
                $(".ordenamiento").show();

                document.getElementById("contMetodos").replaceChildren();
                for (let i = 0; i < particionesVariables.length; i++) {

                    var fila = "<li>" + particionesVariables[i] + " Megabit" + "</li>";
                    var btn = document.createElement("LI");
                    btn.innerHTML = fila;
                    document.getElementById("contMetodos").appendChild(btn);
                }

                ordenamiento[0].disabled = false;
                ordenamiento[1].disabled = false;
                ordenamiento[2].disabled = false;

                break;
            case "4":
                console.log("Particionamiento Estatico Fijo");
                gestionMemoria = 4;
                $(".ordenamiento").hide();
                $("#contMetodos").show();

                document.getElementById("contMetodos").replaceChildren();
                const particion = "<input type='text' name='cantidadParticiones' id = 'cantidadParticiones' autocomplete='off' placeholder='Número de particiones'>" + "</input>";
                var btn = document.createElement("DIV");
                btn.innerHTML = particion;
                document.getElementById("contMetodos").appendChild(btn);

                ordenamiento[0].disabled = true;
                ordenamiento[1].disabled = true;
                ordenamiento[2].disabled = true;

                break;
            default:
                $(".ordenamiento").hide();
                $("#contMetodos").hide();
                console.log("No se ha seleccionado el método de gestión de memoria");
                break;

        }
    }, false);
}

function ejecutarProceso(proceso) {
    var seleccionAjuste = $('input:radio[name=ordenamiento]:checked').val();

    var resultado = memoria.insertarProceso({
        "id": idProceso + 1, "bss": proceso[3].textContent,
        "data": proceso[2].textContent,
        "text": proceso[1].textContent,
        "nombre": proceso[0].textContent, "tamano": proceso[4].textContent
    }, gestionMemoria, seleccionAjuste);

    if (resultado == 1) {
        alert("Memoria insuficiente");
        return 0;
    }

    if (resultado == 0) {
        alert("Memoria llena");
        return 0;
    }

    if (gestionMemoria != 5 && gestionMemoria != 6) {
        var procesoGuardado = memoria.getProceso(idProceso + 1);

        idProceso += 1;
        programasEjecutados.push({
            "id": idProceso, "nombre": proceso[0].textContent, "tamano": proceso[4].textContent, "posicion": procesoGuardado[0].posicion
        });
        llenarEjecutados();
    }

    dibujarProcesos();
}

function dibujarProcesos() {
    var memoriaEstatica = memoria.getSegmentos();

    memoriaEstatica.forEach(segmento => {
        if (segmento.proceso !== null) {
            dibujarProceso(segmento.posicion, "(" + segmento.proceso.id + ")" + segmento.proceso.nombre, segmento.proceso.tamano, segmento.proceso.id);
        }
    });
}

function mostrarImagen(index) {
    const tiempoSeleccionado = listaMemoria[index];
    if (!tiempoSeleccionado) return;

    const memoriaSnapshot = tiempoSeleccionado.memoria;

    limpiarCanvas();

    // Dibuja la memoria base según tipo de gestión
    let numParticiones = 0;
    switch (gestionMemoria) {
        case 1:
        case 2:
            numParticiones = 1;
            break;
        case 3:
            numParticiones = particionesVariables.length;
            break;
        case 4:
            const cantParticion = document.getElementsByName("cantidadParticiones")[0].value;
            numParticiones = parseInt(cantParticion);
            break;
    }

    dibujarMemoria(numParticiones, gestionMemoria);
    dibujarProceso("000000", "SO", 1048576);
    // Dibujar los procesos en ese tiempo
    memoriaSnapshot.segmentos.forEach(seg => {
        if (seg.proceso) {
            dibujarProceso(
                seg.posicion,
                "(" + seg.proceso.id + ")" + seg.proceso.nombre,
                seg.proceso.tamano,
                seg.proceso.id
            );
        }
    });
}


function init() {
    llenarProgramas();
    agregarListener();
}

init();