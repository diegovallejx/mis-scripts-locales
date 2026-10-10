const elementos = {
  cargar: document.querySelector('#cargar'),
  archivo: document.querySelector('#archivo'),
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
}

async function cargarArchivo() {
  const archivo = elementos.archivo.files?.[0];
  elementos.archivo.value = '';
  if (!archivo || ocupado) return;
  ocupado = true;
  try {
    if (archivo.size > 2 * 1024 * 1024) throw new Error('El archivo supera el límite de 2 MB.');
    const codigo = await archivo.text();
    const datos = GestorScripts.analizar(codigo);
    const script = {
      id: 'script-' + crypto.randomUUID(),
      ...datos,
      codigo,
      activo: false
    };
    const siguientes = [...scripts, script];
    await GestorScripts.guardar(siguientes);
    scripts = siguientes;
    seleccionado = script.id;
    avisar('Script cargado e inactivo. Revisa el código y los sitios antes de activarlo.');
  } catch (error) {
    avisar(error.message, true);
  } finally {
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

elementos.archivo.addEventListener('change', cargarArchivo);
elementos.cargar.addEventListener('click', () => elementos.archivo.click());
elementos.activar.addEventListener('click', cambiarEstado);
elementos.eliminar.addEventListener('click', eliminar);
iniciar();
