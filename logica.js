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

function mostrarTablasSeg(mostrar) {
    if (mostrar) {
        $("#tituloEjecutados").hide();
        $(".contenedorTablaEjecutados").hide();

        $("#tituloSegmentacion").show();
        $("#tablaSegemetnos").show();
        $(".contenedorTablaSegmentos").show();
        $("#tituloLibres").show();
        $("#tablaLibres").show();
        $(".contenedorTablaLibres").show();

        $("#tituloMarcos").hide();
        $("#tablaMarcos").hide();
        $(".contenedorTablaMarcos").hide();
        $("#tituloTPP").hide();
        $("#tablaTPP").hide();
        $(".contenedorTablaTPP").hide();
    } else {
        $("#tituloEjecutados").show();
        $(".contenedorTablaEjecutados").show();

        $("#tituloSegmentacion").hide();
        $("#tablaSegemetnos").hide();
        $(".contenedorTablaSegmentos").hide();
        $("#tituloLibres").hide();
        $("#tablaLibres").hide();
        $(".contenedorTablaLibres").hide();
    }
}

function mostrarTablasPag(mostrar) {
    if (mostrar) {
        $("#tituloEjecutados").hide();
        $(".contenedorTablaEjecutados").hide();

        $("#tituloSegmentacion").hide();
        $("#tablaSegemetnos").hide();
        $(".contenedorTablaSegmentos").hide();
        $("#tituloLibres").hide();
        $("#tablaLibres").hide();
        $(".contenedorTablaLibres").hide();

        $("#tituloMarcos").show();
        $("#tablaMarcos").show();
        $(".contenedorTablaMarcos").show();
        $("#tituloTPP").show();
        $("#tablaTPP").show();
        $(".contenedorTablaTPP").show();
    } else {
        $("#tituloEjecutados").show();
        $(".contenedorTablaEjecutados").show();

        $("#tituloMarcos").hide();
        $("#tablaMarcos").hide();
        $(".contenedorTablaMarcos").hide();
        $("#tituloTPP").hide();
        $("#tablaTPP").hide();
        $(".contenedorTablaTPP").hide();
    }
}

function removeItemFromArr(arr, item) {
    return arr.filter(function (e) {
        return e.id != item;
    });
};

function llenarEjecutados() {
    document.getElementById("ejecucion").replaceChildren();
    for (let i = 0; i < programasEjecutados.length; i++) {
        const programa = programasEjecutados[i];

        var fila = "<tr><td>" + programa.id + "</td><td>" + programa.nombre + "</td><td>" + programa.tamano + "</td><td>0x" + programa.posicion + "</td><td><button class='btn btnApagar'" + " value='" + i + "'>Terminar</button>" + "</td></tr>";

        var btn = document.createElement("TR");
        btn.innerHTML = fila;
        document.getElementById("ejecucion").appendChild(btn);
    };
}

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
    document.getElementById("tpps").replaceChildren();

    for (let i = 0; i < programasTTP.length; i++) {
        const programa = programasTTP[i];
        console.log(programasTTP);
        var marco = determinarMarco(programa.nombre, programa.id);

        var fila = "<tr><td>" + programa.id + "</td><td>" + programa.nombre + "</td><td>" + programa.pagina + "</td><td>" + componentToHex(marco) + "</td><td>" + "<button class='btn btnApagar'" + " value='" + i + "'>Apagar</button>" + "</tr>";

        var btn = document.createElement("TR");
        btn.innerHTML = fila;
        document.getElementById("tpps").appendChild(btn);
    }
}

function determinarMarco(nombreProceso, idProceso) {

    var segmentos = memoria.getSegmentos();
    var marco = 0;

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
        var seleccionAjuste = $('input:radio[name=ordenamiento]:checked').val();
        var botones = document.getElementsByName("btnEncender");
        memoria = new Memoria(1048576 * 15, null);
        programasEjecutados = [];
        llenarEjecutados();
        idProceso = 0;

        switch (gestionMemoria) {

            case 1:
                if (seleccionAjuste != undefined) {
                    limpiarMemoria();
                    dibujarMemoria(1, 4);

                    activarBotones(botones);
                } else {
                    alert("Debe seleccionar un tipo de ajuste");
                }
                break;
            case 2:
                if (seleccionAjuste != undefined) {
                    limpiarMemoria();
                    dibujarMemoria(1, 4);

                    activarBotones(botones);
                } else {
                    alert("Debe seleccionar un tipo de ajuste");
                }
                break;
            case 3:
                if (seleccionAjuste != undefined) {
                    limpiarMemoria();
                    dibujarMemoria(particionesVariables.length, gestionMemoria);

                    memoria.setMetodoVariable(particionesVariables);


                    activarBotones(botones);
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

                    activarBotones(botones);
                } else {
                    alert("Debe ingresar el número de particiones")
                }
                break;
            case 5:
                if (seleccionAjuste != undefined) {
                    // Obtener los valores
                    const bitsLogicos = Number(document.getElementById("bitsLogicos")?.value);
                    const bitsSegmento = Number(document.getElementById("bitsSegmento")?.value);
                    const bitsOffset = Number(document.getElementById("bitsOffset")?.value);

                    // Validar que todos sean números válidos
                    const valoresValidos =
                        !isNaN(bitsLogicos) &&
                        !isNaN(bitsSegmento) &&
                        !isNaN(bitsOffset) &&
                        bitsLogicos > 0 &&
                        bitsSegmento > 0 &&
                        bitsOffset > 0;

                    if (!valoresValidos) {
                        alert("Por favor, ingrese valores numéricos válidos en los tres campos.");
                        break;
                    }

                    // Validar que la suma sea coherente
                    if (bitsSegmento + bitsOffset !== bitsLogicos) {
                        alert(`La suma de bits de segmento (${bitsSegmento}) y offset (${bitsOffset}) debe ser igual a los bits lógicos totales (${bitsLogicos}).`);
                        break;
                    }

                    // Si todo está correcto, aplicar
                    memoria.setMetodoSegmentacion(bitsSegmento, bitsOffset);
                    activarBotones(botones);
                } else {
                    alert("Debe seleccionar un tipo de ajuste");
                }
                break;

            case 6:
                // Obtener los valores
                const bitsLogicos = Number(document.getElementById("bitsLogicos")?.value);
                const bitsSegmento = Number(document.getElementById("bitsSegmento")?.value);
                const bitsOffset = Number(document.getElementById("bitsOffset")?.value);

                // Validar que todos sean números válidos
                const valoresValidos =
                    !isNaN(bitsLogicos) &&
                    !isNaN(bitsSegmento) &&
                    !isNaN(bitsOffset) &&
                    bitsLogicos > 0 &&
                    bitsSegmento > 0 &&
                    bitsOffset > 0;

                if (!valoresValidos) {
                    alert("Por favor, ingrese valores numéricos válidos en los tres campos.");
                    break;
                }

                // Validar que la suma sea coherente
                if (bitsSegmento + bitsOffset !== bitsLogicos) {
                    alert(`La suma de bits de segmento (${bitsSegmento}) y offset (${bitsOffset}) debe ser igual a los bits lógicos totales (${bitsLogicos}).`);
                    break;
                }

                limpiarMemoria();

                memoria.setMetodoPaginacion(bitsSegmento, bitsOffset);
                llenarMarcos();
                activarBotones(botones);
                break;
            default:
                alert("Debe seleccionar un método de gestión de memoria");
                limpiarMemoria();
        }
        dibujarProcesos();
        dibujarDiagramaMemoria();
        this.colores = [];
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

    //// Detener programas en ejecución segmentacion
    $('#btnApagarSegmento').on('click', function (event) {
        const id = $(this).attr('data-id');
        if (!id) return;
        console.log(id);
        limpiarMemoria();
        dibujarMemoria(1, 4);

        memoria.eliminarProcesoPag(id);
        segmentosEjecutados = removeItemFromArr(segmentosEjecutados, id);

        llenarLibres();
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


    //// Detener programas en ejecución paginación
    $('#tablaTPP').on('click', '.btnApagar', function (event) {
        limpiarMemoria();

        var tamPagina = document.getElementsByName("tamanoPagina");
        const mega = 1048576;
        var cantParticiones = (mega * 15) / tamPagina[0].value;

        dibujarMemoria(cantParticiones, gestionMemoria);

        var $row = $(this).closest("tr"),
            $tds = $row.find("td");

        memoria.eliminarProcesoPag($tds[0].textContent);

        programasTTP = removeItemFromArr(programasTTP, $tds[0].textContent);

        for (let index = 0; index < programasTTP.length; index++) {
            const element = programasTTP[index];
            var proceso = memoria.getProceso(element.id);
            element.posicion = proceso[0].posicion;
        }

        llenarMarcos();

        llenarTpps();

        dibujarProcesos();
        dibujarDiagramaMemoria();
    })

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

        var $row = $(this).closest("tr"),
            $tds = $row.find("td");
        console.log($tds[0].textContent, $tds[1].textContent);
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
                mostrarTablasPag(false);
                mostrarTablasSeg(false);

                ordenamiento[0].disabled = false;
                ordenamiento[1].disabled = false;
                ordenamiento[2].disabled = false;
                break;
            case "2":
                console.log("Particionamiento Dinamico Sin Compactacion");
                gestionMemoria = 2;
                $("#contMetodos").hide();
                $(".ordenamiento").show();
                mostrarTablasPag(false);
                mostrarTablasSeg(false);

                ordenamiento[0].disabled = false;
                ordenamiento[1].disabled = false;
                ordenamiento[2].disabled = false;
                break;
            case "3":
                console.log("Particionamiento Estatico Variable");
                gestionMemoria = 3;
                $("#contMetodos").show();
                $(".ordenamiento").show();
                mostrarTablasPag(false);
                mostrarTablasSeg(false);

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
                mostrarTablasPag(false);
                mostrarTablasSeg(false);

                document.getElementById("contMetodos").replaceChildren();
                const particion = "<input type='text' name='cantidadParticiones' id = 'cantidadParticiones' autocomplete='off' placeholder='Número de particiones'>" + "</input>";
                var btn = document.createElement("DIV");
                btn.innerHTML = particion;
                document.getElementById("contMetodos").appendChild(btn);

                ordenamiento[0].disabled = true;
                ordenamiento[1].disabled = true;
                ordenamiento[2].disabled = true;

                break;
            case "5":
                console.log("Segmentacion");
                gestionMemoria = 5;
                $("#contMetodos").show();
                $(".ordenamiento").show();
                mostrarTablasPag(false);
                mostrarTablasSeg(true);

                document.getElementById("contMetodos").replaceChildren();

                camposSegmentacion = `
      <div>
        <label for="bitsLogicos">Bits lógicos totales:</label>
        <input type="number" id="bitsLogicos" value="24" autocomplete="off" />
      </div>
      <div>
        <label for="bitsSegmento">Bits para número de segmento:</label>
        <input type="number" id="bitsSegmento" value="5" autocomplete="off" />
      </div>
      <div>
        <label for="bitsOffset">Bits para offset:</label>
        <input type="number" id="bitsOffset" value="19" autocomplete="off" />
      </div>
    `;

                divSeg = document.createElement("DIV");
                divSeg.innerHTML = camposSegmentacion;
                document.getElementById("contMetodos").appendChild(divSeg);

                ordenamiento[0].disabled = false;
                ordenamiento[1].disabled = false;
                ordenamiento[2].disabled = false;

                break;
            case "6":
                console.log("Paginacion");
                gestionMemoria = 6;
                $("#contMetodos").show();
                $(".ordenamiento").hide();
                mostrarTablasSeg(false);
                mostrarTablasPag(true);

                document.getElementById("contMetodos").replaceChildren();

                camposSegmentacion = `
      <div>
        <label for="bitsLogicos">Bits lógicos totales:</label>
        <input type="number" id="bitsLogicos" value="32" autocomplete="off" />
      </div>
      <div>
        <label for="bitsSegmento">Bits para número de segmento:</label>
        <input type="number" id="bitsSegmento" value="16" autocomplete="off" />
      </div>
      <div>
        <label for="bitsOffset">Bits para offset:</label>
        <input type="number" id="bitsOffset" value="16" autocomplete="off" />
      </div>
    `;

                divSeg = document.createElement("DIV");
                divSeg.innerHTML = camposSegmentacion;
                document.getElementById("contMetodos").appendChild(divSeg);

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
        "id": idProceso + 1, "bss": proceso[5].textContent,
        "data": proceso[4].textContent,
        "text": proceso[3].textContent,
        "stack": stack,
        "heap": heap,
        "nombre": proceso[0].textContent, "tamano": proceso[6].textContent
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
            "id": idProceso, "nombre": proceso[0].textContent, "tamano": proceso[6].textContent, "posicion": procesoGuardado[0].posicion
        });
        llenarEjecutados();
    }

    if (gestionMemoria == 5) {
        var procesoGuardado = memoria.getProceso(idProceso + 1);

        idProceso += 1;
        procesoGuardado.forEach(procesog => {
            var parte = procesog.proceso.nombre.split(".")
            segmentosEjecutados.push({ "id": idProceso, "numero": parte[0], "nombre": parte[1], "parte": "."+parte[2], "tamano": procesog.tamano, "posicion": procesog.posicion });
        });
        llenarSegmentos();
        llenarLibres();
    }

    if (gestionMemoria == 6) {
        var procesoGuardado = memoria.getProceso(idProceso + 1);
        idProceso += 1;
        llenarMarcos();

        for (let index = 0; index < procesoGuardado.length; index++) {
            programasTTP.push({ "id": procesoGuardado[index].proceso.id, "nombre": procesoGuardado[index].proceso.nombre, "pagina": index });
        }
        llenarTpps();
    }

    dibujarProcesos();
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
            const nombre = `(${segmento.proceso.id}) ${segmento.proceso.nombre} (${segmento.proceso.tamano})`;
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
    const total = 15 * 1048576;
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
