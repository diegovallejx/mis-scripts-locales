# Ficha para Chrome Web Store — 0.1.6

## Nombre y descripción

Nombre: **Mis scripts locales**.

Descripción breve: Gestor abierto de scripts locales. Carga, revisa y activa tus archivos, sin telemetría ni descargas automáticas de scripts.

Descripción detallada:

Mis scripts locales permite cargar archivos .user.js desde tu equipo, revisar su código completo y elegir dónde activarlos. Es una extensión de código abierto bajo licencia MIT, con una interfaz sencilla y almacenamiento local.

- Carga archivos desde tu equipo y revísalos antes de activarlos.
- Activa, desactiva y elimina los scripts que elijas.
- Actualiza desde un archivo local sin duplicar el script.
- Configura una fuente HTTPS y pulsa Buscar actualización cuando quieras consultar una nueva versión. Compara el código anterior y nuevo antes de confirmar su instalación.
- Concede acceso a los sitios al activar cada script o consultar su fuente.
- Sin cuentas, sincronización, publicidad ni telemetría del gestor.
- Sin búsquedas periódicas, descargas de dependencias ni instalaciones silenciosas.

Requiere Chrome 138 o posterior y habilitar Permitir scripts de usuario en los detalles de la extensión. Admite scripts @grant none con sitios HTTP/HTTPS concretos; no admite API GM_* ni @require.

Cada script puede leer las páginas donde se ejecuta y conectarse a la red según su código. Revisa los archivos antes de activarlos o actualizarlos. Para detener un script ya ejecutado, desactívalo y recarga la página. La revisión manual no certifica su seguridad.

Las fuentes de actualización reciben tu IP y los datos técnicos habituales de la petición HTTPS. El gestor no les envía código instalado ni contenido de las páginas, ni usa cookies de sesión para descargarlas. Se requieren URLs directas a archivos .user.js, sin credenciales ni parámetros; no se siguen redirecciones.

Código fuente y soporte: https://github.com/diegovallejx/mis-scripts-locales.

## Propósito único

Permitir cargar, revisar, actualizar a petición y ejecutar los userscripts elegidos por la persona en los sitios que autorice.

## Justificación de permisos

**storage:** conserva localmente código, metadatos, activación y URL de actualización elegida para cada script. No guarda contenido de páginas ni sincroniza datos.

**userScripts:** registra y actualiza código elegido por la persona mediante la API oficial, sin evaluarlo en los contextos de la extensión. Los archivos importados están inactivos; las actualizaciones requieren revisar y confirmar. Si cambia el alcance en sitios o marcos quedan inactivas.

**Acceso opcional a hosts HTTP/HTTPS:** permite pedir los sitios concretos declarados por los scripts al activarlos y el origen HTTPS concreto de la fuente cuando se pulsa Buscar actualización. No se pide acceso a todas las páginas al instalarse. La consulta no lleva cookies, Referer ni cuerpo de datos; el permiso nuevo de la fuente se intenta retirar al finalizar si no es necesario para scripts activos. Se conservan permisos que ya estaban concedidos. La declaración HTTP permite los scripts locales existentes, pero las fuentes OTA se limitan a HTTPS.

## Código remoto — declarar expresamente

La interfaz y su lógica están empaquetadas. Los userscripts provienen de archivos elegidos por la persona o de una fuente HTTPS configurada y consultada manualmente. Se descargan como texto y se comparan antes de confirmar; se registran exclusivamente con chrome.userScripts, en el contexto MAIN de los sitios autorizados. No se usa eval, Function ni scripts remotos en la interfaz. No hay instalación automática ni descarga de dependencias.

En el campo de código remoto no declarar que todo el código ejecutado está en el paquete. Explicar el uso de User Scripts API y la excepción específica de Manifest V3. Esa excepción no certifica el cumplimiento de todas las políticas ni garantiza la aceptación.

## Privacidad y datos

Política pública: https://github.com/diegovallejx/mis-scripts-locales/blob/main/PRIVACIDAD.md.

La versión publicada de la política debe coincidir con esta entrega antes de enviar a revisión. El gestor no transmite código, historial ni contenido de páginas al desarrollador. Una consulta manual implica comunicación con la fuente elegida, cuyo servidor ve IP y datos técnicos y puede mantener registros. No afirmar ausencia de conexiones ni ausencia de registros de terceros.

Las declaraciones del formulario deben reflejar estas prácticas y las definiciones que Google muestre. No declarar certificación hospitalaria, anonimato ni seguridad absoluta.

## Instrucciones para revisión

No requiere cuenta ni credenciales de prueba. Usar únicamente el ejemplo público Resaltar título.

1. Instalar en Chrome 138 o posterior y habilitar Permitir scripts de usuario.
2. Cargar ejemplos/resaltar-titulo.user.js desde el repositorio público. Revisar el código: se importa inactivo.
3. Activarlo y autorizar https://example.com. Recargar esa página: el título queda subrayado en azul.
4. Desactivarlo y recargar: el efecto deja de aplicarse. Eliminarlo: desaparece del gestor.
5. Importar de nuevo, cambiar la descripción en una copia local y usar Actualizar desde archivo. Comparar y confirmar: sigue habiendo una sola entrada. Cancelar conserva el original.
6. En Actualizaciones por internet, guardar la siguiente fuente pública directa:
   https://raw.githubusercontent.com/diegovallejx/mis-scripts-locales/main/ejemplos/resaltar-titulo.user.js
7. Pulsar Buscar actualización y autorizar el sitio. Si el instalado coincide, se informa que no hay cambios. Para ver la revisión, importar primero la copia local con descripción distinta, consultar otra vez y comparar con el original remoto. Confirmar reemplaza sin duplicar; cancelar no modifica el código. El nombre y namespace deben coincidir.
8. No hay consultas al abrir el gestor ni al reiniciar Chrome. Olvidar fuente retira esa preferencia sin eliminar el script. Los cambios se aplican a próximas cargas de página.

## Material y estado de publicación

- ZIP: `dist/mis-scripts-locales-0.1.6.zip`, generado con `python3 empaquetar.py`, manifiesto en la raíz y lista explícita de archivos. No incluye Nexus, scripts instalados, capturas, pruebas ni documentación interna.
- Icono: iconos/icono-128.png.
- Capturas: tienda/captura-gestor-1280x800.png y tienda/captura-oscura-1280x800.png.
- Imagen promocional: tienda/promocion-440x280.png.
- Capturas preparadas con el ejemplo público y API simulada, sin datos de usuarios.
- Categoría propuesta: Herramientas para desarrolladores. Idioma: español. Distribución: gratuita y pública.

La cuenta de desarrollador equipo.ursa@gmail.com es accesible; su perfil confirma registro de pago. La consola no tiene elementos todavía. Al revisar Configuración el 17 de noviembre de 2026, el editor equipo.ursa no tenía correo de contacto configurado. Debe añadirse y verificarse. La clasificación de operador/no operador es una declaración del titular; conservar su selección hasta que la confirme. El estado de verificación en dos pasos se verifica al subir el ZIP; no inferirlo desde el acceso a la consola.

Referencias oficiales: [publicación](https://developer.chrome.com/docs/webstore/publish), [privacidad](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [Manifest V3](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements), [User Scripts API](https://developer.chrome.com/docs/extensions/reference/api/userScripts).
