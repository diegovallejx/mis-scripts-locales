/* Funciones compartidas por la página y el trabajador de la extensión. */
const GestorScripts = (() => {
  const CLAVE = 'scripts';
  const MAX_BYTES = 2 * 1024 * 1024;
  const DIRECTIVAS_INCOMPATIBLES = new Set([
    'require', 'resource', 'connect', 'include', 'exclude',
    'exclude-match', 'inject-into', 'unwrap', 'sandbox'
  ]);

  function analizar(codigo) {
    if (typeof codigo !== 'string' || !codigo.trim()) {
      throw new Error('El archivo está vacío.');
    }
    if (new TextEncoder().encode(codigo).length > MAX_BYTES) {
      throw new Error('El archivo supera el límite de 2 MB.');
    }
    const cabecera = codigo.match(/^\s*\/\/ ==UserScript==\s*\r?\n([\s\S]*?)^\s*\/\/ ==\/UserScript==/m);
    if (!cabecera) throw new Error('Falta la cabecera ==UserScript==.');
    const datos = {};
    for (const linea of cabecera[1].split(/\r?\n/)) {
      const campo = linea.match(/^\s*\/\/\s*@([\w-]+)(?:\s+(.*))?$/);
      if (!campo) continue;
      const clave = campo[1].toLowerCase();
      const valor = (campo[2] || '').trim();
      if (DIRECTIVAS_INCOMPATIBLES.has(clave)) {
        throw new Error(`La directiva @${clave} todavía no es compatible.`);
      }
      (datos[clave] ||= []).push(valor);
    }
    const nombre = datos.name?.[0];
    if (!nombre) throw new Error('Falta @name.');
    if (datos.grant?.some(valor => valor !== 'none')) {
      throw new Error('Solo se admiten scripts con @grant none.');
    }
    const sitios = [...new Set(datos.match || [])];
    if (!sitios.length) throw new Error('Falta al menos un @match.');
    for (const sitio of sitios) {
      if (!/^https?:\/\/[a-z0-9.-]+\/[\x21-\x7e]*$/i.test(sitio) ||
          sitio.includes('..') || sitio.includes('://*') ||
          sitio.includes('://.') || sitio.includes('://-')) {
        throw new Error(`Sitio no admitido: ${sitio}`);
      }
    }
    const momento = datos['run-at']?.[0] || 'document-idle';
    const momentos = {
      'document-start': 'document_start',
      'document-end': 'document_end',
      'document-idle': 'document_idle'
    };
    if (!momentos[momento]) throw new Error(`Momento no admitido: ${momento}`);
    return {
      nombre,
      version: datos.version?.[0] || '',
      descripcion: datos.description?.[0] || '',
      sitios,
      momento: momentos[momento],
      todosLosMarcos: !Object.hasOwn(datos, 'noframes')
    };
  }

  function permisos(sitios) {
    return [...new Set(sitios.map(sitio => {
      const partes = sitio.match(/^(https?):\/\/([^/]+)\//i);
      return `${partes[1].toLowerCase()}://${partes[2].toLowerCase()}/*`;
    }))];
  }

  function registro(script) {
    const datos = analizar(script.codigo);
    return {
      id: script.id,
      matches: datos.sitios,
      js: [{ code: script.codigo }],
      runAt: datos.momento,
      allFrames: datos.todosLosMarcos,
      world: 'MAIN'
    };
  }

  async function disponibles() {
    const registros = await chrome.userScripts.getScripts();
    return new Set(registros.map(registro => registro.id));
  }

  async function guardarAcceso() {
    await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  }

  async function leer() {
    const respuesta = await chrome.storage.local.get(CLAVE);
    return Array.isArray(respuesta[CLAVE]) ? respuesta[CLAVE] : [];
  }

  async function guardar(scripts) {
    await chrome.storage.local.set({ [CLAVE]: scripts });
  }

  async function restaurar() {
    await guardarAcceso();
    const instalados = await disponibles();
    const scripts = await leer();
    const deseados = scripts.filter(script => script.activo);
    const faltantes = deseados.filter(script => !instalados.has(script.id));
    if (faltantes.length) {
      await chrome.userScripts.register(faltantes.map(registro));
    }
  }

  return { analizar, permisos, registro, disponibles, guardarAcceso, leer, guardar, restaurar };
})();
