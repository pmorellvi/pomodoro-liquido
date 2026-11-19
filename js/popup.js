"use strict";

const CLAVE = "pomodoro-liquido-estado-v1";
const elemento = (id) => document.getElementById(id);
let estado = { version: 1, sesiones: [], seleccionId: null, bloque: null, historial: [] };
let editandoId = null;
p5.disableFriendlyErrors = true;

function setup() {
  createCanvas(112, 150).parent("contenedor-animacion"); // Creamos el canvas y lo colocamos dentro de la extension
  noLoop(); // Solo dibujamos al cambiar el tiempo; no hay efectos ni ondas.
  estado = getItem(CLAVE) ?? estado; //Recuperamos los datos guardados, si no hay datos, lo inicializamos con el estado definido en la cabecera
  //Se asigna a cada boton su funcionalidad
  elemento("tab-temporizador").onclick = () => { mostrarPestana("temporizador"); };
  elemento("tab-sesiones").onclick = () => { mostrarPestana("sesiones"); };
  elemento("nueva-sesion").onclick = () => abrirFormulario();
  elemento("cancelar-sesion").onclick = mostrarListado;
  elemento("volver-sesiones").onclick = mostrarListado;
  elemento("sesion-activa").onchange = (evento) => seleccionar(evento.target.value);
  elemento("formulario-sesion").onsubmit = guardarSesion;
  elemento("iniciar-pausar").onclick = iniciarPausar;
  //Cuando se hace click en finalizar, se comprueba si se ha completado o no
  elemento("finalizar").onclick = () => cambiar((ahora) => {
    if (estado.bloque.estado !== "completado") { //sino se completa se registra a false y se cierra el tramo
      cerrarTramo(ahora);
      registrar(false, ahora);
    }
    estado.bloque = null;
  });
  pintarSesiones(); //Se muestan las sesiones en el desplegable y en el listado de la segunda pantalla
  actualizar(); //Muestra los valores desde que se abre el popup, esta llamada se hace para que el primer segundo se vea relleno
  setInterval(actualizar, 1000); //ponemos un intervalos para que cada 1000milisegundos se ejecute la funcion actualizar
}

//Esta funcion se hace uso de ella cuando modificamos datos, para que asi quede registrado los cambios de datos
//Ademas actualizamos la pantalla
function cambiar(accion = () => {}) {
  const ahora = Date.now();
  comprobarFin(ahora);
  accion(ahora);
  storeItem(CLAVE, estado);
  elemento("mensaje").hidden = true;
  pintarSesiones();
  actualizar();
  return true;
}
//Hace el cambio de pestaña, oculta la pestaña actual y muestra la nueva
function mostrarPestana(nombre) {
  document.querySelectorAll("[data-pestana]").forEach((boton) => {
    const seleccionada = boton.dataset.pestana === nombre;
    boton.setAttribute("aria-pressed", seleccionada);
    elemento(boton.getAttribute("aria-controls")).hidden = !seleccionada;
  });
}

//Sirve para volver del formulario al estado de sesiones
//ocutal el formulario y muestra las sesiones
function mostrarListado() {
  elemento("vista-formulario").hidden = true;
  elemento("vista-listado").hidden = false;
}

//Abrimos un formulario nuevo inicializa los valores por defecto o editamos con sus valores
function abrirFormulario(id = null) {
  editandoId = id;
  //identificamos la sesión si existe
  const sesion = estado.sesiones.find((s) => s.id === id);
  //ponemos los valores que esa sesión tiene guardados, en caso contrario inicializamos los por defecto
  elemento("nombre-sesion").value = sesion?.nombre ?? "";
  elemento("minutos-concentracion").value = sesion?.concentracion ?? 25;
  elemento("minutos-descanso").value = sesion?.descanso ?? 5;
  elemento("titulo-formulario").textContent = id ? "Editar sesión" : "Nueva sesión";
  //ocutamos el listado cuano editamos/creamos una sesion 
  elemento("vista-listado").hidden = true;
  elemento("vista-formulario").hidden = false;
}

//validaciones que se hace al guardar una sesion
function guardarSesion(evento) {
  evento.preventDefault(); //evitamos que el navegador envie un formulario
  //quitamos los espacios y validamos que exista el nombre
  const nombre = elemento("nombre-sesion").value.trim();
  if (!nombre) {
    elemento("mensaje").textContent = "Escribe un nombre para la sesión";
    elemento("mensaje").hidden = false;
    return;
  };

  if (cambiar(() => {
    let sesion = estado.sesiones.find((s) => s.id === editandoId);
    //si no existe, creamos la sesion
    if (!sesion) {
      sesion = { id: crypto.randomUUID() };
      estado.sesiones.push(sesion);
    }
    //asignamso los datos del formulario
    sesion.nombre = nombre;
    sesion.concentracion = Number(elemento("minutos-concentracion").value);
    sesion.descanso = Number(elemento("minutos-descanso").value);
    estado.seleccionId ??= sesion.id;
  }))
  //mostramos el listado de sesiones
  mostrarListado();
}

//Comprueba si hay un bloque activo (un bloque es un apartado de concentración o descanso)
//Dentro de la sesión de estudio, esta un bloque de 25 min de estudio y otro distinto de 5 de descanso
function bloqueActivo() {
  return estado.bloque && estado.bloque.estado !== "completado";
}

//Sirve para seleccionar la sesion y que se cargue el temporizador 
function seleccionar(id) {
  //si eligimos una sesión diferentes quitamos el bloque anterior 
  cambiar(() => {
    if (id !== estado.seleccionId) {
      estado.bloque = null;
    }
    //guardamos el nuevo id de sesión
    estado.seleccionId = id;
  });
  //se muestra de nuevo la pestaña con los datos nuevos
  mostrarPestana("temporizador");
}

//Esta funcion se usa tanto en el desplegable como en la pestaña sesiones
function pintarSesiones() {
  const selector = elemento("sesion-activa");
  const lista = elemento("lista-sesiones");
  //para evitar duplicamos, vacio el contenido anterior
  selector.replaceChildren();
  lista.replaceChildren();
  //si no tiene sesiones se muestra un mensaje
  elemento("sin-sesiones").hidden = estado.sesiones.length > 0;
  if (!estado.sesiones.length) selector.add(new Option("Crea tu primera sesión", ""));
  //En caso de que tenga sesiones, mostramos la información
  estado.sesiones.forEach((sesion) => {
    const seleccionada = sesion.id === estado.seleccionId;
    //la añadimos al desplegable
    selector.add(new Option(sesion.nombre, sesion.id, false, seleccionada));
    //copio la tarjeta definida como plantilla en el html
    const tarjeta = elemento("plantilla-sesion").content.firstElementChild.cloneNode(true);
    //si esta seleccionada, aplicamos el estilo css
    tarjeta.classList.toggle("seleccionada", seleccionada);
    //ponemos el nombre y minutos
    tarjeta.querySelector("h3").textContent = sesion.nombre;
    tarjeta.querySelector("p").textContent = `${sesion.concentracion} min de estudio · ${sesion.descanso} min de descanso`;
    //ponemso el boton correctamente por si se quiere usar
    const usar = tarjeta.querySelector(".usar");
    //si ya es el activo, no se se puede seleccionar
    usar.textContent = seleccionada ? "Seleccionada" : "Usar";
    usar.disabled = seleccionada || Boolean(bloqueActivo());
    //si se selecciona, te lleva directamente a la otra pantalla
    usar.onclick = () => seleccionar(sesion.id);
    tarjeta.querySelector(".editar").onclick = () => abrirFormulario(sesion.id);
    lista.append(tarjeta);
  });
  //si no hay sesiones o ya hay una activa desactivamos el bloque
  selector.disabled = !estado.sesiones.length || Boolean(bloqueActivo());
}

//si el bloque esta completado o no existe bloque, devuelve 0
//si esta en marcha o en pausa, duvuelve el tiempo restante o sino cuanto tiempo hasta terminar
function restante() {
  const b = estado.bloque;
  if (!b || b.estado === "completado") return 0;
  const tiempo = b.estado === "en_marcha"
    ? b.finEn - Date.now()
    : b.restanteMs;

  return Math.max(0, tiempo);
}

//segun el estado del bloque, iniciamos, pausamos o reanudamos
function iniciarPausar() {
  const situacion = estado.bloque?.estado;
  cambiar((ahora) => {
    const b = estado.bloque;

    //si la situacion esta en marcha, guardamos el tiempo restante, cerramos el tramo y lo cambiamos de situacion
    if (situacion === "en_marcha") {
      if (b.estado === "completado") return;
      b.restanteMs = restante();
      cerrarTramo(ahora);
      Object.assign(b, { estado: "pausado", finEn: null });
    } else if (situacion === "pausado") { //si esta pausado, lo iniciamos de nuevo
      Object.assign(b, { estado: "en_marcha", inicioTramo: ahora, finEn: ahora + b.restanteMs });
    } else { //lo iniciamos
      //buscamos la sesion y la cargamos
      const sesion = estado.sesiones.find((s) => s.id === estado.seleccionId);
      //si venimos de un bloque de concentracion, corresponde un bloque de descanso
      const descanso = b?.fase === "concentracion" && b.estado === "completado";
      //convertimos el descanso en milisegundos
      const duracionMs = descanso ? b.descansoMs : sesion.concentracion * 60000;
      //generamos el bloque con la información de la sesion
      estado.bloque = {
        id: crypto.randomUUID(), sesionId: sesion.id, nombreSesion: descanso ? b.nombreSesion : sesion.nombre,
        fase: descanso ? "descanso" : "concentracion", estado: "en_marcha", duracionMs,
        descansoMs: descanso ? b.descansoMs : sesion.descanso * 60000,
        restanteMs: duracionMs, finEn: ahora + duracionMs, inicioTramo: ahora, segmentos: [], terminadoEn: null
      };
    }
  });
}

function cerrarTramo(fin) {
  const b = estado.bloque;
  //si hay un tramo abierto y ha transcurrido tiempo, se guarda esa información
  if (b.inicioTramo !== null && fin > b.inicioTramo) b.segmentos.push({ inicio: b.inicioTramo, fin });
  //al final del todo, se indica que ya no hay un tramo abierto
  b.inicioTramo = null;
}

//registra el tiempo en el historial, el tiempo total que se ha estado concentrado en ese bloque
function registrar(completo, fin) {
  const b = estado.bloque;
  //comprobamos que el bloque sea de concentración (son los unicos bloques donde queremos almacenar el tiempo)
  if (b.fase !== "concentracion") return;
  if (estado.historial.some((r) => r.id === b.id)) return;
  //sumamos toda la duración de los tramos
  const duracionMs = b.segmentos.reduce((total, s) => total + s.fin - s.inicio, 0);
  //añadimos el registros siempre y cuando tenga tiempo de estudio
  if (duracionMs > 0) estado.historial.push({
    id: b.id, sesionId: b.sesionId,
    nombreSesion: b.nombreSesion, completo, fin, duracionMs, segmentos: structuredClone(b.segmentos)
  });
}

//comprueba si el bloque ha agotado el tiempo y si es que si lo pone como completado
function comprobarFin(ahora) {
  const b = estado.bloque;
  if (!b || b.estado !== "en_marcha" || ahora < b.finEn) return;
  cerrarTramo(b.finEn);
  registrar(true, b.finEn);
  Object.assign(b, { estado: "completado", terminadoEn: b.finEn, restanteMs: 0, finEn: null });
}

// Mostramos el estudio realizado en bloques que comenzaron hoy.
function resumenHoy() {
  //Obtenemos la fecha de hoy
  const hoy = new Date().toDateString();
  let tiempo = 0;
  let bloques = 0;
  // Recorremos los bloques del historial
  for (const registro of estado.historial) {
    const inicio = registro.segmentos[0].inicio;
    //filtramos por los bloques del día
    if (new Date(inicio).toDateString() === hoy) {
      tiempo += registro.duracionMs;
      //contamos los bloques que se han completado
      if (registro.completo) bloques++;
    }
  }
  //Si el bloque actual esta en concentración o completado lo añadimos
  const b = estado.bloque;
  if (b?.fase === "concentracion" && b.estado !== "completado") {
    const inicio = b.segmentos[0]?.inicio ?? b.inicioTramo;

    if (new Date(inicio).toDateString() === hoy) {
      tiempo += b.duracionMs - restante();
    }
  }
  //convetismo todos los milisegndos en minutos
  const minutos = Math.floor(tiempo / 60000);
  //mostramos la información del resumen de hoy
  elemento("total-hoy").textContent = minutos;
  elemento("bloques-hoy").textContent = "bloques";
}

//actualiza el temporizador y los controles
function actualizar() {
  const b = estado.bloque;
  //si el bloque ha terminado, guardamos la información
  if (b?.estado === "en_marcha" && Date.now() >= b.finEn) {
    return cambiar();
  }
  //buscamos la sesion
  const sesion = estado.sesiones.find((s) => s.id === estado.seleccionId);
  //cuando entramos mostramos 00, en caso contrario la duración de la sesion
  const duracion = b?.duracionMs ?? (sesion?.concentracion ?? 0) * 60000;
  //el tiempo restante lo convertimos en segundos
  const segundos = Math.ceil((b ? restante() : duracion) / 1000);
  // usamos nf para mostrar un formato correcot en los minutos y segundos, porque esta en formato numerico
  elemento("tiempo-restante").textContent = nf(Math.floor(segundos / 60), 2) + ":" + nf(segundos % 60, 2);
  //comprobamos las fases
  const descanso = b?.fase === "descanso";
  const completado = b?.estado === "completado";
  //mostramos la duración en minutos y el nombre de la fase
  elemento("duracion-bloque").textContent = duracion / 60000;
  elemento("estado-temporizador").textContent = descanso ? "Descanso" : "Concentración";
  //desabilitamos el boton principal si no hay una sesion seleccionada
  const principal = elemento("iniciar-pausar");
  principal.disabled = !sesion;
  principal.textContent = "Iniciar";
  //segun su estado ponemos un texto u otro
  if (b?.estado === "en_marcha") principal.textContent = "Pausar";
  if (b?.estado === "pausado") principal.textContent = "Reanudar";
  if (completado) {principal.textContent = descanso ? "Nuevo bloque" : "Iniciar descanso";}
  //desabilitamos el boton de finalizar si no hay bloque o esta en el bloque de descanso
  const finalizar = elemento("finalizar");
  finalizar.disabled = !b || (completado && descanso);
  //despues de completar la sesion damos la posibilidad de omitir el descanso
  finalizar.textContent = completado && !descanso ? "Omitir descanso" : "Finalizar";
  //si no hay sesion creada permitimos crear una 
  elemento("detalle-temporizador").textContent = sesion ? "" : "Crea una sesión en Sesiones.";
  //actualizamos el resumen del día
  resumenHoy();
  redraw();
}

//la funcion que dibuja el recipiente y su nivel de liquido en funcion del tiempo restante
function draw() {
  const b = estado.bloque;
  let nivel = b ? restante() / b.duracionMs : 1;
  if (b?.fase === "descanso") nivel = 1 - nivel;
  background("#F5F3EE");
  noStroke();
  fill("#2A9D8F");
  rect(22, 133 - nivel * 116, 68, nivel * 116);
  noFill();
  stroke("#30343B");
  strokeWeight(3);
  rect(19, 14, 74, 122);
}
