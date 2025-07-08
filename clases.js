class Memoria {
    constructor(tamano) {
        this.so = new Proceso(0, "SO", 0, 0, 0, 0, 0, 1048576, "000000");
        this.segmentos = [
            {
                proceso: this.so,
                tamano: this.so.getTamano(),
                posicion: this.so.getPosicion(),
            },
            { proceso: null, tamano: tamano, posicion: "100000" },
        ];
        this.tamMaxSeg = 0;
        this.numMaxSeg = 0;
        this.tamPag = 0;
        this.numMaxPag = 0;
        this.marcos = [];              // Arreglo con marcos físicos libres/ocupados
        this.tablaSegmentos = [];      // Una entrada por segmento del proceso
        this.tablasPaginas = [];
        this.tabSeg = {};
    }

    setMetodoSegmentacionPaginada(numSeg, numPag, offset) {
        this.numMaxPag = 2 ** numPag;
        this.tamPag = 2 ** offset;
        this.numMaxSeg = 2 ** numSeg;
        this.tamMaxSeg = this.numMaxPag * this.tamPag;

        const totalMarcos = Math.floor((1048576 * 16) / this.tamPag);
        const base = parseInt(this.segmentos[1].posicion, 16);

        this.marcos = Array(totalMarcos).fill().map((_, i) => ({
            ocupado: false,
            procesoId: null,
            direccion: base + i * this.tamPag,
        }));

        this.tablaSegmentos = [];
        this.tablasPaginas = [];
        this.segmentos = []; // Reiniciamos los segmentos
        this.tabSeg = [];    // Reiniciar registro extendido si se usa

        const totalPaginas = (1048576 * 16) / this.tamPag;
        const paginasSO = Math.ceil(this.so.getTamano() / this.tamPag);

        let posicion = 0;
        const tablaPagSO = [];
        const entradaTabSegSO = {
            procesoId: this.so.id,
            parte: "SO",
            paginas: []
        };

        // Reservar marcos para el sistema operativo
        for (let i = 0; i < paginasSO; i++) {
            const marcoLibre = this.buscarMarcoLibre();

            if (marcoLibre === -1) {
                console.error("Error: no hay suficiente memoria para cargar el SO");
                return;
            }

            this.marcos[marcoLibre].ocupado = true;
            this.marcos[marcoLibre].procesoId = this.so.id;
            this.marcos[marcoLibre].segIndex = 0;

            tablaPagSO.push(marcoLibre);

            entradaTabSegSO.paginas.push({
                numeroPagina: i,
                marco: marcoLibre,
                parte: "SO"
            });

            this.segmentos.push({
                proceso: this.so,
                tamano: this.tamPag,
                posicion: componentToHex(posicion),
            });

            posicion += this.tamPag;
        }

        this.tablasPaginas.push(tablaPagSO);
        this.tablaSegmentos.push({
            basePagTable: this.tablasPaginas.length - 1,
            limiteBytes: paginasSO * this.tamPag,
        });
        this.tabSeg.push(entradaTabSegSO);

        // Agregar el resto de marcos como libres (para visualización en this.segmentos)
        for (let i = paginasSO; i < totalPaginas; i++) {
            this.segmentos.push({
                proceso: null,
                tamano: this.tamPag,
                posicion: componentToHex(posicion),
            });
            posicion += this.tamPag;
        }
    }


    getSegmentos() {
        return this.segmentos;
    }

    getProceso(id) {
        const result = [];

        for (let i = 0; i < this.marcos.length; i++) {
            const marco = this.marcos[i];
            if (marco.ocupado && marco.procesoId === id) {
                result.push({
                    proceso: {
                        id: marco.procesoId,
                        nombre: `${i}.${id}.segmento${marco.segIndex}.pagina${i}` // o lo que uses
                    },
                    posicion: componentToHex(this.marcos[i].direccion),
                });
            }
        }

        return result;
    }

    buscarMarcoLibre() {
        return this.marcos.findIndex(m => !m.ocupado);
    }


    getMemoriaDisponible() {
        var count = 0;
        this.segmentos.forEach((segmento) => {
            if (segmento.proceso == null) {
                count += segmento.tamano;
            }
        });
        return count;
    }

    getSegmentosLibres() {
        var segmentosLibres = [];

        this.segmentos.forEach((segmento) => {
            if (segmento.proceso == null) {
                segmentosLibres.push(segmento);
            }
        });

        return segmentosLibres;
    }

    eliminarProceso(id) {
        const idNum = Number(id);
        
        this.marcos.forEach(marco => {
            if (marco["procesoId"] === idNum) {
                marco.ocupado = false;
                marco.procesoId = null;
            }
        });

        delete this.tabSeg[id];

        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];

            if (element.proceso != null) {
                if (element.proceso.id == id) {
                    this.segmentos[index].proceso = null;
                }
            }
        }
    }


    insertarProceso(proceso) {

        if (this.getMemoriaDisponible() == 0) {
            return 0;
        }
        if (this.getMemoriaDisponible() < proceso.tamano) {
            return 1;
        }

        return this.segmentarYPaginar(
            proceso
        );
    }

    primerAjuste(proceso) {
        // return 1 si el proceso no cabe en el segmento
        // return 0 si la memoria esta llena
        var memoriaLlena = true;
        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];

            if (element.proceso === null) {
                memoriaLlena = false;
                if (element.tamano >= proceso.tamano) {
                    this.segmentos[index].proceso = proceso;
                    return this.segmentos;
                }
            }
        }

        if (memoriaLlena) return 0;

        return 1;
    }

    segmentarYPaginar(proceso) {
        const { tamPag, numMaxPag, numMaxSeg } = this;

        const totalPaginasNecesarias =
            Math.ceil(proceso.text / tamPag) +
            Math.ceil(proceso.data / tamPag) +
            Math.ceil(proceso.bss / tamPag) +
            Math.ceil(proceso.stack / tamPag) +
            Math.ceil(proceso.heap / tamPag);
        if (totalPaginasNecesarias > numMaxPag) {
            return 2;
        }

        let resultado = null;
        let error = false;
        let num = 1;
        const asignarPaginas = (nombreBase, tamanoTotal) => {
            const paginasNecesarias = Math.ceil(tamanoTotal / tamPag);
            const paginasAsignadas = [];
            let posicion = 0;

            for (let i = 0; i < paginasNecesarias; i++) {
                const marcoLibre = this.buscarMarcoLibre();
                if (marcoLibre === -1) {
                    console.log("No hay marcos libres disponibles");
                    error = true;
                    break;
                }

                this.marcos[marcoLibre].ocupado = true;
                this.marcos[marcoLibre].procesoId = proceso.id;
                this.marcos[marcoLibre].segIndex = num;
                this.marcos[marcoLibre].direccion = parseInt(this.segmentos[1].posicion, 16) + (marcoLibre * tamPag);

                paginasAsignadas.push({ pagina: i, marco: marcoLibre, direccion: componentToHex(this.marcos[marcoLibre].direccion) });
                const pagina = {
                    id: proceso.id,
                    nombre: `${num}.${proceso.nombre}.${nombreBase}`,
                    tamano: paginasNecesarias,
                };

                resultado = this.primerAjuste(pagina);

                if (resultado === 1 || resultado === 0) {
                    error = true;
                    return;
                }
                posicion += tamPag;
            }

            this.tabSeg[proceso.id].segmentos.push({
                nombre: `${proceso.nombre}.${nombreBase}`,
                paginas: paginasAsignadas
            })

            if (!error) {
                resultado = {
                    nombre: `${proceso.nombre}.${nombreBase}`,
                    paginas: paginasAsignadas,
                    posicion: componentToHex(parseInt(this.segmentos[1].posicion, 16) + (paginasAsignadas[0] * tamPag)),
                };
            }
            num++;
        }

        this.tabSeg[proceso.id] = { nombre: proceso.nombre, id: proceso.id, segmentos: [] };

        asignarPaginas("text", parseInt(proceso.text));
        if (error) return this.eliminarProceso(proceso.id), 1;

        asignarPaginas("data", parseInt(proceso.data));
        if (error) return this.eliminarProceso(proceso.id), 1;

        asignarPaginas("bss", parseInt(proceso.bss));
        if (error) return this.eliminarProceso(proceso.id), 1;

        asignarPaginas("heap", parseInt(proceso.heap));
        if (error) return this.eliminarProceso(proceso.id), 1;

        asignarPaginas("stack", parseInt(proceso.stack));
        if (error) return this.eliminarProceso(proceso.id), 1;

        console.log("marcos después de insertar:", JSON.parse(JSON.stringify(this.marcos)));
        console.log("segmentos después de insertar:", JSON.parse(JSON.stringify(this.tabSeg)));
        console.log("memoria después de insertar:", JSON.parse(JSON.stringify(this.segmentos)));
        return -1;
    }

}

class Proceso {
    constructor(id, nombre, bss, data, text, stack, heap, tamano, posicion) {
        this.id = id;
        this.nombre = nombre;
        this.bss = bss;
        this.data = data;
        this.text = text;
        this.stack = stack;
        this.heap = heap;
        this.tamano = tamano;
        this.posicion = posicion;
    }

    getId() {
        return this.id;
    }

    getNombre() {
        return this.nombre;
    }

    getBss() {
        return this.bss;
    }

    getData() {
        return this.data;
    }

    getText() {
        return this.text;
    }

    getStack() {
        return this.stack;
    }

    getHeap() {
        return this.heap;
    }

    getTamano() {
        return this.tamano;
    }

    getPosicion() {
        return this.posicion;
    }
}
