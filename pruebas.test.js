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
