/* Consulta manual de código para revisión; nunca lo ejecuta ni lo guarda. */
const ActualizacionesScripts = (() => {
  const MAX_BYTES = 2 * 1024 * 1024;

  function validarFuente(valor) {
    let url;
    try { url = new URL(String(valor).trim()); } catch { throw new Error('Ingresa una URL HTTPS directa al archivo .user.js.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        url.port || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) || /^[\d.]+$/.test(url.hostname) ||
        url.hostname.endsWith('.localhost') || url.hostname.endsWith('.local') ||
        !url.pathname.endsWith('.user.js')) {
      throw new Error('Usa una URL HTTPS directa a un archivo .user.js, sin credenciales, consultas, fragmentos ni puertos especiales. No se admiten direcciones locales.');
    }
    return url.href;
  }

  function versionAnterior(actual, propuesta) {
    if (!/^\d+(?:\.\d+)*$/.test(actual) || !/^\d+(?:\.\d+)*$/.test(propuesta)) return false;
    const a = actual.split('.').map(BigInt);
    const b = propuesta.split('.').map(BigInt);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0n) !== (b[i] || 0n)) return (b[i] || 0n) < (a[i] || 0n);
    }
    return false;
  }

  async function descargar(anterior, fuente, cancelacion) {
    const url = validarFuente(fuente);
    const senales = [AbortSignal.timeout(20000)];
    if (cancelacion) senales.push(cancelacion);
    const signal = AbortSignal.any(senales);
    let respuesta;
    try {
      respuesta = await fetch(url, { method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer',
        cache: 'no-store', redirect: 'error', signal });
    } catch {
      throw new Error(signal.aborted ? 'Consulta cancelada o tiempo de espera agotado.' :
        'No se pudo descargar. Revisa la conexión, el permiso y la URL directa; no se siguen redirecciones.');
    }
    if (!respuesta.ok || respuesta.redirected) throw new Error(`La fuente no entregó un archivo válido (HTTP ${respuesta.status}).`);
    if (/text\/html/i.test(respuesta.headers.get('content-type') || '')) throw new Error('La fuente entregó una página HTML, no un script.');
    if (Number(respuesta.headers.get('content-length')) > MAX_BYTES) {
      await respuesta.body?.cancel();
      throw new Error('El archivo supera el límite de 2 MB.');
    }
    if (!respuesta.body) throw new Error('La fuente entregó una respuesta vacía.');
    const lector = respuesta.body.getReader();
    const decodificador = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    let codigo = '';
    try {
      while (true) {
        signal.throwIfAborted();
        const { done, value } = await lector.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BYTES) throw new Error('El archivo supera el límite de 2 MB.');
        codigo += decodificador.decode(value, { stream: true });
      }
      codigo += decodificador.decode();
    } catch (error) {
      await lector.cancel().catch(() => {});
      throw new Error(signal.aborted ? 'Consulta cancelada o tiempo de espera agotado.' :
        bytes > MAX_BYTES ? 'El archivo supera el límite de 2 MB.' : 'No se pudo leer el archivo como texto UTF-8.');
    } finally {
      lector.releaseLock();
    }
    const actual = GestorScripts.analizar(anterior.codigo);
    const propuesto = GestorScripts.analizar(codigo);
    if (actual.nombre !== propuesto.nombre || actual.espacioNombres !== propuesto.espacioNombres) {
      throw new Error('La identidad del archivo (nombre y namespace) no coincide con el script instalado.');
    }
    if (versionAnterior(actual.version, propuesto.version)) {
      throw new Error('La fuente ofrece una versión anterior. Para un reemplazo intencional usa un archivo local.');
    }
    return codigo;
  }

  return { validarFuente, descargar };
})();
