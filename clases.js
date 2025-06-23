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
  }

  setMetodoSegmentacion(numSeg, offset) {
    this.tamMaxSeg = 2 ** offset;
    this.numMaxSeg = 2 ** numSeg;
  }

  setMetodoPaginacion(numSeg, offset) {
    this.tamPag = 2 ** offset;        // Tamaño de página en bytes
    this.numMaxPag = 2 ** numSeg;     // Número máximo de páginas

    const totalPaginas = (1048576 * 16) / this.tamPag; // Tamaño total de memoria dividida en páginas
    this.segmentos = []; // Reiniciamos los segmentos

    let posicion = 0;
    const paginasSO = Math.ceil(this.so.getTamano() / this.tamPag); // Cantidad de páginas que ocupa el SO

    // Agregamos las páginas del SO
    for (let i = 0; i < paginasSO; i++) {
      this.segmentos.push({
        proceso: this.so,
        tamano: this.tamPag,
        posicion: componentToHex(posicion),
      });
      posicion += this.tamPag;
    }

    // Agregamos el resto de las páginas como libres
    for (let i = paginasSO; i < totalPaginas; i++) {
      this.segmentos.push({
        proceso: null,
        tamano: this.tamPag,
        posicion: componentToHex(posicion),
      });
      posicion += this.tamPag;
    }

    console.log(this.segmentos);
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

  setMetodoFija(segmentos) {
    const tamSeg = this.segmentos[1].tamano / segmentos;
    var posicion = 1048576;
    this.segmentos[1].tamano = tamSeg;
    for (let index = 0; index < segmentos - 1; index++) {
      posicion = posicion + tamSeg;
      this.segmentos.push({
        proceso: null,
        tamano: tamSeg,
        posicion: componentToHex(Math.ceil(posicion)),
      });
    }
  }

  setMetodoVariable(segmentos) {
    const mega = 1048576;
    var posicion = 1048576;
    this.segmentos[1].tamano = mega * segmentos[0];
    for (let index = 1; index < segmentos.length; index++) {
      posicion = posicion + mega * segmentos[index - 1];
      this.segmentos.push({
        proceso: null,
        tamano: mega * segmentos[index],
        posicion: componentToHex(Math.ceil(posicion)),
      });
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

  eliminarProcesoSeg(id) {
    for (let index = 1; index < this.segmentos.length; index++) {
      const element = this.segmentos[index];

      if (element.proceso != null) {
        if (element.proceso.id == id) {
          this.segmentos[index].proceso = null;
        }
      }
    }
    this.dividirMemoria();
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

      return this.paginarProceso(
        proceso
      );
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
    if (seleccionAjuste == "primer") {
      resultado = this.primerAjuste(proceso);
    } else if (seleccionAjuste == "peor") {
      resultado = this.peorAjuste(proceso);
    } else if (seleccionAjuste == "mejor") {
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

    if (memoriaLlena) return 0;

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

  paginarProceso(proceso) {
    const { tamPag, numMaxPag } = this;
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
      const cantidad = Math.ceil(tamanoTotal / tamPag);
      let restantes = tamanoTotal;

      for (let i = 0; i < cantidad; i++) {
        const tamanoPaginaActual = Math.min(tamPag, restantes);
        const pagina = {
          id: proceso.id,
          nombre: `${num}.${proceso.nombre}.${nombreBase}`,
          tamano: tamanoPaginaActual,
        };

        resultado = this.primerAjuste(pagina);

        if (resultado === 1 || resultado === 0) {
          error = true;
          return;
        }

        restantes -= tamanoPaginaActual;
        num++;
      }
    };
    asignarPaginas("text", parseInt(proceso.text));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    asignarPaginas("data", parseInt(proceso.data));
    if (error) return this.eliminarProcesoPag(proceso.id), 1; 

    asignarPaginas("bss", parseInt(proceso.bss));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    asignarPaginas("heap", parseInt(proceso.heap));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    asignarPaginas("stack", parseInt(proceso.stack));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    return -1;
  }

  segmentarProceso(proceso, seleccionAjuste) {
    const { tamMaxSeg, numMaxSeg } = this;

    const totalSegmentosNecesarios =
      Math.ceil(proceso.text / tamMaxSeg) +
      Math.ceil(proceso.data / tamMaxSeg) +
      Math.ceil(proceso.bss / tamMaxSeg) +
      Math.ceil(proceso.stack / tamMaxSeg) +
      Math.ceil(proceso.heap / tamMaxSeg);

    if (totalSegmentosNecesarios > numMaxSeg) {
      return 2; // Excede el número de segmentos permitidos
    }

    let resultado = null;
    let error = false;
    let num = 1;
    const asignarSegmentos = (nombreBase, tamanoTotal) => {
      const cantidad = Math.ceil(tamanoTotal / tamMaxSeg);
      let restantes = tamanoTotal;

      for (let i = 0; i < cantidad; i++) {
        const tamanoSegmento = Math.min(tamMaxSeg, restantes);
        const segmento = {
          id: proceso.id,
          nombre: `${num}.${proceso.nombre}.${nombreBase}`,
          tamano: tamanoSegmento,
        };

        if (seleccionAjuste === "primer") {
          resultado = this.primerAjuste(segmento);
        } else if (seleccionAjuste === "peor") {
          resultado = this.peorAjuste(segmento);
        } else if (seleccionAjuste === "mejor") {
          resultado = this.mejorAjuste(segmento);
        }

        this.dividirMemoria();

        if (resultado === 1 || resultado === 0) {
          error = true;
          return;
        }

        restantes -= tamanoSegmento;
        num++;
      }
    };

    asignarSegmentos("text", parseInt(proceso.text));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    asignarSegmentos("data", parseInt(proceso.data));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    asignarSegmentos("bss", parseInt(proceso.bss));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    asignarSegmentos("heap", parseInt(proceso.heap));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    asignarSegmentos("stack", parseInt(proceso.stack));
    if (error) return this.eliminarProcesoPag(proceso.id), 1;

    return this.dividirMemoria();
  }

  dividirMemoria() {
    /// Dividir la memoria en el tamaño de los segmentos
    for (let index = 0; index < this.segmentos.length; index++) {
      const element = this.segmentos[index];
      if (element.proceso !== null) {
        if (element.proceso.tamano < element.tamano) {
          var nuevoSeg = element.tamano - element.proceso.tamano;
          var posicion =
            parseInt(element.posicion, 16) + parseInt(element.proceso.tamano);

          element.tamano = parseInt(element.proceso.tamano);
          this.segmentos.splice(index + 1, 0, {
            proceso: null,
            tamano: nuevoSeg,
            posicion: componentToHex(Math.ceil(posicion)),
          });
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
    console.log(this.segmentos);
    var memoriaDisponible = 0;
    if (this.segmentos.length > 2) {
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
      this.segmentos[1].posicion = "100000";
      var posicion = parseInt("100000", 16);
      for (let index = 2; index < this.segmentos.length; index++) {
        const element = this.segmentos[index];
        posicion += this.segmentos[index - 1].tamano;

        element.posicion = componentToHex(Math.ceil(posicion));
      }

      /// Guardar el espacio de memoria disponible
      posicion += this.segmentos[this.segmentos.length - 1].tamano;
      this.segmentos.push({
        proceso: null,
        tamano: memoriaDisponible,
        posicion: componentToHex(Math.ceil(posicion)),
      });
    }

    return this.segmentos;
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
