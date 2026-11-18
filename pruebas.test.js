const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const contexto = vm.createContext({ TextEncoder });
const fuente = fs.readFileSync(path.join(__dirname, 'comun.js'), 'utf8');
vm.runInContext(fuente + '\nthis.GestorScriptsPrueba = GestorScripts;', contexto);
const gestor = contexto.GestorScriptsPrueba;

const ejemplo = `// ==UserScript==
// @name         Ejemplo local
// @version      1.0
// @match        https://example.com/*
// @match        http://192.0.2.10/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==
document.body.dataset.prueba = 'lista';`;

test('interpreta un script local y limita sus permisos a los sitios declarados', () => {
  const datos = gestor.analizar(ejemplo);
  assert.equal(datos.nombre, 'Ejemplo local');
  assert.equal(datos.momento, 'document_idle');
  assert.deepEqual(Array.from(gestor.permisos(datos.sitios)), [
    'https://example.com/*',
    'http://192.0.2.10/*'
  ]);
  const registro = gestor.registro({ id: 'script-prueba', codigo: ejemplo });
  assert.equal(registro.world, 'MAIN');
  assert.equal(registro.allFrames, true);
  assert.equal(registro.js[0].code, ejemplo);
});

test('rechaza permisos amplios y dependencias externas', () => {
  assert.throws(() => gestor.analizar(ejemplo.replace('https://example.com/*', 'https://*/*')), /Sitio no admitido/);
  assert.throws(() => gestor.analizar(ejemplo.replace('// @grant        none', '// @grant        GM_xmlhttpRequest')), /@grant none/);
  assert.throws(() => gestor.analizar(ejemplo.replace('// @grant        none', '// @require https://example.com/otro.js')), /@require/);
});

test('respeta @noframes y rechaza cabeceras incompletas', () => {
  const soloPrincipal = ejemplo.replace('// @grant        none', '// @noframes\n// @grant        none');
  assert.equal(gestor.analizar(soloPrincipal).todosLosMarcos, false);
  assert.throws(() => gestor.analizar('alert(1)'), /cabecera/);
});

test('acepta varios sitios de un mismo script sin ampliar permisos', () => {
  const codigo = ejemplo.replace('// @run-at', '// @match        https://otro.example.org/*\n// @run-at');
  const datos = gestor.analizar(codigo);
  assert.equal(datos.sitios.length, 3);
  assert.equal(gestor.permisos(datos.sitios).length, 3);
});

test('restaura solo los scripts activos que faltan tras una actualización', async () => {
  const registrados = [];
  contexto.chrome = {
    storage: { local: {
      setAccessLevel: async () => {},
      get: async () => ({ scripts: [
        { id: 'script-activo', codigo: ejemplo, activo: true },
        { id: 'script-inactivo', codigo: ejemplo, activo: false }
      ] })
    } },
    userScripts: {
      getScripts: async () => [],
      register: async items => registrados.push(...items)
    }
  };
  await gestor.restaurar();
  assert.deepEqual(registrados.map(item => item.id), ['script-activo']);
});

function entornoActualizacion(activo = false) {
  const anterior = { id: 'script-prueba', ...gestor.analizar(ejemplo), codigo: ejemplo, activo };
  let almacenados = [anterior];
  const registros = new Map(activo ? [[anterior.id, gestor.registro(anterior)]] : []);
  const entorno = vm.createContext({ TextEncoder, chrome: {
    storage: { local: {
      get: async () => ({ scripts: almacenados }),
      set: async datos => { almacenados = datos.scripts; }
    } },
    userScripts: {
      getScripts: async () => [...registros.values()],
      update: async items => items.forEach(item => registros.set(item.id, item)),
      register: async items => items.forEach(item => registros.set(item.id, item)),
      unregister: async ({ ids }) => ids.forEach(id => registros.delete(id))
    }
  } });
  vm.runInContext(fuente + '\nthis.gestor = GestorScripts;', entorno);
  return { anterior, entorno, gestor: entorno.gestor, registros, almacenados: () => almacenados };
}

test('detecta duplicados por nombre y namespace incluso en scripts antiguos', () => {
  const codigo = ejemplo.replace('// @version', '// @namespace urn:ejemplo:local\n// @version');
  const anterior = { id: 'script-antiguo', codigo };
  const datos = gestor.analizar(codigo.replace('1.0', '2.0'));
  assert.equal(datos.espacioNombres, 'urn:ejemplo:local');
  assert.equal(gestor.coincidencias([anterior], datos)[0].id, anterior.id);
  assert.equal(gestor.coincidencias([anterior], gestor.analizar(ejemplo)).length, 0);
});

test('reemplaza sin duplicar y admite cambios con la misma versión', async () => {
  const e = entornoActualizacion();
  const codigo = ejemplo.replace("'lista'", "'actualizada'");
  await e.gestor.actualizar(e.anterior, codigo);
  assert.equal(e.almacenados().length, 1);
  assert.equal(e.almacenados()[0].id, e.anterior.id);
  assert.equal(e.almacenados()[0].codigo, codigo);
  assert.equal(e.almacenados()[0].activo, false);
  assert.equal(e.registros.size, 0);
});

test('mantiene activo el script actualizado con los mismos sitios', async () => {
  const e = entornoActualizacion(true);
  const codigo = ejemplo.replace('1.0', '2.0');
  await e.gestor.actualizar(e.anterior, codigo);
  assert.equal(e.almacenados()[0].activo, true);
  assert.equal(e.registros.get(e.anterior.id).js[0].code, codigo);
});

test('un cambio de sitios deja la actualización inactiva sin solicitar permisos', async () => {
  const e = entornoActualizacion(true);
  await e.gestor.actualizar(e.anterior, ejemplo.replace('example.com', 'otro.example.org'));
  assert.equal(e.almacenados()[0].activo, false);
  assert.equal(e.registros.size, 0);
});

test('si falla el guardado recupera el código activo anterior', async () => {
  const e = entornoActualizacion(true);
  e.entorno.chrome.storage.local.set = async () => { throw new Error('Fallo sintético'); };
  await assert.rejects(e.gestor.actualizar(e.anterior, ejemplo.replace('1.0', '2.0')), /Fallo sintético/);
  assert.equal(e.almacenados()[0].codigo, ejemplo);
  assert.equal(e.registros.get(e.anterior.id).js[0].code, ejemplo);
});

test('si falla el registro no reemplaza el archivo almacenado', async () => {
  const e = entornoActualizacion(true);
  e.entorno.chrome.userScripts.update = async () => { throw new Error('Registro rechazado'); };
  await assert.rejects(e.gestor.actualizar(e.anterior, ejemplo.replace('1.0', '2.0')), /Registro rechazado/);
  assert.equal(e.almacenados()[0].codigo, ejemplo);
});

test('permite actualizar inactivos cuando la API de ejecución no está habilitada', async () => {
  const e = entornoActualizacion();
  e.entorno.chrome.userScripts = undefined;
  await e.gestor.actualizar(e.anterior, ejemplo.replace('1.0', '2.0'));
  assert.equal(e.almacenados()[0].version, '2.0');
});

test('rechaza una revisión obsoleta y archivos incompatibles sin alterar lo guardado', async () => {
  const e = entornoActualizacion();
  await assert.rejects(e.gestor.actualizar(e.anterior, 'sin cabecera'), /cabecera/);
  await e.entorno.chrome.storage.local.set({ scripts: [] });
  await assert.rejects(e.gestor.actualizar(e.anterior, ejemplo), /cambió|eliminado/);
  assert.equal(e.almacenados().length, 0);
});
