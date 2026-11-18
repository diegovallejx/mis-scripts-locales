# Privacidad de Mis scripts locales

**Responsable:** Diego Vallejos.

Versión de esta política: 17 de noviembre de 2026. Código fuente y soporte: https://github.com/diegovallejx/mis-scripts-locales.

## Almacenamiento necesario

El gestor conserva el código de los scripts elegidos, nombre, versión, descripción, sitios declarados, estado de activación y, si la persona la configura, la URL de actualización. Se guardan exclusivamente en `chrome.storage.local`, dentro del perfil de Chrome. No se sincronizan con cuentas ni servidores. La fuente declarada en `@downloadURL` se presenta como propuesta; no se consulta automáticamente.

La comparación del código anterior y nuevo se mantiene en memoria mientras está abierta. Cancelar no reemplaza el script; confirmar sustituye su código y sus metadatos en el almacenamiento local. No se guarda un historial de versiones ni una copia de la descarga cancelada. La fuente configurada no cambia automáticamente si el código nuevo declara otra.

## Datos de las páginas

El gestor no guarda contenido de las páginas visitadas ni datos temporales que procesen los scripts. No tiene telemetría, publicidad, análisis de uso, cuentas ni servidores propios. No envía código instalado, historial de navegación ni contenido de páginas al desarrollador ni a los servidores de actualización.

Cada script se ejecuta en el contexto principal de los sitios autorizados, donde el sitio puede interactuar con él. **El comportamiento de red, la memoria y el almacenamiento utilizados por cada script dependen de su código.** El gestor no certifica ese comportamiento ni garantiza que un script importado no guarde o envíe datos. La persona debe revisar el código antes de activarlo o actualizarlo.

Los datos copiados por un script pueden permanecer en el portapapeles hasta que se reemplacen. Los sitios visitados y sus servidores pueden mantener registros, cachés u otras copias que el gestor no controla.

## Actualizaciones por internet a petición

Solo al pulsar «Buscar actualización», el gestor solicita acceso al sitio HTTPS de la fuente guardada y realiza una petición GET al archivo `.user.js` elegido. No hay sondeos periódicos, descargas al abrir Chrome ni instalaciones silenciosas. La descarga queda disponible para revisión antes de confirmar su instalación.

La petición no incluye cookies ni credenciales de la sesión, cuerpo de datos ni encabezado Referer. No se añaden identificadores del paciente, código instalado ni información de las páginas. El servidor y su proveedor de alojamiento reciben la IP y los datos técnicos habituales de una conexión HTTPS, y pueden conservar registros conforme a sus propias políticas. No se promete anonimato ni ausencia de registros en esos servidores.

Se admiten URLs HTTPS directas sin credenciales, parámetros de consulta ni fragmentos; no se siguen redirecciones ni se usan fuentes que requieran iniciar sesión. La descarga se limita a 2 MB y tiene tiempo de espera. El permiso de la fuente se retira al terminar si fue concedido para esa consulta y no es necesario para ejecutar un script activo. Si Chrome impide retirarlo, el gestor avisa para revisarlo manualmente.

Se puede cambiar u olvidar la fuente desde el detalle del script. Olvidarla no elimina el script ni revoca permisos que ya fueran necesarios para otros usos. El gestor no descarga dependencias externas ni ejecuta el archivo descargado dentro de su propia interfaz.

## Eliminación y control

Los datos necesarios permanecen en el perfil local hasta eliminar el script, borrar los datos de la extensión o desinstalarla. Al eliminar un script se borra su copia local y su fuente configurada. El archivo original del equipo no se modifica.

Desactivar, eliminar o reemplazar un script no revierte los efectos de su ejecución en páginas ya abiertas: se deben recargar o cerrar. El gestor no garantiza el borrado físico inmediato de la memoria o del almacenamiento administrado por Chrome.

Los enlaces de código y privacidad abren GitHub únicamente cuando se pulsan. GitHub, Chrome Web Store y las fuentes elegidas aplican sus propias políticas. El uso de información recibida mediante las API de Chrome se limita a cargar, revisar, actualizar a petición y ejecutar scripts elegidos, conforme a los requisitos de uso limitado de Chrome Web Store.

Dirección pública: https://github.com/diegovallejx/mis-scripts-locales/blob/main/PRIVACIDAD.md.
