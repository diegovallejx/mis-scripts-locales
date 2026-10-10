// ==UserScript==
// @name         Resaltar título
// @version      1.0
// @description  Ejemplo público: subraya el título de example.com en azul.
// @match        https://example.com/*
// @grant        none
// @noframes
// ==/UserScript==
(() => {
  const titulo = document.querySelector('h1');
  if (titulo) titulo.style.borderBottom = '3px solid #1766c2';
})();
