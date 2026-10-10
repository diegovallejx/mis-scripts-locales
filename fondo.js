importScripts('comun.js');

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'update') {
    GestorScripts.restaurar().catch(() => {
      // La página del gestor explica cómo habilitar los scripts de usuario.
    });
  }
});
