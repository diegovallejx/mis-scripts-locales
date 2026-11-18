const elementos = {
  cargar: document.querySelector('#cargar'),
  archivo: document.querySelector('#archivo'),
  archivoActualizacion: document.querySelector('#archivo-actualizacion'),
  actualizar: document.querySelector('#actualizar'),
  fuenteActualizacion: document.querySelector('#fuente-actualizacion'),
  estadoFuente: document.querySelector('#estado-fuente'),
  guardarFuente: document.querySelector('#guardar-fuente'),
  buscarActualizacion: document.querySelector('#buscar-actualizacion'),
  olvidarFuente: document.querySelector('#olvidar-fuente'),
  cancelarConsulta: document.querySelector('#cancelar-consulta'),
  revision: document.querySelector('#revision'),
  tituloRevision: document.querySelector('#titulo-revision'),
  resumenRevision: document.querySelector('#resumen-revision'),
  estadoRevision: document.querySelector('#estado-revision'),
  codigoAnterior: document.querySelector('#codigo-anterior'),
  codigoNuevo: document.querySelector('#codigo-nuevo'),
  sitiosAnteriores: document.querySelector('#sitios-anteriores'),
  sitiosNuevos: document.querySelector('#sitios-nuevos'),
  confirmarActualizacion: document.querySelector('#confirmar-actualizacion'),
  importarCopia: document.querySelector('#importar-copia'),
  cancelarRevision: document.querySelector('#cancelar-revision'),
  errorRevision: document.querySelector('#error-revision'),
  aviso: document.querySelector('#aviso'),
  lista: document.querySelector('#lista'),
  contador: document.querySelector('#contador'),
  sinSeleccion: document.querySelector('#sin-seleccion'),
  detalle: document.querySelector('#contenido-detalle'),
  nombre: document.querySelector('#nombre-detalle'),
  descripcion: document.querySelector('#descripcion-detalle'),
  estado: document.querySelector('#estado-detalle'),
  sitiosDesplegable: document.querySelector('#sitios-desplegable'),
  numeroSitios: document.querySelector('#numero-sitios'),
  sitios: document.querySelector('#sitios-detalle'),
  tamano: document.querySelector('#tamano-detalle'),
  codigo: document.querySelector('#codigo-detalle'),
  activar: document.querySelector('#activar'),
  eliminar: document.querySelector('#eliminar')
};

let scripts = [];
let seleccionado = null;
let ocupado = false;
let objetivoActualizacion = null;
let revisionPendiente = null;
let consultaActualizacion = null;

function avisar(mensaje, error = false) {
  elementos.aviso.textContent = mensaje;
  elementos.aviso.classList.toggle('error', error);
  elementos.aviso.hidden = !mensaje;
}

function seleccionadoActual() {
  return scripts.find(script => script.id === seleccionado);
}

async function liberarSitios(sitiosAnteriores, siguientes) {
  const necesarios = new Set(siguientes
    .filter(script => script.activo)
    .flatMap(script => GestorScripts.permisos(script.sitios)));
  const sobrantes = GestorScripts.permisos(sitiosAnteriores)
    .filter(sitio => !necesarios.has(sitio));
  if (sobrantes.length) await chrome.permissions.remove({ origins: sobrantes });
}

function dibujar() {
  elementos.cargar.disabled = ocupado || !!revisionPendiente;
  elementos.confirmarActualizacion.disabled = ocupado;
  elementos.importarCopia.disabled = ocupado;
  elementos.cancelarRevision.disabled = ocupado;
  elementos.lista.replaceChildren();
  elementos.contador.textContent = String(scripts.length);
  if (!scripts.length) {
    const vacia = document.createElement('div');
    vacia.className = 'vacia';
    vacia.textContent = 'Aún no hay scripts. Carga un archivo .user.js para empezar.';
    elementos.lista.append(vacia);
  }
  for (const script of scripts) {
    const tarjeta = document.createElement('button');
    tarjeta.type = 'button';
    tarjeta.disabled = ocupado;
    tarjeta.className = 'tarjeta' + (script.id === seleccionado ? ' seleccionada' : '');
    tarjeta.setAttribute('aria-pressed', String(script.id === seleccionado));
    const fila = document.createElement('span');
    fila.className = 'fila';
    const nombre = document.createElement('strong');
    nombre.textContent = script.nombre;
    const marca = document.createElement('span');
    marca.className = 'marca' + (script.activo ? ' activo' : '');
    marca.setAttribute('aria-label', script.activo ? 'Activo' : 'Inactivo');
    fila.append(nombre, marca);
    const resumen = document.createElement('small');
    const cantidad = script.sitios.length;
    resumen.textContent = `${cantidad} ${cantidad === 1 ? 'sitio' : 'sitios'} · ${script.activo ? 'Activo' : 'Inactivo'}`;
    tarjeta.append(fila, resumen);
    tarjeta.addEventListener('click', () => {
      if (seleccionado !== script.id) elementos.sitiosDesplegable.open = false;
      seleccionado = script.id;
      dibujar();
    });
    elementos.lista.append(tarjeta);
  }
  const script = seleccionadoActual();
  elementos.sinSeleccion.hidden = !!script;
  elementos.detalle.hidden = !script;
  if (!script) {
    elementos.codigo.value = '';
    elementos.nombre.textContent = '';
    elementos.descripcion.textContent = '';
    elementos.sitios.replaceChildren();
    return;
  }
  elementos.nombre.textContent = script.nombre + (script.version ? ` · v${script.version}` : '');
  elementos.descripcion.textContent = script.descripcion || 'Sin descripción.';
  elementos.estado.textContent = script.activo ? 'Activo' : 'Inactivo';
  elementos.estado.classList.toggle('activo', script.activo);
  elementos.numeroSitios.textContent = `${script.sitios.length} ${script.sitios.length === 1 ? 'sitio' : 'sitios'} donde se ejecutará`;
  elementos.sitios.replaceChildren();
  for (const sitio of script.sitios) {
    const item = document.createElement('li');
    item.textContent = sitio;
    elementos.sitios.append(item);
  }
  elementos.codigo.value = script.codigo;
  const bytes = new TextEncoder().encode(script.codigo).length;
  elementos.tamano.textContent = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  elementos.activar.textContent = script.activo ? 'Desactivar' : 'Activar script';
  elementos.activar.disabled = ocupado;
  elementos.eliminar.disabled = ocupado;
  elementos.actualizar.disabled = ocupado || !!revisionPendiente;
  let propuesta = '';
  try { propuesta = GestorScripts.analizar(script.codigo).urlDescarga; } catch {}
  elementos.fuenteActualizacion.value = script.fuenteActualizacion ?? propuesta;
  elementos.fuenteActualizacion.disabled = ocupado || !!revisionPendiente;
  elementos.guardarFuente.disabled = ocupado || !!revisionPendiente;
  elementos.olvidarFuente.disabled = ocupado || !!revisionPendiente || !script.fuenteActualizacion;
  elementos.buscarActualizacion.disabled = ocupado || !!revisionPendiente || !script.fuenteActualizacion;
  elementos.cancelarConsulta.hidden = !consultaActualizacion;
  elementos.estadoFuente.textContent = script.fuenteActualizacion
    ? 'Fuente guardada en este equipo. No hay consultas automáticas.'
    : propuesta && script.fuenteActualizacion === undefined
      ? 'Fuente propuesta por @downloadURL. Revísala y guárdala para habilitar la búsqueda.'
      : 'Sin fuente guardada. Puedes seguir actualizando desde un archivo local.';
}

function mostrarRevision(anterior, codigo, permiteCopia, fuente = '') {
  const datos = GestorScripts.analizar(codigo);
  const datosAnteriores = GestorScripts.analizar(anterior.codigo);
  revisionPendiente = { anterior, codigo };
  elementos.resumenRevision.textContent = `${anterior.nombre} · ${anterior.version || 'Sin versión'} → ${datos.nombre} · ${datos.version || 'Sin versión'}. Revisa ambos archivos antes de reemplazar.`;
  if (fuente) elementos.resumenRevision.textContent += ` Fuente consultada: ${fuente}. La fuente guardada no cambiará aunque el archivo proponga otra dirección.`;
  const conservaActividad = GestorScripts.mismosSitios(datosAnteriores, datos) &&
    datosAnteriores.todosLosMarcos === datos.todosLosMarcos;
  elementos.estadoRevision.textContent = anterior.activo && conservaActividad
    ? 'Conservará su estado activo. El código nuevo se ejecutará en próximas cargas; recarga las páginas abiertas después de confirmar.'
    : 'La actualización quedará inactiva. Puedes activarla después de revisar su código y autorizar sus sitios. Recarga las páginas abiertas para detener el código anterior.';
  if (datos.version === anterior.version) elementos.estadoRevision.textContent += ' La versión es la misma; puedes reemplazar igualmente su contenido.';
  if (!conservaActividad) elementos.estadoRevision.textContent += ' Cambian los sitios o el alcance en marcos de la página.';
  elementos.codigoAnterior.value = anterior.codigo;
  elementos.codigoNuevo.value = codigo;
  for (const [lista, sitios] of [[elementos.sitiosAnteriores, datosAnteriores.sitios], [elementos.sitiosNuevos, datos.sitios]]) {
    lista.replaceChildren();
    for (const sitio of sitios) {
      const item = document.createElement('li');
      item.textContent = sitio;
      lista.append(item);
    }
  }
  elementos.importarCopia.hidden = !permiteCopia;
  elementos.errorRevision.hidden = true;
  elementos.revision.showModal();
  elementos.tituloRevision.focus({ preventScroll: true });
  elementos.revision.scrollTop = 0;
}

function limpiarRevision() {
  revisionPendiente = null;
  elementos.codigoAnterior.value = '';
  elementos.codigoNuevo.value = '';
  elementos.sitiosAnteriores.replaceChildren();
  elementos.sitiosNuevos.replaceChildren();
  elementos.resumenRevision.textContent = '';
  elementos.estadoRevision.textContent = '';
  elementos.errorRevision.textContent = '';
  dibujar();
}

function cerrarRevision() {
  elementos.revision.close();
  limpiarRevision();
}

async function importar(codigo) {
  const script = {
    id: 'script-' + crypto.randomUUID(),
    ...GestorScripts.analizar(codigo), codigo, activo: false
  };
  const siguientes = [...await GestorScripts.leer(), script];
  await GestorScripts.guardar(siguientes);
  scripts = siguientes;
  seleccionado = script.id;
  avisar('Script cargado e inactivo. Revisa el código y los sitios antes de activarlo.');
}

async function cargarArchivo(entrada = elementos.archivo, anterior = null) {
  const archivo = entrada.files?.[0];
  entrada.value = '';
  if (!archivo || ocupado) return;
  ocupado = true;
  dibujar();
  try {
    if (archivo.size > 2 * 1024 * 1024) throw new Error('El archivo supera el límite de 2 MB.');
    const codigo = await archivo.text();
    const datos = GestorScripts.analizar(codigo);
    scripts = await GestorScripts.leer();
    const candidatos = anterior ? [anterior] : GestorScripts.coincidencias(scripts, datos);
    if (candidatos.length > 1) throw new Error('Hay varias copias de este script. Selecciona la que quieres reemplazar y usa «Actualizar desde archivo».');
    if (candidatos.length) mostrarRevision(candidatos[0], codigo, !anterior);
    else await importar(codigo);
  } catch (error) {
    avisar(error.message, true);
  } finally {
    ocupado = false;
    dibujar();
  }
}

async function confirmarRevision(comoCopia = false) {
  if (!revisionPendiente || ocupado) return;
  const { anterior, codigo } = revisionPendiente;
  ocupado = true;
  dibujar();
  try {
    if (comoCopia) await importar(codigo);
    else {
      scripts = await GestorScripts.actualizar(anterior, codigo);
      seleccionado = anterior.id;
      const actualizado = seleccionadoActual();
      let mensaje = actualizado.activo
        ? 'Script actualizado y activo. Recarga las páginas abiertas para usar el código nuevo.'
        : 'Script actualizado e inactivo. Revisa sus sitios antes de activarlo y recarga las páginas abiertas.';
      try {
        await liberarSitios(anterior.sitios, scripts);
      } catch {
        mensaje += ' Revisa en Chrome los permisos de sitios que puedan seguir concedidos.';
      }
      avisar(mensaje);
    }
    cerrarRevision();
  } catch (error) {
    elementos.errorRevision.textContent = 'No se pudo actualizar: ' + error.message;
    elementos.errorRevision.hidden = false;
  } finally {
    ocupado = false;
    dibujar();
  }
}

async function guardarFuente(olvidar = false) {
  const anterior = seleccionadoActual();
  if (!anterior || ocupado || revisionPendiente) return;
  let fuente;
  try { fuente = olvidar ? '' : ActualizacionesScripts.validarFuente(elementos.fuenteActualizacion.value); }
  catch (error) { avisar(error.message, true); return; }
  ocupado = true;
  dibujar();
  try {
    const actuales = await GestorScripts.leer();
    const vigente = actuales.find(script => script.id === anterior.id);
    if (!vigente || vigente.codigo !== anterior.codigo || vigente.fuenteActualizacion !== anterior.fuenteActualizacion) {
      throw new Error('El script cambió en otra ventana. Recarga el gestor antes de cambiar su fuente.');
    }
    const siguientes = actuales.map(script => script.id === anterior.id ? { ...script, fuenteActualizacion: fuente } : script);
    await GestorScripts.guardar(siguientes);
    scripts = siguientes;
    avisar(olvidar ? 'Fuente olvidada. El script se conserva sin cambios.' : 'Fuente guardada. Pulsa «Buscar actualización» cuando quieras consultarla.');
  } catch (error) { avisar(error.message, true); }
  finally { ocupado = false; dibujar(); }
}

async function buscarActualizacion() {
  const anterior = seleccionadoActual();
  if (!anterior?.fuenteActualizacion || ocupado || revisionPendiente) return;
  let fuente;
  try { fuente = ActualizacionesScripts.validarFuente(anterior.fuenteActualizacion); }
  catch (error) { avisar(error.message, true); return; }
  const origen = new URL(fuente).origin + '/*';
  const control = new AbortController();
  consultaActualizacion = control;
  ocupado = true;
  dibujar();
  avisar('Consultando la fuente elegida. No se instalará código hasta que revises y confirmes.');
  let yaConcedido = true;
  let concedido = false;
  try {
    // Ambas llamadas se inician desde el clic, antes de esperar una respuesta.
    const permisoPrevio = chrome.permissions.contains({ origins: [origen] });
    const solicitudPermiso = chrome.permissions.request({ origins: [origen] });
    [yaConcedido, concedido] = await Promise.all([permisoPrevio, solicitudPermiso]);
    if (!concedido) throw new Error('No se concedió acceso a la fuente. El script no cambió.');
    control.signal.throwIfAborted();
    const actuales = await GestorScripts.leer();
    const vigente = actuales.find(script => script.id === anterior.id);
    if (!vigente || vigente.codigo !== anterior.codigo || vigente.fuenteActualizacion !== fuente) {
      throw new Error('El script o su fuente cambió en otra ventana. Recarga el gestor.');
    }
    const codigo = await ActualizacionesScripts.descargar(anterior, fuente, control.signal);
    control.signal.throwIfAborted();
    if (codigo === anterior.codigo) avisar('El archivo de la fuente es idéntico al instalado. No hay cambios.');
    else mostrarRevision(anterior, codigo, false, fuente);
  } catch (error) {
    avisar(control.signal.aborted ? 'Consulta cancelada. El script no cambió.' : error.message, !control.signal.aborted);
  } finally {
    if (concedido && !yaConcedido) {
      try { await liberarSitios([origen], await GestorScripts.leer()); }
      catch { avisar('Revisa en Chrome el permiso temporal de la fuente que puede seguir concedido.', true); }
    }
    consultaActualizacion = null;
    ocupado = false;
    dibujar();
  }
}

async function cambiarEstado() {
  const script = seleccionadoActual();
  if (!script || ocupado) return;
  ocupado = true;
  dibujar();
  let permisoConcedido = false;
  try {
    if (script.activo) {
      await chrome.userScripts.unregister({ ids: [script.id] });
      const siguientes = scripts.map(item => item.id === script.id ? { ...item, activo: false } : item);
      await GestorScripts.guardar(siguientes);
      scripts = siguientes;
      try {
        await liberarSitios(script.sitios, siguientes);
        avisar('Script desactivado y permisos de sitios sin uso retirados.');
      } catch {
        avisar('Script desactivado. Revisa en Chrome los permisos de sitios que puedan seguir concedidos.');
      }
    } else {
      // La solicitud ocurre directamente desde el clic del usuario.
      const concedido = await chrome.permissions.request({
        origins: GestorScripts.permisos(script.sitios)
      });
      if (!concedido) {
        avisar('No se concedió acceso a los sitios. El script sigue inactivo.', true);
        return;
      }
      permisoConcedido = true;
      await chrome.userScripts.register([GestorScripts.registro(script)]);
      const siguientes = scripts.map(item => item.id === script.id ? { ...item, activo: true } : item);
      try {
        await GestorScripts.guardar(siguientes);
      } catch (error) {
        await chrome.userScripts.unregister({ ids: [script.id] });
        throw error;
      }
      scripts = siguientes;
      permisoConcedido = false;
      avisar('Script activado. Recarga las páginas abiertas para ejecutarlo.');
    }
  } catch (error) {
    if (permisoConcedido) {
      try {
        await liberarSitios(script.sitios, scripts);
      } catch {
        // Chrome permite revisar y retirar manualmente los permisos del sitio.
      }
    }
    avisar('No se pudo cambiar el estado. Revisa «Permitir scripts de usuario» en los detalles de la extensión (chrome://extensions). ' + error.message, true);
  } finally {
    ocupado = false;
    dibujar();
  }
}

async function eliminar() {
  const script = seleccionadoActual();
  if (!script || ocupado) return;
  if (!confirm(`¿Eliminar «${script.nombre}» del gestor?`)) return;
  ocupado = true;
  dibujar();
  try {
    if (script.activo) await chrome.userScripts.unregister({ ids: [script.id] });
    const siguientes = scripts.filter(item => item.id !== script.id);
    await GestorScripts.guardar(siguientes);
    scripts = siguientes;
    seleccionado = siguientes[0]?.id || null;
    try {
      await liberarSitios(script.sitios, siguientes);
      avisar('Script eliminado del gestor. El archivo original sigue en tu equipo.');
    } catch {
      avisar('Script eliminado. Revisa en Chrome los permisos de sitios que puedan seguir concedidos.');
    }
  } catch (error) {
    avisar('No se pudo eliminar el script: ' + error.message, true);
  } finally {
    ocupado = false;
    dibujar();
  }
}

async function iniciar() {
  try {
    await GestorScripts.guardarAcceso();
    scripts = await GestorScripts.leer();
    seleccionado = scripts[0]?.id || null;
    dibujar();
    try {
      await GestorScripts.restaurar();
    } catch {
      avisar('Para activar scripts, abre chrome://extensions, entra en los detalles de esta extensión y habilita «Permitir scripts de usuario».', true);
    }
  } catch (error) {
    avisar('No se pudo abrir el almacenamiento local: ' + error.message, true);
  }
}

elementos.archivo.addEventListener('change', () => cargarArchivo());
elementos.guardarFuente.addEventListener('click', () => guardarFuente());
elementos.olvidarFuente.addEventListener('click', () => guardarFuente(true));
elementos.buscarActualizacion.addEventListener('click', buscarActualizacion);
elementos.cancelarConsulta.addEventListener('click', () => consultaActualizacion?.abort());
window.addEventListener('pagehide', () => consultaActualizacion?.abort());
elementos.actualizar.addEventListener('click', () => {
  if (ocupado || revisionPendiente) return;
  objetivoActualizacion = seleccionadoActual();
  if (objetivoActualizacion) elementos.archivoActualizacion.click();
});
elementos.archivoActualizacion.addEventListener('change', () => {
  const anterior = objetivoActualizacion;
  objetivoActualizacion = null;
  if (anterior) cargarArchivo(elementos.archivoActualizacion, anterior);
});
elementos.confirmarActualizacion.addEventListener('click', () => confirmarRevision());
elementos.importarCopia.addEventListener('click', () => confirmarRevision(true));
elementos.cancelarRevision.addEventListener('click', cerrarRevision);
elementos.revision.addEventListener('cancel', evento => {
  evento.preventDefault();
  if (!ocupado) cerrarRevision();
});
elementos.cargar.addEventListener('click', () => elementos.archivo.click());
elementos.activar.addEventListener('click', cambiarEstado);
elementos.eliminar.addEventListener('click', eliminar);
iniciar();
