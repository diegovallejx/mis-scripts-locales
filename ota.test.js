const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ejemplo = fs.readFileSync(path.join(__dirname, 'ejemplos/resaltar-titulo.user.js'), 'utf8');
const compartido = fs.readFileSync(path.join(__dirname, 'comun.js'), 'utf8');

function entorno(respuesta) {
  const peticiones = [];
  const contexto = vm.createContext({ URL, TextEncoder, TextDecoder, AbortSignal, fetch: async (...args) => {
    peticiones.push(args);
    return typeof respuesta === 'function' ? respuesta(...args) : respuesta;
  } });
  const archivo = path.join(__dirname, 'ota.js');
  vm.runInContext(compartido + '\n' + (fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : '') + '\nthis.ota = typeof ActualizacionesScripts === "undefined" ? {} : ActualizacionesScripts; this.gestor = GestorScripts;', contexto);
  return { ota: contexto.ota, gestor: contexto.gestor, peticiones };
}

const fuente = 'https://scripts.example.org/ejemplo.user.js';
const anterior = { id: 'script-ejemplo', codigo: ejemplo };

test('OTA no realiza consultas al cargarse', () => assert.equal(entorno().peticiones.length, 0));

test('la cabecera conserva la fuente declarada sin descargarla', () => {
  const e = entorno();
  const codigo = ejemplo.replace('// @name', '// @downloadURL ' + fuente + '\n// @name');
  assert.equal(e.gestor.analizar(codigo).urlDescarga, fuente);
  assert.equal(e.peticiones.length, 0);
});

test('solo admite URLs HTTPS directas sin credenciales, consultas ni fragmentos', () => {
  const e = entorno();
  assert.equal(typeof e.ota.validarFuente, 'function');
  assert.equal(e.ota.validarFuente(fuente), fuente);
  for (const url of ['http://scripts.example.org/a.js', 'javascript:alert(1)', 'https://usuario:clave@scripts.example.org/a.js', fuente + '?token=secreto', fuente + '#dato', 'https://scripts.example.org:8443/a.js', 'https://localhost/a.js', 'https://127.0.0.1/a.js', 'https://scripts.example.org/a.meta.js']) {
    assert.throws(() => e.ota.validarFuente(url));
  }
});

test('descarga para revisión sin cookies, referer, caché ni redirecciones', async () => {
  const e = entorno(new Response(ejemplo));
  assert.equal(typeof e.ota.descargar, 'function');
  assert.equal(await e.ota.descargar(anterior, fuente), ejemplo);
  assert.equal(e.peticiones.length, 1);
  const [url, opciones] = e.peticiones[0];
  assert.equal(url, fuente);
  assert.equal(opciones.credentials, 'omit');
  assert.equal(opciones.referrerPolicy, 'no-referrer');
  assert.equal(opciones.redirect, 'error');
  assert.equal(opciones.cache, 'no-store');
  assert.equal(opciones.method, 'GET');
  assert.equal(opciones.body, undefined);
});

test('rechaza otro script aunque el servidor entregue JavaScript válido', async () => {
  const e = entorno(new Response(ejemplo.replace('@name', '@namespace distinto\n// @name')));
  assert.equal(typeof e.ota.descargar, 'function');
  await assert.rejects(e.ota.descargar(anterior, fuente), /identidad|namespace/);
});

test('no sigue una redirección ni acepta respuestas HTML', async () => {
  for (const respuesta of [new Response('', {status:302,headers:{Location:fuente}}), new Response('<html>Inicio de sesión</html>', {headers:{'Content-Type':'text/html'}})]) {
    const e = entorno(respuesta);
    assert.equal(typeof e.ota.descargar, 'function');
    await assert.rejects(e.ota.descargar(anterior, fuente));
  }
});

test('rechaza errores HTTP sin incorporar la respuesta al mensaje', async () => {
  const e = entorno(new Response('contenido privado de prueba', {status:403}));
  assert.equal(typeof e.ota.descargar, 'function');
  await assert.rejects(e.ota.descargar(anterior, fuente), error => /403/.test(error.message) && !/privado/.test(error.message));
});

test('limita el tamaño declarado y el tamaño real del cuerpo', async () => {
  for (const respuesta of [new Response(ejemplo, {headers:{'Content-Length':String(3*1024*1024)}}), new Response('x'.repeat(2*1024*1024+1))]) {
    const e = entorno(respuesta);
    assert.equal(typeof e.ota.descargar, 'function');
    await assert.rejects(e.ota.descargar(anterior, fuente), /2 MB/);
  }
});

test('rechaza dependencias incompatibles sin ejecutar el contenido', async () => {
  const e = entorno(new Response(ejemplo.replace('// @name', '// @require https://scripts.example.org/dependencia.js\n// @name')));
  assert.equal(typeof e.ota.descargar, 'function');
  await assert.rejects(e.ota.descargar(anterior, fuente), /@require/);
});

test('impide bajar a una versión numérica anterior', async () => {
  const e = entorno(new Response(ejemplo.replace(/(@version\s+)\S+/, '$10.0')));
  assert.equal(typeof e.ota.descargar, 'function');
  await assert.rejects(e.ota.descargar(anterior, fuente), /anterior/);
});

test('una cancelación llega a la petición sin convertirse en un guardado', async () => {
  const e = entorno((_url, opciones) => { opciones.signal.throwIfAborted(); });
  assert.equal(typeof e.ota.descargar, 'function');
  await assert.rejects(e.ota.descargar(anterior, fuente, AbortSignal.abort()));
});
