class Memoria {
    constructor(tamano) {
        this.segmentos = [{ "proceso": null, "tamano": tamano, "posicion": "100000" }]
    }

    getSegmentos() {
        return this.segmentos;
    }

    getProceso(id) {
        var proceso = [];

        for (let index = 0; index < this.segmentos.length; index++) {
            const segmento = this.segmentos[index];
            if (segmento.proceso != null) {
                if (segmento.proceso.id == id) {
                    proceso.push(segmento);
                }
            }
        }
        return proceso;
    }

    getMemoriaDisponible() {
        var count = 0;
        this.segmentos.forEach(segmento => {
            if (segmento.proceso == null) {
                count += segmento.tamano;
            }
        });
        return count;
    }

    getSegmentosLibres() {
        var segmentosLibres = [];

        this.segmentos.forEach(segmento => {
            if (segmento.proceso == null) {
                segmentosLibres.push(segmento);
            }
        });

        return segmentosLibres;
    }

    setMetodoFija(segmentos) {
        const tamSeg = this.segmentos[0].tamano / segmentos;
        var posicion = 1048576;
        this.segmentos[0].tamano = tamSeg;
        for (let index = 0; index < segmentos - 1; index++) {
            posicion = posicion + tamSeg;
            this.segmentos.push({ "proceso": null, "tamano": tamSeg, "posicion": componentToHex(Math.ceil(posicion)) });
        }
    }

    setMetodoVariable(segmentos) {
        const mega = 1048576;
        var posicion = 1048576;
        this.segmentos[0].tamano = mega * segmentos[0];
        for (let index = 1; index < segmentos.length; index++) {
            posicion = posicion + mega * segmentos[index - 1];
            this.segmentos.push({ "proceso": null, "tamano": mega * segmentos[index], "posicion": componentToHex(Math.ceil(posicion)) });
        }
    }

    eliminarProceso(id, nombre, gestionMemoria) {
        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];

            if (element.proceso != null) {
                if (element.proceso.id == id && element.proceso.nombre == nombre) {
                    this.segmentos[index].proceso = null;
                }
            }
        }

        /// Evalua los metodos de dinamica
        switch (gestionMemoria) {
            case 2: /// Sin compactación
                this.dividirMemoria();
                break;
            case 1: /// Con compactación
                this.dividirMemoria();
                this.compactarMemoria();
                break;
        }
    }

    eliminarProcesoPag(id) {
        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];

            if (element.proceso != null) {
                if (element.proceso.id == id) {
                    this.segmentos[index].proceso = null;
                }
            }
        }
        this.dividirMemoria();
    }

    cabeSegmento(proceso) {
        var cabe = false;
        var segmentosLibres = [];
        for (let index = 0; index < this.segmentos.length; index++) {
            const segmento = this.segmentos[index];
            if (segmento.proceso == null) {
                segmentosLibres.push(segmento);
            }
        }

        for (let index = 0; index < segmentosLibres.length; index++) {
            const segmento = segmentosLibres[index];
            if (segmento.tamano >= proceso.tamano) {
                cabe = true;
                break;
            }
            cabe = false;
        }

        return cabe;
    }

    insertarProceso(proceso, metodo, seleccionAjuste) {
        /// Paginacion
        if (metodo == 6) {
            if (this.getMemoriaDisponible() == 0) {
                return 0;
            }
            if (this.getMemoriaDisponible() < proceso.tamano) {
                return 1;
            }

            var procesoPaginado = this.paginarProceso(proceso, this.segmentos[0].tamano);
            return this.paginacion(procesoPaginado);
        }

        /// Segmentación
        if (metodo == 5) {
            if (this.getMemoriaDisponible() == 0) {
                return 0;
            }
            if (this.getMemoriaDisponible() < proceso.tamano) {
                return 1;
            }

            return this.segmentarProceso(proceso, seleccionAjuste);
        }

        /// Metodo estatico fijo
        if (metodo == 4) {
            return this.estaticaFija(proceso);
        }

        /// Evalua segun el ajuste deseado
        var resultado = null;
        if (seleccionAjuste == 'primer') {
            resultado = this.primerAjuste(proceso);
        } else if (seleccionAjuste == 'peor') {
            resultado = this.peorAjuste(proceso);
        } else if (seleccionAjuste == 'mejor') {
            resultado = this.mejorAjuste(proceso);
        }

        /// Evalua los metodos de dinamica
        if (metodo == 1 || metodo == 2) {
            /// Sí hubi algún error en el llenadod el proceso
            if (resultado == 1 || resultado == 0) {
                return resultado;
            }
            return this.dividirMemoria();
        }

        return resultado;
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

        if (memoriaLlena)
            return 0;

        return 1;
    }

    peorAjuste(proceso) {
        // return 1 si el proceso no cabe en el segmento
        // return 0 si la memoria esta llena
        var memoriaLlena = true;
        var segmento = 0;
        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];
            if (element.proceso === null) {
                if (element.tamano >= parseInt(proceso.tamano)) {
                    segmento = index;
                }
                memoriaLlena = false;
            }
        }

        if (segmento == 0 && this.segmentos[segmento].proceso != null) {
            return 1;
        }

        if (memoriaLlena) {
            return 0;
        }

        if (this.segmentos[segmento].tamano >= proceso.tamano) {
            this.segmentos[segmento].proceso = proceso;
            return this.segmentos;
        }

        return 1;
    }

    mejorAjuste(proceso) {
        // return 1 si el proceso no cabe en el segmento
        // return 0 si la memoria esta llena
        var mejor = 1048576 * 15;
        var cabe = false;
        var memoriaLlena = true;
        var segmento = 0;

        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];
            var dif = element.tamano - proceso.tamano;

            if (element.proceso === null) {
                if (dif < mejor && dif >= 0) {
                    mejor = dif;
                    segmento = index;
                    cabe = true;
                }
                memoriaLlena = false;
            }
        }

        if (memoriaLlena) {
            return 0;
        }

        if (cabe) {
            this.segmentos[segmento].proceso = proceso;
            return this.segmentos;
        }

        return 1;

    }

    estaticaFija(proceso) {
        // return 1 si el proceso no cabe en el segmento
        // return 0 si la memoria esta llena
        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];

            if (element.proceso === null) {
                if (element.tamano < proceso.tamano) {
                    return 1;
                }
                this.segmentos[index].proceso = proceso;
                return this.segmentos;
            }
        }
        return 0;
    }

    paginacion(paginasProceso) {
        for (let index2 = 0; index2 < paginasProceso.length; index2++) {
            for (let index = 0; index < this.segmentos.length; index++) {
                const segmento = this.segmentos[index];

                if (segmento.proceso === null) {
                    this.segmentos[index].proceso = paginasProceso[index2];
                    break;
                }
            }
        }
        return this.segmentos;

    }

    paginarProceso(proceso, tamanoPagina) {
        var pagProceso = Math.ceil(proceso.tamano / tamanoPagina);
        var arrProcesos = [];

        for (let index = 0; index < pagProceso; index++) {
            arrProcesos.push({ "id": proceso.id, "nombre": proceso.nombre + index, "tamano": tamanoPagina });
        }
        return arrProcesos;
    }

    segmentarProceso(proceso, seleccionAjuste) {
        var resultado = null;
        var tamanoInsuficiente = false;
        if (seleccionAjuste == 'primer') {
            if (!this.cabeSegmento({ "tamano": proceso.bss })) {
                tamanoInsuficiente = true;
            }
            resultado = this.primerAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - BSS", "tamano": proceso.bss });
            this.dividirMemoria();

            if (!this.cabeSegmento({ "tamano": proceso.data })) {
                tamanoInsuficiente = true;
            }
            resultado = this.primerAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - Data", "tamano": proceso.data });
            this.dividirMemoria();

            if (!this.cabeSegmento({ "tamano": proceso.text })) {
                tamanoInsuficiente = true;
            }
            resultado = this.primerAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - Text", "tamano": proceso.text });

        } else if (seleccionAjuste == 'peor') {
            if (!this.cabeSegmento({ "tamano": proceso.bss })) {
                tamanoInsuficiente = true;
            }
            resultado = this.peorAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - BSS", "tamano": proceso.bss });
            this.dividirMemoria();

            if (!this.cabeSegmento({ "tamano": proceso.data })) {
                tamanoInsuficiente = true;
            }
            resultado = this.peorAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - Data", "tamano": proceso.data });
            this.dividirMemoria();

            if (!this.cabeSegmento({ "tamano": proceso.text })) {
                tamanoInsuficiente = true;
            }
            resultado = this.peorAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - Text", "tamano": proceso.text });

        } else if (seleccionAjuste == 'mejor') {
            if (!this.cabeSegmento({ "tamano": proceso.bss })) {
                tamanoInsuficiente = true;
            }
            resultado = this.mejorAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - BSS", "tamano": proceso.bss });
            this.dividirMemoria();

            if (!this.cabeSegmento({ "tamano": proceso.data })) {
                tamanoInsuficiente = true;
            }
            resultado = this.mejorAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - Data", "tamano": proceso.data });
            this.dividirMemoria();

            if (!this.cabeSegmento({ "tamano": proceso.text })) {
                tamanoInsuficiente = true;
            }
            resultado = this.mejorAjuste({ "id": proceso.id, "nombre": proceso.nombre + " - Text", "tamano": proceso.text });
        }

        if (tamanoInsuficiente) {
            this.eliminarProcesoPag(proceso.id);
            resultado = 1;
        }

        /// Sí hubo algún error en el llenadod el proceso
        if (resultado == 1 || resultado == 0) {
            return resultado;
        }

        return this.dividirMemoria();
    }

    dividirMemoria() {
        /// Dividir la memoria en el tamaño de los segmentos
        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];
            if (element.proceso !== null) {
                if (element.proceso.tamano < element.tamano) {
                    var nuevoSeg = element.tamano - element.proceso.tamano;
                    var posicion = parseInt(element.posicion, 16) + parseInt(element.proceso.tamano);

                    element.tamano = parseInt(element.proceso.tamano);
                    this.segmentos.splice(index + 1, 0, { "proceso": null, "tamano": nuevoSeg, "posicion": componentToHex(Math.ceil(posicion)) });
                }
            }
        }

        /// Unir los segmentos con procesos vacios
        for (let index = 0; index < this.segmentos.length; index++) {
            const element = this.segmentos[index];
            if (element.proceso === null) {
                if (index + 1 < this.segmentos.length) {
                    if (this.segmentos[index + 1].proceso === null) {
                        var nuevoSeg = element.tamano + this.segmentos[index + 1].tamano;
                        var posicion = parseInt(element.posicion, 16);

                        element.tamano = nuevoSeg;
                        this.segmentos.splice(index + 1, 1);
                        index -= 1;
                    }
                }
            }
        }
        return this.segmentos;
    }

    compactarMemoria() {
        var memoriaDisponible = 0;
        if (this.segmentos.length > 1) {
            /// Eliminar segmentos vacios
            for (let index = 0; index < this.segmentos.length; index++) {
                const element = this.segmentos[index];
                if (element.proceso === null) {
                    memoriaDisponible += element.tamano;
                    this.segmentos.splice(index, 1);
                    index -= 1;
                }

            }

            /// Actualizar posición de los procesos
            this.segmentos[0].posicion = "100000";
            var posicion = parseInt("100000", 16);
            for (let index = 1; index < this.segmentos.length; index++) {
                const element = this.segmentos[index];
                posicion += this.segmentos[index - 1].tamano;

                element.posicion = componentToHex(Math.ceil(posicion));
            }

            /// Guardar el espacio de memoria disponible
            posicion += this.segmentos[this.segmentos.length - 1].tamano;
            this.segmentos.push({ "proceso": null, "tamano": memoriaDisponible, "posicion": componentToHex(Math.ceil(posicion)) });
        }

        return this.segmentos;
    }


    setMetodoSegmentacionPaginada(bitsSegmento, bitsPagina, bitsOffset) {
        // Validar que la suma de bits sea 32
        if (bitsSegmento + bitsPagina + bitsOffset !== 32) {
            throw new Error("La suma de bits debe ser igual a 32");
        }

        // Calcular número de segmentos y páginas basado en los bits
        const numSegmentos = Math.pow(2, bitsSegmento);
        const tamanoPagina = Math.pow(2, bitsOffset);
        const tamanoSegmento = Math.pow(2, bitsPagina) * tamanoPagina;

        // Limpiar segmentos existentes
        this.segmentos = [];
        
        // Crear segmentos paginados
        var posicion = 1048576; // 0x100000 en decimal
        for (let i = 0; i < numSegmentos; i++) {
            this.segmentos.push({
                "proceso": null,
                "tamano": tamanoSegmento,
                "posicion": componentToHex(Math.ceil(posicion)),
                "paginas": Array(Math.pow(2, bitsPagina)).fill(null)
            });
            posicion += tamanoSegmento;
        }
        
        this.tamanoPagina = tamanoPagina;
        this.bitsSegmento = bitsSegmento;
        this.bitsPagina = bitsPagina;
        this.bitsOffset = bitsOffset;
    }

    insertarProcesoSegmentacionPaginada(proceso, seleccionAjuste) {
        // Verificar memoria disponible
        if (this.getMemoriaDisponible() == 0) {
            return 0; // Memoria llena
        }
        
        if (this.getMemoriaDisponible() < proceso.tamano) {
            return 1; // Memoria insuficiente
        }

        // Dividir el proceso en segmentos (BSS, DATA, TEXT)
        const segmentosProceso = [
            { nombre: proceso.nombre + ".BSS", tamano: proceso.bss },
            { nombre: proceso.nombre + ".DATA", tamano: proceso.data },
            { nombre: proceso.nombre + ".TEXT", tamano: proceso.text }
        ];

        let idProceso = proceso.id;
        let resultado = null;
        let tamanoInsuficiente = false;

        // Asignar cada segmento
        for (const segmento of segmentosProceso) {
            // Paginar el segmento
            const paginasSegmento = this.paginarProceso(
                { id: idProceso, nombre: segmento.nombre, tamano: segmento.tamano },
                this.tamanoPagina
            );

            // Asignar páginas a segmentos libres
            for (const pagina of paginasSegmento) {
                let asignado = false;
                
                // Buscar un segmento con espacio para la página
                for (let i = 0; i < this.segmentos.length; i++) {
                    const seg = this.segmentos[i];
                    
                    // Verificar si el segmento tiene espacio para la página
                    if (seg.proceso === null || 
                        (seg.proceso.id === idProceso && seg.paginas.includes(null))) {
                        
                        // Buscar marco libre en el segmento
                        const marcoLibre = seg.paginas.findIndex(p => p === null);
                        if (marcoLibre !== -1) {
                            seg.paginas[marcoLibre] = pagina;
                            seg.proceso = { 
                                id: idProceso, 
                                nombre: pagina.nombre,
                                tamano: pagina.tamano
                            };
                            asignado = true;
                            break;
                        }
                    }
                }
                
                if (!asignado) {
                    tamanoInsuficiente = true;
                    break;
                }
            }
            
            if (tamanoInsuficiente) break;
        }

        if (tamanoInsuficiente) {
            this.eliminarProcesoPag(idProceso);
            return 1; // No se pudo asignar todo el proceso
        }

        return this.dividirMemoria();
    }


    
    setMetodoSegmentacionPaginada(bitsSegmento, bitsPagina, bitsOffset) {
        if (bitsSegmento + bitsPagina + bitsOffset !== 32) {
            throw new Error("La suma de bits debe ser 32");
        }
        
        this.bitsSegmento = bitsSegmento;
        this.bitsPagina = bitsPagina;
        this.bitsOffset = bitsOffset;
        
        const numSegmentos = Math.pow(2, bitsSegmento);
        this.tamanoPagina = Math.pow(2, bitsOffset);
        const tamanoSegmento = Math.pow(2, bitsPagina) * this.tamanoPagina;
        
        this.segmentos = [];
        let posicion = 1048576; // 0x100000
        
        for (let i = 0; i < numSegmentos; i++) {
            this.segmentos.push({
                "proceso": null,
                "tamano": tamanoSegmento,
                "posicion": componentToHex(Math.ceil(posicion)),
                "paginas": Array(Math.pow(2, bitsPagina)).fill(null)
            });
            posicion += tamanoSegmento;
        }
    }
    
}

class Proceso {
    constructor(id, nombre, bss, data, text, tamano, posicion) {
        this.id = id
        this.nombre = nombre
        this.bss = bss
        this.data = data
        this.text = text
        this.tamano = tamano
        this.posicion = posicion
    }

    getId() {
        return this.id;
    }

    getNombre() {
        return this.nombre;
    }

    getTamano() {
        return this.tamano;
    }

    getPosicion() {
        return this.posicion;
    }
}
