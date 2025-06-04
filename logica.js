var programas = [
    {
        nombre: "Notepad",
        text: 19524,
        data: 12352,
        bss: 1165,
        tamano: 19524 + 12352 + 1165
    },
    {
        nombre: "Word",
        text: 77539,
        data: 32680,
        bss: 4100,
        tamano: 77539 + 32680 + 4100
    },
    {
        nombre: "Excel",
        text: 99542,
        data: 24245,
        bss: 7557,
        tamano: 99542 + 24245 + 7557
    },
    {
        nombre: "AutoCAD",
        text: 115000,
        data: 123470,
        bss: 1375,
        tamano: 115000 + 123470 + 1375
    },
    {
        nombre: "Calculadora",
        text: 12342,
        data: 1256,
        bss: 1756,
        tamano: 12342 + 1256 + 1756
    },
    {
        nombre: "p1",
        text: 525000,
        data: 3220000,
        bss: 5000,
        tamano: 525000 + 3220000 + 5000
    },
    {
        nombre: "p2",
        text: 590000,
        data: 974000,
        bss: 25000,
        tamano: 590000 + 974000 + 25000
    },
    {
        nombre: "p3",
        text: 349000,
        data: 2150000,
        bss: 1000,
        tamano: 349000 + 2150000 + 1000
    }
]


var particionesVariables = [1, 2, 2, 3, 3, 4]
var gestionMemoria = 0;
var programasEjecutados = [];
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

        var fila = "<tr><td>" + programa.nombre + "</td><td>" + programa.text + "</td><td>" + programa.data + "</td><td>" + programa.bss + "</td><td>" + programa.tamano + "</td><td><button name = 'btnEncender' class='btn btnEncender'" + " value='" + i + "' disabled>Encender</button>" + "</td></tr>";

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

function llenarEjecutados() {
    document.getElementById("ejecucion").replaceChildren();
    for (let i = 0; i < programasEjecutados.length; i++) {
        const programa = programasEjecutados[i];

        var fila = "<tr><td>" + programa.id + "</td><td>" + programa.nombre + "</td><td>" + programa.tamano + "</td><td>0x" + programa.posicion + "</td><td><button class='btn btnApagar'" + " value='" + i + "'>Apagar</button>" + "</td></tr>";

        var btn = document.createElement("TR");
        btn.innerHTML = fila;
        document.getElementById("ejecucion").appendChild(btn);
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
        } else {
            // Para métodos dinámicos
            ctx.rect(0, 51, 300, 765);
            ctx.stroke();
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
        memoria = new Memoria(1048576 * 16);
        programasEjecutados = [];
        llenarEjecutados();
        idProceso = 0;

        switch (gestionMemoria) {
            case 1:
                if (seleccionAjuste != undefined) {
                    limpiarMemoria();
                    dibujarMemoria(1, 4);
                    dibujarProceso("000000", "SO", 1048576);
                    activarBotones(botones);
                } else {
                    alert("Debe seleccionar un tipo de ajuste");
                }
                break;
            case 2:
                if (seleccionAjuste != undefined) {
                    limpiarMemoria();
                    dibujarMemoria(1, 4);
                    dibujarProceso("000000", "SO", 1048576);
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
                    dibujarProceso("000000", "SO", 1048576);
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
                    dibujarProceso("000000", "SO", 1048576);
                    activarBotones(botones);
                } else {
                    alert("Debe ingresar el número de particiones")
                }
                break;
            default:
                alert("Debe seleccionar un método de gestión de memoria");
                limpiarMemoria();
        }
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
        "id": idProceso + 1, 
        "bss": proceso[3].textContent,
        "data": proceso[2].textContent,
        "text": proceso[1].textContent,
        "nombre": proceso[0].textContent, 
        "tamano": proceso[4].textContent
    }, gestionMemoria, seleccionAjuste);

    if (resultado == 1) {
        alert("Memoria insuficiente");
        return 0;
    }

    if (resultado == 0) {
        alert("Memoria llena");
        return 0;
    }

    var procesoGuardado = memoria.getProceso(idProceso + 1);
    idProceso += 1;
    programasEjecutados.push({
        "id": idProceso, 
        "nombre": proceso[0].textContent, 
        "tamano": proceso[4].textContent, 
        "posicion": procesoGuardado[0].posicion
    });
    llenarEjecutados();
    dibujarProcesos();
   dibujarMatrizGantt();
mostrarResumenMemoria();

}

function dibujarProcesos() {
    var memoriaEstatica = memoria.getSegmentos();

    memoriaEstatica.forEach(segmento => {
        if (segmento.proceso !== null) {
            dibujarProceso(segmento.posicion, "(" + segmento.proceso.id + ")" + segmento.proceso.nombre, segmento.proceso.tamano, segmento.proceso.id);
        }
    });
}


function dibujarMatrizGantt() {
    const tabla = document.getElementById("tablaGantt");
    tabla.innerHTML = "";

    //   array con el ID del proceso ejecutado en cada tiempo
    const timeline = [2, 4, 4, 5, 2, 1, 1]; 

    //  Tomamos los procesos ejecutados
    const procesos = programasEjecutados.map(p => ({
        id: p.id,
        nombre: p.nombre,
        tiempos: Array(timeline.length).fill(null)
    }));

    //  Llenamos la matriz de tiempos
    timeline.forEach((pid, tiempo) => {
        const proc = procesos.find(p => p.id == pid);
        if (proc) {
            proc.tiempos[tiempo] = `x`;
        }
    });

    //  Cabecera t0 t1 t2 ...
    const header = document.createElement("tr");
    header.innerHTML = "<th>Proceso</th>";
    for (let t = 0; t < timeline.length; t++) {
        header.innerHTML += `<th>t${t}</th>`;
    }
    tabla.appendChild(header);

    //  Filas por proceso
    procesos.forEach(proc => {
        const fila = document.createElement("tr");
        fila.innerHTML = `<td>${proc.nombre}</td>`;
        proc.tiempos.forEach(valor => {
            const celda = document.createElement("td");
            if (valor != null) {
                celda.style.backgroundColor = "#2ecc71";
                celda.textContent = valor;
            }
            fila.appendChild(celda);
        });
        tabla.appendChild(fila);
    });
}

function mostrarResumenMemoria() {
    const tabla = document.getElementById("tablaResumenMemoria");
    tabla.innerHTML = "";

    let ocupado = 0;
    let libre = 0;
    const segmentos = memoria.getSegmentos();

    segmentos.forEach(seg => {
        if (seg.proceso) {
            ocupado += parseInt(seg.tamano);
        } else {
            libre += parseInt(seg.tamano);
        }
    });

    const total = ocupado + libre;

    // Cabecera
    const header = document.createElement("tr");
    header.innerHTML = `<th>Estado</th><th>Tamaño total (bytes)</th>`;
    tabla.appendChild(header);

    // Filas
    const filaOcupado = document.createElement("tr");
    filaOcupado.innerHTML = `<td>Ocupado</td><td>${ocupado.toLocaleString()}</td>`;
    tabla.appendChild(filaOcupado);

    const filaLibre = document.createElement("tr");
    filaLibre.innerHTML = `<td>Libre</td><td>${libre.toLocaleString()}</td>`;
    tabla.appendChild(filaLibre);

    const filaTotal = document.createElement("tr");
    filaTotal.innerHTML = `<td><strong>Total</strong></td><td><strong>${total.toLocaleString()}</strong></td>`;
    tabla.appendChild(filaTotal);
}






function init() {
    llenarProgramas();
    agregarListener();
}



init();