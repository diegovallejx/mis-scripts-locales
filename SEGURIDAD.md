# Seguridad

El gestor ejecuta código elegido por la persona. No analiza automáticamente si ese código es confiable. Los permisos de sitios determinan dónde se inyecta un script; no limitan todos los destinos de red que el script puede utilizar desde una página.

Los scripts se ejecutan en el contexto principal del sitio para conservar compatibilidad con su JavaScript. La página puede interactuar con ellos. No hay una barrera de aislamiento entre la página y el script.

El almacenamiento de scripts se limita a los contextos de confianza de la extensión mediante `setAccessLevel`. Se usan permisos opcionales y se retiran los sitios que dejan de ser necesarios al desactivar o eliminar scripts.

La política de contenido del gestor permite conexiones HTTPS para las consultas manuales de actualización (`connect-src https:`). El código de su interfaz sigue restringido a los archivos empaquetados (`script-src 'self'`); no se usa eval, Function ni etiquetas script para ejecutar descargas. Los archivos elegidos se registran exclusivamente mediante `chrome.userScripts`. La política del gestor no limita todas las conexiones de los userscripts ejecutados en las páginas.

Para informar una vulnerabilidad, usa la opción de reporte privado de la sección Security de GitHub cuando esté disponible. No adjuntes datos de páginas reales, credenciales ni scripts privados a un issue público. Un reporte útil contiene la versión del gestor, los pasos de reproducción y un script de ejemplo con datos ficticios.

Se mantienen las correcciones en la versión más reciente. Las revisiones y pruebas no constituyen una garantía de seguridad absoluta.

Las fuentes se guardan por elección explícita, a partir de una propuesta `@downloadURL` o una URL escrita. Solo se consultan al pulsar el botón; no se envía código local ni contenido de páginas. Se omiten credenciales y Referer, se rechazan redirecciones y se limitan tiempo y tamaño real de lectura. Se exige coincidencia de nombre y namespace, sin presentar esa comprobación como una firma criptográfica ni una prueba de autoría. Se rechazan descensos de versiones numéricas reconocibles. El archivo descargado permanece en memoria hasta confirmar; el código nuevo no cambia la fuente elegida. Los proveedores de alojamiento pueden registrar IP y otros datos técnicos.
