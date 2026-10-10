# Ficha para Chrome Web Store

## Nombre y descripción

Nombre: **Mis scripts locales**.

Descripción breve: Gestor abierto de scripts locales. Carga, revisa y activa tus archivos, sin telemetría ni descargas automáticas de scripts.

Descripción detallada:

Mis scripts locales permite cargar archivos .user.js desde tu equipo, revisar su código completo y elegir dónde activarlos. Es una extensión de código abierto bajo licencia MIT, con una interfaz sencilla y almacenamiento local.

- Carga archivos desde tu equipo.
- Revisa su nombre, versión, código y sitios declarados.
- Activa, desactiva y elimina los scripts que elijas.
- Concede acceso solo a los sitios necesarios al activar cada script.
- Sin cuentas, sincronización, publicidad ni telemetría del gestor.
- Sin descarga de dependencias ni actualización automática de los scripts.

Requiere Chrome 138 o posterior y habilitar «Permitir scripts de usuario» en los detalles de la extensión. Admite scripts @grant none con sitios HTTP o HTTPS concretos. No es compatible con las API GM_* ni con @require.

Cada script puede leer las páginas donde se ejecuta y comunicarse con la red según su código. Revisa los archivos antes de activarlos. Para detener un script que ya se ejecutó, desactívalo y recarga la página.

Código fuente y soporte: https://github.com/diegovallejx/mis-scripts-locales.

## Propósito único

Permitir a la persona cargar, revisar y ejecutar userscripts locales de su elección en los sitios que autorice.

## Justificación de permisos

**storage:** conserva localmente el código de los scripts importados, sus metadatos y el estado de activación. No almacena el contenido de las páginas visitadas.

**userScripts:** registra el código elegido por la persona mediante la API oficial de Chrome para scripts de usuario. Los archivos se importan desactivados y requieren activación explícita.

**Acceso opcional a hosts HTTP/HTTPS:** el gestor admite archivos con sitios diferentes. La declaración opcional permite solicitar en tiempo de ejecución los orígenes concretos de cada script; no solicita acceso a todas las páginas al instalarse. No admite `<all_urls>` ni comodines de dominio en los scripts.

## Código externo al paquete

El funcionamiento del gestor está íntegramente en el paquete. Ejecuta código aportado por la persona desde archivos locales mediante `chrome.userScripts`, sin descargarlo de servidores ni evaluarlo en las páginas de la extensión. Esta función debe declararse expresamente durante la revisión, con la excepción de User Scripts API prevista en las políticas de Manifest V3. No describir el producto como una extensión que solo ejecuta código empaquetado.

## Datos y privacidad

La extensión conserva el código y los metadatos proporcionados por la persona dentro de su perfil local de Chrome. No transmite datos de usuarios, páginas ni scripts al desarrollador o a servidores propios. No recopila historial de navegación ni estadísticas de uso. Los scripts importados pueden tener comportamientos independientes, explicados tanto en la interfaz como en la política.

Política pública: https://github.com/diegovallejx/mis-scripts-locales/blob/main/PRIVACIDAD.md.

Las declaraciones de datos del formulario deben reflejar estas prácticas y las definiciones que muestra Google. No presentar el gestor como una certificación de seguridad de los scripts importados.

## Instrucciones para la revisión

No requiere cuenta ni credenciales de prueba.

1. Instala la extensión en Chrome 138 o posterior.
2. En sus detalles de `chrome://extensions`, habilita «Permitir scripts de usuario».
3. Abre el gestor desde su icono y carga `ejemplos/resaltar-titulo.user.js` desde el repositorio público.
4. Comprueba que se importa inactivo y se puede revisar su código.
5. Actívalo y concede acceso a `https://example.com`.
6. Abre o recarga https://example.com. El título queda subrayado en azul.
7. Desactívalo, recarga la página y verifica que el efecto ya no se aplica.
8. Elimina el archivo del gestor y comprueba que desaparece de su lista.

## Material preparado

- ZIP: generado con `python3 empaquetar.py`; su `manifest.json` está en la raíz.
- Icono: `iconos/icono-128.png`.
- Capturas y promoción: carpeta `tienda/`, sin datos de usuarios ni scripts privados.
- Visibilidad solicitada: pública.

El registro y pago de la cuenta de desarrollador se realizan en la consola de Google. Después se carga el ZIP, se completa la ficha, se añaden las imágenes y se envía a revisión. La aceptación depende de Google.

Referencias: [publicación](https://developer.chrome.com/docs/webstore/publish), [campos de privacidad](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [User Scripts API](https://developer.chrome.com/docs/extensions/reference/api/userScripts), [políticas](https://developer.chrome.com/docs/webstore/program-policies/policies).
